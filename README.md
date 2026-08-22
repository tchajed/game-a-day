# Game a Day

A collection of games each built in one day, with AI assistance. Each game focuses on one strong mechanic and aims to deliver a complete interaction in five minutes or less.

## Games

| Game | Directory | Description |
| --- | --- | --- |
| [Hike](hike/) | `hike` | Follow a ribbon of switchbacks through a warm cut-paper forest to the snowline. |
| [Two Top](cooking-sim/) | `cooking-sim` | Program two tiny chefs and debug their kitchen strategy through a frantic dinner shift. |
| [Mystery Chat](mystery-chat/) | `mystery-chat` | Question three ordinary conversations until their hidden truths begin to surface. |
| [Beatbound](rhythm-platformer/) | `rhythm-platformer` | Auto-run through three bright platforming roads, jumping and ducking to the beat. |
| [Route 529](sw-rpg/) | `sw-rpg` | Battle bugs, memory leaks, and scope creep on a software team’s road to Ship City. |
| [NULL PROTOCOL](deckbuilder/) | `deckbuilder` | Read alien signals, build trust, and recover better diplomacy protocols across time loops. |
| [Signal / Sequence](ltl/) | `ltl` | Monitor a stream of signals and catch violations of temporal rules. |
| [Parking Simulator](parking/) | `parking` | Wrestle with the controls of a top-down parallel-parking challenge. |
| [Visa Form](visa-form/) | `visa-form` | Race against a bad government website to complete a visa application. |
| [Little Peak Coffee](espresso/) | `espresso` | Dial in a balanced espresso shot as a meticulous mouse barista. |
| [Museum of Ordinary Things](museum/) | `museum` | Wander an uncanny collection where impossible subjects are treated as ordinary. |
| [Northstar Ledger](accounting/) | `accounting` | Follow emails and audit ferry-company accounts to uncover a hidden route. |
| [Psychopomps](psychopomp/) | `psychopomp` | Navigate the afterlife’s least prepared department as an overqualified new hire. |
| [Bad Bet](betting/) | `betting` | Test a carnival’s suspicious odds before risking your purse on its games of chance. |
| [Upper Management](typing/) | `typing` | Type carefully while corporate memos fill the night office with watchful ravens. |
| [Factory Beat](factory/) | `factory` | Program a cargo robot’s 20-beat route through a relentless automated factory. |
| [GRIDWORKS](energy/) | `energy` | Expand a frontier solar grid with a crew of fast, failure-prone construction robots. |

Each game is a standalone Bun project. To run one locally:

```bash
cd visa-form
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
