# Stall artwork

## Integrated layered scenes

The two playable stalls now use independent background and character layers:

- `public/art/stalls/backgrounds/fox-evening.webp` — straight-on Silver Draw kiosk in a small evening carnival
- `public/art/stalls/backgrounds/rabbit-evening.webp` — angled Generous Toss booth in the same small carnival
- `public/art/stalls/characters/{fox,rabbit}-{neutral,win,lose}.png` — transparent reaction sprites

The fox is female and wears a modest high-necked blouse. The rabbit is male and has a small healed notch in one ear. Betting outcomes cross-fade and translate between neutral, player-win, and player-loss poses. Backgrounds use artificial evening lighting and different camera views. The game contains each 3:2 artboard inside the available viewport rather than cropping it.

The overworld is now a code-native Phaser 2.5D diorama: angled booth faces, depth-scaled characters, y-sorted occlusion, branching packed-earth paths, an arrival gate, a larger big top, scenery layers, and open foreground fencing create a physical three-quarter space without external assets. The playable booths dominate the rear midway, while the notice-board advertisements sit near the entrance and summon their shops at distinct locations farther inside.

## Notice-board advertisements

Three illustrated SVG broadsides live in `public/art/posters/`: Practical Ledgers, Marvelous Moon Portraits, and Dr. Stoat's Tonic. They use deliberately imperfect ink contours, watercolor-like limited palettes, aged paper, and town-bulletin/wanted-poster composition. In the overworld, their boards initially read as ordinary layered community notices; players must approach and inspect a board before its full advertisement is shown and its shop is revealed.

## Unlockable shop artwork

The three summoned shops now use complete 3:2 illustrated scenes with their keepers:

- `public/art/shops/practical-ledgers-evening.webp` — a grave tawny owl accountant amid ledgers, pigeonholes, and an abacus
- `public/art/shops/moon-portraits-evening.webp` — an elderly fruit bat artist in a velvet-and-gilt moon portrait studio
- `public/art/shops/stoat-tonic-evening.webp` — a bespectacled stoat presenting a glowing bottle from a crooked apothecary wagon

The responsive Phaser overlay keeps purchasing copy and controls independent of the paintings. Scenes are contained rather than cropped, with translucent text panels placed away from the keepers.

## Carnival entrance

`public/art/entrance/bad-bet-welcome.webp` is the new arrival screen: a blank carved carnival sign, lanterns, tents, and a clear path into the midway. Phaser adds the exact setting copy and entry button so lettering remains crisp and editable.

## Generation

Artwork was generated using Pi's `codex_generate_image` tool with the GPT Image 2 backend. Character layers were requested on flat chroma-key green, then converted locally to alpha PNGs. Prompts preserved the first sunny fox and rabbit identities while separating them from compact, character-free evening carnival backgrounds. The shop scenes referenced their matching broadsides and existing stall backgrounds to maintain the same mysterious evening storybook style.
