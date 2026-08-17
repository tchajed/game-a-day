# GRIDWORKS

GRIDWORKS is a two-level operations game about expanding a solar grid with robot teams whose repair skills form a directed ring:

**OPTIC repairs ARC → ARC repairs SERVO → SERVO repairs OPTIC**

A pair always has a blind spot. Balanced triads are resilient, but splitting them gets work done faster and makes the next breakdown harder to answer. ARC units wire solar arrays 55% faster, SERVO units erect pylons 55% faster, and OPTIC units move 35% faster, making them natural field responders. Only active units accumulate wear, so keeping the right reserve matters.

## Levels

1. **Triad Protocol:** a short, pre-funded tutorial. Use the selected OPTIC to restore a failed ARC, then assign SERVO to the marked pylon and ARC to the marked array.
2. **Broken Frontier:** build an 18 MW network before a 2:30 storm deadline with two balanced triads. The final expansion wave must be funded by the grid's early exports.

## Controls

- **Drag:** pan across the 36×36 field
- **Mouse wheel / + −:** zoom
- **Click unit:** select it
- **Click terrain:** move the selected unit, or place a selected blueprint
- **Click blueprint:** assign the selected unit
- **Click failed unit with a compatible unit selected:** dispatch a reboot
- **1–2:** choose relay or solar construction
- **Escape:** cancel the build tool
- **Home button:** recenter on the Grid Core

## Development

```bash
bun install
bun run dev
bun test
bun run build
```

Use `?debug=true` for extra credits, level skipping, and the `window.__ENERGY__` programmatic-playtesting API. Add `&level=2` to start on the featured level. Use `?music=off` to disable audio.
