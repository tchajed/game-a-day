import { describe, expect, test } from 'vitest'
import { initialState, stepGame } from './game'

describe('energy simulation', () => {
  test('borrowing-compatible economy earns revenue while matching contract', () => {
    const state = initialState()
    const next = stepGame(state, .1)
    expect(next.elapsed).toBeCloseTo(.1)
    expect(next.cash).toBeGreaterThan(22000)
  })

  test('final contract remains achievable without a weather spike', () => {
    const state = initialState()
    state.elapsed = 254.95
    const next = stepGame(state, .1)
    expect(next.target).toBe(7)
    expect(next.price).toBe(160)
  })

  test('a normal run starts solvent and exactly on contract', () => {
    const state = initialState()
    expect(state.debt).toBe(0)
    expect(state.cash).toBe(22000)
    expect(state.exportMW).toBe(state.target)
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
