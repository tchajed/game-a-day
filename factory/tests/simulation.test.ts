import { describe, expect, test } from "bun:test";
import {
  LEVELS,
  initialState,
  isPressActive,
  simulate,
  step,
  type Command,
} from "../src/simulation";

describe("factory route simulation", () => {
  test("both debug solutions reach OUT while carrying cargo", () => {
    LEVELS.forEach((level, index) => {
      const result = simulate([...level.solution], 20, index);
      expect(result.status).toBe("won");
      expect(result.crate).toEqual(level.target);
    });
  });

  test("interact acts only on the current square", () => {
    let state = initialState("running");
    state.robot = { x: 2, y: 7, facing: "right" };
    state = step(state, "interact");
    expect(state.carrying).toBe(false);
    expect(state.message).toBe("NOTHING TO INTERACT WITH");

    state.robot = { x: 3, y: 7, facing: "right" };
    state = step(state, "interact");
    expect(state.carrying).toBe(true);
  });

  test("entering OUT with cargo wins without a drop command", () => {
    let state = initialState("running");
    state.robot = { x: 9, y: 2, facing: "right" };
    state.carrying = true;
    state.crate = null;
    state = step(state, "right");
    expect(state.status).toBe("won");
  });

  test("crossing press A on an active beat destroys the robot", () => {
    const unsafe: Command[] = ["right", "right", "interact", "up", "up"];
    const result = simulate(unsafe, 5);
    expect(isPressActive(0, 5)).toBe(true);
    expect(result.status).toBe("dead");
    expect(result.message).toContain("PRESS A COLLISION");
  });

  test("level two belts transport the loose weight, not the robot", () => {
    let state = initialState("running", 1);
    state.robot = { x: 3, y: 7, facing: "right" };
    state.weight = { x: 4, y: 6 };
    state = step(state, "wait");
    expect(state.weight).toEqual({ x: 5, y: 6 });
    expect(state.robot).toMatchObject({ x: 3, y: 7 });
    expect(state.message).toBe("WEIGHT CONVEYOR TRANSFER");
  });

  test("the weight holds the plate open and removing it closes the required door", () => {
    let state = initialState("running", 1);
    state.weight = { x: 6, y: 5 };
    state = step(state, "wait");
    expect(state.weight).toEqual(LEVELS[1].plate);
    expect(state.doorOpen).toBe(true);

    state.robot = { x: 6, y: 3, facing: "right" };
    state = step(state, "right");
    expect(state.robot).toMatchObject({ x: 7, y: 3 });

    state.robot = { x: 6, y: 4, facing: "up" };
    state = step(state, "interact");
    expect(state.carryingWeight).toBe(true);
    expect(state.doorOpen).toBe(false);

    state.robot = { x: 6, y: 3, facing: "right" };
    state.carryingWeight = false;
    state = step(state, "right");
    expect(state.robot).toMatchObject({ x: 6, y: 3 });
    expect(state.message).toBe("MOVEMENT BLOCKED");
  });

  test("the longer manual heavy-weight route wins without a conveyor transfer", () => {
    const program = LEVELS[1].alternateSolution;
    expect(program).toBeDefined();

    let state = initialState("running", 1);
    const messages: string[] = [];
    for (const command of program ?? []) {
      state = step(state, command);
      messages.push(state.message);
    }

    expect(program?.length).toBe(19);
    expect(messages).not.toContain("WEIGHT CONVEYOR TRANSFER");
    expect(state.status).toBe("won");
    expect(state.weight).toEqual(LEVELS[1].plate);
  });

  test("the moving patrol forces timing on the faster conveyor route", () => {
    const timed = simulate([...LEVELS[1].solution], 20, 1);
    expect(timed.status).toBe("won");

    const untimed = [...LEVELS[1].solution];
    untimed.splice(5, 1); // Skip the hold before crossing PATROL A's route.
    const collision = simulate(untimed, 20, 1);
    expect(collision.status).toBe("dead");
    expect(collision.message).toContain("PATROL A COLLISION");

    const lateToDoor = [...LEVELS[1].solution];
    lateToDoor.splice(12, 0, "wait");
    const corridorCollision = simulate(lateToDoor, 20, 1);
    expect(corridorCollision.status).toBe("dead");
    expect(corridorCollision.message).toContain("PATROL B COLLISION");
  });
});
