# Factory programming

This is a game where you control a robot in a factory by scheduling its actions. This isn't programming in the sense of sophisticated logic, but programming its timing precisely. The whole game will also be a rhythm game and will operate on the beat, so all timing will be in terms of beats.

I am imagining that you have a complex environment with many things moving and a tight path to walk. The "program" (schedule of actions) starts out simple: just movement in the cardinal directions, and pauses. You should have a nice interface to adjust timing and view the timeline of actions and such. The factory is very dangerous so the robot dies in a run quickly, and progression within the level comes from making it a bit further and seeing what's ahead.

I want a pixel art look (maybe similar to Megaman), but a previous conversation with ChatGPT said true pixel art is hard to get right, so maybe you need to fake it? Or can you create regular assets and then turn them into pixel art systematically?

I think the right thing for the factory is primarily picking up and moving boxes around, and putting them on conveyor belts, but it can also include flipping switches to open doors, turn on and off conveyors, etc. Let's start out with one somewhat simple level and then we'll try a more complex level design.

Eventually I want to have simple conditionals in the programs to react to something dynamic in the environment, like something with some timing randomness, but let's not do that initially while we work out the core mechanics.

You should make sure there is a solution. Debug mode should provide controls for skipping to a specific point in the simulation as well as loading up the solution.

Make sure to make the UI game-like and usable. I think this should be done in Phaser as a result, but it might also be cool to have the programming UI be in React and the simulation and art in Phaser. We should have readable text sizes and fonts, minimize the use of text in general. The fonts should match the style.

## Prototype

**Shift Protocol** is a two-level React + Phaser prototype. Program a food-delivery robot's 20-beat route, collect crates and operate factory machinery with one context-sensitive interact command, then reach the OUT bay. Each run permanently maps the tiles it sees, so planning happens against a growing fog-of-war map. The first shift introduces cycling presses and a blast door; the second asks you to route a loose industrial weight along conveyors onto a pressure plate while timing around oversized patrol robots. A slower manual weight route is also possible.

```bash
bun install
bun run dev
```

Use the timeline or keyboard shortcuts: arrows move, `Space` holds, `E` interacts with the current square, and `Enter` runs the tape. Carrying cargo into OUT completes the shift automatically. Runs play against one of five selectable procedurally synthesized 128 BPM Tone.js scores, with double-time phrases plus synchronized machinery, movement, interaction, collision, and delivery cues. Add `?music=off` to silence audio. Add `?debug=true` to reveal controls for loading each level's verified solution and seeking to any beat; programmatic playtests can also use `window.factoryDebug`.
