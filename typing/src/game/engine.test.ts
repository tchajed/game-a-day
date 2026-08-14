import { describe, expect, it } from 'vitest'
import { AUTHORED_MEMOS, WORD_COUNT } from './content'
import { createGameState, gameReducer } from './engine'

describe('typing engine', () => {
  it('ships more than 400 authored words', () => {
    expect(WORD_COUNT).toBeGreaterThanOrEqual(400)
  })

  it('advances only on the expected key', () => {
    const initial = createGameState()
    const wrong = gameReducer(initial, { type: 'key', key: 'x', now: 100 })
    expect(wrong.charIndex).toBe(0)
    expect(wrong.mistakes).toBe(1)
    expect(wrong.attempts).toBe(1)

    const correct = gameReducer(wrong, { type: 'key', key: initial.current.text[0]!, now: 200 })
    expect(correct.charIndex).toBe(1)
    expect(correct.correct).toBe(1)
  })

  it('records weaknesses and increases scrutiny after mistakes', () => {
    let state = createGameState()
    for (let index = 0; index < 5; index += 1) state = gameReducer(state, { type: 'force-mistake', now: index })
    expect(Object.keys(state.weaknesses).length).toBeGreaterThan(0)
    expect(state.scrutiny).toBe(3)
    expect(state.blots).toHaveLength(5)
  })

  it('inserts no more than one practice memo after three authored memos', () => {
    let state = createGameState()
    state = gameReducer(state, { type: 'force-mistake', now: 0 })
    for (let index = 0; index < 3; index += 1) {
      state = gameReducer(state, { type: 'finish-sentence', now: index + 1 })
      state = gameReducer(state, { type: 'next' })
    }
    expect(state.current.kind).toBe('practice')
    state = gameReducer(state, { type: 'finish-sentence', now: 5 })
    state = gameReducer(state, { type: 'next' })
    expect(state.current.kind).toBe('authored')
    expect(state.authoredIndex).toBe(3)
  })

  it('can reach every stage with debug skips', () => {
    let state = createGameState()
    for (let stage = 1; stage <= 5; stage += 1) {
      state = gameReducer(state, { type: 'skip-stage' })
      expect(state.current.stage).toBe(stage)
    }
  })

  it('reserves the final period for the raven', () => {
    const finalIndex = AUTHORED_MEMOS.findIndex((memo) => memo.id === 'final')
    let state = {
      ...createGameState(),
      current: AUTHORED_MEMOS[finalIndex]!,
      authoredIndex: finalIndex,
      charIndex: AUTHORED_MEMOS[finalIndex]!.text.length - 2,
    }
    const expected = state.current.text[state.charIndex]!
    state = gameReducer(state, { type: 'key', key: expected, now: 100 })
    expect(state.phase).toBe('ending')
    expect(state.current.text[state.charIndex]).toBe('.')
  })
})
