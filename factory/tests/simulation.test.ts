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

  test("the conveyor advances the roomba an extra square", () => {
    let state = initialState("running", 1);
    state.robot = { x: 2, y: 6, facing: "right" };
    state = step(state, "right");
    expect(state.robot).toMatchObject({ x: 4, y: 6 });
    expect(state.message).toBe("CONVEYOR TRANSFER");
  });

  test("moving patrol robots are lethal", () => {
    let state = initialState("running", 1);
    state.beat = 6;
    state.robot = { x: 5, y: 5, facing: "up" };
    state = step(state, "up");
    expect(state.status).toBe("dead");
    expect(state.message).toContain("PATROL A COLLISION");
  });
});
