import { AUTHORED_MEMOS, PRACTICE_MEMOS, type Memo } from './content'

export type GamePhase = 'playing' | 'transition' | 'ending' | 'complete'

export type Blot = {
  memoId: string
  index: number
  offset: number
  size: number
  rotation: number
}

export type GameState = {
  phase: GamePhase
  current: Memo
  authoredIndex: number
  charIndex: number
  correct: number
  attempts: number
  mistakes: number
  currentMistakes: number
  mistypedKey: string | null
  streak: number
  bestStreak: number
  scrutiny: number
  enactedStage: number
  startedAt: number | null
  finishedAt: number | null
  weaknesses: Record<string, number>
  pendingPractice: Memo | null
  authoredSincePractice: number
  blots: Blot[]
  errorPulse: number
  completionPulse: number
}

export type GameAction =
  | { type: 'key'; key: string; now?: number }
  | { type: 'next' }
  | { type: 'finish-sentence'; now?: number }
  | { type: 'force-mistake'; now?: number }
  | { type: 'skip-stage' }
  | { type: 'set-scrutiny'; value: number }
  | { type: 'trigger-ending'; now?: number }
  | { type: 'complete-ending'; now?: number }
  | { type: 'restart' }

export function createGameState(): GameState {
  return {
    phase: 'playing',
    current: AUTHORED_MEMOS[0]!,
    authoredIndex: 0,
    charIndex: 0,
    correct: 0,
    attempts: 0,
    mistakes: 0,
    currentMistakes: 0,
    mistypedKey: null,
    streak: 0,
    bestStreak: 0,
    scrutiny: 0,
    enactedStage: 0,
    startedAt: null,
    finishedAt: null,
    weaknesses: {},
    pendingPractice: null,
    authoredSincePractice: 0,
    blots: [],
    errorPulse: 0,
    completionPulse: 0,
  }
}

const PATTERNS = ['tion', 'ing', 'th', 'er', 'ou', 'ch', 'ea', 'st']

function weaknessKeys(text: string, index: number): string[] {
  const expected = text[index]?.toLowerCase() ?? ''
  const context = text.slice(Math.max(0, index - 3), index + 4).toLowerCase()
  const keys = [`char:${expected}`]
  if (/[^a-z0-9 ]/i.test(expected)) keys.push('punctuation')
  if (index > 0 && expected === text[index - 1]?.toLowerCase()) keys.push('double')
  for (const pattern of PATTERNS) {
    if (context.includes(pattern)) keys.push(pattern)
  }
  return keys
}

function addWeaknesses(weights: Record<string, number>, keys: string[]) {
  const next = { ...weights }
  for (const key of keys) next[key] = (next[key] ?? 0) + (key.startsWith('char:') ? 1 : 3)
  return next
}

function practiceScore(text: string, weaknesses: Record<string, number>) {
  const lower = text.toLowerCase()
  let score = 0
  for (const [key, weight] of Object.entries(weaknesses)) {
    if (key.startsWith('char:')) {
      const char = key.slice(5)
      score += (lower.split(char).length - 1) * weight * 0.25
    } else if (lower.includes(key) || key === 'punctuation' || key === 'double') {
      score += weight
    }
  }
  return score
}

export function choosePractice(state: GameState): Memo | null {
  if (!Object.keys(state.weaknesses).length) return null
  const candidates = Object.entries(PRACTICE_MEMOS).flatMap(([pattern, lines]) =>
    lines.map((text, index) => ({ pattern, text, index })),
  )
  candidates.sort((a, b) => {
    const difference = practiceScore(b.text, state.weaknesses) - practiceScore(a.text, state.weaknesses)
    return difference || a.text.localeCompare(b.text)
  })
  const winner = candidates[0]
  if (!winner || practiceScore(winner.text, state.weaknesses) <= 0) return null
  return {
    id: `practice-${state.authoredIndex}-${winner.pattern}-${winner.index}`,
    stage: state.current.stage,
    text: winner.text,
    kind: 'practice',
  }
}

function completeSentence(state: GameState): GameState {
  const authoredSincePractice = state.current.kind === 'practice' ? 0 : state.authoredSincePractice + 1
  const enactedStage = state.current.effect
    ? Math.max(state.enactedStage, state.current.stage + 1)
    : state.enactedStage
  const accurate = state.currentMistakes === 0
  let next = {
    ...state,
    phase: 'transition' as const,
    charIndex: state.current.text.length,
    enactedStage,
    authoredSincePractice,
    completionPulse: state.completionPulse + (accurate ? 1 : 0),
  }
  if (state.current.kind !== 'practice' && authoredSincePractice >= 3 && state.authoredIndex < AUTHORED_MEMOS.length - 2) {
    next = { ...next, pendingPractice: choosePractice(next) }
  }
  return next
}

