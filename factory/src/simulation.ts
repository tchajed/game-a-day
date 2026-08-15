export type Command = "up" | "right" | "down" | "left" | "wait" | "interact" | null;

export type Facing = "up" | "right" | "down" | "left";
export type RunStatus = "ready" | "running" | "dead" | "won";

export interface Point {
  x: number;
  y: number;
}

export interface Press extends Point {
  phase: readonly number[];
  name: string;
}

export interface Conveyor extends Point {
  direction: Facing;
}

export interface EnemyRobot {
  name: string;
  path: readonly Point[];
  phase?: number;
}

export interface LevelDefinition {
  name: string;
  subtitle: string;
  robotStart: Point & { facing: Facing };
  crateStart: Point;
  panel: Point | null;
  door: Point | null;
  target: Point;
  walls: readonly Point[];
  presses: readonly Press[];
  conveyors: readonly Conveyor[];
  enemies: readonly EnemyRobot[];
  solution: readonly Command[];
}

export interface SimState {
  level: number;
  beat: number;
  robot: Point & { facing: Facing };
  crate: Point | null;
  carrying: boolean;
  doorOpen: boolean;
  status: RunStatus;
  message: string;
}

export const GRID = { width: 12, height: 9 };
export const PROGRAM_LENGTH = 20;

const dividerWalls = Array.from({ length: 7 }, (_, index) => ({ x: 6, y: index + 1 }));

export const LEVELS: readonly LevelDefinition[] = [
  {
    name: "SHIFT 01",
    subtitle: "PRESS LINE",
    robotStart: { x: 1, y: 7, facing: "right" },
    crateStart: { x: 3, y: 7 },
    panel: { x: 4, y: 4 },
    door: { x: 6, y: 4 },
    target: { x: 10, y: 2 },
    walls: dividerWalls,
    presses: [
      { x: 3, y: 5, phase: [1, 2], name: "PRESS A" },
      { x: 7, y: 3, phase: [2, 3], name: "PRESS B" },
    ],
    conveyors: [],
    enemies: [],
    solution: [
      "right", "right", "interact", "up", "wait", "wait", "up", "up", "right", "interact",
      "right", "right", "right", "wait", "wait", "up", "up", "right", "right", "right",
    ],
  },
  {
    name: "SHIFT 02",
    subtitle: "ROBOT TRAFFIC",
    robotStart: { x: 1, y: 7, facing: "right" },
    crateStart: { x: 2, y: 7 },
    panel: null,
    door: null,
    target: { x: 10, y: 2 },
    walls: [],
    presses: [],
    conveyors: [
      { x: 3, y: 6, direction: "right" },
      { x: 4, y: 6, direction: "right" },
      { x: 5, y: 6, direction: "right" },
    ],
    enemies: [
      {
        name: "PATROL A",
        path: [
          { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
          { x: 8, y: 4 }, { x: 7, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 4 },
        ],
      },
      {
        name: "PATROL B",
        phase: 2,
        path: [
          { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 },
          { x: 9, y: 6 }, { x: 9, y: 5 }, { x: 9, y: 4 }, { x: 9, y: 3 },
        ],
      },
    ],
    solution: [
      "right", "interact", "up", "right", "wait", "up", "wait", "up", "up", "right",
      "right", "up", "right", "wait", "right", "right",
    ],
  },
] as const;

// Level-one aliases kept public for lightweight playtests and debug tooling.
export const CRATE_START = LEVELS[0].crateStart;
export const PANEL = LEVELS[0].panel as Point;
export const DOOR = LEVELS[0].door as Point;
export const TARGET = LEVELS[0].target;
export const PRESSES = LEVELS[0].presses;
export const SOLUTION = [...LEVELS[0].solution];

export function getLevel(index: number): LevelDefinition {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, index))] ?? LEVELS[0];
}

export function initialState(status: RunStatus = "ready", level = 0): SimState {
  const definition = getLevel(level);
  return {
    level,
    beat: 0,
    robot: { ...definition.robotStart },
    crate: { ...definition.crateStart },
    carrying: false,
    doorOpen: false,
    status,
    message: "ROUTE READY // PRESS RUN",
  };
}

export function isPressActive(index: number, beat: number, level = 0): boolean {
  const phase = beat % 4;
  return getLevel(level).presses[index]?.phase.includes(phase) ?? false;
}

