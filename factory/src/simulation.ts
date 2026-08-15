export type Command =
  | "up"
  | "right"
  | "down"
  | "left"
  | "wait"
  | "grab"
  | "drop"
  | "switch"
  | null;

export type Facing = "up" | "right" | "down" | "left";
export type RunStatus = "ready" | "running" | "dead" | "won";

export interface Point {
  x: number;
  y: number;
}

export interface SimState {
  beat: number;
  robot: Point & { facing: Facing };
  crate: Point | null;
  carrying: boolean;
  doorOpen: boolean;
  status: RunStatus;
  message: string;
}

export const GRID = { width: 12, height: 9 };
export const CRATE_START: Point = { x: 3, y: 7 };
export const PANEL: Point = { x: 4, y: 4 };
export const DOOR: Point = { x: 6, y: 4 };
export const TARGET: Point = { x: 10, y: 2 };
export const PROGRAM_LENGTH = 20;

export const PRESSES = [
  { x: 3, y: 5, phase: [1, 2], name: "PRESS A" },
  { x: 7, y: 3, phase: [2, 3], name: "PRESS B" },
] as const;

export const SOLUTION: Command[] = [
  "right",
  "grab",
  "up",
  "up",
  "wait",
  "wait",
  "right",
  "right",
  "switch",
  "right",
  "up",
  "right",
  "right",
  "wait",
  "wait",
  "up",
  "up",
  "right",
  "right",
  "drop",
];

export function initialState(status: RunStatus = "ready"): SimState {
  return {
    beat: 0,
    robot: { x: 1, y: 7, facing: "right" },
    crate: { ...CRATE_START },
    carrying: false,
    doorOpen: false,
    status,
    message: "ROUTE READY // PRESS RUN",
  };
}

export function isPressActive(index: number, beat: number): boolean {
  const phase = beat % 4;
  return PRESSES[index]?.phase.includes(phase as never) ?? false;
}

function same(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function adjacent(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

function wallAt(point: Point, doorOpen: boolean): boolean {
  if (
    point.x <= 0 ||
    point.y <= 0 ||
    point.x >= GRID.width - 1 ||
    point.y >= GRID.height - 1
  ) {
    return true;
  }

  if (point.x === 6 && point.y >= 1 && point.y <= 7) {
    return point.y !== DOOR.y || !doorOpen;
  }

  return false;
}

function delta(command: Command): Point | null {
  if (command === "up") return { x: 0, y: -1 };
  if (command === "right") return { x: 1, y: 0 };
  if (command === "down") return { x: 0, y: 1 };
  if (command === "left") return { x: -1, y: 0 };
  return null;
}

export function step(previous: SimState, command: Command): SimState {
  if (previous.status === "dead" || previous.status === "won") return previous;

  const state: SimState = {
    ...previous,
    beat: previous.beat + 1,
    robot: { ...previous.robot },
    crate: previous.crate ? { ...previous.crate } : null,
    status: "running",
    message: "EXECUTING ROUTE",
  };
  const movement = delta(command);

  if (movement) {
    state.robot.facing = command as Facing;
    const next = {
      x: state.robot.x + movement.x,
      y: state.robot.y + movement.y,
    };
    if (!wallAt(next, state.doorOpen)) {
      state.robot.x = next.x;
      state.robot.y = next.y;
    } else {
      state.message = "MOVEMENT BLOCKED";
    }
  } else if (command === "grab") {
    if (state.crate && adjacent(state.robot, state.crate)) {
      state.crate = null;
      state.carrying = true;
      state.message = "CARGO LOCKED";
    } else {
      state.message = "NO CARGO IN REACH";
    }
  } else if (command === "drop") {
    if (state.carrying && adjacent(state.robot, TARGET)) {
      state.carrying = false;
      state.crate = { ...TARGET };
      state.status = "won";
      state.message = "SHIPMENT ACCEPTED";
    } else {
      state.message = "NO DROP BAY IN REACH";
    }
  } else if (command === "switch") {
    if (adjacent(state.robot, PANEL)) {
      state.doorOpen = true;
      state.message = "BLAST DOOR OPEN";
    } else {
      state.message = "NO SWITCH IN REACH";
    }
  } else if (command === "wait" || command === null) {
    state.message = command === "wait" ? "HOLDING POSITION" : "EMPTY BEAT // HOLD";
  }

  for (let index = 0; index < PRESSES.length; index += 1) {
    const press = PRESSES[index];
    if (press && same(state.robot, press) && isPressActive(index, state.beat)) {
      state.status = "dead";
      state.message = `${press.name} COLLISION // ROUTE ABORTED`;
      return state;
    }
  }

  if (state.beat >= PROGRAM_LENGTH && state.status !== "won") {
    state.status = "dead";
    state.message = "SHIFT WINDOW EXPIRED // ROUTE ABORTED";
  }

  return state;
}

export function simulate(program: Command[], throughBeat = PROGRAM_LENGTH): SimState {
  let state = initialState("running");
  const lastBeat = Math.min(throughBeat, PROGRAM_LENGTH);
  for (let index = 0; index < lastBeat; index += 1) {
    state = step(state, program[index] ?? null);
    if (state.status === "dead" || state.status === "won") break;
  }
  return state;
}
