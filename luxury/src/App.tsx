import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  Crown,
  Gem,
  Hammer,
  Layers3,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  applyDecisionPhase,
  CRISES,
  DECISION_ROUNDS,
  deltaLabel,
  evaluate,
  INITIAL_METRICS,
  type Decision,
  type Metrics,
} from './game'
import { playStamp, startMusic, stopMusic, updateMusic } from './audio'

const params = new URLSearchParams(window.location.search)
const DEBUG = params.get('debug') === 'true'
const MUSIC_OFF = params.get('music') === 'off'

type Stage = 'intro' | 'decision' | 'outcome' | 'end'
type PendingSelections = Record<number, number>
type Resolution = Decision & { timedOut: boolean }
type Aftershock = { quarter: string; text: string; delta: string }

const metricMeta = {
  aura: { label: 'Aura', icon: Gem },
  craft: { label: 'Craft', icon: Hammer },
  cash: { label: 'Reserve', icon: Banknote },
} as const

function Crest() {
  return (
    <div className="crest" aria-label="Maison Morrow crest">
      <span className="crest-m">M</span>
      <span className="crest-rule" />
      <span className="crest-year">1949</span>
    </div>
  )
}

function Metric({ name, value }: { name: keyof typeof metricMeta; value: number }) {
  const meta = metricMeta[name]
  const Icon = meta.icon
  const danger = value < (name === 'cash' ? 10 : 45)
  return (
    <div
      className={`metric ${danger ? 'metric-danger' : ''}`}
      data-metric={name}
      data-value={value}
      role="group"
      aria-label={`${meta.label}: ${name === 'cash' ? `${value} million dollars` : value}`}
    >
      <div className="metric-heading" aria-hidden="true"><Icon size={18} strokeWidth={1.5} /><span>{meta.label}</span></div>
      <div className="metric-value" aria-hidden="true">{name === 'cash' ? `$${value}m` : value}</div>
      <div className="metric-track" aria-hidden="true"><span style={{ width: `${name === 'cash' ? Math.min(100, value * 1.7) : value}%` }} /></div>
    </div>
  )
}

