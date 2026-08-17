export type BuildingType = 'wind' | 'solar' | 'battery' | 'flywheel'
export type Pad = { x: number; y: number; building?: BuildingType }

export type GameState = {
  elapsed: number
  cash: number
  debt: number
  score: number
  generation: number
  exportMW: number
  target: number
  price: number
  stored: number
  capacity: number
  dispatch: number
  intendedDispatch: number
  balancedSeconds: number
  dangerSeconds: number
  selected: number | null
  buildMode: BuildingType | null
  pads: Pad[]
  windFault: boolean
  alignProgress: number
  flywheelHeat: number
  running: boolean
  finished: boolean
  toast: string
  seed: number
}

export const BUILDINGS: Record<BuildingType, { name: string; cost: number; icon: string; note: string }> = {
  wind: { name: 'Wind', cost: 6500, icon: '◉', note: '4.5 MW · needs alignment' },
  solar: { name: 'Solar', cost: 5500, icon: '▰', note: '3.5 MW · dependable' },
  battery: { name: 'Battery', cost: 8000, icon: '▥', note: '8 MWh · ±4 MW' },
  flywheel: { name: 'Flywheel', cost: 4500, icon: '◎', note: '1 MWh · ±6 MW · runs hot' },
}

export const initialState = (debug = false): GameState => ({
  elapsed: debug ? 35 : 0, cash: debug ? 35000 : 22000, debt: 0, score: 0,
  generation: 3, exportMW: 3, target: 3, price: 80,
  stored: 4, capacity: 8, dispatch: 0, intendedDispatch: 0,
  balancedSeconds: 0, dangerSeconds: 0, selected: null, buildMode: null,
  pads: [{ x: 5, y: 2 }, { x: 7, y: 4 }, { x: 3, y: 6 }],
  windFault: false, alignProgress: 1, flywheelHeat: 0, running: true, finished: false,
  toast: 'GRID ONLINE // Match the export contract', seed: 7261,
})

const contract = (t: number) => {
  if (t < 60) return [3, 80]
  if (t < 90) return [4, 95]
  if (t < 120) return [5, 110]
  if (t < 150) return [3, 60]
  if (t < 170) return [6, 180]
  if (t < 210) return [4, 90]
  if (t < 255) return [6, 125]
  return [7, 160]
}

export function stepGame(s: GameState, dt: number): GameState {
  if (!s.running || s.finished) return s
  const n = { ...s, pads: s.pads.map(p => ({ ...p })) }
  n.elapsed = Math.min(300, n.elapsed + dt)
  ;[n.target, n.price] = contract(n.elapsed)
  if (!n.windFault && (Math.floor(s.elapsed / 57) !== Math.floor(n.elapsed / 57)) && n.elapsed > 64) {
    n.windFault = true; n.alignProgress = .55; n.toast = '⚠ TURBINE BEARING DRIFT — RECALIBRATE'
  }
  const counts = (type: BuildingType) => n.pads.filter(p => p.building === type).length
  const windCount = counts('wind')
  const solarCount = counts('solar')
  const windGen = (3 + windCount * 4.5) * n.alignProgress
  const solarGen = solarCount * 3.5
  n.generation = windGen + solarGen
  const storageRate = 4 + counts('battery') * 4 + counts('flywheel') * 6
  n.capacity = 8 + counts('battery') * 8 + counts('flywheel')
  const maxDischarge = Math.min(storageRate, n.stored * 15)
  const maxCharge = Math.min(storageRate, (n.capacity - n.stored) * 15)
  n.dispatch = Math.max(-maxCharge, Math.min(maxDischarge, n.intendedDispatch))
  n.exportMW = Math.max(0, n.generation + n.dispatch)
  const hours = dt * 24 / 3600
  n.stored = Math.max(0, Math.min(n.capacity, n.stored - Math.max(0, n.dispatch) * hours / .92 + Math.max(0, -n.dispatch) * hours * .92))
  const matched = Math.min(n.exportMW, n.target)
  const excess = Math.max(0, n.exportMW - n.target)
  const missing = Math.max(0, n.target - n.exportMW)
  const income = (matched * n.price + excess * n.price * .25 - missing * 120) * hours * 20
  n.cash += income; n.score += Math.max(0, income)
  const err = Math.abs(n.exportMW - n.target)
  n.balancedSeconds += err <= 1 ? dt : 0
  n.dangerSeconds = err > 5 ? n.dangerSeconds + dt : Math.max(0, n.dangerSeconds - dt * 2)
  const flywheels = counts('flywheel')
  n.flywheelHeat = flywheels ? Math.max(0, Math.min(100, n.flywheelHeat + (Math.abs(n.dispatch) > 4 ? 16 : -22) * dt)) : 0
  if (n.flywheelHeat >= 100) { n.intendedDispatch = 0; n.toast = 'FLYWHEEL TRIPPED // Cooling' }
  if (n.debt > 0 && Math.floor(s.elapsed / 60) !== Math.floor(n.elapsed / 60)) { n.cash -= 100; n.toast = 'CREDIT INTEREST — $100' }
  if (n.elapsed >= 300 || n.dangerSeconds >= 12) { n.finished = true; n.running = false }
  return n
}

export function formatMoney(n: number) { return `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString()}` }
