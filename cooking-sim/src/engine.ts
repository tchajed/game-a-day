export type ActionKind = 'serve' | 'clear' | 'bake' | 'top' | 'knead'
export type PizzaKind = 'tomato' | 'mushroom'
export type OrderState = 'seated' | 'prepping' | 'topped' | 'baking' | 'ready' | 'serving' | 'eating' | 'dirty' | 'clearing' | 'done' | 'left'
export type ChefId = 'Mise' | 'Sunny'

export type Priorities = Record<ActionKind, number>
export type ChefConfig = { priorities: Priorities; label: string }
export type GameConfig = { chefs: Record<ChefId, ChefConfig>; baseReserve: number }
export type Position = { x: number; y: number }
export type ChefAction = {
  kind: ActionKind
  orderId?: number
  counterId?: number
  timeLeft: number
  total: number
  from: Position
  to: Position
  label: string
}
export type Chef = { id: ChefId; color: string; position: Position; action: ChefAction | null; completed: number }
export type Order = {
  id: number
  table: number
  kind: PizzaKind
  state: OrderState
  patience: number
  eating: number
  seatedAt: number
}
export type Counter = { id: number; kind: 'empty' | 'base' | 'working-base' | 'working-top' | 'topped'; orderId?: number }
export type Oven = { id: number; orderId: number; timeLeft: number; loading: boolean }
export type PassItem = { orderId: number; cooling: number }
export type GameEvent = { id: number; time: number; text: string; tone: 'good' | 'bad' | 'info' }
export type GameStatus = 'planning' | 'running' | 'paused' | 'ended'
export type GameState = {
  time: number
  status: GameStatus
  score: number
  served: number
  lost: number
  streak: number
  shiftLength: number
  speed: 1 | 2 | 4
  chefs: Record<ChefId, Chef>
  orders: Order[]
  counters: Counter[]
  ovens: Oven[]
  pass: PassItem[]
  events: GameEvent[]
  nextOrder: number
  eventId: number
}

export const ACTIONS: ActionKind[] = ['serve', 'clear', 'bake', 'top', 'knead']
export const ACTION_LABELS: Record<ActionKind, string> = {
  serve: 'Serve hot food', clear: 'Clear tables', bake: 'Load the oven', top: 'Dress pizzas', knead: 'Prep dough',
}

export const DEFAULT_CONFIG: GameConfig = {
  baseReserve: 2,
  chefs: {
    Mise: { label: 'Kitchen lead', priorities: { serve: 15, clear: 5, bake: 86, top: 100, knead: 65 } },
    Sunny: { label: 'Dining lead', priorities: { serve: 100, clear: 78, bake: 46, top: 25, knead: 8 } },
  },
}

export const CHAOS_CONFIG: GameConfig = {
  baseReserve: 3,
  chefs: {
    Mise: { label: 'Dough obsessed', priorities: { serve: 3, clear: 2, bake: 15, top: 35, knead: 100 } },
    Sunny: { label: 'Helpful, allegedly', priorities: { serve: 45, clear: 10, bake: 15, top: 35, knead: 100 } },
  },
}

export const STATIONS: Record<ActionKind, Position> = {
  knead: { x: 17, y: 25 }, top: { x: 32, y: 25 }, bake: { x: 49, y: 23 }, serve: { x: 70, y: 48 }, clear: { x: 82, y: 48 },
}

const ARRIVALS = [0, 5, 12, 20, 29, 38, 48, 58, 67]
const KINDS: PizzaKind[] = ['tomato', 'mushroom', 'mushroom', 'tomato', 'tomato', 'mushroom', 'tomato', 'mushroom', 'mushroom']
const TABLES = [0, 1, 2, 0, 1, 2, 0, 1, 2]
const ACTION_TIMES: Record<ActionKind, number> = { knead: 3.1, top: 2.6, bake: 1.3, serve: 1.7, clear: 1.5 }

export function createGame(status: GameStatus = 'planning'): GameState {
  return {
    time: 0, status, score: 0, served: 0, lost: 0, streak: 0, shiftLength: 94, speed: 1,
    chefs: {
      Mise: { id: 'Mise', color: '#e35d4f', position: { x: 38, y: 65 }, action: null, completed: 0 },
      Sunny: { id: 'Sunny', color: '#3e8a79', position: { x: 68, y: 68 }, action: null, completed: 0 },
    },
    orders: [], counters: [0, 1, 2].map(id => ({ id, kind: 'empty' })), ovens: [], pass: [], events: [], nextOrder: 0, eventId: 0,
  }
}

