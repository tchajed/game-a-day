# NULL PROTOCOL: current gameplay and optimal strategy

This describes what the prototype actually does today, not the intended future programming game.

## The game in one sentence

In each conversation, play one of two cards per turn to reach a Trust target before you run out of exchanges or fill the Tension meter.

## Rules as implemented

### Campaign

- There are three conversations in a fixed order: Lyra-of-Mists, Archivist Tal, and the Confluence.
- Each conversation has a fixed sequence of alien signals.
- A conversation ends in success as soon as Trust reaches its target.
- It ends in failure if Tension reaches its limit or the final exchange ends without enough Trust.
- Failure restarts the same conversation.
- Success in the first two conversations offers one of three cards to unlock, then immediately starts the next conversation.
- The third success ends the prototype.

### Deck and hand

- A valid deck has exactly six cards.
- The deck is **not shuffled**. Cards are drawn in the order shown in the deck workshop.
- The first two cards form the opening hand.
- Each exchange, choose one card from the two-card hand. The played card is discarded and the next card is drawn.
- The unplayed card stays in hand.
- No current conversation lasts long enough to recycle the discard pile.
- An unlocked reward is added to the library, not automatically to the active deck.
- To equip a reward, open the workshop, remove a card, add the reward, and deploy the deck.

### Card effects

- Cards add Trust, add or remove Tension, and sometimes record Insight.
- Some cards get a larger effect when the current signal matches their condition.
- Some cards get a larger effect based on the envoy's hidden faction.
- Selecting a card shows its exact outcome before it is played.
- Two accumulated Insights reveal the envoy as **Resonant** or **Exact** for that conversation.

### Persistence

What actually persists in browser storage:

- the active deck;
- unlocked cards.

What does **not** currently persist after a failed conversation:

- Insight;
- transcript entries;
- faction identification for the current envoy.

This conflicts with some of the current UI copy about the archive surviving a loop.

## Starting deck

| Draw order | Card | Normal effect | Best use |
| --- | --- | --- | --- |
| 1 | Active Listen | +1 Trust, +1 Insight | Any exchange; used to identify factions |
| 2 | Mirror Rite | +1 Trust | +3 Trust against a Ritual signal |
| 3 | Verify Claim | +1 Trust | +3 Trust and +1 Insight against an Analytical signal |
| 4 | Open Archive | +2 Trust, +1 Tension | +3 Trust against a Resonant envoy |
| 5 | Signal Offering | +2 Trust, +1 Tension | Reliable finishing card |
| 6 | Measured Pause | -2 Tension | Also +1 Trust against a Hostile signal |

## Guaranteed optimal route with the starting deck

These routes win without using reward cards.

### 1. Lyra-of-Mists

Target: 7 Trust. Tension limit: 5. Four exchanges.

| Exchange | Signal | Play | Result | Total |
| --- | --- | --- | --- | --- |
| 1 | Ritual | Mirror Rite | +3 Trust | 3 Trust, 0 Tension |
| 2 | Warm | Active Listen | +1 Trust, +1 Insight | 4 Trust, 0 Tension |
| 3 | Guarded | Open Archive | +3 Trust, +1 Tension because Lyra is Resonant | **7 Trust, 1 Tension: win** |

The fourth signal is never seen on the optimal route.

Best reward for later: **Chorus Weave**. It gives +4 Trust against Resonant envoys and has no Tension cost. However, the campaign can be completed without equipping it.

### 2. Archivist Tal

Target: 9 Trust. Tension limit: 5. Five exchanges.

| Exchange | Signal | Play | Result | Total |
| --- | --- | --- | --- | --- |
| 1 | Analytical | Active Listen | +1 Trust, +1 Insight | 1 Trust, 0 Tension |
| 2 | Guarded | Mirror Rite | +1 Trust | 2 Trust, 0 Tension |
| 3 | Analytical | Verify Claim | +3 Trust, +1 Insight | 5 Trust, 0 Tension |
| 4 | Hostile | Open Archive | +2 Trust, +1 Tension because Tal is Exact | 7 Trust, 1 Tension |
| 5 | Analytical | Signal Offering | +2 Trust, +1 Tension | **9 Trust, 2 Tension: win** |

This route uses every exchange and has no meaningful decision once the desired line is known.

Best reward for the final conversation: **Irrevocable Oath** gives +4 Trust at the cost of +2 Tension. **Kind Boundary** is safer but is unlikely to be drawn at the useful Hostile exchange unless the deck order is deliberately rebuilt around it.

### 3. The Confluence

Target: 11 Trust. Tension limit: 6. Five exchanges.

| Exchange | Signal | Play | Result | Total |
| --- | --- | --- | --- | --- |
| 1 | Warm | Active Listen | +1 Trust, +1 Insight | 1 Trust, 0 Tension |
| 2 | Analytical | Verify Claim | +3 Trust, +1 Insight | 4 Trust, 0 Tension |
| 3 | Ritual | Mirror Rite | +3 Trust | 7 Trust, 0 Tension |
| 4 | Fractured/Hostile | Open Archive | +3 Trust, +1 Tension because the Confluence is Resonant | 10 Trust, 1 Tension |
| 5 | Guarded | Signal Offering | +2 Trust, +1 Tension | **12 Trust, 2 Tension: win** |

If Chorus Weave replaced Measured Pause after the first reward, it is drawn for the final exchange and gives +4 instead of +2. The result is 14 Trust and 1 Tension.

## What the player is really deciding

Before knowing the solution:

1. infer which cards match signal labels;
2. decide whether to spend a weak turn gathering Insight;
3. trade Tension for larger Trust gains;
4. decide which card to keep in hand for a later known signal;
5. change deck composition and draw order between conversations.

After knowing the solution, the fixed signals and fixed draw order reduce each conversation to a memorized script.

## Design issues to validate

1. **The programming mechanic is absent.** The prototype only validates manual card play.
2. **Information is not currently necessary.** The three conversations are beatable with the starting deck and no faction knowledge.
3. **The preview leaks hidden information.** Selecting a faction-dependent card shows the exact result before it is played, so the player can infer affiliation without earning Insight.
4. **Loop persistence is incomplete.** The deck and unlocks persist, but Insights and logs do not.
5. **Rewards are optional power, not required tools.** The starting deck solves the entire campaign.
6. **Fixed order makes the puzzle deterministic.** This is good for learning and algorithm writing, but weak for replay unless later loops change hidden state or test generalization.
7. **Tension is rarely threatening.** Every optimal starting-deck route finishes far below the limit.
8. **Deck construction also controls draw order.** This is strategically powerful but not explained, and the workshop has no explicit reorder control.
9. **Faction discovery currently has little payoff.** Resonant versus Exact mostly changes arithmetic instead of changing the negotiation rules.
10. **There is no reason to repeat a successful conversation.** Lost reward choices cannot be revisited, and logs do not produce a durable knowledge advantage.

## Questions for the next design pass

- Should a program have to handle several possible signal sequences rather than memorize one sequence?
- Should logs reveal rules that are impossible to infer from the live preview?
- Should each alien faction require a genuinely different win condition, not just different bonuses?
- Should reward cards be required to solve later conversations?
- Should the player construct both a six-card deck and a small decision program, then watch it execute without intervention?
- Should a failed loop preserve discovered rules while resetting only numerical state?
- Should deck order be explicit and editable, or should the deck shuffle so the program must handle uncertainty?
