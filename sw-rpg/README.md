# Software development RPG

The idea of this game is a pokemon-style RPG where your fights are personified obstacles in software development, and the party consists of software engineers (and other staff): think bugs in the wild, performance issues, and other "trainers" will be managers and product people asking for features and other issues. This is all tongue-in-cheek and supposed to be humorous.

Use Phaser. I want a visual style similar to a modern pokemon game (with decent quality and readability, and this is on a larger screen): it is deliberately supposed to look like that.

To keep things simple for the protytpe, let's just have two wild encounters and then a trainer. Have the player leave one city (which has buildings but you can't enter them) and then go to another, and these will happen along the way.

## Prototype

```bash
bun install
bun run dev
```

Move with **WASD** or the **arrow keys**. In battle, each party member has four attacks on **1–4**; press **S** or use the separate swap button to switch between Maya and Inez. Swapping uses the active member's turn. Click or press **Space/Enter** to advance combat dialogue. The route contains two wild blockers followed by a stakeholder battle where PM Alex sends out two escalating requests, and takes about five minutes to complete.

The Tone.js score switches between **Eastbound Adventure**, a bright 16-bar overworld theme, and **Interrupt Storm**, a faster 16-bar battle theme. Both are authored as multitrack MIDI in `scripts/generate-soundtracks.ts`; run `bun run music:generate` to rebuild the `.mid` files.

Use `?music=off` to disable music. Use `?debug=true` to show the encounter-skip control; press **N** to skip the next fight. Automated playtests can use the small `window.__SW_RPG__` API (`getState`, `startBattle`, `chooseAction`, `swapParty`, `continueDialogue`, `winBattle`, and `reset`).
