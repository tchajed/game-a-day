import { describe, expect, it } from 'vitest';
import {
  ACTION_WINDOW_MS,
  BEAT_MS,
  RUN_SPEED,
  START_X,
  beatToMs,
  createLevel,
  isOnBeat,
  validateLevel,
} from './level';

describe('beginner beat road', () => {
  const level = createLevel();

  it('has one continuous, traversable path across a wide level', () => {
    const report = validateLevel(level);
    expect(report.errors).toEqual([]);
    expect(report.reachable).toBe(true);

    let x = START_X;
    for (const event of level) {
      expect(event.from.x).toBeCloseTo(x);
      x = event.to.x;
    }
    expect(x).toBeGreaterThan(3_500);
  });

  it('starts with only one action and generous runs between cues', () => {
    expect(level).toHaveLength(7);
    expect(new Set(level.map((event) => event.action))).toEqual(new Set(['jump']));
    expect(level.every((event) => event.travelBeats >= 4)).toBe(true);
  });

  it('places every jump on a whole beat after a reachable run', () => {
    expect(validateLevel(level).quantized).toBe(true);
    for (const event of level) {
      expect(Number.isInteger(event.beat)).toBe(true);
      const expectedDistance = RUN_SPEED * (beatToMs(event.travelBeats) / 1000);
      expect(event.to.x - event.from.x).toBeCloseTo(expectedDistance);
    }
  });

  it('uses a forgiving but still rhythmic timing window', () => {
    const event = level[3];
    const exact = beatToMs(event.beat);
    expect(isOnBeat(exact, event)).toBe(true);
    expect(isOnBeat(exact + ACTION_WINDOW_MS, event)).toBe(true);
    expect(isOnBeat(exact - ACTION_WINDOW_MS, event)).toBe(true);
    expect(isOnBeat(exact + ACTION_WINDOW_MS + 1, event)).toBe(false);
    expect((ACTION_WINDOW_MS * 2) / BEAT_MS).toBeLessThan(0.8);
    expect(validateLevel(level).precise).toBe(true);
  });

  it('completes under a perfect-input simulation while holding right', () => {
    let simulatedX = START_X;
    let previousBeat = 0;
    for (const event of level) {
      simulatedX += RUN_SPEED * (beatToMs(event.beat - previousBeat) / 1000);
      expect(isOnBeat(beatToMs(event.beat), event)).toBe(true);
      expect(simulatedX).toBeCloseTo(event.to.x);
      previousBeat = event.beat;
    }
  });

  it('cannot reach later cues by standing still', () => {
    for (const event of level) {
      expect(Math.abs(START_X - event.to.x)).toBeGreaterThan(105);
    }
  });
});
