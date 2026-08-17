# GRIDWORKS

GRIDWORKS is an endless isometric base-building game about growing a frontier power network. There is no contract or countdown: connected generators continuously earn credits, which fund increasingly expensive facilities and a wider grid.

## Core loop

1. Choose a facility and click the field to place its blueprint.
2. Select a robot, then click the blueprint to assign construction.
3. Build relay pylons outward from the Grid Core.
4. Keep generators within range of the connected pylon network so their power can be exported.
5. Reinvest the income in solar arrays, wind fields, geothermal stations, fusion yards, and robot garages.

Robots do not choose work themselves, and occasionally lose their task lock. Select a stalled robot and reboot it before issuing more orders.

## Controls

- **Drag:** pan across the 36×36 field
- **Mouse wheel / + −:** zoom
- **Click robot:** select it
- **Click terrain:** move the selected robot, or place the selected blueprint
- **Click blueprint:** assign the selected robot
- **1–6:** choose a build tool
- **Escape:** cancel the build tool
- **Home button:** recenter on the Grid Core

## Development

```bash
bun install
bun run dev
bun test
bun run build
```

Use `?debug=true` for extra starting credits, a credit cheat, and the `window.__ENERGY__` playtesting API. Use `?music=off` to disable audio.
