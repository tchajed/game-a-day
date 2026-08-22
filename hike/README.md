# Hike

In this game you'll hike up a mountain. The hiking is simple: just move along the path.

The 2D look resembles overlapping sheets of paper: geometric, simple, and beautiful. The trail winds through a lightweight 2.5D perspective, with hand-shaped switchbacks turning toward the horizon and procedural cutouts filling the landscape.

## Play

```sh
bun run dev
```

Hold the round boot button, <kbd>↑</kbd>, <kbd>W</kbd>, or <kbd>Space</kbd> to follow the switchbacks. The continuous five-minute trail climbs from young woods through old growth and mountain fog to the snowline. A fresh trail moment appears about every 13 seconds: familiar wildlife, creeks, cairns, and flowers mingle with square clouds, uphill waterfalls, and other things that do not quite belong. Click a sighting while it is nearby to log it.

The trail circles counterclockwise around the mountain: a rising, densely wooded slope stays on the left while trees line the downhill side on the right. Nearby trunks fade so the hiker and immediate trail remain readable. Three breaks in the right-hand trees open briefly onto cliffside mountain views. Use **Art** to switch between Cut Paper and the pixel-art Pocket Hike.

Add `?debug=true&music=off` for 1×/2×/4× walk-speed controls, jumps through all 22 sightings, and silent automated testing. The game also exposes `window.__HIKE_DEBUG__` for programmatic playtesting, including `jumpToProgress(station)`.
