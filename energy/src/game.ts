export type BuildingType = 'pylon' | 'solar' | 'wind' | 'geothermal' | 'fusion' | 'garage'
export type BuildingStatus = 'blueprint' | 'building' | 'complete'
export type WorkerStatus = 'idle' | 'moving' | 'building' | 'stalled'

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
  targetX: number
  targetY: number
  workClock: number
}

export type GameState = {
  elapsed: number
  cash: number
  totalEnergy: number
  generation: number
  buildMode: BuildingType | null
  selectedWorker: number | null
  buildings: Building[]
  workers: Worker[]
  nextId: number
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

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  pylon: { name: 'Relay pylon', cost: 45, output: 0, buildTime: 3, icon: '⌁', key: '1', note: 'Carries the grid 6 tiles' },
  solar: { name: 'Solar array', cost: 140, output: 4, buildTime: 6, icon: '▰', key: '2', note: '+4 MW · cheap and compact' },
  wind: { name: 'Wind field', cost: 430, output: 13, buildTime: 11, icon: '✣', key: '3', note: '+13 MW · serious output' },
  geothermal: { name: 'Geo station', cost: 1450, output: 42, buildTime: 18, icon: '◉', key: '4', note: '+42 MW · industrial power' },
  fusion: { name: 'Fusion yard', cost: 5200, output: 155, buildTime: 30, icon: '⬡', key: '5', note: '+155 MW · endgame scale' },
  garage: { name: 'Robot garage', cost: 900, output: 0, buildTime: 14, icon: '▣', key: '6', note: 'Deploys another worker' },
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const isGenerator = (type: BuildingType) => BUILDINGS[type].output > 0

export function getBuildingCost(state: GameState, type: BuildingType) {
  const built = state.buildings.filter(building => building.type === type).length
  const growth = type === 'pylon' ? 1.07 : 1.16
  return Math.round(BUILDINGS[type].cost * growth ** built / 5) * 5
}

export function recomputeNetwork(buildings: Building[]): Building[] {
  const next: Building[] = buildings.map(building => ({ ...building, connected: false, parentId: null }))
  const connectedPylons = new Set<number>()
  let changed = true

  while (changed) {
    changed = false
    for (const pylon of next) {
      if (pylon.type !== 'pylon' || pylon.status !== 'complete' || connectedPylons.has(pylon.id)) continue
      const candidates: Array<{ id: number | null; x: number; y: number }> = [{ id: null as number | null, ...HQ }]
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
    { id: null as number | null, ...HQ },
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
    cash: debug ? 12000 : 560,
    totalEnergy: 0,
    generation: 4,
    buildMode: null,
    selectedWorker: 1,
    buildings,
    workers: [
      { id: 1, name: 'MICA-1', x: 17.3, y: 18.4, status: 'idle', taskId: null, targetX: 17.3, targetY: 18.4, workClock: 0 },
      { id: 2, name: 'BOLT-2', x: 18.5, y: 19.1, status: 'idle', taskId: null, targetX: 18.5, targetY: 19.1, workClock: 12 },
      { id: 3, name: 'KITE-3', x: 19.1, y: 18.3, status: 'idle', taskId: null, targetX: 19.1, targetY: 18.3, workClock: 24 },
    ],
    nextId: 10,
    toast: 'Select a structure, place a blueprint, then assign a robot.',
    seed: 81727,
    running: true,
  }
}

export function placeBlueprint(state: GameState, type: BuildingType, x: number, y: number): GameState {
  const cost = getBuildingCost(state, type)
  if (state.cash < cost) return { ...state, toast: `Need ${formatCredits(cost)} for ${BUILDINGS[type].name}.` }
  if (x < 1 || y < 1 || x >= WORLD_SIZE - 1 || y >= WORLD_SIZE - 1) return { ...state, toast: 'That site is outside the survey boundary.' }
  if (distance({ x, y }, HQ) < 2.2 || state.buildings.some(building => distance(building, { x, y }) < 1.25)) {
    return { ...state, toast: 'Site obstructed — choose another tile.' }
  }
  const building: Building = { id: state.nextId, type, x, y, status: 'blueprint', progress: 0, connected: false, parentId: null }
  return {
    ...state,
    cash: state.cash - cost,
    buildings: [...state.buildings, building],
    nextId: state.nextId + 1,
    toast: `${BUILDINGS[type].name} planned. Select a robot, then click its blueprint.`,
  }
}

export function assignWorker(state: GameState, workerId: number, taskId: number): GameState {
  const task = state.buildings.find(building => building.id === taskId && building.status !== 'complete')
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!task || !worker) return state
  const workers = state.workers.map(unit => {
    if (unit.id !== workerId) return unit.taskId === taskId ? { ...unit, taskId: null, status: 'idle' as WorkerStatus } : unit
    return { ...unit, taskId, targetX: task.x, targetY: task.y, status: 'moving' as WorkerStatus }
  })
  const buildings = state.buildings.map(building => building.id === taskId ? { ...building, status: 'building' as BuildingStatus } : building)
  return { ...state, workers, buildings, toast: `${worker.name} assigned to ${BUILDINGS[task.type].name}.` }
}

export function moveWorker(state: GameState, workerId: number, x: number, y: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!worker) return state
  return {
    ...state,
    workers: state.workers.map(unit => unit.id === workerId
      ? { ...unit, taskId: null, targetX: x, targetY: y, status: 'moving' as WorkerStatus }
      : unit),
    toast: `${worker.name} moving to marker.`,
  }
}

