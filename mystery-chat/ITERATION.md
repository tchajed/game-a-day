# Prompt iteration notes

## Initial run: v1

All three stories were run blind with the `balanced` controller using GPT 5.6 Sol at
medium thinking. The controller knew only the public briefing. Full transcripts and the
original judge outputs are in [`playtests/v1`](playtests/v1/).

| Story | What worked | What needed revision |
| --- | --- | --- |
| What June Saw Offshore | Natural route from missing skiff to impossible ship; clear, safe recovery plan; strong voice and callback | June became precise too quickly, bundled time/place/visibility into one reply, and never revealed the undead crew—the defining hidden image |
| Support Ticket 13-B | Excellent diagnostic escalation; ordinary causes were tested; confession felt earned; sequence had meaningful order | Eight player turns ended one step before file cleanup and final restart, so the mystery was exposed but not resolved |
| The Final Candidate | Convincing interview, fair clues, direct reveal, coherent reason to want the job | The player responsibly declined to mix a wish with hiring. The public interview succeeded, but the central deal-making mechanic was not exercised |

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
