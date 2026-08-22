# Hike

In this game you'll hike up a mountain. The hiking is simple: just move along the path. However, various strange things appear, and you need to click on them; every one of these gives an achievement.

Some of the things I want are trash on the ground, a lone bird, a strange cloud, two identical and distinct trees next to each other (when all the other trees are procedurally generated).

I want a 2D look resembling many overlapping sheets of paper - geometric, simple, and beautiful.

The hiking itself should be simple. I was imagining that it's a 2D side scroller but you'd going around the mountain. The viewpoint should be limited and the hike itself should be fairly long, so the distinct events are somewhat far apart. None of the events should be missable.

## Play

```sh
bun run dev
```

Hold the round boot button, <kbd>→</kbd>, <kbd>D</kbd>, or <kbd>Space</kbd> to hike. The eight-minute trail climbs from young woods through old growth and mountain fog to the snowline, pausing at every curiosity until you find and click it. Use **Look** to switch between four distinct treatments: Cut Paper, Ink Wash, Neon Summit, and the pixel-art Pocket Hike.

Add `?debug=true&music=off` for 1×/2×/4× walk-speed controls, surprise jumps, and silent automated testing. The game also exposes `window.__HIKE_DEBUG__` for programmatic playtesting.