function App() {
  const [stage, setStage] = useState<Stage>('intro')
  const [roundIndex, setRoundIndex] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>({ ...INITIAL_METRICS })
  const [pending, setPending] = useState<PendingSelections>({})
  const pendingRef = useRef<PendingSelections>({})
  const resolvingRef = useRef(false)
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [aftershocks, setAftershocks] = useState<Aftershock[]>([])
  const [luxuryScore, setLuxuryScore] = useState(0)
  const [musicOn, setMusicOn] = useState(!MUSIC_OFF)
  const [history, setHistory] = useState<number[]>([])

  const round = DECISION_ROUNDS[roundIndex]
  const roundCrises = round.crisisIndices.map(crisisIndex => ({ crisisIndex, crisis: CRISES[crisisIndex] }))
  const isParallel = round.crisisIndices.length > 1
  const result = stage === 'end' ? evaluate(metrics, luxuryScore) : null
  const markedCount = round.crisisIndices.filter(crisisIndex => pending[crisisIndex] !== undefined).length
  const allMarked = markedCount === round.crisisIndices.length

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(() => {
    const latestBrief = round.crisisIndices[round.crisisIndices.length - 1]
    updateMusic(latestBrief, (metrics.aura + metrics.craft) / 200)
  }, [metrics.aura, metrics.craft, round.crisisIndices])

  const resolveRound = useCallback((submitted: PendingSelections, timedOut = false) => {
    if (stage !== 'decision' || resolvingRef.current) return
    resolvingRef.current = true

    const nextResolutions = DECISION_ROUNDS[roundIndex].crisisIndices.map(crisisIndex => {
      const selected = submitted[crisisIndex]
      return {
        crisisIndex,
        choiceIndex: selected ?? CRISES[crisisIndex].timeoutChoice,
        timedOut: timedOut && selected === undefined,
      }
    })
    const decisions = nextResolutions.map(({ crisisIndex, choiceIndex }) => ({ crisisIndex, choiceIndex }))

    setMetrics(current => applyDecisionPhase(current, decisions, 'now'))
    setLuxuryScore(score => score + decisions.reduce((total, { crisisIndex, choiceIndex }) => (
      total + CRISES[crisisIndex].choices[choiceIndex].luxury
    ), 0))
    setHistory(current => [...current, ...nextResolutions.map(item => item.choiceIndex)])
    setResolutions(nextResolutions)
    setStage('outcome')
    playStamp(nextResolutions.every(({ crisisIndex, choiceIndex }) => CRISES[crisisIndex].choices[choiceIndex].luxury >= 1))
  }, [roundIndex, stage])

  useEffect(() => {
    if (stage !== 'decision') return
    if (round.seconds === null) {
      setRemaining(null)
      return
    }

    const durationSeconds = DEBUG ? round.seconds * 4 : round.seconds
    setRemaining(durationSeconds)
    const end = Date.now() + durationSeconds * 1000
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds <= 0) {
        window.clearInterval(interval)
        resolveRound(pendingRef.current, true)
      }
    }, 200)
    return () => window.clearInterval(interval)
  }, [resolveRound, round.seconds, stage])

  function selectChoice(crisisIndex: number, choiceIndex: number) {
    if (stage !== 'decision' || !round.crisisIndices.includes(crisisIndex)) return
    setPending(current => ({ ...current, [crisisIndex]: choiceIndex }))
  }

  const playRound = useCallback((choiceIndices: number[]) => {
    if (choiceIndices.length !== DECISION_ROUNDS[roundIndex].crisisIndices.length) return
    const submitted = Object.fromEntries(
      DECISION_ROUNDS[roundIndex].crisisIndices.map((crisisIndex, index) => [crisisIndex, choiceIndices[index]]),
    )
    setPending(submitted)
    pendingRef.current = submitted
    resolveRound(submitted)
  }, [resolveRound, roundIndex])

  useEffect(() => {
    const api = {
      resolve: playRound,
      skip: () => resolveRound({}, true),
      getState: () => ({ stage, roundIndex, crisisIndices: [...round.crisisIndices], metrics, history, pending, remaining }),
    }
    ;(window as Window & { __MORROW__?: typeof api }).__MORROW__ = api
  }, [history, metrics, pending, playRound, remaining, resolveRound, round.crisisIndices, roundIndex, stage])

  function begin() {
    resolvingRef.current = false
    setStage('decision')
    if (musicOn) void startMusic()
  }

  function sealDecisions() {
    if (!allMarked) return
    resolveRound(pending)
  }

  function advance() {
    if (resolutions.length === 0) return
    const decisions = resolutions.map(({ crisisIndex, choiceIndex }) => ({ crisisIndex, choiceIndex }))
    const settled = applyDecisionPhase(metrics, decisions, 'later')
    setMetrics(settled)
    setAftershocks(resolutions.map(({ crisisIndex, choiceIndex }) => {
      const crisis = CRISES[crisisIndex]
      const choice = crisis.choices[choiceIndex]
      return { quarter: crisis.quarter, text: choice.consequence, delta: deltaLabel(choice.later) }
    }))
    setResolutions([])
    setPending({})
    pendingRef.current = {}
    resolvingRef.current = false

    if (roundIndex === DECISION_ROUNDS.length - 1 || settled.cash < 0) {
      setStage('end')
      return
    }
    setRoundIndex(current => current + 1)
    setStage('decision')
  }

  function toggleMusic() {
    if (musicOn) {
      stopMusic()
      setMusicOn(false)
    } else {
      setMusicOn(true)
      void startMusic()
    }
  }

  function restart() {
    stopMusic()
    setStage('intro')
    setRoundIndex(0)
    setMetrics({ ...INITIAL_METRICS })
    setPending({})
    pendingRef.current = {}
    resolvingRef.current = false
    setResolutions([])
    setRemaining(null)
    setAftershocks([])
    setLuxuryScore(0)
    setHistory([])
    if (!MUSIC_OFF) setMusicOn(true)
  }

  const timerClass = remaining !== null && remaining <= 7 ? 'timer urgent' : 'timer'
  const firstBrief = round.crisisIndices[0] + 1
  const lastBrief = round.crisisIndices[round.crisisIndices.length - 1] + 1
  const briefProgress = firstBrief === lastBrief ? `${firstBrief} / 8` : `${firstBrief}—${lastBrief} / 8`

  return (
    <main className={`game-shell stage-${stage} ${isParallel ? 'parallel-session' : 'solo-session'}`}>
      <header className="topbar">
        <div className="brand-lockup"><Crest /><div><span className="eyebrow">Maison Morrow</span><strong>Objects for the private hour</strong></div></div>
        <div className="tenure"><span>Brief</span><b>{briefProgress}</b></div>
        <button className="icon-button" onClick={toggleMusic} aria-label={musicOn ? 'Mute music' : 'Play music'}>
          {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      <section className="metrics-strip" aria-label="Company metrics">
        <Metric name="aura" value={metrics.aura} />
        <Metric name="craft" value={metrics.craft} />
        <Metric name="cash" value={metrics.cash} />
      </section>

      <div className="board-layout">
        <section className="decision-area">
          {aftershocks.length > 0 && stage === 'decision' && (
            <div className="aftershock" role="status">
              <Sparkles size={16} />
              <div className="aftershock-list">
                {aftershocks.map(item => <span key={item.quarter}>{item.text}</span>)}
              </div>
              <strong>{aftershocks.map(item => item.delta || 'No ledger movement').join(' · ')}</strong>
            </div>
          )}

          {(stage === 'decision' || stage === 'outcome' || stage === 'intro') && (
            <>
              <div className="round-console">
                <div>
                  <span>SESSION {roundIndex + 1} / {DECISION_ROUNDS.length}</span>
                  <b><Layers3 size={14} />{round.label}</b>
                </div>
                {stage === 'decision' && (
                  <div className={timerClass} role="timer" aria-live="off" aria-label={remaining === null ? 'Untimed decision' : `${remaining} seconds remaining`}>
                    <Clock3 size={18} aria-hidden="true" /><b>{remaining === null ? 'UNTIMED' : remaining}</b>
                  </div>
                )}
              </div>

              <div className={`crisis-deck ${isParallel ? 'parallel-deck' : 'solo-deck'}`}>
                {roundCrises.map(({ crisisIndex, crisis }) => {
                  const resolution = resolutions.find(item => item.crisisIndex === crisisIndex)
                  const selectedIndex = stage === 'outcome' ? resolution?.choiceIndex : pending[crisisIndex]
                  const selectedChoice = selectedIndex === undefined ? null : crisis.choices[selectedIndex]

                  return (
                    <article className="crisis-card" key={crisis.quarter}>
                      <div className="crisis-topline"><span>{crisis.quarter}</span></div>
                      <div className="source">{crisis.source}</div>
                      <h1>{crisis.headline}</h1>
                      <p className="brief">{crisis.brief}</p>

                      {stage !== 'outcome' && (
                        <div className="choices" aria-label={`Choices for ${crisis.headline}`}>
                          {crisis.choices.map((choice, choiceIndex) => {
                            const selected = selectedIndex === choiceIndex
                            return (
                              <button
                                className={`choice ${selected ? 'selected' : ''}`}
                                key={choice.id}
                                onClick={() => selectChoice(crisisIndex, choiceIndex)}
                                disabled={stage !== 'decision'}
                                aria-pressed={selected}
                              >
                                <span className="choice-number">0{choiceIndex + 1}</span>
                                <span><b>{choice.title}</b><small>{choice.detail}</small></span>
                                {selected ? <Check size={18} /> : <ArrowRight size={18} />}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {stage === 'outcome' && selectedChoice && (
                        <div className="outcome" role="group" aria-label={`Outcome for ${crisis.headline}`}>
                          <span className="outcome-label">{resolution?.timedOut ? 'BOARD CHOICE' : 'SEALED'}</span>
                          <p>{selectedChoice.response}</p>
                          <div className="immediate"><b>NOW</b><span>{deltaLabel(selectedChoice.now) || 'No immediate ledger movement'}</span></div>
                          <blockquote><b>ARCHIVE PRINCIPLE</b>{crisis.note}</blockquote>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>

              {stage === 'decision' && (
                <div className="decision-footer">
                  <b>{markedCount} OF {round.crisisIndices.length} SELECTED</b>
                  <button className="seal-button" onClick={sealDecisions} disabled={!allMarked}>
                    {isParallel ? 'Seal decisions' : 'Seal decision'} <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}

              {stage === 'outcome' && (
                <div className="outcome-footer">
                  <button className="advance-button" onClick={advance}>
                    {roundIndex === DECISION_ROUNDS.length - 1 ? 'Legacy ledger' : 'Next session'} <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {stage === 'intro' && (
        <div className="modal-backdrop">
          <section className="intro-modal">
            <Crest />
            <div className="intro-kicker">PARIS · 75TH YEAR · PRIVATE READING</div>
            <h1>You inherit a legend<br />the world has begun to doubt.</h1>
            <div className="strategy-reading">
              <div><b>01</b><span><strong>Never chase volume.</strong> Attention is not desire.</span></div>
              <div><b>02</b><span><strong>Protect the object.</strong> The story cannot rescue weak craft.</span></div>
              <div><b>03</b><span><strong>Access is the product.</strong> A refusal can create more value than a sale.</span></div>
            </div>
            <button onClick={begin}>Enter the atelier <ArrowRight size={18} aria-hidden="true" /></button>
          </section>
        </div>
      )}

      {stage === 'end' && (
        <div className="modal-backdrop end-backdrop">
          <section className={`end-modal result-${result}`}>
            <div className="end-seal"><Crown size={31} /></div>
            <div className="intro-kicker">THE 150TH ANNIVERSARY LEDGER</div>
            <h1>{result === 'icon' ? 'The impossible object.' : result === 'independent' ? 'The maison endures.' : result === 'insolvent' ? 'The doors close quietly.' : 'Just another lunchbox.'}</h1>
            <p>{result === 'icon'
              ? 'You made fewer objects, refused louder opportunities, and left the next custodian a legend stronger than the one you inherited.'
              : result === 'independent'
                ? 'Morrow remains independent. Its mystique is intact, though collectors will debate a few choices for decades.'
                : result === 'insolvent'
                  ? 'Taste without a reserve is only a beautiful liquidation. The final artisans leave before dawn.'
                  : 'The company grew. The category noticed. Then the public found something newer, cheaper, and almost identical.'}</p>
            <div className="final-ledger">
              <div><span>AURA</span><b>{metrics.aura}</b></div>
              <div><span>CRAFT</span><b>{metrics.craft}</b></div>
              <div><span>RESERVE</span><b>${metrics.cash}m</b></div>
              <div><span>PLAYBOOK</span><b>{luxuryScore} / 16</b></div>
            </div>
            <button onClick={restart}><RotateCcw size={16} /> Begin another tenure</button>
          </section>
        </div>
      )}

      {DEBUG && stage === 'decision' && (
        <div className="debug-tools">
          DEBUG <button onClick={() => playRound(round.crisisIndices.map(() => 0))}>Resolve with 01</button>
          <button onClick={() => resolveRound({}, true)}>Skip session</button>
        </div>
      )}
    </main>
  )
}

export default App