function registerMistake(state: GameState, key: string, now: number): GameState {
  const expected = state.current.text[state.charIndex] ?? ''
  const mistakeNumber = state.mistakes + 1
  return {
    ...state,
    startedAt: state.startedAt ?? now,
    mistypedKey: key,
    attempts: state.attempts + 1,
    mistakes: mistakeNumber,
    currentMistakes: state.currentMistakes + 1,
    streak: 0,
    scrutiny: Math.min(7, Math.max(state.scrutiny, Math.ceil(mistakeNumber / 2))),
    weaknesses: addWeaknesses(state.weaknesses, weaknessKeys(state.current.text, state.charIndex)),
    blots: [
      ...state.blots,
      {
        memoId: state.current.id,
        index: state.charIndex,
        offset: ((mistakeNumber * 17) % 13) - 6,
        size: 4 + ((mistakeNumber * 7) % 6),
        rotation: (mistakeNumber * 47) % 180,
      },
    ],
    errorPulse: state.errorPulse + 1,
  }
}

function typeKey(state: GameState, key: string, now: number): GameState {
  if (state.phase !== 'playing') return state
  if (state.mistypedKey !== null) {
    return key === 'Backspace' ? { ...state, mistypedKey: null } : state
  }
  if (key.length !== 1) return state
  const expected = state.current.text[state.charIndex]
  if (!expected) return state
  if (key !== expected) return registerMistake(state, key, now)

  const nextIndex = state.charIndex + 1
  const streak = state.streak + 1
  const progressed = {
    ...state,
    startedAt: state.startedAt ?? now,
    attempts: state.attempts + 1,
    correct: state.correct + 1,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    charIndex: nextIndex,
  }

  const isFinal = state.current.id === 'final'
  if (isFinal && state.current.text[nextIndex] === '.') {
    return { ...progressed, phase: 'ending', enactedStage: 6 }
  }
  if (nextIndex >= state.current.text.length) return completeSentence(progressed)
  return progressed
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const now = 'now' in action && action.now !== undefined ? action.now : Date.now()
  switch (action.type) {
    case 'key':
      return typeKey(state, action.key, now)
    case 'force-mistake':
      return state.phase === 'playing' ? registerMistake(state, '×', now) : state
    case 'finish-sentence':
      if (state.current.id === 'final') return { ...state, phase: 'ending', enactedStage: 6, startedAt: state.startedAt ?? now }
      return state.phase === 'playing' ? completeSentence(state) : state
    case 'next': {
      if (state.phase !== 'transition') return state
      if (state.pendingPractice) {
        return {
          ...state,
          phase: 'playing',
          current: state.pendingPractice,
          charIndex: 0,
          currentMistakes: 0,
          mistypedKey: null,
          pendingPractice: null,
        }
      }
      const nextIndex = state.current.kind === 'practice' ? state.authoredIndex + 1 : state.authoredIndex + 1
      const nextMemo = AUTHORED_MEMOS[nextIndex]
      if (!nextMemo) return { ...state, phase: 'complete', finishedAt: now }
      return {
        ...state,
        phase: 'playing',
        current: nextMemo,
        authoredIndex: nextIndex,
        charIndex: 0,
        currentMistakes: 0,
        mistypedKey: null,
        authoredSincePractice: state.current.kind === 'practice' ? 0 : state.authoredSincePractice,
      }
    }
    case 'skip-stage': {
      const targetStage = Math.min(5, state.current.stage + 1)
      const targetIndex = AUTHORED_MEMOS.findIndex((memo) => memo.stage === targetStage)
      if (targetIndex < 0 || targetIndex === state.authoredIndex) return { ...state, phase: 'ending', enactedStage: 6 }
      return {
        ...state,
        phase: 'playing',
        current: AUTHORED_MEMOS[targetIndex]!,
        authoredIndex: targetIndex,
        charIndex: 0,
        currentMistakes: 0,
        mistypedKey: null,
        pendingPractice: null,
        enactedStage: Math.max(state.enactedStage, targetStage),
      }
    }
    case 'set-scrutiny':
      return { ...state, scrutiny: Math.max(0, Math.min(7, action.value)) }
    case 'trigger-ending':
      return { ...state, phase: 'ending', enactedStage: 6, startedAt: state.startedAt ?? now }
    case 'complete-ending':
      return { ...state, phase: 'complete', finishedAt: now }
    case 'restart':
      return createGameState()
  }
}

export function accuracy(state: GameState) {
  return state.attempts ? (state.correct / state.attempts) * 100 : 100
}

export function wpm(state: GameState, now = Date.now()) {
  if (!state.startedAt) return 0
  const end = state.finishedAt ?? now
  const minutes = Math.max((end - state.startedAt) / 60_000, 1 / 60)
  return state.correct / 5 / minutes
}
