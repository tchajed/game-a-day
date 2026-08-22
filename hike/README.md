# Hike

In this game you'll hike up a mountain. The hiking is simple: just move along the path.

The trail is rendered as a procedural low-poly diorama in Three.js: real perspective, moving light, long tree shadows, ground fog, faceted terrain, and a camera that follows each switchback from the young woods to the snowline. No downloaded 3D models or textures are used.

Open the **Hiker** model viewer from the top-right control to orbit and inspect four fully procedural character designs: Trail Scout, Ridge Runner, Creek Guide, and Crag Climber. Every hiker carries a modeled backpack; the Scout and Runner have classic square packs with a small mountain badge, while the Guide and Climber carry distinct roll-top and rope-loaded designs. Choosing **Use this hiker** saves that model for the trail. The viewer is also available directly at `/hike/character.html`.

## Play

```sh
bun run dev
```

Hold the round boot button, <kbd>↑</kbd>, <kbd>W</kbd>, or <kbd>Space</kbd> to follow the switchbacks. The continuous five-minute trail climbs from young woods through old growth and mountain fog to the snowline. A fresh trail moment appears about every 13 seconds: familiar wildlife, creeks, cairns, and flowers mingle with square clouds, uphill waterfalls, and other things that do not quite belong. A small gold glint rewards a close look; click the nearby 3D sighting to log it.

The trail circles the mountain beneath dense low-poly pines. Three breaks in the downhill trees open onto distant faceted peaks, while snow gradually overtakes the ground and tree crowns near the summit.

Add `?debug=true&music=off` for 1×/2×/4× walk-speed controls, jumps through all 22 sightings, and silent automated testing. The game also exposes `window.__HIKE_DEBUG__` for programmatic playtesting, including `jumpToProgress(station)` and `screenPosition(id)`.
