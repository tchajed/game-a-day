# The Impossible Collection

An interactive PlayCanvas museum with two ways to explore 41 oil paintings:

- a six-room 3D museum arranged around a shared central concourse
- a responsive, filterable online collection grid

## Galleries

1. The Court of Beasts
2. Objects, Elsewhere
3. Worlds Without Us
4. The Department of Impossible Weather
5. Minor Gods at Work
6. The Night Garden

The Night Garden is generated entirely offline. Clean SVG source studies in `artwork-src/night-garden/` are rasterized and passed through two deterministic oil-paint recipes: bright graphic impasto and dark velatura. The pipeline adds clustered pigment, directional brush drag, canvas weave, and illuminated edge relief.

```sh
bun install
bun run art:night-garden  # requires rsvg-convert and ImageMagick
bun run dev
bun run test
```