export function enemyPosition(enemy: EnemyRobot, beat: number): Point {
  const index = ((beat + (enemy.phase ?? 0)) % enemy.path.length + enemy.path.length) % enemy.path.length;
  return enemy.path[index] ?? enemy.path[0] ?? { x: -1, y: -1 };
}

function same(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function wallAt(point: Point, state: SimState, level: LevelDefinition): boolean {
  if (point.x <= 0 || point.y <= 0 || point.x >= GRID.width - 1 || point.y >= GRID.height - 1) return true;
  return level.walls.some((wall) => same(wall, point) && (!level.door || !same(wall, level.door) || !state.doorOpen));
}

function delta(command: Facing): Point {
  if (command === "up") return { x: 0, y: -1 };
  if (command === "right") return { x: 1, y: 0 };
  if (command === "down") return { x: 0, y: 1 };
  return { x: -1, y: 0 };
}

function moveRobot(state: SimState, direction: Facing, level: LevelDefinition): boolean {
  const movement = delta(direction);
  const next = { x: state.robot.x + movement.x, y: state.robot.y + movement.y };
  if (wallAt(next, state, level)) return false;
  state.robot.x = next.x;
  state.robot.y = next.y;
  return true;
}

export function step(previous: SimState, command: Command): SimState {
  if (previous.status === "dead" || previous.status === "won") return previous;

  const level = getLevel(previous.level);
  const previousRobot = { ...previous.robot };
  const state: SimState = {
    ...previous,
    beat: previous.beat + 1,
    robot: { ...previous.robot },
    crate: previous.crate ? { ...previous.crate } : null,
    status: "running",
    message: "EXECUTING ROUTE",
  };

  if (command === "up" || command === "right" || command === "down" || command === "left") {
    state.robot.facing = command;
    if (!moveRobot(state, command, level)) state.message = "MOVEMENT BLOCKED";
  } else if (command === "interact") {
    if (!state.carrying && state.crate && same(state.robot, state.crate)) {
      state.crate = null;
      state.carrying = true;
      state.message = "CARGO LOCKED";
    } else if (level.panel && same(state.robot, level.panel)) {
      state.doorOpen = true;
      state.message = "BLAST DOOR OPEN";
    } else {
      state.message = "NOTHING TO INTERACT WITH";
    }
  } else {
    state.message = command === "wait" ? "HOLDING POSITION" : "EMPTY BEAT // HOLD";
  }

  const conveyor = level.conveyors.find((belt) => same(belt, state.robot));
  if (conveyor && moveRobot(state, conveyor.direction, level)) state.message = "CONVEYOR TRANSFER";

  for (let index = 0; index < level.presses.length; index += 1) {
    const press = level.presses[index];
    if (press && same(state.robot, press) && isPressActive(index, state.beat, state.level)) {
      state.status = "dead";
      state.message = `${press.name} COLLISION // ROUTE ABORTED`;
      return state;
    }
  }

  for (const enemy of level.enemies) {
    const enemyNow = enemyPosition(enemy, state.beat);
    const enemyBefore = enemyPosition(enemy, state.beat - 1);
    const collided = same(state.robot, enemyNow) || (same(previousRobot, enemyNow) && same(state.robot, enemyBefore));
    if (collided) {
      state.status = "dead";
      state.message = `${enemy.name} COLLISION // ROUTE ABORTED`;
      return state;
    }
  }

  if (state.carrying && same(state.robot, level.target)) {
    state.carrying = false;
    state.crate = { ...level.target };
    state.status = "won";
    state.message = "SHIPMENT ACCEPTED";
    return state;
  }

  if (state.beat >= PROGRAM_LENGTH) {
    state.status = "dead";
    state.message = "SHIFT WINDOW EXPIRED // ROUTE ABORTED";
  }

  return state;
}

export function simulate(program: Command[], throughBeat = PROGRAM_LENGTH, level = 0): SimState {
  let state = initialState("running", level);
  const lastBeat = Math.min(throughBeat, PROGRAM_LENGTH);
  for (let index = 0; index < lastBeat; index += 1) {
    state = step(state, program[index] ?? null);
    if (state.status === "dead" || state.status === "won") break;
  }
  return state;
}
