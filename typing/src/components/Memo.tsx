import type { Blot, GameState } from '../game/engine'

function BlotMark({ blot, textLength }: { blot: Blot; textLength: number }) {
  const position = Math.max(2, Math.min(96, (blot.index / textLength) * 100))
  return (
    <i
      className="ink-blot"
      style={{
        left: `${position}%`,
        width: blot.size,
        height: blot.size * 0.7,
        transform: `translate(${blot.offset}px, -50%) rotate(${blot.rotation}deg)`,
      }}
    />
  )
}

export function Memo({ state }: { state: GameState }) {
  const { current, charIndex } = state
  const complete = current.text.slice(0, charIndex)
  const expected = current.text[charIndex] ?? ''
  const remaining = current.text.slice(charIndex + 1)
  const currentBlots = state.blots.filter((blot) => blot.memoId === current.id)
  const finalReveal = state.phase === 'ending' || state.phase === 'complete'

  return (
    <section className={`memo-card ${state.errorPulse ? 'has-history' : ''}`} data-testid="memo" aria-live="polite">
      <div className="memo-header">
        <span>BLACKWING HOLDINGS</span>
        <span>INTERNAL / {current.id.toUpperCase()}</span>
      </div>
      <div className="memo-rule" />
      <p className="memo-text">
        <span className="typed">{complete}</span>
        {expected && (
          <span key={`${state.errorPulse}-${charIndex}`} className="expected" data-testid="expected-char">
            {finalReveal && current.id === 'final' ? '.' : expected === ' ' ? '\u00a0' : expected}
          </span>
        )}
        <span className="untyped">{remaining}</span>
      </p>
      {current.kind === 'practice' && <span className="training-stamp">SUPPLEMENTAL REVIEW</span>}
      <div className="signature-line">Dictated on behalf of Upper Management</div>
      <div className="blot-layer" aria-hidden="true">
        {currentBlots.map((blot, index) => <BlotMark key={`${blot.index}-${index}`} blot={blot} textLength={current.text.length} />)}
      </div>
    </section>
  )
}
