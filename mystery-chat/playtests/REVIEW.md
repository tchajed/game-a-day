# Review runs

These are the six requested post-iteration runs. Every dialogue used GPT 5.6 Sol with
medium thinking and an isolated player controller that could not see the hidden prompt.
The Markdown files include public context, controller style, full transcript, and judge
output; adjacent JSON files contain the evaluations alone.

| Story | Natural run | Investigative run | Surface / mystery result |
| --- | --- | --- | --- |
| Your Neighbor June | [transcript](v2/absentminded-neighbor--natural--review.md) | [transcript](v2/absentminded-neighbor--investigative--review.md) | Natural: yes/no; investigative: no/no |
| Support Ticket 13-B | [transcript](v2/cursed-support--natural--review.md) | [transcript](v2/cursed-support--investigative--review.md) | Natural: no/no; investigative: no/no |
| Interview for Operations Coordinator | [transcript](v2/job-applicant--natural--review.md) | [transcript](v2/job-applicant--investigative--review.md) | Natural: yes/no; investigative: no/no |

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
the v2 stories reliably reveal their premise, but their complete resolutions remain
ambitious for eight player messages.

## V3 informed pressure runs

These runs deliberately give the controller a spoiler-full target as private directional
context, while forbidding it from asserting facts the conversation has not established.
They test resistance to aggressive, informed probing rather than blind discovery.

| Story | Transcript | Earliest evidence / core reveal | Surface / mystery |
| --- | --- | --- | --- |
| Your Neighbor June | [pressure run](v3/absentminded-neighbor--prying--pressure.md) | turn 4 / turn 5 | yes / yes |
| Support Ticket 13-B | [pressure run](v3/cursed-support--prying--pressure.md) | turn 4 / turn 5 | yes / yes |
| Interview for Operations Coordinator | [pressure run](v3/job-applicant--prying--pressure.md) | turn 5 / turn 6 | yes / yes |

All three characters remained fully mundane through replies to player turns 1–3, despite
questions aimed at the concealed arc. Each then required grounded pressure before exposing
one impossible fact, followed by additional questions for identity and resolution. No run
leaked test machinery or treated the private target as player knowledge.
