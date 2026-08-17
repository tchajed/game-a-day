# The Museum of Ordinary Things

An interactive PlayCanvas museum treating its unusual collection as the stuff of everyday life, with two ways to explore 42 paintings:

- a six-gallery 3D museum arranged around a shared central concourse
- a lower-level, evenly lit visible-storage room with 42 browsable painting bays (11 occupied), including four wide-format bays
- a responsive, filterable online collection grid

## Galleries

1. Portraits and Personages
2. Domestic Arrangements
3. Views from the Outer Counties
4. A Brief History of Weather
5. The Working Day
6. The Garden at Night

Lower level B1 contains Visible Storage. Add `{ slot, room, work }` entries to `storageAssignments` in `src/main.ts` when moving paintings into one of its 42 numbered bays. The online collection automatically groups those works under its Visible Storage category.

The Night Garden is generated entirely offline. Clean SVG source studies in `artwork-src/night-garden/` are rasterized and passed through two deterministic oil-paint recipes: bright graphic impasto and dark velatura. The pipeline adds clustered pigment, directional brush drag, canvas weave, and illuminated edge relief.

```sh
bun install
bun run art:night-garden  # requires rsvg-convert and ImageMagick
bun run dev
bun run test
bun run test:wall-snapshots    # compare 18 wall elevations and the wide storage bay
bun run update:wall-snapshots  # intentionally accept a rehanging
```

Add `?debug=true` for compact fast-travel and collection controls used during playtesting. Add `music=off` to hard-disable the optional procedural ambience during automated runs.
