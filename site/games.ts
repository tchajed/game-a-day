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
    directory: "deckbuilder",
    slug: "null-protocol",
    date: "2026-08-17",
    cover: "screenshots/null-protocol-fieldbook-contact.png",
    crop: { left: 245, top: 78, width: 900, height: 540 },
  },
  {
    directory: "energy",
    slug: "energy",
    date: "2026-08-16",
    cover: "artifacts/energy-unreliable-rescue.png",
    crop: { left: 0, top: 0, width: 865, height: 577 },
  },
  {
    directory: "factory",
    slug: "factory-beat",
    date: "2026-08-15",
    cover: "screenshots/shift-protocol.png",
    crop: { left: 0, top: 0, width: 970, height: 647 },
  },
  {
    directory: "typing",
    slug: "upper-management",
    date: "2026-08-14",
    cover: "screenshots/opening.png",
    crop: { left: 208, top: 0, width: 864, height: 576 },
  },
  {
    directory: "betting",
    slug: "bad-bet",
    date: "2026-08-13",
    cover: "screenshots/bad-bet-entry.png",
    crop: { left: 208, top: 0, width: 864, height: 576 },
  },
  {
    directory: "psychopomp",
    slug: "psychopomp",
    date: "2026-08-12",
    cover: "screenshot.png",
    crop: { left: 435, top: 10, width: 810, height: 540 },
  },
  {
    directory: "accounting",
    slug: "ledger",
    date: "2026-08-12",
    cover: "screenshots/ledger.png",
    crop: { left: 0, top: 20, width: 810, height: 540 },
  },
  {
    directory: "museum",
    slug: "museum",
    date: "2026-08-11",
    cover: "screenshots/museum-entry.png",
    crop: { left: 430, top: 20, width: 810, height: 540 },
  },
  {
    directory: "espresso",
    slug: "espresso",
    date: "2026-08-11",
    cover: "screenshots/espresso-station.png",
    crop: { left: 190, top: 20, width: 900, height: 540 },
  },
  {
    directory: "visa-form",
    slug: "visa-form",
    date: "2026-08-10",
    cover: "artifacts/privacy-ads.png",
    crop: { left: 120, top: 20, width: 900, height: 540 },
  },
  {
    directory: "parking",
    slug: "parking",
    date: "2026-08-09",
    cover: "screenshots/curbside-vertical.png",
    crop: { left: 280, top: 80, width: 900, height: 540 },
  },
  {
    directory: "ltl",
    slug: "ltl",
    date: "2026-08-08",
    cover: "screenshots/signal-sequence-level-1.png",
    crop: { left: 0, top: 50, width: 900, height: 540 },
  },
];
