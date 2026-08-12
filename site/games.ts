export type GameConfig = {
  directory: string;
  slug: string;
  date: string;
  cover: string;
  crop: { left: number; top: number; width: number; height: number };
};

// Slugs, release dates, artwork, and card accents live here rather than in the games.
export const games: GameConfig[] = [
  {
    directory: "aug11-2",
    slug: "museum",
    date: "2026-08-11",
    cover: "screenshots/museum-entry.png",
    crop: { left: 430, top: 20, width: 810, height: 540 },
  },
  {
    directory: "aug11",
    slug: "espresso",
    date: "2026-08-11",
    cover: "screenshots/espresso-station.png",
    crop: { left: 190, top: 20, width: 900, height: 540 },
  },
  {
    directory: "aug10",
    slug: "visa-form",
    date: "2026-08-10",
    cover: "artifacts/privacy-ads.png",
    crop: { left: 120, top: 20, width: 900, height: 540 },
  },
  {
    directory: "aug9",
    slug: "parking",
    date: "2026-08-09",
    cover: "screenshots/curbside-vertical.png",
    crop: { left: 280, top: 80, width: 900, height: 540 },
  },
  {
    directory: "aug8",
    slug: "ltl",
    date: "2026-08-08",
    cover: "screenshots/signal-sequence-level-1.png",
    crop: { left: 0, top: 50, width: 900, height: 540 },
  },
];
