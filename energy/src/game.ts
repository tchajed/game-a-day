export type BuildingType = 'pylon' | 'solar'
export type BuildingStatus = 'blueprint' | 'building' | 'complete'
export type WorkerStatus = 'idle' | 'moving' | 'building' | 'rescuing' | 'stalled'
export type RobotRole = 'arc' | 'servo' | 'optic'
export type GamePhase = 'playing' | 'won' | 'lost'

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
  role: RobotRole
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
}

export type GameState = {
  level: number
  phase: GamePhase
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

export type LevelSpec = {
  number: string
  name: string
  directive: string
  goal: string
  targetGeneration: number
  timeLimit: number | null
}

export const WORLD_SIZE = 36
export const HQ = { x: 18, y: 18 }
export const PYLON_RANGE = 6.25
export const FACILITY_RANGE = 4.75
export const ROBOT_MTTF = 21
export const RESCUE_TIME = 2.4

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  pylon: { name: 'Relay pylon', cost: 35, output: 0, buildTime: 4.5, icon: '⌁', key: '1', note: 'SERVO erects these 55% faster' },
  solar: { name: 'Solar array', cost: 110, output: 3, buildTime: 8, icon: '▰', key: '2', note: 'ARC wires these 55% faster' },
}

export const ROLES: Record<RobotRole, { name: string; glyph: string; color: string; repairs: RobotRole; specialty: string }> = {
  arc: { name: 'ARC', glyph: 'ϟ', color: '#ffcf63', repairs: 'servo', specialty: 'SOLAR +55%' },
  servo: { name: 'SERVO', glyph: '◆', color: '#62b9ff', repairs: 'optic', specialty: 'PYLON +55%' },
  optic: { name: 'OPTIC', glyph: '◉', color: '#ef83ff', repairs: 'arc', specialty: 'MOVE +35%' },
}

export const LEVELS: LevelSpec[] = [
  {
    number: '01',
    name: 'TRIAD PROTOCOL',
    directive: 'OPTIC repairs ARC · ARC repairs SERVO · SERVO repairs OPTIC. Restore the down ARC, then finish both marked structures.',
    goal: 'RESTORE ARC · REACH 6 MW',
    targetGeneration: 6,
    timeLimit: null,
  },
  {
    number: '02',
    name: 'BROKEN FRONTIER',
    directive: 'Build to 18 MW before the storm. Keep balanced triads close: specialists work faster, idle reserves do not wear out.',
    goal: 'REACH 18 MW BEFORE 02:30',
    targetGeneration: 18,
    timeLimit: 150,
  },
]

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

// Deterministic shifted-exponential wear makes playtests repeatable without making
// the moment of each field fault obvious to a player.
function failureInterval(id: number, repairs: number) {
  const minimum = 8
  const value = Math.sin((id * 91 + repairs * 193 + 17) * 12.9898) * 43758.5453
  const uniform = Math.min(.96, Math.max(.04, value - Math.floor(value)))
  return minimum - Math.log(1 - uniform) * (ROBOT_MTTF - minimum)
}

function makeWorker(id: number, role: RobotRole, offset: number, tutorial = false): Worker {
  const x = HQ.x - 1.2 + offset * .72
  const y = HQ.y + 1 + (offset % 2) * .55
  return {
    id,
    name: `${ROLES[role].name}-${String(id).padStart(2, '0')}`,
    role,
    x,
    y,
    status: 'idle',
    taskId: null,
    rescueId: null,
    targetX: x,
    targetY: y,
    operatingTime: 0,
    failureAt: tutorial ? Infinity : failureInterval(id, 0),
    repairs: 0,
    serviceTime: 0,
  }
}

export function canRepair(repairer: Worker | RobotRole, target: Worker | RobotRole) {
  const repairerRole = typeof repairer === 'string' ? repairer : repairer.role
  const targetRole = typeof target === 'string' ? target : target.role
  return ROLES[repairerRole].repairs === targetRole
}

