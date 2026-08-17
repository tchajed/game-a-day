export type BuildingType = 'pylon' | 'solar'
export type BuildingStatus = 'blueprint' | 'building' | 'complete'
export type WorkerStatus = 'idle' | 'moving' | 'building' | 'rescuing' | 'stalled'

export type Building = {
  id: number
  type: BuildingType
  x: number
  y: number
  status: BuildingStatus
  progress: number
  connected: boolean
  parentId: number | null
}

export type Worker = {
  id: number
  name: string
  x: number
  y: number
  status: WorkerStatus
  taskId: number | null
  rescueId: number | null
  targetX: number
  targetY: number
  operatingTime: number
  failureAt: number
  repairs: number
  serviceTime: number
  reliable: boolean
}

export type GameState = {
  elapsed: number
  cash: number
  totalEnergy: number
  generation: number
  buildMode: BuildingType | null
  placementError: { x: number; y: number; message: string; until: number } | null
  selectedWorker: number | null
  buildings: Building[]
  workers: Worker[]
  nextId: number
  nextWorkerId: number
  toast: string
  seed: number
  running: boolean
}

type BuildingSpec = {
  name: string
  cost: number
  output: number
  buildTime: number
  icon: string
  key: string
  note: string
}

export const WORLD_SIZE = 36
export const HQ = { x: 18, y: 18 }
export const PYLON_RANGE = 6.25
export const FACILITY_RANGE = 4.75
export const ROBOT_MTTF = 30
export const RESCUE_TIME = 2.5
export const BASE_WORKER_DEPLOY_COST = 180

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  pylon: { name: 'Relay pylon', cost: 35, output: 0, buildTime: 4, icon: '⌁', key: '1', note: 'Carries the grid 6 tiles' },
  solar: { name: 'Solar array', cost: 110, output: 3, buildTime: 8, icon: '▰', key: '2', note: '+3 MW continuous export' },
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

// Deterministic samples from a shifted exponential distribution. Across many repairs,
// operating time averages ROBOT_MTTF while still making each fault unpredictable.
function failureInterval(id: number, repairs: number) {
  const minimum = 6
  const value = Math.sin((id * 91 + repairs * 193 + 17) * 12.9898) * 43758.5453
  const uniform = Math.min(.999, Math.max(.001, value - Math.floor(value)))
  return minimum - Math.log(1 - uniform) * (ROBOT_MTTF - minimum)
}

function makeWorker(id: number, reliable = false, offset = 0): Worker {
  return {
    id,
    name: reliable ? 'FAILSAFE-0' : `UNIT-${String(id).padStart(2, '0')}`,
    x: HQ.x - .7 + offset * .55,
    y: HQ.y + .8 + (offset % 2) * .4,
    status: 'idle',
    taskId: null,
    rescueId: null,
    targetX: HQ.x - .7 + offset * .55,
    targetY: HQ.y + .8 + (offset % 2) * .4,
    operatingTime: 0,
    failureAt: reliable ? Infinity : failureInterval(id, 0),
    repairs: 0,
    serviceTime: 0,
    reliable,
  }
}

export function getBuildingCost(state: GameState, type: BuildingType) {
  const built = state.buildings.filter(building => building.type === type).length
  const growth = type === 'pylon' ? 1.04 : 1.09
  return Math.round(BUILDINGS[type].cost * growth ** built / 5) * 5
}

export function getWorkerDeployCost(state: GameState) {
  const extraWorkers = Math.max(0, state.workers.filter(worker => !worker.reliable).length - 3)
  return Math.round(BASE_WORKER_DEPLOY_COST * 1.3 ** extraWorkers / 5) * 5
}

export function recomputeNetwork(buildings: Building[]): Building[] {
  const next: Building[] = buildings.map(building => ({ ...building, connected: false, parentId: null }))
  const connectedPylons = new Set<number>()
  let changed = true

  while (changed) {
    changed = false
    for (const pylon of next) {
      if (pylon.type !== 'pylon' || pylon.status !== 'complete' || connectedPylons.has(pylon.id)) continue
      const candidates: Array<{ id: number | null; x: number; y: number }> = [{ id: null, ...HQ }]
      for (const other of next) {
        if (other.type === 'pylon' && connectedPylons.has(other.id)) candidates.push(other)
      }
      const parent = candidates
        .filter(candidate => distance(pylon, candidate) <= PYLON_RANGE)
        .sort((a, b) => distance(pylon, a) - distance(pylon, b))[0]
      if (parent) {
        pylon.connected = true
        pylon.parentId = parent.id
        connectedPylons.add(pylon.id)
        changed = true
      }
    }
  }

  const networkNodes: Array<{ id: number | null; x: number; y: number }> = [
    { id: null, ...HQ },
    ...next.filter(building => building.type === 'pylon' && building.connected),
  ]
  for (const building of next) {
    if (building.status !== 'complete' || building.type === 'pylon') continue
    const parent = networkNodes
      .filter(node => distance(building, node) <= FACILITY_RANGE)
      .sort((a, b) => distance(building, a) - distance(building, b))[0]
    if (parent) {
      building.connected = true
      building.parentId = parent.id
    }
  }
  return next
}

