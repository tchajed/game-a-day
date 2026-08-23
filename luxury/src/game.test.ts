import { describe, expect, test } from 'bun:test'
import {
  applyDecisionPhase,
  CRISES,
  DECISION_ROUNDS,
  getCompanyStatus,
  INITIAL_METRICS,
  playStrategy,
} from './game'

describe('Maison Morrow decision cadence', () => {
  test('progresses from a generous untimed brief to timed simultaneous sessions', () => {
    expect(DECISION_ROUNDS.flatMap(round => round.crisisIndices)).toEqual(CRISES.map((_, index) => index))
    expect(CRISES).toHaveLength(12)
    expect(DECISION_ROUNDS[0].crisisIndices).toHaveLength(1)
    expect(DECISION_ROUNDS[0].seconds).toBeNull()
    expect(DECISION_ROUNDS[1].crisisIndices).toHaveLength(1)

    const soloSeconds = DECISION_ROUNDS[1].seconds ?? 0
    for (const round of DECISION_ROUNDS.slice(2)) {
      expect(round.crisisIndices).toHaveLength(2)
      expect(round.seconds).toBeGreaterThan(soloSeconds)
    }
  })

  test('keeps the timed portion near three minutes despite four new decisions', () => {
    const totalTimedSeconds = DECISION_ROUNDS.reduce((total, round) => total + (round.seconds ?? 0), 0)
    expect(totalTimedSeconds).toBe(190)
    expect(totalTimedSeconds).toBeLessThan(210)
  })

  test('applies parallel decisions as one atomic ledger movement', () => {
    const metrics = applyDecisionPhase(INITIAL_METRICS, [
      { crisisIndex: 2, choiceIndex: 0 },
      { crisisIndex: 3, choiceIndex: 1 },
    ], 'now')
    expect(metrics).toEqual({ aura: 62, craft: 64, cash: 33, reach: 46 })
  })

  test('contains both no-clean-answer and no-harmful-answer decisions', () => {
    const recall = CRISES[8]
    for (const choice of recall.choices) {
      const allDeltas = { ...choice.now, ...choice.later }
      expect(Object.values(allDeltas).some(value => value < 0)).toBe(true)
    }

    const schools = CRISES[9]
    for (const choice of schools.choices) {
      expect((choice.now.aura ?? 0) + (choice.later.aura ?? 0)).toBeGreaterThanOrEqual(0)
      expect((choice.now.craft ?? 0) + (choice.later.craft ?? 0)).toBeGreaterThan(0)
    }
  })
})

describe('Maison Morrow interlude', () => {
  test('prepares distinct bad, okay, and good company readings', () => {
    expect(getCompanyStatus({ aura: 35, craft: 50, cash: 30, reach: 20 })).toBe('bad')
    expect(getCompanyStatus(INITIAL_METRICS)).toBe('okay')
    expect(getCompanyStatus({ aura: 82, craft: 76, cash: 30, reach: 50 })).toBe('good')
  })
})

describe('Maison Morrow balance', () => {
  test('the opening crisis threatens trust without threatening solvency', () => {
    expect(INITIAL_METRICS.cash).toBeGreaterThanOrEqual(40)
    for (const choice of CRISES[0].choices) {
      expect(INITIAL_METRICS.cash + (choice.now.cash ?? 0)).toBeGreaterThanOrEqual(40)
    }
  })

  test('a consistent luxury playbook can produce an iconic maison', () => {
    const run = playStrategy([1, 1, 1, 1, 1, 1, 1, 2, 0, 0, 2, 1])
    expect(run.result).toBe('icon')
    expect(run.metrics.cash).toBeGreaterThanOrEqual(0)
  })

  test('chasing volume turns Morrow ordinary', () => {
    const run = playStrategy(CRISES.map(() => 0))
    expect(run.result).toBe('ordinary')
  })

  test('a mixed route can survive without becoming iconic', () => {
    const run = playStrategy([1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0])
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
      const result = playStrategy(choices).result
      if (result !== 'ordinary' && result !== 'insolvent') wins += 1
    }
    const winRate = wins / total
    expect(winRate).toBeGreaterThan(0.08)
    expect(winRate).toBeLessThan(0.4)
  })
})
