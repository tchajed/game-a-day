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
  wind: number
  sun: number
  stored: number
  capacity: number
  dispatch: number
  intendedDispatch: number
  balancedSeconds: number
  dangerSeconds: number
  storm: boolean
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
  wind: { name: 'Wind', cost: 9000, icon: '◉', note: '0–5 MW · needs alignment' },
  solar: { name: 'Solar', cost: 7000, icon: '▰', note: '0–4 MW · follows sun' },
  battery: { name: 'Battery', cost: 11000, icon: '▥', note: '8 MWh · ±4 MW' },
  flywheel: { name: 'Flywheel', cost: 6000, icon: '◎', note: '1 MWh · ±6 MW · runs hot' },
}

export const initialState = (debug = false): GameState => ({
  elapsed: debug ? 35 : 0, cash: debug ? 35000 : 18000, debt: 30000, score: 0,
  generation: 0, exportMW: 0, target: 3, price: 80, wind: .68, sun: .9,
  stored: 4, capacity: 8, dispatch: 0, intendedDispatch: 0,
  balancedSeconds: 0, dangerSeconds: 0, storm: false, selected: null, buildMode: null,
  pads: [{ x: 5, y: 2 }, { x: 7, y: 4 }, { x: 3, y: 6 }],
  windFault: false, alignProgress: 1, flywheelHeat: 0, running: true, finished: false,
  toast: 'GRID ONLINE // Match the export contract', seed: 7261,
})

const contract = (t: number) => {
  if (t < 60) return [3, 80]
  if (t < 90) return [4, 95]
  if (t < 120) return [5, 110]
  if (t < 150) return [3, 60]
  if (t < 170) return [6, 240]
  if (t < 210) return [4, 90]
  if (t < 255) return [6, 125]
  return [8, 180]
}

export function stepGame(s: GameState, dt: number): GameState {
  if (!s.running || s.finished) return s
  const n = { ...s, pads: s.pads.map(p => ({ ...p })) }
  n.elapsed = Math.min(300, n.elapsed + dt)
  ;[n.target, n.price] = contract(n.elapsed)
  n.storm = n.elapsed >= 255
  n.wind = Math.max(.12, Math.min(1, .58 + Math.sin(n.elapsed * .21) * .22 + Math.sin(n.elapsed * .053) * .17))
  n.sun = n.storm ? .1 : Math.max(.28, .84 + Math.sin(n.elapsed * .073) * .15 - (n.elapsed % 71 > 57 ? .4 : 0))
  if (!n.windFault && (Math.floor(s.elapsed / 41) !== Math.floor(n.elapsed / 41)) && n.elapsed > 39) {
    n.windFault = true; n.alignProgress = .38; n.toast = '⚠ TURBINE YAW DRIFT — ALIGN NOW'
  }
  const counts = (type: BuildingType) => n.pads.filter(p => p.building === type).length
  const windCount = 1 + counts('wind')
  const solarCount = counts('solar')
  const windGen = windCount * (n.storm ? 7 : 5) * n.wind * n.alignProgress
  const solarGen = solarCount * 4 * n.sun
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
  if (Math.floor(s.elapsed / 30) !== Math.floor(n.elapsed / 30)) { n.cash -= 250; n.toast = 'DEBT INTEREST — $250' }
  if (n.elapsed >= 300 || n.dangerSeconds >= 10) { n.finished = true; n.running = false }
  return n
}

export function formatMoney(n: number) { return `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n)).toLocaleString()}` }
