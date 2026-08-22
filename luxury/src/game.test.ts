import { describe, expect, test } from 'bun:test'
import { CRISES, INITIAL_METRICS, playStrategy } from './game'

describe('Maison Morrow balance', () => {
  test('the opening crisis threatens trust without threatening solvency', () => {
    expect(INITIAL_METRICS.cash).toBeGreaterThanOrEqual(40)
    for (const choice of CRISES[0].choices) {
      expect(INITIAL_METRICS.cash + (choice.now.cash ?? 0)).toBeGreaterThanOrEqual(40)
    }
  })

  test('the luxury playbook produces an iconic maison', () => {
    const best = CRISES.map(crisis => crisis.choices.findIndex(choice => choice.luxury === 2))
    const run = playStrategy(best)
    expect(run.result).toBe('icon')
    expect(run.metrics.cash).toBeGreaterThanOrEqual(0)
  })

  test('chasing volume turns Morrow ordinary', () => {
    const run = playStrategy(CRISES.map(() => 0))
    expect(run.result).toBe('ordinary')
  })

  test('a mostly cautious route can survive without becoming iconic', () => {
    const run = playStrategy([2, 2, 2, 2, 2, 1, 2, 2])
    expect(run.result).toBe('independent')
  })

  test('victory requires consistent judgment, not one lucky choice', () => {
    let wins = 0
    const total = 3 ** CRISES.length
    for (let mask = 0; mask < total; mask += 1) {
      let value = mask
      const choices = CRISES.map(() => {
        const choice = value % 3
        value = Math.floor(value / 3)
        return choice
      })
      if (playStrategy(choices).result !== 'ordinary' && playStrategy(choices).result !== 'insolvent') wins += 1
    }
    const winRate = wins / total
    expect(winRate).toBeGreaterThan(0.08)
    expect(winRate).toBeLessThan(0.4)
  })
})
