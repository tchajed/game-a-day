# Rhythm platformer

Beatbound is a three-level rhythm platformer built with Phaser and Tone.js. Hold a direction for several beats, then jump or duck when the next cue reaches the timing marker. The procedural soundtrack layers a heavy downbeat, an eight-bar lead melody, a changing chord progression, and a one-beat audio warning for every action.

The bright side-scrolling roads use small enemies, rolling hills, clouds, beat blocks, and a procedural dash-and-dot background texture. The difficulty now builds across three short stages:

1. **Beginner Road** — seven forgiving jumps with long four-to-five-beat runs.
2. **Bop & Duck** — adds low flyers, duck cues, and three-beat patterns.
3. **Switchback Sprint** — mixes both actions, reverses direction, and finishes with two-beat cues.

```bash
bun install
bun run dev
```

- **Move:** hold **A / D** or **← / →**.
- **Jump:** tap **Space / W / ↑** on the beat.
- **Duck:** tap **S / ↓** on the beat.
- A failed or completed run restarts immediately with one press. Held movement remains active through a Space restart.
- `bun run test` validates all three routes, beat quantization, run distance, progression, and timing precision.
- `?music=off` starts muted.
- `?debug=true` exposes speed, autoplay, level skip, and reset controls before the run begins.
- In debug mode, press **T** for 50% speed, **P** for autoplay, or **N** to assist the next action near its beat.
- `?debug=true&autoplay=true` runs perfect-input playtests through each level.
- `?debug=true&slow=0.5` starts at practice speed.
- `window.__BEATBOUND__` provides `getState()`, `press()`, `setDirection()`, and `restart()` for browser automation.
