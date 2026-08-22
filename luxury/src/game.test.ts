import { describe, expect, test } from 'bun:test'
import { applyDecisionPhase, CRISES, DECISION_ROUNDS, INITIAL_METRICS, playStrategy } from './game'

describe('Maison Morrow decision tutorial', () => {
  test('progresses from a generous untimed brief to timed simultaneous sessions', () => {
    expect(DECISION_ROUNDS.flatMap(round => round.crisisIndices)).toEqual(CRISES.map((_, index) => index))
    expect(DECISION_ROUNDS[0].crisisIndices).toHaveLength(1)
    expect(DECISION_ROUNDS[0].seconds).toBeNull()
    expect(DECISION_ROUNDS[1].crisisIndices).toHaveLength(1)

    const soloSeconds = DECISION_ROUNDS[1].seconds ?? 0
    for (const round of DECISION_ROUNDS.slice(2)) {
      expect(round.crisisIndices).toHaveLength(2)
      expect(round.seconds).toBeGreaterThan(soloSeconds)
    }
  })

  test('keeps the timed portion comfortably inside the five-minute prototype', () => {
    const totalTimedSeconds = DECISION_ROUNDS.reduce((total, round) => total + (round.seconds ?? 0), 0)
    expect(totalTimedSeconds).toBe(150)
    expect(totalTimedSeconds).toBeLessThan(180)
  })

  test('applies parallel decisions as one atomic ledger movement', () => {
    const metrics = applyDecisionPhase(INITIAL_METRICS, [
      { crisisIndex: 2, choiceIndex: 0 },
      { crisisIndex: 3, choiceIndex: 1 },
    ], 'now')
    expect(metrics).toEqual({ aura: 62, craft: 64, cash: 33, reach: 46 })
  })
})

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
