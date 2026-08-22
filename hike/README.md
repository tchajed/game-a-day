# Hike

In this game you'll hike up a mountain. The hiking is simple: just move along the path. However, various strange things appear, and you need to click on them; every one of these gives an achievement.

Some of the things I want are trash on the ground, a lone bird, a strange cloud, two identical and distinct trees next to each other (when all the other trees are procedurally generated).

I want a 2D look resembling many overlapping sheets of paper - geometric, simple, and beautiful.

The hiking itself stays simple while the trail winds through a lightweight 2.5D perspective. Hand-shaped switchbacks turn toward the horizon, while the hiker, trees, and curiosities remain procedural 2D cutouts. The hike is deliberately long enough for its distinct events to breathe, and none of them are missable.

## Play

```sh
bun run dev
```

Hold the round boot button, <kbd>↑</kbd>, <kbd>W</kbd>, or <kbd>Space</kbd> to follow the switchbacks. The eight-minute trail climbs from young woods through old growth and mountain fog to the snowline, pausing at every curiosity until you find and click it.

Use **Scene ↔** to compare two environment approaches: **Living Slope** fills the projected terrain with contour layers, stones, deadfall, moss, and ferns; **Trail Tunnel** uses close screen-space banks, trunks, and canopy to shorten the sightline. Both open onto three mountain overlooks. Use **Art** to switch between Cut Paper and the pixel-art Pocket Hike.

Add `?debug=true&music=off` for 1×/2×/4× walk-speed controls, surprise jumps, and silent automated testing. The game also exposes `window.__HIKE_DEBUG__` for programmatic playtesting, including `setView("slope" | "tunnel")` and `jumpToProgress(station)`.
