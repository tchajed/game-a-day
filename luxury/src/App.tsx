import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  Crown,
  Gem,
  Hammer,
  Layers3,
  LockKeyhole,
  Radio,
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
  aura: { label: 'Aura', icon: Gem, hint: 'desire without access' },
  craft: { label: 'Craft', icon: Hammer, hint: 'integrity of the object' },
  cash: { label: 'Reserve', icon: Banknote, hint: 'millions available' },
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
    <div className={`metric ${danger ? 'metric-danger' : ''}`} data-metric={name} data-value={value}>
      <div className="metric-heading"><Icon size={15} strokeWidth={1.5} /><span>{meta.label}</span></div>
      <div className="metric-value">{name === 'cash' ? `$${value}m` : value}</div>
      <div className="metric-track"><span style={{ width: `${name === 'cash' ? Math.min(100, value * 1.7) : value}%` }} /></div>
      <div className="metric-hint">{meta.hint}</div>
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

  const competitorRows = useMemo(() => {
    const q = round.crisisIndices[round.crisisIndices.length - 1] + 1
    return [
      { name: 'PackIt', model: 'units', value: `${(3.1 + q * 0.4).toFixed(1)}m`, rise: '+18%' },
      { name: 'BentoBase', model: 'units', value: `${(1.8 + q * 0.25).toFixed(1)}m`, rise: '+31%' },
      { name: 'Tomorrow®', model: 'social mentions', value: `${Math.round(42 + q * 17)}k`, rise: '+92%' },
    ]
  }, [round.crisisIndices])

  const timerClass = remaining !== null && remaining <= 7 ? 'timer urgent' : 'timer'
  const firstBrief = round.crisisIndices[0] + 1
  const lastBrief = round.crisisIndices[round.crisisIndices.length - 1] + 1
  const briefProgress = firstBrief === lastBrief ? `${firstBrief} / 8` : `${firstBrief}—${lastBrief} / 8`

  return (
    <main className={`game-shell stage-${stage} ${isParallel ? 'parallel-session' : 'solo-session'}`}>
      <header className="topbar">
        <div className="brand-lockup"><Crest /><div><span className="eyebrow">Maison Morrow</span><strong>Objects for the private hour</strong></div></div>
        <div className="tenure"><span>BRIEFS BEFORE THE CEO</span><b>{briefProgress}</b></div>
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
        <aside className="left-rail">
          <section className={`playbook panel ${stage === 'decision' ? 'playbook-sealed' : ''}`}>
            <div className="panel-title"><LockKeyhole size={14} /><span>The 1949 playbook</span></div>
            {stage === 'decision' ? (
              <div className="sealed-counsel"><LockKeyhole size={19} /><b>COUNSEL SEALED</b><span>No principles or forecasts appear during deliberation.</span></div>
            ) : (
              <><p>Never chase volume.</p><p>Protect the object.</p><p>Access is the product.</p></>
            )}
          </section>
          <section className="pressure panel">
            <div className="panel-title"><Radio size={14} /><span>Market pressure</span></div>
            <div className="pressure-number">{Math.round((metrics.reach / 100) * 9.2 + 0.8)}×</div>
            <p>more people asking than buying</p>
            <div className="noise-track"><span style={{ width: `${metrics.reach}%` }} /></div>
            <small>Noise can feel like success.</small>
          </section>
        </aside>

        <section className="decision-area">
          {aftershocks.length > 0 && stage === 'decision' && (
            <div className="aftershock" role="status">
              <Sparkles size={16} />
              <div className="aftershock-list">
                <b>THE LAST SESSION, NOW VISIBLE</b>
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
                <p>{round.instruction}</p>
                <div className={timerClass} aria-label={remaining === null ? 'Untimed decision' : `${remaining} seconds remaining`}>
                  <Clock3 size={15} /><b>{stage !== 'decision' ? 'SEALED' : remaining === null ? 'UNTIMED' : remaining}</b>
                </div>
              </div>

              <div className={`crisis-deck ${isParallel ? 'parallel-deck' : 'solo-deck'}`}>
                {roundCrises.map(({ crisisIndex, crisis }) => {
                  const resolution = resolutions.find(item => item.crisisIndex === crisisIndex)
                  const selectedIndex = stage === 'outcome' ? resolution?.choiceIndex : pending[crisisIndex]
                  const selectedChoice = selectedIndex === undefined ? null : crisis.choices[selectedIndex]

                  return (
                    <article className="crisis-card" key={crisis.quarter}>
                      <div className="crisis-topline"><span>{crisis.quarter}</span></div>
                      <div className="source">From the {crisis.source}</div>
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
                          <span className="outcome-label">{resolution?.timedOut ? 'THE BOARD COMPLETED THIS BRIEF' : 'THE SEAL IS SET'}</span>
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
                  <div>
                    <b>{markedCount} / {round.crisisIndices.length} BRIEFS MARKED</b>
                    <span>Selections may be revised. No result appears before the seal.</span>
                  </div>
                  <button className="seal-button" onClick={sealDecisions} disabled={!allMarked}>
                    {isParallel ? 'Seal both decisions' : 'Seal this decision'} <ArrowRight size={17} />
                  </button>
                </div>
              )}

              {stage === 'outcome' && (
                <div className="outcome-footer">
                  <span>Deeper consequences surface only after you leave this session.</span>
                  <button className="advance-button" onClick={advance}>
                    {roundIndex === DECISION_ROUNDS.length - 1 ? 'Open the legacy ledger' : 'Enter the next session'} <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="right-rail panel">
          <div className="panel-title"><span>Competitor dashboard</span><i>LIVE</i></div>
          <div className="morrow-row">
            <div><Crown size={15} /><b>MORROW</b><small>annual units</small></div>
            <strong>0.6k</strong>
          </div>
          {competitorRows.map(row => (
            <div className="competitor" key={row.name}>
              <div><b>{row.name}</b><small>{row.model}</small></div>
              <strong>{row.value}</strong><span>{row.rise}</span>
            </div>
          ))}
          <div className="analyst-note"><span>ANALYST NOTE</span>“Morrow continues to underperform the category in units shipped.”</div>
          <div className="ignore-stamp">IRRELEVANT?</div>
        </aside>
      </div>

      {stage === 'intro' && (
        <div className="modal-backdrop">
          <section className="intro-modal">
            <Crest />
            <div className="intro-kicker">PARIS · 75TH YEAR · PRIVATE READING</div>
            <h1>You inherit a legend<br />the world has begun to doubt.</h1>
            <p>Before anyone starts a clock, read the only strategy the maison has kept for seventy-five years.</p>
            <div className="strategy-reading">
              <div><b>01</b><span><strong>Never chase volume.</strong> Attention is not desire.</span></div>
              <div><b>02</b><span><strong>Protect the object.</strong> The story cannot rescue weak craft.</span></div>
              <div><b>03</b><span><strong>Access is the product.</strong> A refusal can create more value than a sale.</span></div>
            </div>
            <p className="tutorial-copy">Your first brief is untimed. The next is a timed solo decision. Then two briefs begin arriving at once, with a longer shared clock and no feedback until both are sealed.</p>
            <button onClick={begin}>Read the first brief — untimed <ArrowRight size={17} /></button>
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