export function initialState(debug = false): GameState {
  const buildings: Building[] = [
    { id: 1, type: 'solar', x: 20, y: 17, status: 'complete', progress: 1, connected: true, parentId: null },
    { id: 2, type: 'pylon', x: 22, y: 19, status: 'complete', progress: 1, connected: true, parentId: null },
  ]
  return {
    elapsed: 0,
    cash: debug ? 12000 : 420,
    totalEnergy: 0,
    generation: 3,
    buildMode: null,
    placementError: null,
    selectedWorker: 2,
    buildings,
    workers: [makeWorker(1, true, 0), makeWorker(2, false, 1), makeWorker(3, false, 2), makeWorker(4, false, 3)],
    nextId: 10,
    nextWorkerId: 5,
    toast: 'Place a blueprint, assign a unit, and watch for field failures.',
    seed: 81727,
    running: true,
  }
}

export function addWorker(state: GameState): GameState {
  const cost = getWorkerDeployCost(state)
  if (state.cash < cost) return { ...state, toast: `Need ${formatCredits(cost)} to deploy another unit.` }
  const id = state.nextWorkerId
  return {
    ...state,
    cash: state.cash - cost,
    workers: [...state.workers, makeWorker(id, false, state.workers.length)],
    nextWorkerId: id + 1,
    selectedWorker: id,
    buildMode: null,
    toast: `UNIT-${String(id).padStart(2, '0')} deployed for ${formatCredits(cost)}. More throughput means more failures.`,
  }
}

export function placeBlueprint(state: GameState, type: BuildingType, x: number, y: number): GameState {
  const reject = (message: string, toast: string): GameState => ({
    ...state,
    placementError: { x, y, message, until: state.elapsed + 4.5 },
    toast,
  })
  const cost = getBuildingCost(state, type)
  if (state.cash < cost) return reject('INSUFFICIENT CREDITS', `Need ${formatCredits(cost)} for ${BUILDINGS[type].name}.`)
  if (x < 1 || y < 1 || x >= WORLD_SIZE - 1 || y >= WORLD_SIZE - 1) return reject('OUTSIDE SURVEY AREA', 'That site is outside the survey boundary.')
  if (distance({ x, y }, HQ) < 2.2 || state.buildings.some(building => distance(building, { x, y }) < 1.5)) {
    return reject('SITE OBSTRUCTED', 'Site obstructed — leave room around each structure.')
  }
  const building: Building = { id: state.nextId, type, x, y, status: 'blueprint', progress: 0, connected: false, parentId: null }
  return {
    ...state,
    cash: state.cash - cost,
    buildings: [...state.buildings, building],
    nextId: state.nextId + 1,
    placementError: null,
    toast: `${BUILDINGS[type].name} planned. Select a working unit, then click its blueprint.`,
  }
}

export function assignWorker(state: GameState, workerId: number, taskId: number): GameState {
  const task = state.buildings.find(building => building.id === taskId && building.status !== 'complete')
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!task || !worker || worker.status === 'stalled') return state
  const workers = state.workers.map(unit => {
    if (unit.id !== workerId) return unit.taskId === taskId ? { ...unit, taskId: null, status: 'idle' as WorkerStatus } : unit
    return { ...unit, taskId, rescueId: null, targetX: task.x, targetY: task.y, status: 'moving' as WorkerStatus, serviceTime: 0 }
  })
  const buildings = state.buildings.map(building => building.id === taskId ? { ...building, status: 'building' as BuildingStatus } : building)
  return { ...state, workers, buildings, toast: `${worker.name} dispatched to ${BUILDINGS[task.type].name}.` }
}

export function assignRescue(state: GameState, workerId: number, targetId: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  const target = state.workers.find(unit => unit.id === targetId)
  if (!worker || !target || worker.id === target.id || worker.status === 'stalled' || target.status !== 'stalled') return state
  const workers = state.workers.map(unit => {
    if (unit.id !== workerId) return unit.rescueId === targetId ? { ...unit, rescueId: null, status: 'idle' as WorkerStatus } : unit
    return {
      ...unit,
      taskId: null,
      rescueId: targetId,
      targetX: target.x,
      targetY: target.y,
      status: 'moving' as WorkerStatus,
      serviceTime: 0,
    }
  })
  return { ...state, workers, selectedWorker: workerId, buildMode: null, toast: `${worker.name} responding to ${target.name}. Keep a rescue path open.` }
}

