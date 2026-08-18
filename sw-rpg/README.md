# Software development RPG

The idea of this game is a pokemon-style RPG where your fights are personified obstacles in software development, and the party consists of software engineers (and other staff): think bugs in the wild, performance issues, and other "trainers" will be managers and product people asking for features and other issues. This is all tongue-in-cheek and supposed to be humorous.

Use Phaser. I want a visual style similar to a modern pokemon game (with decent quality and readability, and this is on a larger screen): it is deliberately supposed to look like that.

To keep things simple for the protytpe, let's just have two wild encounters and then a trainer. Have the player leave one city (which has buildings but you can't enter them) and then go to another, and these will happen along the way.

## Prototype

```bash
bun install
bun run dev
```

Move with **WASD** or the **arrow keys**. In battle, click an action or press **1–4**. The route contains two wild blockers followed by a stakeholder battle, and takes about five minutes to complete.

Use `?music=off` to disable music. Use `?debug=true` to show the encounter-skip control; press **N** to skip the next fight. Automated playtests can use the small `window.__SW_RPG__` API (`getState`, `startBattle`, `chooseAction`, `winBattle`, and `reset`).
