# Game a Day

A collection of tiny games built as rapid, one-day experiments. Each game focuses on one strong mechanic and aims to deliver a complete interaction in five minutes or less.

## Games

| Game | Directory | Description |
| --- | --- | --- |
| [Signal / Sequence](aug8/) | `aug8` | Monitor a stream of signals and catch violations of temporal rules. |
| [Parking Simulator](aug9/) | `aug9` | Wrestle with the controls of a top-down parallel-parking challenge. |
| [Visa Form](aug10/) | `aug10` | Race against a hostile government website to complete a visa application. |

Each game is a standalone Bun project. To run one locally:

```bash
cd aug10
bun install
bun run dev
```

## Portfolio site

The [`site`](site/) project generates the collection's landing page and builds every published game into one static output directory.

```bash
cd site
bun install
bun run dev       # develop the landing page
bun run build     # build the landing page and all games
```

The complete static build is written to `site/dist`.

## Adding a game

Create a new game directory from the repository root:

```bash
./new-game <directory>
```

Then add its metadata to [`site/games.ts`](site/games.ts) when it is ready to appear on the portfolio site.

See [`GAME_GUIDELINES.md`](GAME_GUIDELINES.md) for the shared game-design goals, development constraints, and prototype workflow. New game directories receive an `AGENTS.md` copied from [`AGENTS.template.md`](AGENTS.template.md).
