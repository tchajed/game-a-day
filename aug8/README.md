# LTL game

This is a (nerdy) game about linear temporal logic. The idea is that a level consists of a few LTL formulas and a sequence of states. The player is supposed to keep track of which of the LTL formulas can still be true (formally, which are true for some infinite extension of the finite prefix so far and which are definitely false). I'm imagining this as real time, so you have to think somewhat quickly, but of course this is really hard if there are 3 complicated formulas.

While this is a nerdy game, I want to have a mode where the LTL formula isn't literally shown and opt-in to seeing it. Instead of a formula, there should be some other more natural language-esque way of presenting it.

The prototype we're building should have at least four levels: the first three show what the tutorial progression might look like (as LTL features are added), and the last is something hard.

There are a few different ways to present states. The most natural is that the whole prefix is shown, and one state at a time is added at a regular time interval. But this could also be a turn-based game, or a rhythm game, or earlier states could disappear.

I haven't decided on the exact syntax: should be past-time LTL or an until operator for example.

## Technology

I think this can just be built with React even with the real-time and audio components but use your judgment.

## Visuals

I was thinking a pretty clean visual style, with states having properties like color and maybe a number (so the state formulas would be colors and maybe inequalities; nothing hard to evaluate on a single state). Let's play around with exactly what the states have. I didn't want color + shape because that becomes a different type of identification game.

## Audio

Not really sure but let's try having audio.
