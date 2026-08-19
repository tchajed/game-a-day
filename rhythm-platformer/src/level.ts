export const BPM = 108;
export const BEAT_MS = 60_000 / BPM;
export const ACTION_WINDOW_MS = 210;
export const RUN_SPEED = 190;
export const POSITION_TOLERANCE = 105;
export const JUMP_BEATS = 1.5;
export const START_X = 180;
export const GROUND_Y = 557;

export type Action = 'jump';

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
  hazardX: number;
  travelBeats: number;
}

// Each obstacle is separated by a comfortable four or five beats of running.
const SEGMENT_BEATS = [4, 4, 4, 5, 5, 5, 5];

export function createLevel(): BeatEvent[] {
  let point: Point = { x: START_X, y: GROUND_Y };
  let beat = 0;

  return SEGMENT_BEATS.map((travelBeats, index) => {
    beat += travelBeats;
    const next: Point = {
      x: point.x + RUN_SPEED * (beatToMs(travelBeats) / 1000),
      y: GROUND_Y,
    };
    const event: BeatEvent = {
      index,
      beat,
      action: 'jump',
      from: { ...point },
      to: next,
      hazardX: next.x + 66,
      travelBeats,
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

/** Pure validation used by tests and checked at runtime. */
export function validateLevel(events: BeatEvent[]): ValidationResult {
  const errors: string[] = [];

  events.forEach((event, index) => {
    if (!Number.isInteger(event.beat)) errors.push(`Event ${index} is not on a whole beat`);
    if (event.travelBeats < 4 || event.travelBeats > 5) {
      errors.push(`Event ${index} does not leave a simple four-to-five-beat run`);
    }
    if (index === 0) {
      if (event.from.x !== START_X || event.beat !== event.travelBeats) {
        errors.push('The opening run is not connected to the start');
      }
    } else {
      const previous = events[index - 1];
      if (event.from.x !== previous.to.x || event.from.y !== previous.to.y) {
        errors.push(`Route breaks between events ${index - 1} and ${index}`);
      }
      if (event.beat - previous.beat !== event.travelBeats) {
        errors.push(`Event ${index} has the wrong travel time`);
      }
    }

    const expectedDistance = RUN_SPEED * (beatToMs(event.travelBeats) / 1000);
    const actualDistance = event.to.x - event.from.x;
    if (Math.abs(expectedDistance - actualDistance) > 0.01) {
      errors.push(`Event ${index} cannot be reached at run speed`);
    }
    if (event.action !== 'jump') errors.push(`Event ${index} adds an advanced action`);
    if (event.hazardX <= event.to.x) errors.push(`Hazard ${index} is not beyond its jump cue`);
  });

  const precise = ACTION_WINDOW_MS / BEAT_MS < 0.4;
  if (!precise) errors.push('Timing window is too broad to feel rhythmic');

  return {
    reachable: !errors.some((error) => error.includes('Route') || error.includes('connected') || error.includes('reach')),
    quantized: !errors.some((error) => error.includes('whole beat') || error.includes('travel time')),
    precise,
    errors,
  };
}
