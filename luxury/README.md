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

Make eight timed decisions while balancing aura, craft, and cash. Immediate ledger movements appear at once; deeper consequences arrive one quarter later. Music is procedural and changes as the tenure progresses.

- `?music=off` disables music for testing.
- `?debug=true` extends decision timers and reveals one-click counsel/board choices.
- `bun test` runs the exhaustive balance simulation over all 6,561 strategies.
