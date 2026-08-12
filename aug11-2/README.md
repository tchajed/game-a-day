# The Museum of Ordinary Things

An interactive PlayCanvas museum treating its unusual collection as the stuff of everyday life, with two ways to explore 41 paintings:

- a six-room 3D museum arranged around a shared central concourse
- a responsive, filterable online collection grid

## Galleries

1. Portraits and Personages
2. Domestic Arrangements
3. Views from the Outer Counties
4. A Brief History of Weather
5. The Working Day
6. The Garden at Night

The Night Garden is generated entirely offline. Clean SVG source studies in `artwork-src/night-garden/` are rasterized and passed through two deterministic oil-paint recipes: bright graphic impasto and dark velatura. The pipeline adds clustered pigment, directional brush drag, canvas weave, and illuminated edge relief.

```sh
bun install
bun run art:night-garden  # requires rsvg-convert and ImageMagick
bun run dev
bun run test
```
