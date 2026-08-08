# Signal / Sequence — Prototype Design

## Core fantasy

The player is a temporal-logic monitor watching a live stream of colored, numbered signals. Rules begin unresolved. As each new state arrives, the player must identify rules that have become impossible and flag them before the next signal.

## Interaction

- States arrive in real time, one every 2.5 seconds at normal speed.
- The full finite prefix remains visible as a horizontal timeline.
- Click a rule card when that rule becomes **broken**.
- The monitor never reveals a break before the player acts: both possible and secretly broken rules appear **Unresolved**. Guaranteed, caught, and missed outcomes are revealed.
- A correct flag scores points and builds a streak.
- A false flag or failure to flag a newly broken rule before the next state costs one integrity point.
- The player starts each level with three integrity points.
- Pause and speed controls are available. Pausing is not penalized in this prototype.

## Logic and status model

The game uses future-time LTL concepts and three monitoring values:

- **Possible** — the observed prefix still has an extension that satisfies the rule.
- **Satisfied** — the prefix already guarantees the rule, regardless of its extension.
- **Broken** — no extension of the prefix can satisfy the rule.

The prototype introduces `G` (always), `F` (eventually), `X` (next), and `U` (until). For gameplay clarity, each rule has a purpose-built monitor rather than a general LTL parser. This keeps the prototype small while preserving the intended finite-prefix semantics.

## Presentation

- Natural-language rule cards are shown by default.
- An opt-in **Show LTL** toggle reveals symbolic formulas.
- State propositions are a color plus an integer value.
- Visual direction: a clean, dark temporal-monitoring console with bright signal colors, strong typography, subtle grid texture, and restrained motion.

## Level progression

1. **Stay in bounds** — safety properties using `G`; learn to flag violations.
2. **Promises & next steps** — introduce `F` and `X`; see that some prefixes can guarantee a property.
3. **Hold until** — introduce `U`; maintain an invariant until a release signal.
4. **Operator stack** — a faster mixed challenge with several concurrent rules.

Each level is handcrafted so that rule transitions are legible and useful for teaching.

## Audio

Audio uses the Web Audio API and requires no asset downloads:

- soft pulse when a state arrives;
- rising confirmation tones for a correct flag;
- low warning tone for mistakes or missed rules;
- short completion flourish.

Audio is enabled by default but can be muted. It begins only after user interaction, in accordance with browser autoplay policies.

## Prototype scope

- Desktop-first React web game with responsive behavior for narrow screens.
- Four levels, tutorial callouts, scoring, streaks, integrity, pause, replay, speed, audio, and LTL visibility controls.
- No backend, accounts, level editor, or saved progression.
