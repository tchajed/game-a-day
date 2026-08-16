import { describe, expect, test } from 'vitest'
import { initialState, stepGame } from './game'

describe('energy simulation', () => {
  test('borrowing-compatible economy earns revenue while matching contract', () => {
    const state = initialState()
    state.generation = 3
    state.wind = .6
    const next = stepGame(state, .1)
    expect(next.elapsed).toBeCloseTo(.1)
    expect(next.cash).toBeGreaterThan(17990)
  })

  test('storm and final contract begin at 4:15', () => {
    const state = initialState()
    state.elapsed = 254.95
    const next = stepGame(state, .1)
    expect(next.storm).toBe(true)
    expect(next.target).toBe(8)
    expect(next.price).toBe(180)
  })

  test('storage dispatch is clamped when empty', () => {
    const state = initialState()
    state.stored = 0
    state.intendedDispatch = 8
    const next = stepGame(state, .1)
    expect(next.dispatch).toBe(0)
    expect(next.stored).toBe(0)
  })
})
