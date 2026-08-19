# Rhythm platformer

Beatbound is a short, beginner-friendly rhythm platformer built with Phaser and Tone.js. Hold right for four or five beats at a time, then jump a tiny bouncer when its cue reaches the timing marker. The procedural soundtrack supplies a heavy downbeat and a one-beat audio warning for every jump.

The level is a wide, colorful side-scrolling road with small enemies, rolling hills, clouds, beat blocks, and a procedural dash-and-dot background texture. There are seven jumps, one action to learn, a forgiving ±210 ms timing window, and no direction reversals.

```bash
bun install
bun run dev
```

- **Move:** hold **D / →** (or use the on-screen arrows).
- **Jump:** tap **Space / W / ↑** on the big beat.
- A failed or completed run restarts immediately with one press—no refresh or extra instruction-screen click.
- `bun run test` validates route continuity, beat quantization, run distance, and timing precision.
- `?music=off` starts muted.
- `?debug=true` exposes speed, autoplay, and reset controls before the run begins.
- In debug mode, press **T** for 50% speed, **P** for autoplay, or **N** to assist a jump near its beat.
- `?debug=true&autoplay=true` runs the perfect-input playtest.
- `?debug=true&slow=0.5` starts at practice speed.
- `window.__BEATBOUND__` provides `getState()`, `press('jump')`, `setDirection()`, and `restart()` for browser automation.
