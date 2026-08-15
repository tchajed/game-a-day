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
  const expected = current.text[charIndex] ?? ''
  const displayedKey = state.mistypedKey ?? expected
  const currentBlots = state.blots.filter((blot) => blot.memoId === current.id)
  const mistakeIndexes = new Set(currentBlots.map((blot) => blot.index))
  const finalReveal = state.phase === 'ending' || state.phase === 'complete'
  const tokens = Array.from(current.text.matchAll(/\S+|\s+/g))

  return (
    <section className={`memo-card ${state.mistypedKey !== null ? 'has-current-error' : ''}`} data-testid="memo" aria-live="polite">
      <div className="memo-letterhead" aria-label="Blackwing Holdings">
        <svg className="letterhead-mark" viewBox="0 0 52 42" aria-hidden="true">
          <path d="M5 31 21 7l4 13L40 4l-7 19 14-6-18 20-6-10-8 9 2-12Z" />
          <path className="letterhead-eye" d="m27 19 4-2-2 4Z" />
        </svg>
        <span><strong>BLACKWING</strong><small>HOLDINGS</small></span>
      </div>
      <div className="memo-rule" />
      <p className="memo-text">
        {tokens.map((match) => {
          const token = match[0]
          const start = match.index
          const isWhitespace = /^\s+$/.test(token)
          return (
            <span className={isWhitespace ? 'memo-space' : 'memo-word'} key={start}>
              {Array.from(token).map((character, offset) => {
                const index = start + offset
                const isExpected = index === charIndex && expected !== ''
                const className = isExpected
                  ? `memo-char expected ${state.mistypedKey !== null ? 'mistyped-char' : ''}`
                  : `memo-char ${index < charIndex ? 'typed' : 'untyped'} ${mistakeIndexes.has(index) ? 'mistake-location' : ''}`
                const content = isExpected
                  ? finalReveal && current.id === 'final' ? '.' : displayedKey
                  : character
                return (
                  <span
                    className={className}
                    data-testid={isExpected ? 'expected-char' : undefined}
                    key={isExpected ? `${index}-${state.errorPulse}` : index}
                  >
                    {content}
                  </span>
                )
              })}
            </span>
          )
        })}
      </p>
      {current.kind === 'practice' && <span className="training-stamp">SUPPLEMENTAL REVIEW</span>}
      <div className="blot-layer" aria-hidden="true">
        {currentBlots.map((blot, index) => <BlotMark key={`${blot.index}-${index}`} blot={blot} textLength={current.text.length} />)}
      </div>
    </section>
  )
}