function event(state: GameState, text: string, tone: GameEvent['tone']) {
  state.events.unshift({ id: state.eventId++, time: state.time, text, tone })
  state.events = state.events.slice(0, 5)
}

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.y - b.y) / 25
}

function tablePosition(table: number): Position {
  return { x: 70 + (table % 2) * 17, y: 34 + Math.floor(table / 2) * 27 }
}

function candidates(state: GameState, kind: ActionKind): Array<{ orderId?: number; counterId?: number }> {
  if (kind === 'serve') return state.pass.map(p => ({ orderId: p.orderId }))
  if (kind === 'clear') return state.orders.filter(o => o.state === 'dirty').map(o => ({ orderId: o.id }))
  if (kind === 'bake' && state.ovens.length < 2) return state.counters.filter(c => c.kind === 'topped').map(c => ({ orderId: c.orderId, counterId: c.id }))
  if (kind === 'top') {
    const base = state.counters.find(c => c.kind === 'base')
    if (!base) return []
    return state.orders.filter(o => o.state === 'seated').sort((a, b) => a.patience - b.patience).map(o => ({ orderId: o.id, counterId: base.id }))
  }
  if (kind === 'knead') {
    const empty = state.counters.find(c => c.kind === 'empty')
    return empty ? [{ counterId: empty.id }] : []
  }
  return []
}

function scoreCandidate(state: GameState, kind: ActionKind, priority: number, orderId?: number, config?: GameConfig) {
  let score = priority
  const order = state.orders.find(o => o.id === orderId)
  if (order) score += (36 - order.patience) * 1.2
  if (kind === 'serve') score += 25
  if (kind === 'bake') score += 10
  if (kind === 'knead') {
    const supply = state.counters.filter(c => c.kind === 'base' || c.kind === 'working-base').length
    const demand = state.orders.filter(o => o.state === 'seated').length
    if (supply >= Math.min(config?.baseReserve ?? 2, Math.max(1, demand))) score -= 1000
  }
  return score
}

function assignAction(state: GameState, chef: Chef, config: GameConfig) {
  let best: { kind: ActionKind; orderId?: number; counterId?: number; score: number } | null = null
  for (const kind of ACTIONS) {
    const priority = config.chefs[chef.id].priorities[kind]
    if (priority <= 0) continue
    for (const item of candidates(state, kind)) {
      const score = scoreCandidate(state, kind, priority, item.orderId, config)
      if (!best || score > best.score) best = { kind, ...item, score }
    }
  }
  if (!best || best.score < 0) return
  const order = state.orders.find(o => o.id === best.orderId)
  const counter = state.counters.find(c => c.id === best.counterId)
  if (best.kind === 'knead' && counter) counter.kind = 'working-base'
  if (best.kind === 'top' && counter && order) { counter.kind = 'working-top'; counter.orderId = order.id; order.state = 'prepping' }
  if (best.kind === 'bake' && counter && order) {
    counter.kind = 'empty'; counter.orderId = undefined; order.state = 'baking'
    state.ovens.push({ id: state.ovens.find(o => o.id === 0) ? 1 : 0, orderId: order.id, timeLeft: 7, loading: true })
  }
  if (best.kind === 'serve' && order) { state.pass = state.pass.filter(p => p.orderId !== order.id); order.state = 'serving' }
  if (best.kind === 'clear' && order) order.state = 'clearing'
  const target = best.kind === 'serve' || best.kind === 'clear' ? tablePosition(order?.table ?? 0) : STATIONS[best.kind]
  const total = ACTION_TIMES[best.kind] + distance(chef.position, target)
  chef.action = { kind: best.kind, orderId: best.orderId, counterId: best.counterId, timeLeft: total, total, from: { ...chef.position }, to: target, label: ACTION_LABELS[best.kind] }
}

function finishAction(state: GameState, chef: Chef) {
  const action = chef.action
  if (!action) return
  const order = state.orders.find(o => o.id === action.orderId)
  const counter = state.counters.find(c => c.id === action.counterId)
  if (action.kind === 'knead' && counter) counter.kind = 'base'
  if (action.kind === 'top' && counter && order) { counter.kind = 'topped'; order.state = 'topped' }
  if (action.kind === 'bake') {
    const oven = state.ovens.find(o => o.orderId === action.orderId)
    if (oven) oven.loading = false
  }
  if (action.kind === 'serve' && order) { order.state = 'eating'; order.eating = 7.5; event(state, `Table ${order.table + 1} got their ${order.kind} pie`, 'good') }
  if (action.kind === 'clear' && order) {
    order.state = 'done'; state.served++; state.streak++; const tip = 100 + Math.round(order.patience * 3) + state.streak * 10; state.score += tip
    event(state, `Table ${order.table + 1} cleared · +${tip}`, 'good')
  }
  chef.position = { ...action.to }; chef.completed++; chef.action = null
}

