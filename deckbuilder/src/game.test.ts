import { describe, expect, it } from 'vitest'
import { encounters, resolveCard, startingDeck } from './game'

function run(encounterIndex: number, plays: string[]) {
  let trust = 0
  let tension = 0
  plays.forEach((cardId, turn) => {
    const result = resolveCard(cardId, encounters[encounterIndex], turn)
    trust += result.trust
    tension = Math.max(0, tension + result.tension)
  })
  return { trust, tension }
}

describe('manual campaign balance', () => {
  it('keeps the starting deck deliberately tiny', () => {
    expect(startingDeck).toHaveLength(6)
    expect(new Set(startingDeck).size).toBe(6)
  })

  it('allows every contact to be solved with the starting deck', () => {
    const routes = [
      ['mirror', 'listen', 'disclose'],
      ['listen', 'mirror', 'verify', 'disclose', 'offering'],
      ['listen', 'verify', 'mirror', 'disclose', 'offering'],
    ]

    routes.forEach((route, index) => {
      const result = run(index, route)
      expect(result.trust).toBeGreaterThanOrEqual(encounters[index].target)
      expect(result.tension).toBeLessThan(encounters[index].tensionLimit)
    })
  })

  it('makes signal-matched cards meaningfully stronger', () => {
    expect(resolveCard('mirror', encounters[0], 0).matched).toBe(true)
    expect(resolveCard('mirror', encounters[0], 0).trust).toBe(3)
    expect(resolveCard('verify', encounters[1], 0).trust).toBe(3)
  })
})
