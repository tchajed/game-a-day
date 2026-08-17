# Programming deckbuilder

I want to create a deck building game which involves programming. The key mechanic is that you don't get to play out your deck manually, you have to write a complete algorithm for it. To make this manageable, I want the deck to be very small (I was thinking 6-8 cards, two card hands, that kind of thing).

Given that you have to play programmatically, I was thinking of also having cards related to getting information, in the same way that some deckbuilders have meta game cards related to collecting cards or permanent improvements. These would produce logs that you could then view. This will be necessary to learn more about the opponent.

## Setting

The setting is diplomacy with an alien race, which has two sub-factions (but the player doesn't know that at the start). The explanation for the game is that there's a time loop that we can enter to reset everything except for the deck, and within each loop we get to do lots of talks but also build up state. You play as a commander who can send out robot/AI negotiators.

It would be good to have several distinct matches (like you know that you're going to have talks in some sequence, and each will be repeated a few times) so that you can create different decks - that construction isn't programmatic, and you can reuse cards between those decks.

## Graphics

The interface is for deck building and should be easy to use. For now, and to make it possible for me to debug this, also create a separate UI to play the matches manually - we'll get this right before developing any programming.

## Game design

Obviously the crucial part of the game is the cards and how to earn them.

## Prototype review

- [`GAMEPLAY.md`](GAMEPLAY.md) states the current rules, optimal route, and design problems without presentation copy.
- Run `bun run dev` and open [`/style-review.html`](style-review.html) to compare three alternate visual directions for the same game state.