function abandonOrder(state: GameState, order: Order) {
  order.state = 'left'; state.lost++; state.streak = 0; state.score = Math.max(0, state.score - 75)
  state.pass = state.pass.filter(p => p.orderId !== order.id)
  state.ovens = state.ovens.filter(o => o.orderId !== order.id)
  for (const counter of state.counters) if (counter.orderId === order.id) { counter.kind = 'empty'; counter.orderId = undefined }
  for (const chef of Object.values(state.chefs)) if (chef.action?.orderId === order.id) chef.action = null
  event(state, `Table ${order.table + 1} walked out`, 'bad')
}

export function tick(source: GameState, dt: number, config: GameConfig): GameState {
  if (source.status !== 'running') return source
  const state = structuredClone(source) as GameState
  state.time += dt

  while (state.nextOrder < ARRIVALS.length && ARRIVALS[state.nextOrder] <= state.time) {
    const i = state.nextOrder++
    state.orders.push({ id: i, table: TABLES[i], kind: KINDS[i], state: 'seated', patience: 35, eating: 0, seatedAt: state.time })
    event(state, `Table ${TABLES[i] + 1} ordered ${KINDS[i]}`, 'info')
  }

  for (const order of state.orders) {
    if (['seated', 'prepping', 'topped', 'baking', 'ready', 'serving'].includes(order.state)) {
      order.patience -= dt
      if (order.patience <= 0) abandonOrder(state, order)
    } else if (order.state === 'eating') {
      order.eating -= dt
      if (order.eating <= 0) order.state = 'dirty'
    }
  }

  for (const oven of state.ovens) if (!oven.loading) oven.timeLeft -= dt
  for (const oven of [...state.ovens]) {
    if (oven.timeLeft <= 0 && state.pass.length < 2) {
      state.ovens = state.ovens.filter(o => o !== oven)
      const order = state.orders.find(o => o.id === oven.orderId)
      if (order && order.state === 'baking') { order.state = 'ready'; state.pass.push({ orderId: order.id, cooling: 10 }); event(state, `${order.kind} pizza is up!`, 'info') }
    }
  }
  for (const item of state.pass) item.cooling -= dt

  for (const chef of Object.values(state.chefs)) {
    if (chef.action) {
      chef.action.timeLeft -= dt
      const progress = 1 - Math.max(0, chef.action.timeLeft) / chef.action.total
      chef.position.x = chef.action.from.x + (chef.action.to.x - chef.action.from.x) * Math.min(1, progress * 2)
      chef.position.y = chef.action.from.y + (chef.action.to.y - chef.action.from.y) * Math.min(1, progress * 2)
      if (chef.action.timeLeft <= 0) finishAction(state, chef)
    }
  }
  for (const chef of Object.values(state.chefs)) if (!chef.action) assignAction(state, chef, config)

  const allArrived = state.nextOrder >= ARRIVALS.length
  const unresolved = state.orders.some(o => !['done', 'left'].includes(o.state))
  if ((allArrived && !unresolved) || state.time >= state.shiftLength) {
    state.status = 'ended'
    for (const order of state.orders) if (!['done', 'left'].includes(order.state)) abandonOrder(state, order)
    event(state, `Shift complete · ${state.served}/${ARRIVALS.length} tables served`, state.served >= 7 ? 'good' : 'bad')
  }
  return state
}

export function runSimulation(config: GameConfig, step = 0.1): GameState {
  let state = createGame('running')
  while (state.status === 'running') state = tick(state, step, config)
  return state
}

export function configFromRuleCode(code: string): GameConfig {
  const config = structuredClone(DEFAULT_CONFIG)
  for (const chef of ['Mise', 'Sunny'] as ChefId[]) {
    const block = code.match(new RegExp(`${chef}\\s*\\{([\\s\\S]*?)\\}`, 'i'))?.[1] ?? ''
    const found = ACTIONS.map(kind => ({ kind, index: block.toLowerCase().indexOf(kind) })).filter(x => x.index >= 0).sort((a, b) => a.index - b.index)
    if (found.length) found.forEach((entry, i) => { config.chefs[chef].priorities[entry.kind] = 100 - i * 18 })
  }
  const reserve = code.match(/bases\s*[=<]\s*(\d)/i)?.[1]
  if (reserve) config.baseReserve = Math.max(1, Math.min(3, Number(reserve)))
  return config
}
