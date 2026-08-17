import { describe, expect, test } from 'vitest'
import {
  ROLES,
  assignRescue,
  assignWorker,
  canRepair,
  getBuildingCost,
  initialState,
  moveWorker,
  placeBlueprint,
  recomputeNetwork,
  roleNeededFor,
  stepGame,
  type Building,
  type GameState,
  type RobotRole,
} from './game'

function run(state: GameState, seconds: number) {
  for (let i = 0; i < seconds * 10 && state.phase === 'playing'; i++) state = stepGame(state, .1)
  return state
}

describe('triad repair protocol', () => {
  test('repair compatibility forms one directional three-role ring', () => {
    const roles = Object.keys(ROLES) as RobotRole[]
    for (const target of roles) {
      const compatible = roles.filter(repairer => canRepair(repairer, target))
      expect(compatible).toEqual([roleNeededFor(target)])
      expect(compatible).toHaveLength(1)
    }
    expect(canRepair('optic', 'arc')).toBe(true)
    expect(canRepair('arc', 'servo')).toBe(true)
    expect(canRepair('servo', 'optic')).toBe(true)
  })

  test('tutorial starts with a selected OPTIC and a failed ARC', () => {
    const state = initialState()
    expect(state.level).toBe(0)
    expect(state.generation).toBe(3)
    expect(state.selectedWorker).toBe(3)
    expect(state.workers.map(worker => worker.role)).toEqual(['arc', 'servo', 'optic'])
    expect(state.workers[0].status).toBe('stalled')
    expect(state.buildings.filter(building => building.status === 'blueprint')).toHaveLength(2)
  })

  test('wrong-role rescue is rejected with useful feedback', () => {
    const state = initialState()
    const next = assignRescue(state, 2, 1)
    expect(next.workers[1].status).toBe('idle')
    expect(next.toast).toContain('needs OPTIC')
  })

  test('tutorial is solved by repairing ARC and using both specialists', () => {
    let state = initialState()
    state = assignRescue(state, 3, 1)
    state = run(state, 8)
    expect(state.workers[0].status).toBe('idle')
    expect(state.workers[0].repairs).toBe(1)

    state = assignWorker(state, 2, 3)
    state = assignWorker(state, 1, 4)
    state = run(state, 18)
    expect(state.phase).toBe('won')
    expect(state.generation).toBe(6)
  })

  test('idle units do not accumulate wear, active units do', () => {
    let state = initialState(false, 1)
    const idleWear = state.workers[2].operatingTime
    state = run(state, 5)
    expect(state.workers[2].operatingTime).toBe(idleWear)
    state = moveWorker(state, 3, 26, 20)
    state = run(state, 1)
    expect(state.workers[2].operatingTime).toBeGreaterThan(idleWear)
  })

  test('standard units stall at their sampled operating lifetime', () => {
    let state = initialState(false, 1)
    state.workers[0].failureAt = .5
    state = moveWorker(state, 1, 30, 30)
    state = stepGame(state, .6)
    expect(state.workers[0].status).toBe('stalled')
  })

  test('a compatible unit restores a failure and the rescued unit resumes its task', () => {
    let state = initialState(false, 1)
    state = placeBlueprint(state, 'solar', 25, 16)
    state = assignWorker(state, 1, 10)
    state.workers[0] = { ...state.workers[0], status: 'stalled', x: 22, y: 20, operatingTime: 30 }
    state = assignRescue(state, 3, 1)
    state = run(state, 8)
    expect(state.workers[0].repairs).toBe(1)
    expect(['moving', 'building', 'idle']).toContain(state.workers[0].status)
    expect(state.workers[0].operatingTime).toBeGreaterThanOrEqual(0)
  })
})

describe('grid and challenge level', () => {
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

  test('rejected placement records an on-grid error marker', () => {
    const state = placeBlueprint(initialState(false, 1), 'solar', 18, 18)
    expect(state.placementError).toMatchObject({ x: 18, y: 18, message: 'SITE OBSTRUCTED' })
  })

  test('specialists build their structure faster', () => {
    let specialist = placeBlueprint(initialState(false, 1), 'solar', 25, 16)
    let generalist = structuredClone(specialist)
    specialist = assignWorker(specialist, 1, 10)
    generalist = assignWorker(generalist, 2, 10)
    specialist = run(specialist, 5)
    generalist = run(generalist, 5)
    expect(specialist.buildings.at(-1)!.progress).toBeGreaterThan(generalist.buildings.at(-1)!.progress)
  })

  test('repeat construction becomes gradually more expensive', () => {
    let state = initialState(false, 1)
    const first = getBuildingCost(state, 'solar')
    state = placeBlueprint(state, 'solar', 12, 12)
    expect(getBuildingCost(state, 'solar')).toBeGreaterThan(first)
  })

  test('an automated balanced-triad strategy can beat the featured level', () => {
    let state = initialState(false, 1)
    const plans: Array<['pylon' | 'solar', number, number]> = [
      ['pylon', 27, 19], ['pylon', 32, 19],
      ['solar', 25, 16], ['solar', 27, 22], ['solar', 31, 16], ['solar', 33, 22],
    ]
    for (const [type, x, y] of plans) state = placeBlueprint(state, type, x, y)
    expect(state.buildings.filter(building => building.status === 'blueprint')).toHaveLength(6)

    for (let tick = 0; tick < 1450 && state.phase === 'playing'; tick++) {
      // The last array must be funded by early exports, so the plan naturally has
      // a second expansion wave instead of being queued entirely at the start.
      if (state.nextId === 16 && state.cash >= getBuildingCost(state, 'solar')) state = placeBlueprint(state, 'solar', 29, 23)

      // Rescue first. Prefer idle responders so productive workers are only diverted
      // when a triad has no reserve available.
      const targeted = new Set(state.workers.map(worker => worker.rescueId).filter(id => id !== null))
      for (const target of state.workers.filter(worker => worker.status === 'stalled' && !targeted.has(worker.id))) {
        const candidates = state.workers
          .filter(worker => worker.status !== 'stalled' && worker.rescueId === null && canRepair(worker, target))
          .sort((a, b) => (a.status === 'idle' ? 0 : 1) - (b.status === 'idle' ? 0 : 1))
        if (candidates[0]) state = assignRescue(state, candidates[0].id, target.id)
      }

      // Keep each specialty on its best construction type. OPTICs remain a fast
      // reserve until a compatible rescue is needed.
      for (const worker of state.workers.filter(worker => worker.status === 'idle')) {
        const preferredType = worker.role === 'arc' ? 'solar' : worker.role === 'servo' ? 'pylon' : null
        if (!preferredType) continue
        const claimed = new Set(state.workers.map(unit => unit.taskId).filter(id => id !== null))
        const task = state.buildings.find(building => building.type === preferredType && building.status !== 'complete' && !claimed.has(building.id))
        if (task) state = assignWorker(state, worker.id, task.id)
      }
      state = stepGame(state, .1)
    }

    expect(state.phase).toBe('won')
    expect(state.generation).toBe(18)
    expect(state.elapsed).toBeLessThan(150)
    expect(state.workers.reduce((sum, worker) => sum + worker.repairs, 0)).toBeGreaterThanOrEqual(2)
  })

  test('the storm ends a challenge that misses its output target', () => {
    const state = run(initialState(false, 1), 151)
    expect(state.phase).toBe('lost')
    expect(state.toast).toContain('STORM')
  })
})
