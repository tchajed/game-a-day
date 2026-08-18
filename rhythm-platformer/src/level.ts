export const BPM = 132;
export const BEAT_MS = 60_000 / BPM;
export const ACTION_WINDOW_MS = 125;
export const TRAVEL_BEATS = 2;

export type Action = 'jump' | 'duck';

export interface Point {
  x: number;
  y: number;
}

export interface BeatEvent {
  index: number;
  beat: number;
  action: Action;
  from: Point;
  to: Point;
}

const ACTIONS: Action[] = [
  'jump', 'jump', 'duck', 'jump',
  'jump', 'duck', 'jump', 'jump',
  'duck', 'jump', 'jump', 'duck',
  'jump', 'jump', 'duck', 'jump',
];

export function createLevel(): BeatEvent[] {
  let point: Point = { x: 180, y: 620 };
  return ACTIONS.map((action, index) => {
    const next: Point = {
      x: point.x < 480 ? 720 : 180,
      y: point.y - (action === 'jump' ? 96 : 0),
    };
    const event: BeatEvent = {
      index,
      beat: 4 + index * TRAVEL_BEATS,
      action,
      from: { ...point },
      to: next,
    };
    point = next;
    return event;
  });
}

export function beatToMs(beat: number): number {
  return beat * BEAT_MS;
}

export function timingDeltaMs(elapsedMs: number, event: BeatEvent): number {
  return elapsedMs - beatToMs(event.beat);
}

export function isOnBeat(elapsedMs: number, event: BeatEvent): boolean {
  return Math.abs(timingDeltaMs(elapsedMs, event)) <= ACTION_WINDOW_MS;
}

export interface ValidationResult {
  reachable: boolean;
  quantized: boolean;
  precise: boolean;
  errors: string[];
}

/** Pure validation used both by tests and the debug overlay. */
export function validateLevel(events: BeatEvent[]): ValidationResult {
  const errors: string[] = [];

  events.forEach((event, index) => {
    if (event.beat % TRAVEL_BEATS !== 0) {
      errors.push(`Event ${index} is not on the ${TRAVEL_BEATS}-beat grid`);
    }
    if (index > 0) {
      const previous = events[index - 1];
      if (event.from.x !== previous.to.x || event.from.y !== previous.to.y) {
        errors.push(`Route breaks between events ${index - 1} and ${index}`);
      }
      if (event.beat - previous.beat !== TRAVEL_BEATS) {
        errors.push(`Event ${index} has an unreachable travel time`);
      }
    }
    const distance = Math.abs(event.to.x - event.from.x);
    if (distance < 400 || distance > 620) {
      errors.push(`Event ${index} has an invalid horizontal crossing`);
    }
    const rise = event.from.y - event.to.y;
    if (event.action === 'jump' && rise !== 96) {
      errors.push(`Jump ${index} does not reach the next platform`);
    }
    if (event.action === 'duck' && rise !== 0) {
      errors.push(`Duck ${index} cannot stay under its flyer`);
    }
  });

  const precise = ACTION_WINDOW_MS / BEAT_MS < 0.3;
  if (!precise) errors.push('Timing window is too broad to require rhythmic precision');

  return {
    reachable: !errors.some((error) => error.includes('Route') || error.includes('travel') || error.includes('reach') || error.includes('stay')),
    quantized: !errors.some((error) => error.includes('grid') || error.includes('travel time')),
    precise,
    errors,
  };
}
