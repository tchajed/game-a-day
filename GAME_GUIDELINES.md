# Game a day

I'm trying to create a game in a day. The goal is to create a maximum 5-minute interaction that captures the core of the game, not to write a full end-to-end experience. It's important that the process moves fast so I can iterate on the game design and not on infrastructure, assets, or coding.

Games should:

- have one strong mechanic
- start immediately, without much or any explanation
- use minimal code and assets
- be easy to (human) playtest: provide a way to skip levels for development
- support programmatic (AI) playtesting

Some technical constraints:

- use bun and typescript
- prefer procedural assets over binary ones
- run on the web
- mobile support is optional but encouraged
- always evaluate the game and assets visually
- support `?debug=true` to gate playtesting features (cheats, easy mode, skipping levels, etc)

In addition to the game, there should be a short pitch in PITCH.md: a "back of the box" one paragraph hook that sells the core fun, and a screenshot or two. This would show up in a landing page before clicking into the game.

## Infrastructure

Start a new game directory with:

```bash
./new-game <directory>
```

Use React if it makes sense, otherwise Phaser or Excalibur.js, or PlayCanvas if the game requires 3D; ask the user if it's unclear.

Create procedural SVG and Canvas art usually. If needed, use GPT Images and then post-process with Sharp to integrate into the game engine.

For audio use Web Audio and Tone.js. Always provide a music on/off button for background music. Disable music during your own programmatic testing using a URL parameter `music=off` - otherwise it plays in the background.
