import { describe, expect, it } from 'vitest'
import { encounters, resolveCard, startingDeck } from './game'

const firstRewards = encounters[0].rewards
const secondRewards = encounters[1].rewards

type Route = { cards: string[]; trust: number; tension: number }

function playRoute(encounterIndex: number, plays: string[]): Route | null {
  const encounter = encounters[encounterIndex]
  let trust = 0
  let tension = 0
  let intel = 0

  for (let turn = 0; turn < plays.length; turn += 1) {
    const result = resolveCard(plays[turn], encounter, turn, intel)
    trust = Math.max(0, trust + result.trust)
    tension = Math.max(0, tension + result.tension)
    intel += result.intel
    if (tension >= encounter.tensionLimit) return null
    if (trust >= encounter.target) return { cards: plays.slice(0, turn + 1), trust, tension }
  }

  return null
}

function findWinningRoute(encounterIndex: number, library: string[]): Route | null {
  const turns = encounters[encounterIndex].signals.length

  function search(prefix: string[], remaining: string[]): Route | null {
    if (prefix.length > 0) {
      const result = playRoute(encounterIndex, prefix)
      if (result) return result
    }
    if (prefix.length === turns) return null

    for (let index = 0; index < remaining.length; index += 1) {
      const result = search(
        [...prefix, remaining[index]],
        [...remaining.slice(0, index), ...remaining.slice(index + 1)],
      )
      if (result) return result
    }
    return null
  }

  return search([], library)
}

describe('campaign progression balance', () => {
  it('starts with six unique protocols in a viable draw order', () => {
    expect(startingDeck).toHaveLength(6)
    expect(new Set(startingDeck).size).toBe(6)
    expect(playRoute(0, ['mirror', 'disclose', 'offering', 'listen'])).toMatchObject({ trust: 12, tension: 5 })
  })

  it('punishes reckless tension before the first accord', () => {
    expect(playRoute(0, ['disclose', 'offering', 'mirror', 'listen'])).toBeNull()
  })

  it('requires a first-contact reward to satisfy Tal', () => {
    expect(findWinningRoute(1, startingDeck)).toBeNull()
    for (const reward of firstRewards) {
      expect(findWinningRoute(1, [...startingDeck, reward]), reward).not.toBeNull()
    }
  })

  it('requires a Tal reward to satisfy the Confluence', () => {
    for (const firstReward of firstRewards) {
      expect(findWinningRoute(2, [...startingDeck, firstReward]), firstReward).toBeNull()
    }
  })

  it('keeps every pair of reward choices viable for the finale', () => {
    for (const firstReward of firstRewards) {
      for (const secondReward of secondRewards) {
        const route = findWinningRoute(2, [...startingDeck, firstReward, secondReward])
        expect(route, `${firstReward} + ${secondReward}`).not.toBeNull()
      }
    }
  })

  it('adds visible signal pressure to card tension', () => {
    expect(resolveCard('verify', encounters[1], 0)).toMatchObject({ trust: 4, tension: 1, matched: true })
    expect(resolveCard('pause', encounters[2], 3)).toMatchObject({ trust: 3, tension: -1, matched: true })
  })

  it('turns gathered insight into a stronger calibrated offering', () => {
    expect(resolveCard('offering', encounters[1], 2, 1)).toMatchObject({ trust: 3, tension: 3 })
    expect(resolveCard('offering', encounters[1], 2, 2)).toMatchObject({ trust: 5, tension: 2, matched: true })
  })
})
