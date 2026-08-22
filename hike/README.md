# Hike

In this game you'll hike up a mountain. The hiking is simple: just move along the path.

The 2D look resembles overlapping sheets of paper: geometric, simple, and beautiful. The trail winds through a lightweight 2.5D perspective, with hand-shaped switchbacks turning toward the horizon and procedural cutouts filling the landscape.

## Play

```sh
bun run dev
```

Hold the round boot button, <kbd>↑</kbd>, <kbd>W</kbd>, or <kbd>Space</kbd> to follow the switchbacks. The continuous five-minute trail climbs from young woods through old growth and mountain fog to the snowline. A fresh trail moment appears about every 13 seconds: familiar wildlife, creeks, cairns, and flowers mingle with square clouds, uphill waterfalls, and other things that do not quite belong. Click a sighting while it is nearby to log it.

Use **Scene ↔** to compare two environment approaches: **Living Slope** fills the projected terrain with contour layers, stones, deadfall, moss, and ferns; **Trail Tunnel** uses close screen-space banks, trunks, and canopy to shorten the sightline. Both open onto three mountain overlooks. Use **Art** to switch between Cut Paper and the pixel-art Pocket Hike.

Add `?debug=true&music=off` for 1×/2×/4× walk-speed controls, jumps through all 22 sightings, and silent automated testing. The game also exposes `window.__HIKE_DEBUG__` for programmatic playtesting, including `setView("slope" | "tunnel")` and `jumpToProgress(station)`.
