# Game a Day

A collection of games each built in one day, with AI assistance. Each game focuses on one strong mechanic and aims to deliver a complete interaction in five minutes or less.

## Games

| Game | Directory | Description |
| --- | --- | --- |
| [Signal / Sequence](aug8/) | `aug8` | Monitor a stream of signals and catch violations of temporal rules. |
| [Parking Simulator](aug9/) | `aug9` | Wrestle with the controls of a top-down parallel-parking challenge. |
| [Visa Form](aug10/) | `aug10` | Race against a bad government website to complete a visa application. |
| [Little Peak Coffee](aug11/) | `aug11` | Dial in a balanced espresso shot as a meticulous mouse barista. |
| [Museum of Ordinary Things](aug11-2/) | `aug11-2` | Wander an uncanny collection where impossible subjects are treated as ordinary. |
| [Northstar Ledger](aug12/) | `aug12` | Follow emails and audit ferry-company accounts to uncover a hidden route. |
| [Psychopomps](psychopomp/) | `psychopomp` | Navigate the afterlife’s least prepared department as an overqualified new hire. |
| [Bad Bet](betting/) | `betting` | Test a carnival’s suspicious odds before risking your purse on its games of chance. |
| [Upper Management](typing/) | `typing` | Type carefully while corporate memos fill the night office with watchful ravens. |

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

```bash
./new-game <directory>
```
