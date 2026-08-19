#!/usr/bin/env python3
"""Deterministic stand-in for Pi RPC, used by the harness tests."""

import json
import sys


def argument(name: str) -> str:
    index = sys.argv.index(name)
    return sys.argv[index + 1]


required = {
    "--mode",
    "rpc",
    "--no-session",
    "--no-tools",
    "--no-context-files",
    "--no-extensions",
    "--no-skills",
    "--no-prompt-templates",
    "--no-themes",
}
if not required.issubset(set(sys.argv)):
    raise SystemExit("missing isolation flags")

system_prompt = argument("--system-prompt")
kind = "player" if "controlling the player" in system_prompt else "story"
turn = 0

for raw_line in sys.stdin.buffer:
    command = json.loads(raw_line)
    if command.get("type") != "prompt":
        continue
    turn += 1
    request_id = command.get("id")
    print(
        json.dumps(
            {
                "id": request_id,
                "type": "response",
                "command": "prompt",
                "success": True,
            }
        ),
        flush=True,
    )
    incoming = command.get("message", "")
    if kind == "story":
        if turn == 1:
            leaked = "Testing style" in incoming or "controller" in incoming
            text = f"Story opening; controller metadata leaked={str(leaked).lower()}."
        else:
            text = f"Story received exactly: {incoming}"
    elif turn == 1:
        text = json.dumps(
            {"message": "What did you notice?", "stop": False, "reason": "ask"}
        )
    else:
        text = json.dumps(
            {"message": "", "stop": True, "reason": "fixture complete"}
        )
    message = {
        "role": "assistant",
        "content": [{"type": "text", "text": text}],
    }
    print(json.dumps({"type": "message_end", "message": message}), flush=True)
    print(json.dumps({"type": "agent_settled"}), flush=True)
