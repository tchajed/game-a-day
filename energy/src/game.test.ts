import { describe, expect, test } from 'vitest'
import { assignWorker, getBuildingCost, initialState, placeBlueprint, recomputeNetwork, stepGame, type Building } from './game'

describe('endless energy base simulation', () => {
  test('starts with a solvent base and no countdown or contract', () => {
    const state = initialState()
    expect(state.cash).toBe(560)
    expect(state.generation).toBe(4)
    expect(state.running).toBe(true)
    expect(stepGame(state, 600).elapsed).toBe(600)
  })

  test('connected facilities generate credits forever', () => {
    const state = initialState()
    const next = stepGame(state, 1)
    expect(next.cash).toBeGreaterThan(state.cash)
    expect(next.generation).toBe(4)
  })

  test('pylon chains carry power back to headquarters', () => {
    const buildings: Building[] = [
      { id: 1, type: 'pylon', x: 23, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
      { id: 2, type: 'pylon', x: 29, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
      { id: 3, type: 'wind', x: 32, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
    ]
    const connected = recomputeNetwork(buildings)
    expect(connected.every(building => building.connected)).toBe(true)
    expect(connected[1].parentId).toBe(1)
    expect(connected[2].parentId).toBe(2)
  })

  test('a generator beyond the distribution network stays offline', () => {
    const state = initialState()
    state.buildings.push({ id: 9, type: 'fusion', x: 2, y: 2, status: 'complete', progress: 1, connected: false, parentId: null })
    const next = stepGame(state, .1)
    expect(next.buildings.find(building => building.id === 9)?.connected).toBe(false)
    expect(next.generation).toBe(4)
  })

  test('robots must be assigned before blueprints are constructed', () => {
    let state = placeBlueprint(initialState(), 'pylon', 24, 19)
    const task = state.buildings.at(-1)!
    state = stepGame(state, 10)
    expect(state.buildings.at(-1)?.progress).toBe(0)
    state = assignWorker(state, 1, task.id)
    for (let i = 0; i < 100; i++) state = stepGame(state, .1)
    expect(state.buildings.at(-1)?.status).toBe('complete')
  })

  test('repeat facilities become increasingly expensive', () => {
    let state = initialState()
    const first = getBuildingCost(state, 'wind')
    state = placeBlueprint({ ...state, cash: 10000 }, 'wind', 12, 12)
    expect(getBuildingCost(state, 'wind')).toBeGreaterThan(first)
  })
})
