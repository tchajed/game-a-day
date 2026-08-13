# Stall artwork

## Integrated layered scenes

The two playable stalls now use independent background and character layers:

- `public/art/stalls/backgrounds/fox-evening.webp` — straight-on Silver Spin kiosk in a small evening carnival
- `public/art/stalls/backgrounds/rabbit-evening.webp` — angled Generous Toss booth in the same small carnival
- `public/art/stalls/characters/{fox,rabbit}-{neutral,win,lose}.png` — transparent reaction sprites

The fox is female and wears a modest high-necked blouse. The rabbit is male and has a small healed notch in one ear. Betting outcomes cross-fade and translate between neutral, player-win, and player-loss poses. Backgrounds use artificial evening lighting and different camera views. The game contains each 3:2 artboard inside the available viewport rather than cropping it.

The overworld is now a code-native Phaser 2.5D diorama: angled booth faces, depth-scaled characters, y-sorted occlusion, compressed paths, scenery layers, and foreground fencing create a physical three-quarter space without external assets. Shop screens remain code-native pending further art passes.

## Notice-board advertisements

Three illustrated SVG broadsides live in `public/art/posters/`: Practical Ledgers, Marvelous Moon Portraits, and Dr. Stoat's Tonic. They use deliberately imperfect ink contours, watercolor-like limited palettes, aged paper, and town-bulletin/wanted-poster composition. In the overworld, their boards initially read as ordinary layered community notices; players must approach and inspect a board before its full advertisement is shown and its shop is revealed.

## Generation

Artwork was generated using Pi's `codex_generate_image` tool with the GPT Image 2 backend. Character layers were requested on flat chroma-key green, then converted locally to alpha PNGs. Prompts preserved the first sunny fox and rabbit identities while separating them from compact, character-free evening carnival backgrounds.
