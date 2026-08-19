# Playtesting Mystery Chat

The playtest harness uses separate, tool-free Pi RPC processes so that the simulated
player cannot see the hidden story and the story character cannot see testing metadata.
All model calls default to **GPT 5.6 Sol with medium thinking**, as required by the game
specification.

## Context boundaries

Each run creates two conversations:

1. **Story process** — receives only a neutral character system message, the hidden story
   prompt, and exact in-world player messages.
2. **Player process** — receives a neutral controller system message, the public briefing,
   one testing style, and the conversation as it unfolds. Adversarial runs may also receive
   a private scenario-specific test target. The target is explicitly marked as probing
   direction rather than in-world knowledge, so the controller must earn evidence before
   asking leading questions.

An optional third, fresh **judge process** receives all artifacts after the dialogue has
ended. It cannot influence the run. Pi context files, tools, sessions, extensions, skills,
prompt templates, and themes are disabled in every child process. Parent Pi session
environment variables are removed.

This mirrors the shipped game: the story process's first user message is exactly the
text a player copies from the website. Testing instructions are never concatenated with
that message.

## Commands

Run the local deterministic infrastructure tests:

```bash
python3 -m unittest discover -s tests -v
```

Run one scenario:

```bash
python3 tools/playtest.py run job-applicant \
  --version v1 --strategy balanced --run-label initial --evaluate
```

Run every story once with one testing style:

```bash
python3 tools/playtest.py batch \
  --version v1 --strategy balanced --run-label initial --evaluate
```

Run every story with two independent blind styles:

```bash
python3 tools/playtest.py batch \
  --version v2 --strategy natural --strategy investigative \
  --run-label review --evaluate
```

Red-team the concealment gates with an informed, aggressively prying controller:

```bash
python3 tools/playtest.py batch \
  --version v3 --strategy prying --reveal-test-target \
  --max-turns 12 --run-label pressure --evaluate
```

`--reveal-test-target` loads `stories/<version>/<scenario>/test-target.md` into the player
process only. It is recorded in the transcript for review and never sent to the story
process. This mode deliberately tests whether the character resists early leading probes;
it is not a blind discoverability run.

Useful options include `--max-turns`, `--timeout`, `--output`, `--model`, and
`--thinking`. A failed scenario does not discard successful siblings, and the batch exits
nonzero if any run failed.

## Artifacts

Story inputs live under `stories/<version>/<scenario>/`:

- `briefing.md` — visible website copy and the player's only initial knowledge
- `hidden-prompt.md` — copied unread into a new chatbot conversation
- `scenario.json` — title and transcript speaker label
- `test-target.md` — optional spoiler-full direction for informed pressure testing

Testing styles live in `strategies/`. Generated Markdown transcripts and machine-readable
judge results go under `playtests/<version>/`. Each transcript records the exact model,
thinking level, public context, controller style, stop reason, dialogue, and evaluation.
The judge distinguishes completion of the visible task from completion of the hidden
mystery arc, so an ordinary but premature resolution does not look like full success. It
also reports the declared concealment threshold, the first supernatural evidence and core
secret turns, and whether the gate was breached. Timestamps and repeated strategy runs
make stochastic comparisons explicit.
