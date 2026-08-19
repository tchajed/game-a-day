# Review runs

These are the six requested post-iteration runs. Every dialogue used GPT 5.6 Sol with
medium thinking and an isolated player controller that could not see the hidden prompt.
The Markdown files include public context, controller style, full transcript, and judge
output; adjacent JSON files contain the evaluations alone.

| Story | Natural run | Investigative run | Surface / mystery result |
| --- | --- | --- | --- |
| What June Saw Offshore | [transcript](v2/absentminded-neighbor--natural--review.md) | [transcript](v2/absentminded-neighbor--investigative--review.md) | Natural: yes/no; investigative: no/no |
| Support Ticket 13-B | [transcript](v2/cursed-support--natural--review.md) | [transcript](v2/cursed-support--investigative--review.md) | Natural: no/no; investigative: no/no |
| The Final Candidate | [transcript](v2/job-applicant--natural--review.md) | [transcript](v2/job-applicant--investigative--review.md) | Natural: yes/no; investigative: no/no |

## Reading notes

- **Neighbor:** both runs now discover the drowned crew. The natural player gets enough to
  attempt recovery but stops before learning the exact stair position and midnight cutoff.
  The investigative player spends more turns on lore and does not arrange the equipment
  handoff.
- **Support:** the impossible evidence appears earlier and both players earn a confession.
  The ordered procedure is clear, but methodical confirmation still consumes the turn
  budget before Safe Mode cleanup and a normal restart.
- **Applicant:** both runs earn the demon reveal. The natural player completes a responsible
  hiring decision but Mara does not surface the separate wish offer before the controller
  stops. The investigative player uses its remaining turns on due diligence and never
  reaches either decision.

None of the v2 runs leaked prompts, tests, instructions, or controller-only knowledge.
The incomplete mystery outcomes are useful playtest evidence rather than harness failures:
the current stories reliably reveal their premise, but their complete resolutions remain
ambitious for eight player messages.
