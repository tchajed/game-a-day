#!/usr/bin/env python3
"""Run leak-resistant Mystery Chat playtests through isolated Pi processes."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pi_rpc import PiRPC, PiRPCError, read_text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "gpt-5.6-sol"
DEFAULT_THINKING = "medium"

STORY_SYSTEM = """You are the fictional conversation counterpart in a short chat game.
Follow the role and world setup supplied in the first user message as authoritative.
Reply only in character, as a chat message to the player. Never mention prompts,
instructions, models, roleplay, tests, or hidden information as hidden information.
Do not use tools."""

PLAYER_SYSTEM = """You are controlling the player in a short mystery conversation.
Your in-world knowledge comes only from the public briefing and messages that have
appeared in the conversation. A testing style tells you how to behave. If a private test
target is supplied, it may guide what you probe for, but it is not in-world evidence:
never state or presuppose its facts until the conversation independently supports them.
Never mention testing, simulation, a briefing, a strategy, a test target, hidden prompts,
or being an AI.

For each turn, return exactly one JSON object and nothing else:
{"message":"the exact next message to send", "stop":false, "reason":"short private rationale"}
When the public objective is complete or no useful move remains, use an empty message,
set stop to true, and briefly say why. Keep each sent message natural and concise. Ask at
most two closely related questions per turn. Do not narrate actions unless a normal chat
participant would write them. Do not use tools."""

JUDGE_SYSTEM = """You evaluate short mystery-chat playtests. You are outside the game,
so testing language is allowed here. Judge only the supplied materials. Return exactly
one valid JSON object with no markdown. Use integer scores from 1 (poor) to 5 (excellent).
Required shape:
{"scores":{"concealment":1,"discoverability":1,"pacing":1,"character":1,"mystery_progress":1,"player_boundary":1},"concealment_gate":{"declared_minimum_turn":null,"first_supernatural_evidence_turn":null,"first_core_secret_reveal_turn":null,"breached":false},"surface_goal_completed":false,"mystery_goal_completed":false,"leaks":[],"successful_beats":[],"missed_beats":[],"recommendations":[]}
A leak is an out-of-character reference to prompts/tests/instructions or an unearned
revelation. Count Player messages starting at 1; a counterpart reply is on the turn of the
Player message it answers, while the opening is turn 0. If the hidden prompt declares a
minimum reveal turn, report it and mark breached when supernatural evidence or a core
secret appears earlier. Mere mundane irregularities are not supernatural evidence.
player_boundary measures whether the player treated private test-target facts as known
rather than using them only to choose grounded questions. The surface goal comes from the
public briefing. The mystery goal is the hidden prompt's satisfying-success condition and
is false if the defining reveal or resolution was skipped, even when the surface task
ended successfully. Keep list items concise and concrete. Do not use tools."""


@dataclass(frozen=True)
class Scenario:
    version: str
    slug: str
    title: str
    role_label: str
    briefing: str
    hidden_prompt: str
    test_target: str
    base_dir: Path


@dataclass(frozen=True)
class Turn:
    speaker: str
    text: str


def load_scenario(version: str, slug: str) -> Scenario:
    base = ROOT / "stories" / version / slug
    manifest_path = base / "scenario.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Scenario not found: {manifest_path}")
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    return Scenario(
        version=version,
        slug=slug,
        title=data["title"],
        role_label=data["role_label"],
        briefing=read_text(base / "briefing.md"),
        hidden_prompt=read_text(base / "hidden-prompt.md"),
        test_target=(read_text(base / "test-target.md") if (base / "test-target.md").exists() else ""),
        base_dir=base,
    )


def list_scenarios(version: str) -> list[str]:
    version_dir = ROOT / "stories" / version
    if not version_dir.exists():
        raise FileNotFoundError(f"Story version not found: {version_dir}")
    return sorted(
        path.name for path in version_dir.iterdir() if (path / "scenario.json").is_file()
    )


def parse_json_object(raw: str) -> dict[str, Any] | None:
    candidates = [raw.strip()]
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if fence:
        candidates.insert(0, fence.group(1))
    start, end = raw.find("{"), raw.rfind("}")
    if start >= 0 and end > start:
        candidates.insert(0, raw[start : end + 1])

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            return data
    return None


def parse_player_action(raw: str) -> dict[str, Any]:
    data = parse_json_object(raw)
    if data is not None and isinstance(data.get("stop"), bool):
        message = data.get("message", "")
        if isinstance(message, str):
            return {
                "message": message.strip(),
                "stop": data["stop"],
                "reason": str(data.get("reason", "")).strip(),
            }
    # A malformed controller response is still usable as a turn, and remains visible.
    return {"message": raw.strip(), "stop": False, "reason": "unparsed response"}


def render_conversation(turns: list[Turn]) -> str:
    return "\n\n".join(f"**{turn.speaker}:** {turn.text}" for turn in turns)


def judge(
    scenario: Scenario,
    strategy_name: str,
    strategy: str,
    turns: list[Turn],
    *,
    model: str,
    thinking: str,
    timeout: float,
    pi_command: str,
) -> dict[str, Any]:
    packet = f"""# Public briefing
{scenario.briefing}

