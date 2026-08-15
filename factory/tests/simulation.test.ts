import { describe, expect, test } from "bun:test";
import {
  SOLUTION,
  initialState,
  isPressActive,
  simulate,
  step,
  type Command,
} from "../src/simulation";

describe("factory route simulation", () => {
  test("the debug solution ships the crate on beat 20", () => {
    const result = simulate(SOLUTION);
    expect(result.status).toBe("won");
    expect(result.beat).toBe(20);
    expect(result.crate).toEqual({ x: 10, y: 2 });
    expect(result.doorOpen).toBe(true);
  });

  test("crossing press A on an active beat destroys the robot", () => {
    const unsafe: Command[] = ["right", "grab", "up", "up", "right"];
    const result = simulate(unsafe, 5);
    expect(isPressActive(0, 5)).toBe(true);
    expect(result.status).toBe("dead");
    expect(result.message).toContain("PRESS A COLLISION");
  });

  test("the divider blocks movement until its switch is used", () => {
    let state = initialState("running");
    state.robot = { x: 5, y: 4, facing: "right" };
    state = step(state, "right");
    expect(state.robot).toMatchObject({ x: 5, y: 4 });
    expect(state.message).toBe("MOVEMENT BLOCKED");
  });
});
