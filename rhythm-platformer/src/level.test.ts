import { describe, expect, it } from 'vitest';
import {
  ACTION_WINDOW_MS,
  BEAT_MS,
  TRAVEL_BEATS,
  beatToMs,
  createLevel,
  isOnBeat,
  validateLevel,
} from './level';

describe('procedural beat route', () => {
  const level = createLevel();

  it('has one continuous, traversable path to the finish', () => {
    const report = validateLevel(level);
    expect(report.errors).toEqual([]);
    expect(report.reachable).toBe(true);

    let position = level[0].from;
    for (const event of level) {
      expect(event.from).toEqual(position);
      position = event.to;
    }
    expect(position.y).toBeLessThan(level[0].from.y - 900);
  });

  it('requires both obstacle actions along the route', () => {
    expect(level.filter((event) => event.action === 'jump').length).toBeGreaterThan(8);
    expect(level.filter((event) => event.action === 'duck').length).toBeGreaterThan(3);
  });

  it('places every required action exactly on the two-beat grid', () => {
    expect(validateLevel(level).quantized).toBe(true);
    for (let index = 0; index < level.length; index += 1) {
      expect(level[index].beat % TRAVEL_BEATS).toBe(0);
      if (index > 0) expect(level[index].beat - level[index - 1].beat).toBe(TRAVEL_BEATS);
    }
  });

  it('accepts the authored beat but rejects sloppy timing', () => {
    const event = level[5];
    const exact = beatToMs(event.beat);
    expect(isOnBeat(exact, event)).toBe(true);
    expect(isOnBeat(exact + ACTION_WINDOW_MS, event)).toBe(true);
    expect(isOnBeat(exact - ACTION_WINDOW_MS, event)).toBe(true);
    expect(isOnBeat(exact + ACTION_WINDOW_MS + 1, event)).toBe(false);
    expect(isOnBeat(exact - ACTION_WINDOW_MS - 1, event)).toBe(false);
    expect((ACTION_WINDOW_MS * 2) / BEAT_MS).toBeLessThan(0.6);
    expect(validateLevel(level).precise).toBe(true);
  });

  it('completes under a perfect-input simulation', () => {
    let cleared = 0;
    for (const event of level) {
      if (isOnBeat(beatToMs(event.beat), event)) cleared += 1;
    }
    expect(cleared).toBe(level.length);
  });
});