export function roleNeededFor(target: RobotRole): RobotRole {
  return (Object.keys(ROLES) as RobotRole[]).find(role => ROLES[role].repairs === target)!
}

export function getBuildingCost(state: GameState, type: BuildingType) {
  const built = state.buildings.filter(building => building.type === type).length
  const growth = type === 'pylon' ? 1.04 : 1.09
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

export function initialState(debug = false, level = 0): GameState {
  if (level === 0) {
    const workers = [
      makeWorker(1, 'arc', 0, true),
      makeWorker(2, 'servo', 1, true),
      makeWorker(3, 'optic', 2, true),
    ]
    workers[0] = { ...workers[0], status: 'stalled', x: 21, y: 20, targetX: 21, targetY: 20 }
    return {
      level,
      phase: 'playing',
      elapsed: 0,
      cash: debug ? 12000 : 0,
      totalEnergy: 0,
      generation: 3,
      buildMode: null,
      placementError: null,
      selectedWorker: 3,
      buildings: [
        { id: 1, type: 'solar', x: 20, y: 17, status: 'complete', progress: 1, connected: true, parentId: null },
        { id: 2, type: 'pylon', x: 22, y: 19, status: 'complete', progress: 1, connected: true, parentId: null },
        { id: 3, type: 'pylon', x: 14, y: 18, status: 'blueprint', progress: 0, connected: false, parentId: null },
        { id: 4, type: 'solar', x: 10, y: 18, status: 'blueprint', progress: 0, connected: false, parentId: null },
      ],
      workers,
      nextId: 10,
      toast: 'OPTIC-03 is selected. Click the failed ARC-01 to begin its reboot.',
      seed: 81727,
      running: true,
    }
  }

  return {
    level,
    phase: 'playing',
    elapsed: 0,
    cash: debug ? 12000 : 700,
    totalEnergy: 0,
    generation: 3,
    buildMode: null,
    placementError: null,
    selectedWorker: 1,
    buildings: [
      { id: 1, type: 'solar', x: 20, y: 17, status: 'complete', progress: 1, connected: true, parentId: null },
      { id: 2, type: 'pylon', x: 22, y: 19, status: 'complete', progress: 1, connected: true, parentId: null },
    ],
    workers: [
      makeWorker(1, 'arc', 0), makeWorker(2, 'servo', 1), makeWorker(3, 'optic', 2),
      makeWorker(4, 'arc', 3), makeWorker(5, 'servo', 4), makeWorker(6, 'optic', 5),
    ],
    nextId: 10,
    toast: 'Two balanced triads online. Extend the grid and keep compatible repairers in reserve.',
    seed: 42711,
    running: true,
  }
}

export function placeBlueprint(state: GameState, type: BuildingType, x: number, y: number): GameState {
  if (state.level === 0) return { ...state, toast: 'Construction sites are pre-marked in training. Assign the matching specialists.' }
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
    toast: `${BUILDINGS[type].name} planned. Assign a specialist or accept slower construction.`,
  }
}

export function assignWorker(state: GameState, workerId: number, taskId: number): GameState {
  const task = state.buildings.find(building => building.id === taskId && building.status !== 'complete')
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!task || !worker || worker.status === 'stalled' || state.phase !== 'playing') return state
  const workers = state.workers.map(unit => {
    if (unit.id !== workerId) return unit.taskId === taskId ? { ...unit, taskId: null, status: 'idle' as WorkerStatus } : unit
    return { ...unit, taskId, rescueId: null, targetX: task.x, targetY: task.y, status: 'moving' as WorkerStatus, serviceTime: 0 }
  })
  const buildings = state.buildings.map(building => building.id === taskId ? { ...building, status: 'building' as BuildingStatus } : building)
  const bonus = (task.type === 'solar' && worker.role === 'arc') || (task.type === 'pylon' && worker.role === 'servo')
  return { ...state, workers, buildings, toast: `${worker.name} dispatched${bonus ? ' — specialty bonus active.' : '.'}` }
}

