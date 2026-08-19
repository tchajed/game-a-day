export const BPM = 108;
export const BEAT_MS = 60_000 / BPM;
export const BEATS_PER_BAR = 4;
export const ACTION_WINDOW_MS = 210;
export const RUN_SPEED = 190;
export const POSITION_TOLERANCE = 105;
export const JUMP_BEATS = 1.5;
export const JUMP_HOLD_BEATS = 0.55;
export const MIN_JUMP_HEIGHT = 86;
export const MAX_JUMP_HEIGHT = 112;
export const DUCK_BEATS = 1.25;
export const START_X = 180;
export const GROUND_Y = 557;

export type Action = 'jump' | 'duck';

export interface Point {
  x: number;
  y: number;
}

export interface BeatEvent {
  index: number;
  beat: number;
  action: Action;
  direction: -1 | 1;
  from: Point;
  to: Point;
  hazardX: number;
  travelBeats: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  subtitle: string;
  startX: number;
  events: BeatEvent[];
}

interface EventSpec {
  beats: number;
  action: Action;
  direction: -1 | 1;
}

const TUTORIAL: EventSpec[] = [
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 5, action: 'jump', direction: 1 },
  { beats: 5, action: 'jump', direction: 1 },
  { beats: 5, action: 'jump', direction: 1 },
  { beats: 5, action: 'jump', direction: 1 },
];

const DUCK_AND_RUN: EventSpec[] = [
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 3, action: 'jump', direction: 1 },
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 3, action: 'jump', direction: 1 },
  { beats: 4, action: 'duck', direction: 1 },
];

const FINAL_DASH: EventSpec[] = [
  // Give the final road a clear count-in: its opening jump lands on beat one of bar two.
  { beats: BEATS_PER_BAR, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 3, action: 'jump', direction: 1 },
  { beats: 4, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 3, action: 'jump', direction: 1 },
  { beats: 3, action: 'duck', direction: 1 },
  { beats: 2, action: 'jump', direction: 1 },
  { beats: 2, action: 'duck', direction: 1 },
  { beats: 3, action: 'jump', direction: 1 },
];

function buildEvents(startX: number, specs: EventSpec[]): BeatEvent[] {
  let point: Point = { x: startX, y: GROUND_Y };
  let beat = 0;

  return specs.map((spec, index) => {
    beat += spec.beats;
    const next: Point = {
      x: point.x + spec.direction * RUN_SPEED * (beatToMs(spec.beats) / 1000),
      y: GROUND_Y,
    };
    const event: BeatEvent = {
      index,
      beat,
      action: spec.action,
      direction: spec.direction,
      from: { ...point },
      to: next,
      hazardX: next.x + spec.direction * 66,
      travelBeats: spec.beats,
    };
    point = next;
    return event;
  });
}

export function createLevels(): LevelDefinition[] {
  const definitions = [
    { id: 'beginner-road', name: 'BEGINNER ROAD', subtitle: 'RUN RIGHT · JUMP BIG', startX: START_X, specs: TUTORIAL },
    { id: 'bop-and-duck', name: 'BOP & DUCK', subtitle: 'TWO MOVES · QUICKER CUES', startX: START_X, specs: DUCK_AND_RUN },
    { id: 'final-dash', name: 'FINAL DASH', subtitle: 'FAST CUES · ONE-WAY ROAD', startX: START_X, specs: FINAL_DASH },
  ] as const;

  return definitions.map(({ specs, ...definition }) => ({
    ...definition,
    events: buildEvents(definition.startX, [...specs]),
  }));
}

export function createLevel(index = 0): BeatEvent[] {
  return createLevels()[index].events;
}

export function beatToMs(beat: number): number {
  return beat * BEAT_MS;
}

export function isDownbeat(beat: number): boolean {
  return beat % BEATS_PER_BAR === 0;
}

export function jumpHeightForHoldMs(holdMs: number): number {
  const holdProgress = Math.min(1, Math.max(0, holdMs / beatToMs(JUMP_HOLD_BEATS)));
  return MIN_JUMP_HEIGHT + (MAX_JUMP_HEIGHT - MIN_JUMP_HEIGHT) * holdProgress;
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
    if (event.travelBeats < 2 || event.travelBeats > 5) {
      errors.push(`Event ${index} has an unreadable run length`);
    }
    if (index === 0) {
      if (event.beat !== event.travelBeats) errors.push('The opening run is not connected to the start');
    } else {
      const previous = events[index - 1];
      if (event.from.x !== previous.to.x || event.from.y !== previous.to.y) {
        errors.push(`Route breaks between events ${index - 1} and ${index}`);
      }
      if (event.beat - previous.beat !== event.travelBeats) {
        errors.push(`Event ${index} has the wrong travel time`);
      }
    }

    const expectedDistance = event.direction * RUN_SPEED * (beatToMs(event.travelBeats) / 1000);
    const actualDistance = event.to.x - event.from.x;
    if (Math.abs(expectedDistance - actualDistance) > 0.01) {
      errors.push(`Event ${index} cannot be reached at run speed`);
    }
    if (Math.sign(event.hazardX - event.to.x) !== event.direction) {
      errors.push(`Hazard ${index} is on the wrong side of its cue`);
    }
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
