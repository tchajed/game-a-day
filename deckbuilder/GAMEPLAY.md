# NULL PROTOCOL: gameplay and progression

This describes the current manual-play prototype.

## Core loop

Each contact presents a fixed sequence of alien signals. Play one of two cards per exchange to reach the Trust target before the exchanges end.

- Every signal has visible **pressure**, which is added to the card’s Tension effect.
- If Tension reaches its limit, the link collapses—even if the same play reaches the Trust target.
- Signal-matched cards are much stronger than mismatched cards.
- The six-card deck is not shuffled. Its first two cards form the opening hand; after each play, the next card is drawn from left to right.
- The workshop now has explicit draw-order controls.
- Winning either of the first two contacts unlocks one of three specialist cards and opens the workshop before the next contact.

The campaign is three contacts and is intended to take only a few attempts.

## Starting methods

| Card | Effect |
| --- | --- |
| Active Listen | +1 Trust, −1 Tension, +1 Insight |
| Mirror Rite | +4 Trust on Ritual; otherwise no Trust and +1 Tension |
| Verify Claim | +4 Trust on Analytical; otherwise no Trust and +1 Tension |
| Open Archive | +4 Trust, +1 Tension on Warm; otherwise +1 Trust, +2 Tension |
| Signal Offering | +3 Trust, +2 Tension; with 2 Insight, +5 Trust, +1 Tension |
| Measured Pause | −2 Tension; on Hostile, +3 Trust and −3 Tension |

## Progression gates

### 1. Lyra-of-Mists

- **12 Trust**, **6 Tension**, four exchanges.
- Signals: Ritual → Warm → Guarded → Warm.
- The starting draw order is a viable teaching line: Mirror Rite → Open Archive → Signal Offering → Active Listen.
- That line finishes at 12 Trust and 5 Tension. A mismatched or overly aggressive opening can collapse the link.

Reward choice:

- **Shared Stillness:** safe, especially strong on Guarded.
- **Chorus Weave:** consistently forceful, strongest on Warm, but adds Tension.
- **Gentle Redaction:** safe, especially strong on Hostile.

### 2. Archivist Tal

- **18 Trust**, **9 Tension**, five exchanges.
- Signals: Analytical → Guarded → Analytical → Hostile → Warm.
- No ordering or play sequence using only the six starting cards can reach accord.
- Each Lyra reward enables at least one legal solution, but the player must equip it and arrange the draw order.
- The three reward choices produce different routes: Stillness exploits the guarded exchange, Chorus supplies broad power at a tension cost, and Redaction turns Tal’s accusation into progress.
- Tal also makes Insight tactical: combining two observation results calibrates Signal Offering from a risky +3 into an efficient +5.

Reward choice:

- **Pattern Proof:** +6 Trust on Analytical.
- **Kind Boundary:** +6 Trust and heavy cooling on Guarded or Hostile.
- **Irrevocable Oath:** unconditional +6 Trust with dangerous Tension.

### 3. The Confluence

- **22 Trust**, **12 Tension**, five exchanges.
- Signals: Warm → Analytical → Ritual → Hostile → Guarded.
- The starting cards plus a Lyra reward top out below the Trust target.
- A card recovered from Tal is therefore required.
- Every one of the nine possible Lyra/Tal reward pairs has at least one legal winning route. Aggressive Oath routes need cooling; Pattern routes reward exact sequencing; Boundary routes trade raw flexibility for safety.

## What the player must now do

1. Read the signal sequence and pressure.
2. Choose one specialist from each reward tier.
3. Cut two methods to keep the deck at six cards.
4. Gather Insight early enough to calibrate an Offering when that route needs it.
5. Arrange the exact draw order while accounting for the card that remains in hand.
6. Balance matched Trust gains against cumulative Tension.

This remains a deterministic, short sequencing puzzle suitable for the manual-play phase. The future programming layer can automate the same two-card-hand decisions.

## Balance checks

`src/game.test.ts` exhaustively searches distinct-card play sequences and verifies that:

- Lyra is solvable with the starting deck;
- Tal is impossible without a Lyra reward and solvable with each one;
- the Confluence is impossible without a Tal reward;
- all nine reward pairs can complete the finale;
- reaching the Tension cap is always a failure.