export function rebootWorker(state: GameState, workerId: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!worker || worker.status !== 'stalled') return state
  return {
    ...state,
    workers: state.workers.map(unit => unit.id === workerId
      ? { ...unit, status: unit.taskId ? 'moving' as WorkerStatus : 'idle' as WorkerStatus, workClock: 0 }
      : unit),
    toast: `${worker.name} rebooted. Keep an eye on it.`,
  }
}

export function stepGame(state: GameState, dt: number): GameState {
  if (!state.running) return state
  let completedGarage = false
  const buildings = state.buildings.map(building => ({ ...building }))
  const workers = state.workers.map(worker => {
    const next = { ...worker, workClock: worker.workClock + dt }
    if (next.status === 'stalled' || next.status === 'idle') return next

    // Deterministic service faults make the small robot crew require active supervision.
    if (next.workClock >= 46 + next.id * 7) {
      next.status = 'stalled'
      return next
    }

    const dx = next.targetX - next.x
    const dy = next.targetY - next.y
    const remaining = Math.hypot(dx, dy)
    if (remaining > 0.16) {
      const travel = Math.min(remaining, dt * 2.35)
      next.x += dx / remaining * travel
      next.y += dy / remaining * travel
      next.status = 'moving'
      return next
    }

    next.x = next.targetX
    next.y = next.targetY
    if (next.taskId === null) {
      next.status = 'idle'
      return next
    }
    const task = buildings.find(building => building.id === next.taskId)
    if (!task || task.status === 'complete') {
      next.taskId = null
      next.status = 'idle'
      return next
    }
    next.status = 'building'
    task.status = 'building'
    task.progress = Math.min(1, task.progress + dt / BUILDINGS[task.type].buildTime)
    if (task.progress >= 1) {
      task.status = 'complete'
      task.progress = 1
      completedGarage ||= task.type === 'garage'
      next.taskId = null
      next.status = 'idle'
    }
    return next
  })

  if (completedGarage) {
    const id = state.nextId
    workers.push({ id, name: `RIVET-${workers.length + 1}`, x: HQ.x, y: HQ.y + .7, status: 'idle', taskId: null, targetX: HQ.x, targetY: HQ.y + .7, workClock: 0 })
  }

  const networked = recomputeNetwork(buildings)
  const generation = networked.reduce((sum, building) => sum + (building.connected ? BUILDINGS[building.type].output : 0), 0)
  const income = generation * 0.82 * dt
  const stalled = workers.find(worker => worker.status === 'stalled' && state.workers.find(old => old.id === worker.id)?.status !== 'stalled')
  const finished = networked.find(building => building.status === 'complete' && state.buildings.find(old => old.id === building.id)?.status !== 'complete')
  let toast = state.toast
  if (finished) toast = `${BUILDINGS[finished.type].name} complete${finished.connected ? ' and exporting.' : ' — OFF GRID. Extend a pylon line.'}`
  if (stalled) toast = `⚠ ${stalled.name} lost task lock. Select it and REBOOT.`

  return {
    ...state,
    elapsed: state.elapsed + dt,
    cash: state.cash + income,
    totalEnergy: state.totalEnergy + generation * dt / 3600,
    generation,
    buildings: networked,
    workers,
    nextId: completedGarage ? state.nextId + 1 : state.nextId,
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
