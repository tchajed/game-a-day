import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { DebugPanel } from './components/DebugPanel'
import { Scene } from './components/Scene'
import { AUTHORED_MEMOS, STAGE_NAMES } from './game/content'
import { OfficeAudio } from './game/audio'
import { accuracy, createGameState, gameReducer, type GameState, wpm } from './game/engine'

declare global {
  interface Window {
    __UPPER_MANAGEMENT__?: {
      getState: () => GameState
      typeExpected: () => void
      makeMistake: () => void
      finishSentence: () => void
      skipStage: () => void
      setScrutiny: (value: number) => void
      triggerEnding: () => void
    }
  }
}

const params = new URLSearchParams(window.location.search)
const DEBUG = params.get('debug') === 'true'
const AUDIO_DEFAULT = params.get('music') !== 'off'

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createGameState)
  const stateRef = useRef(state)
  const [now, setNow] = useState(Date.now())
  const [audioEnabled, setAudioEnabled] = useState(AUDIO_DEFAULT)
  const audio = useMemo(() => new OfficeAudio(AUDIO_DEFAULT), [])
  stateRef.current = state

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return
      const current = stateRef.current
      if (current.phase !== 'playing') return
      event.preventDefault()
      const correct = event.key === current.current.text[current.charIndex]
      audio.key(correct)
      dispatch({ type: 'key', key: event.key })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [audio])

  useEffect(() => {
    if (state.phase !== 'transition') return
    audio.tap()
    const timeout = window.setTimeout(() => dispatch({ type: 'next' }), 280)
    return () => window.clearTimeout(timeout)
  }, [state.phase, state.current.id, audio])

  useEffect(() => {
    if (state.phase !== 'ending') return
    audio.tap()
    const timeout = window.setTimeout(() => dispatch({ type: 'complete-ending' }), 5200)
    return () => window.clearTimeout(timeout)
  }, [state.phase, audio])

  useEffect(() => {
    if (!DEBUG) return
    window.__UPPER_MANAGEMENT__ = {
      getState: () => stateRef.current,
      typeExpected: () => {
        const current = stateRef.current
        const key = current.current.text[current.charIndex]
        if (key) dispatch({ type: 'key', key })
      },
      makeMistake: () => dispatch({ type: 'force-mistake' }),
      finishSentence: () => dispatch({ type: 'finish-sentence' }),
      skipStage: () => dispatch({ type: 'skip-stage' }),
      setScrutiny: (value) => dispatch({ type: 'set-scrutiny', value }),
      triggerEnding: () => dispatch({ type: 'trigger-ending' }),
    }
    return () => { delete window.__UPPER_MANAGEMENT__ }
  }, [])

  const elapsed = state.startedAt ? (state.finishedAt ?? now) - state.startedAt : 0
  const accuracyValue = accuracy(state)
  const titleStage = Math.min(5, state.current.stage)
  const memoFraction = state.current.kind === 'practice'
    ? state.authoredIndex / AUTHORED_MEMOS.length
    : (state.authoredIndex + state.charIndex / state.current.text.length) / AUTHORED_MEMOS.length
  const progress = Math.min(100, memoFraction * 100)

  const toggleAudio = () => {
    const next = !audioEnabled
    setAudioEnabled(next)
    audio.setEnabled(next)
    if (next && state.startedAt) audio.startAmbience()
  }

  return (
    <main className="app-shell">
      <Scene state={state} />
      <header className="hud">
        <div className="brand-block">
          <h1>UPPER MANAGEMENT</h1>
        </div>
        <div className="metrics" aria-label="Typing metrics">
          <div className="metric"><b aria-hidden="true">◎</b><span><small>ACCURACY</small><strong>{accuracyValue.toFixed(1)}%</strong></span></div>
          <div className="metric"><b aria-hidden="true">↟</b><span><small>STREAK</small><strong>{state.streak}</strong></span></div>
          <div className="metric"><b aria-hidden="true">⌨</b><span><small>WPM</small><strong>{Math.round(wpm(state, now))}</strong></span></div>
          <div className="metric"><b aria-hidden="true">◷</b><span><small>TIME</small><strong data-testid="timer">{formatTime(elapsed)}</strong></span></div>
          <button className="audio-toggle" onClick={toggleAudio} aria-label={`${audioEnabled ? 'Mute' : 'Enable'} office ambience`}>
            <b aria-hidden="true">◖</b><span>{audioEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
          </button>
        </div>
      </header>
      <aside className="stage-label">
        <span>MEMO {String(state.authoredIndex + 1).padStart(2, '0')} / {String(AUTHORED_MEMOS.length).padStart(2, '0')}</span>
        <strong>{STAGE_NAMES[titleStage]}</strong>
        <div className="stage-pips" aria-label={`Section ${titleStage + 1} of 6`}>
          {STAGE_NAMES.map((name, index) => <i key={name} className={index <= titleStage ? 'active' : ''} />)}
        </div>
      </aside>
      <div className="shift-progress" aria-label={`${Math.round(progress)}% of dictation complete`}>
        <i style={{ width: `${progress}%` }} />
      </div>
      {state.currentMistakes > 0 && state.phase === 'playing' && (
        <div className="game-feedback error-feedback" key={`error-${state.errorPulse}`}>
          PATTERN LOGGED // REVIEW SCHEDULED
        </div>
      )}
      {state.phase === 'transition' && (
        <div className="game-feedback success-feedback" key={`success-${state.completionPulse}`}>
          MEMO ACCEPTED {state.currentMistakes === 0 ? `// CLEAN STREAK ${state.streak}` : ''}
        </div>
      )}
      {!state.startedAt && state.phase === 'playing' && (
        <div className="start-prompt"><b aria-hidden="true">⌨</b><span>TYPE TO BEGIN</span><i /></div>
      )}
      {state.phase === 'ending' && (
        <div className="ending-copy" data-testid="ending">
          <span>PROMOTION PROCESSED</span>
          <strong>WELCOME TO UPPER MANAGEMENT</strong>
        </div>
      )}
      {state.phase === 'complete' && (
        <div className="completion-card" data-testid="ending">
          <span>SHIFT COMPLETE</span>
          <h2>Your position has been filled.</h2>
          <p>{accuracyValue.toFixed(1)}% accurate · {state.mistakes} irregularities observed</p>
          <button onClick={() => dispatch({ type: 'restart' })}>BEGIN ANOTHER SHIFT</button>
        </div>
      )}
      {DEBUG && (
        <DebugPanel
          state={state}
          onFinish={() => dispatch({ type: 'finish-sentence' })}
          onMistake={() => dispatch({ type: 'force-mistake' })}
          onSkip={() => dispatch({ type: 'skip-stage' })}
          onScrutiny={(value) => dispatch({ type: 'set-scrutiny', value })}
          onEnding={() => dispatch({ type: 'trigger-ending' })}
        />
      )}
    </main>
  )
}
