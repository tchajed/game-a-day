# Luxury company

Run a luxury company. Have to follow the luxury playbook, business does poorly and competitors take over if you stray. Can have a bunch of decisions on timers, and music follows your progress. I’m thinking you get immediate feedback on decisions but maybe a delay in how it affects revenue and brand perception. You should also have a dashboard keeping track of your competitors, including the mass market competitors that you really shouldn't care about.

This is inspired by the story of Rolex, but I don't want it to be a watch company. I think it'd be funny if it's the luxury version of something that doesn't actually have a luxury presence right now.

---

## Luxury lunchboxes

You make luxury lunchboxes. These are the height of performance and fashion, and the craze for them is akin to watches or handbags. People want to be seen carrying them around. There's essentially no competition in the luxury market, but you're competing with a bunch of companies that make highly functional products at reasonable price points. The company's been in this business for 75 years before the game starts, and you take over as a new CEO in a time of crisis.

## Play

```bash
bun install
bun run dev
```

Make eight decisions across a five-session tutorial while balancing aura, craft, and cash. The opening strategy reading and first brief are untimed. A timed solo brief follows; then the remaining decisions arrive in simultaneous pairs with a longer shared clock. Choices can be revised before sealing, and no principles, forecasts, or results appear during deliberation. Immediate ledger movements appear only after the whole session is sealed; deeper consequences arrive in the next session.

The default timed portion is 150 seconds, leaving the complete prototype comfortably within its five-minute target.

- `?music=off` disables music for testing.
- `?debug=true` quadruples timed sessions and provides neutral resolve/skip controls without identifying strong choices.
- Programmatic playtesting can use `window.__MORROW__.resolve([choiceIndex, ...])`, `skip()`, and `getState()`.
- `bun test` validates the tutorial cadence and runs the exhaustive balance simulation over all 6,561 strategies.