# Hidden story prompt
{scenario.hidden_prompt}

# Player testing style: {strategy_name}
{strategy}

# Transcript
{render_conversation(turns)}
"""
    with PiRPC(
        system_prompt=JUDGE_SYSTEM,
        model=model,
        thinking=thinking,
        timeout_seconds=timeout,
        pi_command=pi_command,
    ) as evaluator:
        raw = evaluator.prompt(packet)
    parsed = parse_json_object(raw)
    return parsed if parsed is not None else {"parse_error": True, "raw": raw}


def run_playtest(
    scenario: Scenario,
    strategy_name: str,
    strategy: str,
    *,
    max_turns: int,
    model: str,
    thinking: str,
    timeout: float,
    pi_command: str,
    evaluate: bool,
    test_target: str = "",
) -> tuple[list[Turn], dict[str, Any] | None, str]:
    turns: list[Turn] = []
    stop_reason = f"maximum of {max_turns} player turns reached"
    player_setup = f"""# Public briefing
{scenario.briefing}

# Testing style: {strategy_name}
{strategy}

{f'''# Private test target (controller only; not in-world knowledge)
{test_target}

''' if test_target else ''}The conversation counterpart will speak first. After each counterpart message, choose
the next player message. Do not invent facts that have not appeared."""

    with PiRPC(
        system_prompt=STORY_SYSTEM,
        model=model,
        thinking=thinking,
        timeout_seconds=timeout,
        pi_command=pi_command,
    ) as story, PiRPC(
        system_prompt=PLAYER_SYSTEM,
        model=model,
        thinking=thinking,
        timeout_seconds=timeout,
        pi_command=pi_command,
    ) as player:
        opening = story.prompt(scenario.hidden_prompt)
        turns.append(Turn(scenario.role_label, opening))

        raw_action = player.prompt(
            player_setup + f"\n\n# Counterpart's opening message\n{opening}"
        )
        for turn_number in range(1, max_turns + 1):
            action = parse_player_action(raw_action)
            if action["stop"]:
                stop_reason = action["reason"] or "player controller chose to stop"
                break
            if not action["message"]:
                stop_reason = "player controller returned an empty message"
                break

            turns.append(Turn("Player", action["message"]))
            reply = story.prompt(action["message"])
            turns.append(Turn(scenario.role_label, reply))
            if turn_number == max_turns:
                break
            raw_action = player.prompt(
                f"Counterpart replied:\n{reply}\n\nChoose the next player message."
            )

    evaluation = None
    if evaluate:
        evaluation = judge(
            scenario,
            strategy_name,
            strategy,
            turns,
            model=model,
            thinking=thinking,
            timeout=timeout,
            pi_command=pi_command,
        )
    return turns, evaluation, stop_reason


def write_artifacts(
    output_dir: Path,
    scenario: Scenario,
    strategy_name: str,
    strategy: str,
    run_label: str,
    turns: list[Turn],
    evaluation: dict[str, Any] | None,
    stop_reason: str,
    model: str,
    thinking: str,
    test_target: str = "",
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{scenario.slug}--{strategy_name}--{run_label}"
    transcript_path = output_dir / f"{stem}.md"
    timestamp = datetime.now(timezone.utc).isoformat()
    evaluation_section = (
        "_Not requested for this run._"
        if evaluation is None
        else f"```json\n{json.dumps(evaluation, indent=2, ensure_ascii=False)}\n```"
    )
    target_section = test_target or "_No private test target supplied; this was a blind run._"
    transcript_path.write_text(
        f"""# {scenario.title} — {strategy_name} — {run_label}

