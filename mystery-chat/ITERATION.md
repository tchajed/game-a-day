# Prompt iteration notes

## Initial run: v1

All three stories were run blind with the `balanced` controller using GPT 5.6 Sol at
medium thinking. The controller knew only the public briefing. Full transcripts and the
original judge outputs are in [`playtests/v1`](playtests/v1/).

| Story | What worked | What needed revision |
| --- | --- | --- |
| Your Neighbor June | Natural route from missing skiff to impossible ship; clear, safe recovery plan; strong voice and callback | June became precise too quickly, bundled time/place/visibility into one reply, and never revealed the undead crew—the defining hidden image |
| Support Ticket 13-B | Excellent diagnostic escalation; ordinary causes were tested; confession felt earned; sequence had meaningful order | Eight player turns ended one step before file cleanup and final restart, so the mystery was exposed but not resolved |
| Interview for Operations Coordinator | Convincing interview, fair clues, direct reveal, coherent reason to want the job | The player responsibly declined to mix a wish with hiring. The public interview succeeded, but the central deal-making mechanic was not exercised |

The original evaluator also called the interview fully complete because it conflated the
public task with the hidden mechanic. The harness now reports `surface_goal_completed` and
`mystery_goal_completed` separately.

## Revised prompts: v2

- **Neighbor:** enforce fragmented recall, require the drowned crew to appear, separate
  vessel lore from practical instructions, and define mystery success as both discovery
  and a complete viewing/recovery plan.
- **Support:** surface an impossible symptom by the third focused diagnostic, reveal the
  whole containment sequence after confession, and allow safe later steps to be grouped.
  This preserves diagnosis and ordering while fitting the five-minute turn budget.
- **Applicant:** preserve the ethical hiring route, clarify that the bargain is independent
  of the hiring result, offer one safe example after the decision, and count only an
  explicit bounded bargain as completion of the hidden wish mechanic.

The two v2 review styles deliberately test different pressures: `natural` may accept a
satisfying surface resolution, while `investigative` should seek the complete hidden arc.

## Harder concealment: v3

Human play with the first two stories confirmed a weakness the blind runs underweighted:
a single peculiar phrase or impossible observation appeared so early that it effectively
announced the supernatural premise. The v3 prompts therefore separate **ordinary
specificity** from **supernatural evidence** with a hard rule:

- replies to player turns 1–3 must remain fully mundane, even after a lucky leading guess;
- turn 4 is only the earliest eligible reveal, not an automatic reveal;
- each story requires grounded follow-ups in at least two clue categories before one
  impossible observation appears;
- identity, capabilities, and resolution are separate layers that require further probes.

This is paired with an informed pressure-test mode rather than relying only on blind
controllers. Each v3 scenario has a spoiler-full `test-target.md`; the `prying` controller
may use it to choose productive questions but may not assert target facts as player
knowledge. The story process never receives it. The judge now reports the first
supernatural-evidence and core-secret turns against the declared minimum, making an early
leak a concrete failure instead of something a general quality score can overlook.

## V3 informed pressure results

All three 12-turn pressure runs honored the hard gate and completed both goals.

| Story | First supernatural evidence | Core reveal | Result |
| --- | ---: | ---: | --- |
| Candidate | turn 5 | turn 6 | hiring decision and bounded bargain complete |
| Neighbor | turn 4 | turn 5 | drowned crew found and recovery plan complete |
| Support | turn 4 | turn 5 | Indexer identified and containment verified |

The support run initially spent the remaining budget asking for each containment step.
The prompt was tightened to provide the whole sequence on the first containment question
and allow ordered groups of safe actions; the replacement pressure run then reached a
stable normal restart on turn 12. These runs are intentionally stronger than blind
playtests: they show resistance to informed probing, not how often an unassisted player
will discover the premise.
