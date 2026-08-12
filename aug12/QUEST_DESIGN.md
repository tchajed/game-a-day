# Quest design

The progression rule is: **the player may only say a fact after observing a source that contains it**. A sent question may unlock requests, and only a completed request may add its answer to the journal.

The runtime version of this structure lives in each stage’s `quest` object in [`src/App.tsx`](src/App.tsx):

```text
discovery { factId, source, revealedBy }
  → email { requires: [factId], grants: questionId }
    → requests { requires: [questionId], availableAfter }
      → completed request reply
        → journal finding
```

The game validates at startup that every email requires its stage’s discovered fact, every request desk requires the fact granted by that email, and every report discovery points to a real row.

## Current quest graphs

### Tutorial — capacity

| Order | Player-visible source/action | Fact granted | What it unlocks |
|---|---|---|---|
| 1 | Mara’s email proposes another sailing after two freight calls were turned away | `extra-sailing-proposed` | A reply asking what evidence to check |
| 2 | Player sends the reply | `capacity-question-open` | Mira’s response, then the capacity request |
| 3 | Player requests **Check deck capacity** and ends the day | — | Mira’s completed analysis |
| 4 | Mira’s reply compares sold weight with safe capacity | **Kestrel sails 61% full / 39% is unused** | The sourced finding is written to the journal |

The 61% figure must not appear in the prompt, player email, request card, or opening journal note. Its first source is Mira’s completed request.

### Level 1 — bicycle fees

| Order | Player-visible source/action | Fact granted | What it unlocks |
|---|---|---|---|
| 1 | Mara says the attached report contains an operating line that does not fit | — | The report |
| 2 | Player selects **Bicycle fees** in the report | `bicycle-fees-down-34` | The email that cites **−34%** |
| 3 | Player sends the question | `bicycle-question-open` | Audit requests |
| 4 | A request reply arrives | The selected request’s finding | A sourced journal entry |

The initial email deliberately does not contain −34%. The reply control is absent until the player identifies that number in the report.

### Level 5 — fuel

| Order | Player-visible source/action | Fact granted | What it unlocks |
|---|---|---|---|
| 1 | Vale says Finance’s report explains the board’s view | — | The report |
| 2 | Player selects **Fuel** in the report | `fuel-up-72` | The email that cites **+72%** |
| 3 | Player sends the question | `north-reef-question-open` | Evidence requests |
| 4 | Request replies arrive | GPS, cargo, scan, or testimony findings | Journal evidence and the final board decision |

## Content checks for future stages

1. List every fact the player can repeat.
2. Give each fact a visible source: message, report row, or request reply.
3. Put the fact’s ID in the next action’s `requires` list.
4. Keep unsourced answers out of open-question and journal copy.
5. Make the player perform the observation; merely opening a screen should not count when selecting a specific row is the intended mechanic.
6. Treat acknowledgements (“I’ll check”) as process updates, not findings.
