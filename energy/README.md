# GRIDWORKS

GRIDWORKS is an endless operations game about scaling a solar grid with an unreliable robot crew. Standard units are fast but fail after 60 seconds of operating time on average. A failed unit can only be restored when another unit physically reaches it, so every increasingly expensive robot is a tradeoff between construction throughput and another breakdown demanding attention.

## Core loop

1. Place relay pylons and solar-array blueprints.
2. Select a unit, then click a blueprint to dispatch it.
3. Keep generators within range of the connected relay network so their power earns credits.
4. When a unit fails, select a working unit and click the failure to send a field rescue.
5. Reinvest credits in additional units, whose deployment cost increases with crew size.

`FAILSAFE-0` never fails, preventing total crew lockup, but it moves and works at only 40% of standard speed. All other units have an MTTF (mean time to failure) of 60 operating seconds. Idle time does not count.

## Controls

- **Drag:** pan across the 36×36 field
- **Mouse wheel / + −:** zoom
- **Click unit:** select it
- **Click terrain:** move the selected unit, or place the selected blueprint
- **Click blueprint:** assign the selected unit
- **Click failed unit with a working unit selected:** dispatch a rescue
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

Use `?debug=true` for extra starting credits, a credit cheat, and the `window.__ENERGY__` playtesting API. Use `?music=off` to disable audio.
