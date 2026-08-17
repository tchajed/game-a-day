import { describe, expect, test } from 'vitest'
import {
  addWorker,
  assignRescue,
  assignWorker,
  getBuildingCost,
  initialState,
  moveWorker,
  placeBlueprint,
  recomputeNetwork,
  stepGame,
  type Building,
} from './game'

describe('unreliable robot energy operation', () => {
  test('starts with simple solar generation and one reliable failsafe', () => {
    const state = initialState()
    expect(state.cash).toBe(420)
    expect(state.generation).toBe(3)
    expect(state.workers.filter(worker => worker.reliable)).toHaveLength(1)
    expect(state.workers.filter(worker => !worker.reliable)).toHaveLength(3)
  })

  test('connected solar arrays generate credits forever', () => {
    const state = initialState()
    const next = stepGame(state, 1)
    expect(next.cash).toBeGreaterThan(state.cash)
    expect(next.generation).toBe(3)
  })

  test('pylon chains carry power back to headquarters', () => {
    const buildings: Building[] = [
      { id: 1, type: 'pylon', x: 23, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
      { id: 2, type: 'pylon', x: 29, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
      { id: 3, type: 'solar', x: 32, y: 18, status: 'complete', progress: 1, connected: false, parentId: null },
    ]
    const connected = recomputeNetwork(buildings)
    expect(connected.every(building => building.connected)).toBe(true)
    expect(connected[1].parentId).toBe(1)
    expect(connected[2].parentId).toBe(2)
  })

  test('a solar array beyond the distribution network stays offline', () => {
    const state = initialState()
    state.buildings.push({ id: 9, type: 'solar', x: 2, y: 2, status: 'complete', progress: 1, connected: false, parentId: null })
    const next = stepGame(state, .1)
    expect(next.buildings.find(building => building.id === 9)?.connected).toBe(false)
    expect(next.generation).toBe(3)
  })

  test('robots must be assigned before blueprints are constructed', () => {
    let state = placeBlueprint(initialState(), 'pylon', 24, 19)
    const task = state.buildings.at(-1)!
    state = stepGame(state, 2)
    expect(state.buildings.at(-1)?.progress).toBe(0)
    state = assignWorker(state, 2, task.id)
    for (let i = 0; i < 160; i++) state = stepGame(state, .1)
    expect(state.buildings.at(-1)?.status).toBe('complete')
  })

  test('standard units fail after their sampled operating lifetime', () => {
    let state = initialState()
    state.workers[1].failureAt = .5
    state = moveWorker(state, 2, 30, 30)
    state = stepGame(state, .6)
    expect(state.workers.find(worker => worker.id === 2)?.status).toBe('stalled')
  })

  test('the reliable unit never fails but works slowly', () => {
    let state = placeBlueprint(initialState(), 'pylon', 24, 19)
    const task = state.buildings.at(-1)!
    state = assignWorker(state, 1, task.id)
    for (let i = 0; i < 100; i++) state = stepGame(state, .1)
    const progress = state.buildings.at(-1)?.progress ?? 0
    expect(state.workers[0].status).not.toBe('stalled')
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThan(.5)
    for (let i = 0; i < 2000; i++) state = stepGame(state, .1)
    expect(state.workers[0].status).not.toBe('stalled')
  })

  test('a second unit can reach and restore a stalled unit', () => {
    let state = initialState()
    state.workers[1] = { ...state.workers[1], status: 'stalled', x: 20, y: 20, operatingTime: 30 }
    state = assignRescue(state, 1, 2)
    for (let i = 0; i < 180; i++) state = stepGame(state, .1)
    const rescued = state.workers.find(worker => worker.id === 2)!
    expect(rescued.status).toBe('idle')
    expect(rescued.operatingTime).toBe(0)
    expect(rescued.repairs).toBe(1)
  })

  test('stalled units cannot move or assign themselves', () => {
    let state = initialState()
    state.workers[1].status = 'stalled'
    const moved = moveWorker(state, 2, 30, 30)
    const blueprint = placeBlueprint(state, 'pylon', 24, 19).buildings.at(-1)!
    const assigned = assignWorker(state, 2, blueprint.id)
    expect(moved).toBe(state)
    expect(assigned).toBe(state)
  })

  test('players can instantly deploy as many standard units as they want', () => {
    let state = initialState()
    for (let i = 0; i < 12; i++) state = addWorker(state)
    expect(state.workers).toHaveLength(16)
    expect(state.workers.filter(worker => worker.reliable)).toHaveLength(1)
  })

  test('repeat construction becomes gradually more expensive', () => {
    let state = initialState()
    const first = getBuildingCost(state, 'solar')
    state = placeBlueprint({ ...state, cash: 10000 }, 'solar', 12, 12)
    expect(getBuildingCost(state, 'solar')).toBeGreaterThan(first)
  })
})