export function assignRescue(state: GameState, workerId: number, targetId: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  const target = state.workers.find(unit => unit.id === targetId)
  if (!worker || !target || worker.id === target.id || worker.status === 'stalled' || target.status !== 'stalled' || state.phase !== 'playing') return state
  if (!canRepair(worker, target)) {
    const needed = ROLES[roleNeededFor(target.role)].name
    return { ...state, toast: `INCOMPATIBLE: ${target.name} needs ${needed}. Repair cycle: OPTIC → ARC → SERVO → OPTIC.` }
  }
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
  return { ...state, workers, selectedWorker: workerId, buildMode: null, toast: `${worker.name} responding to ${target.name}. Its own assignment is suspended.` }
}

export function moveWorker(state: GameState, workerId: number, x: number, y: number): GameState {
  const worker = state.workers.find(unit => unit.id === workerId)
  if (!worker || worker.status === 'stalled' || state.phase !== 'playing') return state
  return {
    ...state,
    workers: state.workers.map(unit => unit.id === workerId
      ? { ...unit, taskId: null, rescueId: null, targetX: x, targetY: y, status: 'moving' as WorkerStatus, serviceTime: 0 }
      : unit),
    toast: `${worker.name} moving to marker.`,
  }
}

function workerSpeed(worker: Worker) {
  return worker.role === 'optic' ? 3.1 : 2.3
}

function workerRate(worker: Worker, task?: Building) {
  if (task?.type === 'solar' && worker.role === 'arc') return 1.55
  if (task?.type === 'pylon' && worker.role === 'servo') return 1.55
  return 1
}

export function stepGame(state: GameState, dt: number): GameState {
  if (!state.running || state.phase !== 'playing') return state
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

    worker.operatingTime += dt
    if (worker.operatingTime >= worker.failureAt) {
      worker.status = 'stalled'
      worker.serviceTime = 0
      newlyStalled = worker
      continue
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
      worker.serviceTime += dt
      if (worker.serviceTime >= RESCUE_TIME) {
        target.repairs += 1
        target.operatingTime = 0
        target.failureAt = state.level === 0 ? Infinity : failureInterval(target.id, target.repairs)
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
    task.progress = Math.min(1, task.progress + dt * workerRate(worker, task) / BUILDINGS[task.type].buildTime)
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
  const elapsed = state.elapsed + dt
  const finished = networked.find(building => building.status === 'complete' && state.buildings.find(old => old.id === building.id)?.status !== 'complete')
  let toast = state.toast
  if (finished) toast = `${BUILDINGS[finished.type].name} complete${finished.connected ? ' and exporting.' : ' — OFF GRID. Extend a relay line.'}`
  if (newlyRescued) toast = `${newlyRescued.name} restored. Reassign the repairer; the rescued unit resumes its old task.`
  if (newlyStalled) toast = `⚠ ${newlyStalled.name} FAILED — dispatch ${ROLES[roleNeededFor(newlyStalled.role)].name}.`

  const repaired = workers.reduce((sum, worker) => sum + worker.repairs, 0)
  const won = generation >= LEVELS[state.level].targetGeneration && (state.level !== 0 || repaired > 0)
  const outOfTime = LEVELS[state.level].timeLimit !== null && elapsed >= LEVELS[state.level].timeLimit!
  const allStalled = workers.every(worker => worker.status === 'stalled')
  const phase: GamePhase = won ? 'won' : outOfTime || allStalled ? 'lost' : 'playing'

  return {
    ...state,
    phase,
    running: phase === 'playing',
    elapsed,
    cash: state.cash + income,
    totalEnergy: state.totalEnergy + generation * dt / 3600,
    generation,
    placementError: state.placementError && elapsed >= state.placementError.until ? null : state.placementError,
    buildings: networked,
    workers,
    toast: won ? `Directive complete: ${generation} MW stable.` : allStalled ? 'CREW LOCKOUT. No compatible unit remains online.' : outOfTime ? 'STORM ARRIVED. Output target missed.' : toast,
  }
}

export function formatCredits(value: number) {
  return `₡${Math.floor(value).toLocaleString()}`
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