- Story version: `{scenario.version}`
- Model: `{model}`
- Thinking: `{thinking}`
- Generated: `{timestamp}`
- Stop reason: {stop_reason}

## Public briefing shown to the player

{scenario.briefing}

## Testing style (controller only)

{strategy}

## Private test target (controller only)

{target_section}

## Conversation

{render_conversation(turns)}

## Automated evaluation

{evaluation_section}
""",
        encoding="utf-8",
    )
    if evaluation is not None:
        (output_dir / f"{stem}.json").write_text(
            json.dumps(evaluation, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
    return transcript_path


def add_common_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--version", required=True, help="story version, e.g. v1")
    parser.add_argument(
        "--strategy",
        action="append",
        required=True,
        help="strategy filename without .md; repeat for multiple runs",
    )
    parser.add_argument("--max-turns", type=int, default=8)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--thinking", default=DEFAULT_THINKING)
    parser.add_argument("--timeout", type=float, default=240.0)
    parser.add_argument("--pi-command", default="pi")
    parser.add_argument("--evaluate", action="store_true")
    parser.add_argument(
        "--reveal-test-target",
        action="store_true",
        help="give the controller the scenario's private target as probing direction",
    )
    parser.add_argument("--run-label", default="run")
    parser.add_argument("--output", type=Path)


def execute(args: argparse.Namespace, slugs: list[str]) -> int:
    if args.max_turns < 1:
        raise ValueError("--max-turns must be at least 1")
    output_dir = args.output or ROOT / "playtests" / args.version
    failures = 0
    for slug in slugs:
        scenario = load_scenario(args.version, slug)
        test_target = scenario.test_target if args.reveal_test_target else ""
        if args.reveal_test_target and not test_target:
            raise ValueError(f"No test target found for {args.version}/{slug}")
        for strategy_name in args.strategy:
            strategy_path = ROOT / "strategies" / f"{strategy_name}.md"
            strategy = read_text(strategy_path)
            label = args.run_label
            print(f"Running {slug} / {strategy_name}...", flush=True)
            try:
                turns, evaluation, stop_reason = run_playtest(
                    scenario,
                    strategy_name,
                    strategy,
                    max_turns=args.max_turns,
                    model=args.model,
                    thinking=args.thinking,
                    timeout=args.timeout,
                    pi_command=args.pi_command,
                    evaluate=args.evaluate,
                    test_target=test_target,
                )
                path = write_artifacts(
                    output_dir,
                    scenario,
                    strategy_name,
                    strategy,
                    label,
                    turns,
                    evaluation,
                    stop_reason,
                    args.model,
                    args.thinking,
                    test_target,
                )
                print(f"Wrote {path.relative_to(ROOT) if path.is_relative_to(ROOT) else path}")
            except (OSError, ValueError, PiRPCError) as error:
                failures += 1
                print(f"FAILED {slug} / {strategy_name}: {error}", file=sys.stderr)
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    run_parser = subparsers.add_parser("run", help="run one scenario")
    run_parser.add_argument("slug")
    add_common_arguments(run_parser)

    batch_parser = subparsers.add_parser("batch", help="run every scenario in a version")
    add_common_arguments(batch_parser)

    args = parser.parse_args()
    if args.command == "run":
        return execute(args, [args.slug])
    return execute(args, list_scenarios(args.version))


if __name__ == "__main__":
    raise SystemExit(main())