export function moveWorker(state: GameState, workerId: number, x: number, y: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!worker || worker.status === 'stalled') return state
  return {
    ...state,
    workers: state.workers.map(unit => unit.id === workerId
      ? { ...unit, taskId: null, rescueId: null, targetX: x, targetY: y, status: 'moving' as WorkerStatus, serviceTime: 0 }
      : unit),
    toast: `${worker.name} moving to marker.`,
  }
}

function workerSpeed(worker: Worker) {
  return worker.reliable ? .95 : 2.35
}

function workerRate(worker: Worker) {
  return worker.reliable ? .38 : 1
}

export function stepGame(state: GameState, dt: number): GameState {
  if (!state.running) return state
  const buildings = state.buildings.map(building => ({ ...building }))
  const workers = state.workers.map(worker => ({ ...worker }))
  let newlyStalled: Worker | null = null
  let newlyRescued: Worker | null = null

  const travelWorker = (worker: Worker) => {
    const dx = worker.targetX - worker.x
    const dy = worker.targetY - worker.y
    const remaining = Math.hypot(dx, dy)
    if (remaining <= .16) {
      worker.x = worker.targetX
      worker.y = worker.targetY
      return true
    }
    const travel = Math.min(remaining, dt * workerSpeed(worker))
    worker.x += dx / remaining * travel
    worker.y += dy / remaining * travel
    worker.status = 'moving'
    return false
  }

  for (const worker of workers) {
    if (worker.status === 'idle' || worker.status === 'stalled') continue

    if (!worker.reliable) {
      worker.operatingTime += dt
      if (worker.operatingTime >= worker.failureAt) {
        worker.status = 'stalled'
        worker.serviceTime = 0
        newlyStalled = worker
        continue
      }
    }

    if (worker.rescueId !== null) {
      const target = workers.find(unit => unit.id === worker.rescueId)
      if (!target || target.status !== 'stalled') {
        worker.rescueId = null
        worker.status = 'idle'
        worker.serviceTime = 0
        continue
      }
      worker.targetX = target.x
      worker.targetY = target.y
      if (!travelWorker(worker)) continue
      worker.status = 'rescuing'
      worker.serviceTime += dt * workerRate(worker)
      if (worker.serviceTime >= RESCUE_TIME) {
        target.repairs += 1
        target.operatingTime = 0
        target.failureAt = target.reliable ? Infinity : failureInterval(target.id, target.repairs)
        target.serviceTime = 0
        target.status = target.taskId !== null || target.rescueId !== null ? 'moving' : 'idle'
        worker.rescueId = null
        worker.status = 'idle'
        worker.serviceTime = 0
        newlyRescued = target
      }
      continue
    }

    if (!travelWorker(worker)) continue
    if (worker.taskId === null) {
      worker.status = 'idle'
      continue
    }
    const task = buildings.find(building => building.id === worker.taskId)
    if (!task || task.status === 'complete') {
      worker.taskId = null
      worker.status = 'idle'
      continue
    }
    worker.status = 'building'
    task.status = 'building'
    task.progress = Math.min(1, task.progress + dt * workerRate(worker) / BUILDINGS[task.type].buildTime)
    if (task.progress >= 1) {
      task.status = 'complete'
      task.progress = 1
      worker.taskId = null
      worker.status = 'idle'
    }
  }

  const networked = recomputeNetwork(buildings)
  const generation = networked.reduce((sum, building) => sum + (building.connected ? BUILDINGS[building.type].output : 0), 0)
  const income = generation * .9 * dt
  const finished = networked.find(building => building.status === 'complete' && state.buildings.find(old => old.id === building.id)?.status !== 'complete')
  let toast = state.toast
  if (finished) toast = `${BUILDINGS[finished.type].name} complete${finished.connected ? ' and exporting.' : ' — OFF GRID. Extend a relay line.'}`
  if (newlyRescued) toast = `${newlyRescued.name} restored. Its fault clock has been reset.`
  if (newlyStalled) toast = `⚠ ${newlyStalled.name} FAILED. Select a working unit, then click the stalled unit.`

  return {
    ...state,
    elapsed: state.elapsed + dt,
    cash: state.cash + income,
    totalEnergy: state.totalEnergy + generation * dt / 3600,
    generation,
    placementError: state.placementError && state.elapsed + dt >= state.placementError.until ? null : state.placementError,
    buildings: networked,
    workers,
    toast,
  }
}

export function formatCredits(value: number) {
  return `₡${Math.floor(value).toLocaleString()}`
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
