This repo hosts a number of game directories (named by date) and a portfolio website at `./site`.

Commit after every logical change, directly to the `main` branch.

Use `./new-game <directory>` to create a new game directory.

Maintain the list of games in README.md and metadata in [`site/games.ts`](site/games.ts).

Games are deployed to a non-root URL (e.g., `/espresso`). Before deploying a game, test that it was written to handle this, in particular that asset handling uses `BASE_URL`.

See [`GAME_GUIDELINES.md`](GAME_GUIDELINES.md) for the shared game-design goals, development constraints, and prototype workflow. Each game's AGENTS.md refers to this.
