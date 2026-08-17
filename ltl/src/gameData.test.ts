import { describe, expect, test } from 'bun:test';
import { levels, monitors, type Signal } from './gameData';

const signal = (color: Signal['color'], value = 1): Signal => ({ color, value, hex: '' });

describe('finite-prefix monitors', () => {
  test('always breaks on its first counterexample', () => {
    const monitor = monitors.always((state) => state.value < 8);
    expect(monitor([signal('cyan', 3)])).toBe('possible');
    expect(monitor([signal('cyan', 3), signal('gold', 8)])).toBe('broken');
  });

  test('eventually becomes guaranteed when witnessed and fails if unmet at the end', () => {
    const monitor = monitors.eventually((state) => state.color === 'coral');
    expect(monitor([signal('cyan')])).toBe('possible');
    expect(monitor.atEnd([signal('cyan')])).toBe('broken');
    expect(monitor([signal('cyan'), signal('coral')])).toBe('satisfied');
    expect(monitor.atEnd([signal('cyan'), signal('coral')])).toBe('satisfied');
  });

  test('a pending next-response fails when its trigger is the final state', () => {
    const monitor = monitors.responseNext(
      (state) => state.color === 'coral',
      (state) => state.value <= 4,
    );
    expect(monitor([signal('cyan'), signal('coral', 2)])).toBe('possible');
    expect(monitor.atEnd([signal('cyan'), signal('coral', 2)])).toBe('broken');
  });

  test('until breaks if hold fails before release', () => {
    const monitor = monitors.until(
      (state) => state.color === 'cyan',
      (state) => state.color === 'gold',
    );
    expect(monitor([signal('cyan'), signal('cyan')])).toBe('possible');
    expect(monitor([signal('cyan'), signal('violet')])).toBe('broken');
    expect(monitor([signal('cyan'), signal('gold')])).toBe('satisfied');
  });
});

describe('handcrafted playthroughs', () => {
  test('every level has at least one break and one decisive transition', () => {
    for (const level of levels) {
      const finalStatuses = level.rules.map((rule) => rule.evaluate(level.sequence));
      expect(finalStatuses).toContain('broken');
      expect(finalStatuses.some((status) => status !== 'possible')).toBe(true);
    }
  });

  test('the full timed experience stays well under five minutes', () => {
    const durationMs = levels.reduce((total, level) => total + level.interval * level.sequence.length, 0);
    expect(durationMs).toBeLessThan(5 * 60 * 1000);
  });
});
