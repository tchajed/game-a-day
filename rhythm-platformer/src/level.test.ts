import { describe, expect, it } from 'vitest';
import {
  ACTION_WINDOW_MS,
  BEAT_MS,
  JUMP_HOLD_BEATS,
  MAX_JUMP_HEIGHT,
  MIN_JUMP_HEIGHT,
  RUN_SPEED,
  beatToMs,
  createLevels,
  isDownbeat,
  isOnBeat,
  jumpHeightForHoldMs,
  validateLevel,
} from './level';

describe('three-level beat road', () => {
  const levels = createLevels();

  it('contains a tutorial and two progressively richer levels', () => {
    expect(levels).toHaveLength(3);
    expect(levels.map((level) => level.events.length)).toEqual([7, 9, 10]);
    expect(new Set(levels[0].events.map((event) => event.action))).toEqual(new Set(['jump']));
    expect(new Set(levels[1].events.map((event) => event.action))).toEqual(new Set(['jump', 'duck']));
    expect(new Set(levels[2].events.map((event) => event.direction))).toEqual(new Set([-1, 1]));
  });

  it('gives every level one continuous, traversable route', () => {
    for (const level of levels) {
      const report = validateLevel(level.events);
      expect(report.errors, level.name).toEqual([]);
      expect(report.reachable).toBe(true);

      let position = level.events[0].from;
      for (const event of level.events) {
        expect(event.from).toEqual(position);
        position = event.to;
      }
    }
  });

  it('starts the switchback with a jump on a strong downbeat', () => {
    const opening = levels[2].events[0];
    expect(opening.action).toBe('jump');
    expect(isDownbeat(opening.beat)).toBe(true);
  });

  it('scales jump height with a short, capped hold', () => {
    expect(jumpHeightForHoldMs(0)).toBe(MIN_JUMP_HEIGHT);
    expect(jumpHeightForHoldMs(beatToMs(JUMP_HOLD_BEATS) / 2)).toBeCloseTo(
      (MIN_JUMP_HEIGHT + MAX_JUMP_HEIGHT) / 2,
    );
    expect(jumpHeightForHoldMs(beatToMs(JUMP_HOLD_BEATS) * 2)).toBe(MAX_JUMP_HEIGHT);
  });

  it('keeps the tutorial spacious, then tightens the rhythm', () => {
    expect(levels[0].events.every((event) => event.travelBeats >= 4)).toBe(true);
    expect(levels[1].events.some((event) => event.travelBeats === 3)).toBe(true);
    expect(levels[2].events.some((event) => event.travelBeats === 2)).toBe(true);
  });

  it('places every action on a whole beat after a reachable run', () => {
    for (const level of levels) {
      expect(validateLevel(level.events).quantized).toBe(true);
      for (const event of level.events) {
        expect(Number.isInteger(event.beat)).toBe(true);
        const expectedDistance = event.direction * RUN_SPEED * (beatToMs(event.travelBeats) / 1000);
        expect(event.to.x - event.from.x).toBeCloseTo(expectedDistance);
      }
    }
  });

  it('uses a forgiving but still rhythmic timing window', () => {
    for (const level of levels) {
      const event = level.events[Math.floor(level.events.length / 2)];
      const exact = beatToMs(event.beat);
      expect(isOnBeat(exact, event)).toBe(true);
      expect(isOnBeat(exact + ACTION_WINDOW_MS, event)).toBe(true);
      expect(isOnBeat(exact - ACTION_WINDOW_MS, event)).toBe(true);
      expect(isOnBeat(exact + ACTION_WINDOW_MS + 1, event)).toBe(false);
      expect(validateLevel(level.events).precise).toBe(true);
    }
    expect((ACTION_WINDOW_MS * 2) / BEAT_MS).toBeLessThan(0.8);
  });

  it('completes every route under a perfect directional simulation', () => {
    for (const level of levels) {
      let simulatedX = level.startX;
      for (const event of level.events) {
        simulatedX += event.direction * RUN_SPEED * (beatToMs(event.travelBeats) / 1000);
        expect(isOnBeat(beatToMs(event.beat), event)).toBe(true);
        expect(simulatedX).toBeCloseTo(event.to.x);
      }
    }
  });
});
