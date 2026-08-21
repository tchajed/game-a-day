import { describe, expect, test } from 'bun:test'
import { ACTIONS, DEFAULT_CONFIG, configFromRuleCode, createGame, finishSimulation, runSimulation, tick, type GameConfig } from './engine'

function copyConfig(): GameConfig { return structuredClone(DEFAULT_CONFIG) }

describe('kitchen simulation', () => {
  test('the reference program gives a strong but imperfect service', () => {
    const result = runSimulation(DEFAULT_CONFIG)
    expect(result.status).toBe('ended')
    expect(result.served).toBeGreaterThanOrEqual(7)
    expect(result.lost).toBeLessThanOrEqual(2)
    expect(result.score).toBeGreaterThan(900)
  })

  test('a crew that never serves fails decisively', () => {
    const config = copyConfig()
    for (const chef of Object.values(config.chefs)) chef.priorities.serve = 0
    const result = runSimulation(config)
    expect(result.served).toBe(0)
    expect(result.lost).toBe(9)
  })

  test('a crew that only makes dough deadlocks its counters', () => {
    const config = copyConfig()
    for (const chef of Object.values(config.chefs)) {
      for (const action of ACTIONS) chef.priorities[action] = action === 'knead' ? 100 : 0
    }
    config.baseReserve = 3
    const result = runSimulation(config)
    expect(result.counters.every(counter => counter.kind === 'base')).toBe(true)
    expect(result.served).toBe(0)
  })

  test('chefs finish traveling before their action timer starts', () => {
    let state = tick(createGame('running'), 0.01, DEFAULT_CONFIG)
    const assigned = state.chefs.Mise.action
    expect(assigned).not.toBeNull()
    if (!assigned) return

    state = tick(state, assigned.travelTime / 2, DEFAULT_CONFIG)
    const traveling = state.chefs.Mise
    expect(traveling.action).not.toBeNull()
    expect(traveling.position.x).not.toBeCloseTo(assigned.to.x, 2)
    expect((traveling.action?.timeLeft ?? 0) - assigned.workTime).toBeGreaterThan(0)

    state = tick(state, assigned.travelTime / 2 + 0.01, DEFAULT_CONFIG)
    const working = state.chefs.Mise
    expect(working.position.x).toBeCloseTo(assigned.to.x, 2)
    expect(working.position.y).toBeCloseTo(assigned.to.y, 2)
    expect(working.action?.timeLeft ?? 0).toBeLessThanOrEqual(assigned.workTime)
  })

  test('the engine keeps station capacity and unique work assignments', () => {
    let state = createGame('running')
    while (state.status === 'running') {
      state = tick(state, 0.1, DEFAULT_CONFIG)
      expect(state.counters).toHaveLength(3)
      expect(state.ovens.length).toBeLessThanOrEqual(2)
      expect(state.pass.length).toBeLessThanOrEqual(2)
      const activeOrders = Object.values(state.chefs).map(c => c.action?.orderId).filter(id => id !== undefined)
      expect(new Set(activeOrders).size).toBe(activeOrders.length)
    }
  })

  test('skip to end continues a paused shift and preserves its statistics', () => {
    let state = createGame('running')
    for (let i = 0; i < 120; i++) state = tick(state, 0.1, DEFAULT_CONFIG)
    state.status = 'paused'
    const elapsed = state.time
    const result = finishSimulation(state, DEFAULT_CONFIG)

    expect(result.status).toBe('ended')
    expect(result.time).toBeGreaterThan(elapsed)
    expect(result.stats.orders).toHaveLength(9)
    expect(result.stats.chefs.Mise.work + result.stats.chefs.Mise.travel + result.stats.chefs.Mise.idle).toBeCloseTo(result.time, 0)
    expect(result.stats.orders.some(order => order.servedAt !== undefined)).toBe(true)
  })

  test('completed runs record guest waits and chef activity', () => {
    const result = runSimulation(DEFAULT_CONFIG)
    const waiting = result.stats.orderStateTime.seated + result.stats.orderStateTime.topped + result.stats.orderStateTime.ready + result.stats.orderStateTime.dirty
    expect(waiting).toBeGreaterThan(0)
    expect(result.stats.chefs.Mise.actions.top).toBeGreaterThan(0)
    expect(result.stats.orders.filter(order => order.finishedAt !== undefined)).toHaveLength(result.served)
  })

  test('KitchenScript order changes agent priorities', () => {
    const config = configFromRuleCode(`Mise { serve(); clear(); bake(); top(); knead(); bases <= 1 } Sunny { knead(); top(); bake(); clear(); serve(); }`)
    expect(config.chefs.Mise.priorities.serve).toBeGreaterThan(config.chefs.Mise.priorities.knead)
    expect(config.chefs.Sunny.priorities.knead).toBeGreaterThan(config.chefs.Sunny.priorities.serve)
    expect(config.baseReserve).toBe(1)
  })
})
