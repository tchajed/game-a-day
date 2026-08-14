import type { GameState } from '../game/engine'

type Props = {
  state: GameState
  onFinish: () => void
  onMistake: () => void
  onSkip: () => void
  onScrutiny: (value: number) => void
  onEnding: () => void
}

export function DebugPanel({ state, onFinish, onMistake, onSkip, onScrutiny, onEnding }: Props) {
  return (
    <details className="debug-panel">
      <summary>DEBUG / {state.current.id}</summary>
      <div className="debug-actions">
        <button onClick={onFinish}>Finish sentence</button>
        <button onClick={onMistake}>Force mistake</button>
        <button onClick={onSkip}>Next stage</button>
        <button onClick={() => onScrutiny(state.scrutiny >= 7 ? 0 : state.scrutiny + 1)}>Scrutiny +</button>
        <button onClick={onEnding}>Ending</button>
      </div>
      <output>{JSON.stringify({
        phase: state.phase,
        stage: state.enactedStage,
        memo: state.current.id,
        char: state.charIndex,
        accuracy: state.attempts ? Math.round(state.correct / state.attempts * 1000) / 10 : 100,
        scrutiny: state.scrutiny,
        weaknesses: state.weaknesses,
      }, null, 2)}</output>
    </details>
  )
}
