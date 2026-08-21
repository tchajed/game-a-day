# Two Top

A programming cooking simulator inspired by the coordination puzzles of *PlateUp*. Program two tiny chefs, run a 94-second dinner shift, and revise their priorities when the kitchen jams.

## Play

Each table orders either tomato or mushroom pizza. The crew must prep dough, top orders, load two ovens, serve hot food, and clear tables using only three counters and a two-slot pass.

Four programming interfaces explore different amounts of player control:

- **Tune** — adjust five action priorities for each chef and choose a dough buffer.
- **Rules API** — order calls against a small, chainable kitchen API.
- **KitchenScript** — write prioritized `when … -> …` rules for each chef.
- **Autopilot** — watch the reference JavaScript strategy run by itself.

The programming panel folds into a compact live status rail during service, and can be reopened at any time to adjust the running strategy. Chefs visibly carry dough, pizzas, and dirty dishes between each preparation stage. Use **Skip to end** beside the speed controls to simulate the rest of a shift instantly; the shift report then breaks down guest bottlenecks, each chef's work/walking/idle time, and a table-by-table service timeline.

The palette switcher in the header includes four visual directions: Soft Bistro, Blueprint, Night Diner, and Paper Plan.

## Development

```bash
bun install
bun run dev
bun test
bun run build
```

The Vite build uses a relative base path and works when hosted below a non-root URL. Use `?debug=true` for an end-shift control and `?music=off` to disable audio during automated testing.
