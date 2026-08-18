# Rhythm platformer

I have an idea for a rhythm platformer: a tough-as-nails platformer where the music guides you to the right timing.

Create a procedural soundtrack with tone.js and midi instruments. There should be a couple layers to this, a heavy bass track, and a strong downbeat.

Create a level where you need to snake left and right and keep jumping up (a classic platformer shape). There should be floor obstacles for you to jump over and things flying. Make sure you have programmatic testing to make sure that (a) there is a path through, (b) the path requires somewhat precise timing, and (c) the path is exactly on the beat with the music. Add audio queues to the music on exactly what you should do. Let's also add a scrolling indicator of these actions, similar to Just Dance.

For this game I don't want to focus on graphics, so use simple shapes and graphics for the background, level, and obstacles/enemies. The main character should be a rounded rectangle blob thing with eyes. Use Phaser.

## Prototype

Beatbound is a 16-cue vertical platforming run at 132 BPM. You control every crossing: hold **A/D** or **←/→** to run, press **Space/↑** to jump, and hold **S/↓** to duck when each cue crosses the white timing line. Spikes, flyers, gaps, and ledge landings all have collision checks; the soundtrack, route, hazards, and cue chart are procedural/code-only.

```bash
bun install
bun run dev
```

- `bun run test` validates route continuity, beat quantization, and the ±125 ms timing window.
- `?music=off` starts muted.
- `?debug=true&autoplay=true` runs the perfect-input movement playtest. In debug mode, press `N` for assisted input and `T` to toggle 35% slow motion.
- `?debug=true&slow=0.35` starts the music, movement, cue track, and timing windows at 35% speed (values from `0.2` to `1` are supported).
- `window.__BEATBOUND__` provides `getState()`, `press(action)`, `setDirection()`, `setDuck()`, and `restart()` for browser automation.
