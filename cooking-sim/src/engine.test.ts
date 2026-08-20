import { describe, expect, test } from 'bun:test'
import { ACTIONS, DEFAULT_CONFIG, configFromRuleCode, createGame, runSimulation, tick, type GameConfig } from './engine'

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

  test('KitchenScript order changes agent priorities', () => {
    const config = configFromRuleCode(`Mise { serve(); clear(); bake(); top(); knead(); bases < 1 } Sunny { knead(); top(); bake(); clear(); serve(); }`)
    expect(config.chefs.Mise.priorities.serve).toBeGreaterThan(config.chefs.Mise.priorities.knead)
    expect(config.chefs.Sunny.priorities.knead).toBeGreaterThan(config.chefs.Sunny.priorities.serve)
    expect(config.baseReserve).toBe(1)
  })
})
