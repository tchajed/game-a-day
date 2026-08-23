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
  Newspaper,
  RotateCcw,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  applyDecisionPhase,
  CRISES,
  DECISION_ROUNDS,
  deltaLabel,
  evaluate,
  getCompanyStatus,
  INITIAL_METRICS,
  type CompanyStatus,
  type Decision,
  type Metrics,
} from './game'
import { playStamp, startMusic, stopMusic, updateMusic } from './audio'

const params = new URLSearchParams(window.location.search)
const DEBUG = params.get('debug') === 'true'
const MUSIC_OFF = params.get('music') === 'off'
const BASE_URL = import.meta.env.BASE_URL
const MAX_LUXURY_SCORE = CRISES.reduce((total, crisis) => total + Math.max(...crisis.choices.map(choice => choice.luxury)), 0)
const INTERLUDE_AFTER_ROUND = 3

type Stage = 'history' | 'decision' | 'outcome' | 'interlude' | 'end'
type PendingSelections = Record<number, number>
type Resolution = Decision & { timedOut: boolean }

const metricMeta = {
  aura: { label: 'Aura', icon: Gem },
  craft: { label: 'Craft', icon: Hammer },
  cash: { label: 'Reserve', icon: Banknote },
} as const

const historyChapters = [
  {
    year: '1949',
    title: 'Made for the meal between shifts',
    image: 'archive/1949-first-box.webp',
    alt: 'Founder Éloise Morrow and metalworker Luc Vautrin examine the first metal lunchbox in a workshop.',
    body: 'Éloise Morrow did not set out to make a status object. She designed field kitchens for the French railways, then used one rejected sheet of aluminum to make a lunchbox for Luc Vautrin, the metalworker at the next bench. It had a silent piano hinge, rounded corners that would not tear a coat, and three enamel compartments sized for bread, fruit, and whatever remained from supper.',
    caption: 'Éloise Morrow and Luc Vautrin with prototype No. 0. Rue Oberkampf atelier, winter 1949.',
  },
  {
    year: '1976',
    title: 'Repair became the signature',
    image: 'archive/1976-night-train.webp',
    alt: 'A worn blue compartmented lunchbox has its brass clasp repaired on an overnight train.',
    body: 'The boxes became known on night trains and long jobs, not runways. Morrow promised to repair any one that had carried a thousand lunches. Traveling fitters replaced clasps in dining cars and factory canteens, leaving each repair visible in brass. A used Morrow slowly became more desirable than a new one: proof that the box had belonged to a life rather than a shelf.',
    caption: 'Clasp repair aboard the Paris–Milan night service. The owner’s cheese and bread were kept in place.',
  },
  {
    year: '1996',
    title: 'Useful enough to become a symbol',
    image: 'archive/1996-courthouse.webp',
    alt: 'Three Paris commuters in the rain carry small rectangular metal lunchboxes.',
    body: 'A photograph of three young barristers carrying repaired Morrows made the lunchbox fashionable by accident. The maison refused handbags, perfume, and an easier miniature. It made the same food-safe box, slowly, while cooks, architects, and musicians began carrying one. Scarcity followed use—not the other way around. That distinction is the inheritance now placed in your hands.',
    caption: 'The courthouse photograph. One brass-corner repair, three packed lunches, and no placement fee.',
  },
] as const

const interludes: Record<CompanyStatus, {
  kicker: string
  title: string
  body: string
  stories: [string, string]
}> = {
  bad: {
    kicker: 'MIDYEAR SERVICE REPORT · COOLING',
    title: 'The boxes are coming back empty.',
    body: 'Cash is thin and the object itself has become part of the argument. Owners still send Morrows to Paris, but too many arrive polished, photographed, and unused. In the canteen, artisans have started taking home their own lunches rather than risk hearing another rumor over the soup.',
    stories: [
      'Repair queue fills with nearly new boxes whose owners want old-looking dents added.',
      'A reseller now advertises an “unused food compartment” as a mark of quality.',
    ],
  },
  okay: {
    kicker: 'MIDYEAR SERVICE REPORT · HOLDING',
    title: 'Tomorrow’s lunch is still packed.',
    body: 'The maison is neither fever nor failure. The reserve can cover the hard months, the benches are busy, and real owners still know why the dividers are shaped this way. Yet every easy growth idea is waiting outside the door, carrying a presentation and asking to be let in.',
    stories: [
      'The oldest box repaired this month contained a handwritten list of thirty years of favorite soups.',
      'Waiting time holds steady as apprentices clear a backlog of handles, hinges, and mustard stains.',
    ],
  },
  good: {
    kicker: 'MIDYEAR SERVICE REPORT · HEATING',
    title: 'The important tables have lunchboxes on them.',
    body: 'The reserve is sound, the workshop is trusted, and demand has become almost impolite. More encouragingly, the most discussed Morrows are scratched, warm, and full of food. The danger now is success itself: everyone wants the symbol, and fewer people understand the meal that made it matter.',
    stories: [
      'A six-seat restaurant removes its plates and serves every course from repaired 1960s boxes.',
      'Owners form unofficial Friday lunch clubs with one rule: an empty Morrow stays outside.',
    ],
  },
}

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
  const [stage, setStage] = useState<Stage>('history')
  const [roundIndex, setRoundIndex] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>({ ...INITIAL_METRICS })
  const [pending, setPending] = useState<PendingSelections>({})
  const pendingRef = useRef<PendingSelections>({})
  const resolvingRef = useRef(false)
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [luxuryScore, setLuxuryScore] = useState(0)
  const [musicOn, setMusicOn] = useState(!MUSIC_OFF)
  const [history, setHistory] = useState<number[]>([])

  const round = DECISION_ROUNDS[roundIndex]
  const roundCrises = round.crisisIndices.map(crisisIndex => ({ crisisIndex, crisis: CRISES[crisisIndex] }))
  const isParallel = round.crisisIndices.length > 1
  const result = stage === 'end' ? evaluate(metrics, luxuryScore) : null
  const companyStatus = getCompanyStatus(metrics)
  const interlude = interludes[companyStatus]
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
    setResolutions([])
    setPending({})
    pendingRef.current = {}
    resolvingRef.current = false

    if (roundIndex === DECISION_ROUNDS.length - 1 || settled.cash < 0) {
      setStage('end')
      return
    }

    const nextRound = roundIndex + 1
    setRoundIndex(nextRound)
    setStage(roundIndex === INTERLUDE_AFTER_ROUND ? 'interlude' : 'decision')
  }

  function continueInterlude() {
    if (stage !== 'interlude') return
    setStage('decision')
  }

  useEffect(() => {
    const api = {
      resolve: playRound,
      skip: () => resolveRound({}, true),
      acknowledge: advance,
      continue: continueInterlude,
      getState: () => ({ stage, roundIndex, crisisIndices: [...round.crisisIndices], metrics, history, pending, remaining }),
    }
    ;(window as Window & { __MORROW__?: typeof api }).__MORROW__ = api
  })

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
    setStage('history')
    setRoundIndex(0)
    setMetrics({ ...INITIAL_METRICS })
    setPending({})
    pendingRef.current = {}
    resolvingRef.current = false
    setResolutions([])
    setRemaining(null)
    setLuxuryScore(0)
    setHistory([])
    if (!MUSIC_OFF) setMusicOn(true)
  }

  const timerClass = remaining !== null && remaining <= 7 ? 'timer urgent' : 'timer'
  const firstBrief = round.crisisIndices[0] + 1
  const lastBrief = round.crisisIndices[round.crisisIndices.length - 1] + 1
  const briefProgress = firstBrief === lastBrief ? `${firstBrief} / ${CRISES.length}` : `${firstBrief}—${lastBrief} / ${CRISES.length}`

  return (
    <main className={`game-shell stage-${stage} ${isParallel ? 'parallel-session' : 'solo-session'}`}>
      <header className="topbar">
        <div className="brand-lockup"><Crest /><div><span className="eyebrow">Maison Morrow</span><strong>Lunch, made worth carrying</strong></div></div>
        <div className="tenure"><span>Decision</span><b>{briefProgress}</b></div>
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
          {(stage === 'decision' || stage === 'outcome') && (
            <>
              <div className="round-console">
                <div>
                  <span>SESSION {roundIndex + 1} / {DECISION_ROUNDS.length}</span>
                  <b><Layers3 size={14} />{stage === 'outcome' ? 'The lunch-hour report' : round.label}</b>
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
                    <article className="crisis-card" key={crisis.title}>
                      <h1>{crisis.title}</h1>
                      <p className="brief">{crisis.body}</p>

                      {stage === 'decision' && (
                        <div className="choices" aria-label={`Choices for ${crisis.title}`}>
                          {crisis.choices.map((choice, choiceIndex) => {
                            const selected = selectedIndex === choiceIndex
                            return (
                              <button
                                className={`choice ${selected ? 'selected' : ''}`}
                                key={choice.id}
                                onClick={() => selectChoice(crisisIndex, choiceIndex)}
                                aria-pressed={selected}
                              >
                                <span><b>{choice.title}</b><small>{choice.body}</small></span>
                                {selected ? <Check size={18} /> : <ArrowRight size={18} />}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {stage === 'outcome' && selectedChoice && (
                        <div className="outcome" role="group" aria-label={`Outcome for ${crisis.title}`}>
                          <span className="outcome-label">{resolution?.timedOut ? 'THE CLOCK CHOSE' : `YOU CHOSE · ${selectedChoice.title}`}</span>
                          <p>{selectedChoice.response}</p>
                          <div className="immediate"><b>AT ONCE</b><span>{deltaLabel(selectedChoice.now) || 'No immediate ledger movement'}</span></div>
                          <section className="news-clipping" aria-label="Later news report">
                            <div><Newspaper size={15} /><span>THE MORROW REGISTER · THREE MONTHS LATER</span></div>
                            <h2>{selectedChoice.newsHeadline}</h2>
                            <p>{selectedChoice.consequence}</p>
                            <strong>{deltaLabel(selectedChoice.later) || 'No later ledger movement'}</strong>
                          </section>
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
                  <span>Read the report before the ledger closes.</span>
                  <button className="advance-button" onClick={advance}>
                    {roundIndex === DECISION_ROUNDS.length - 1 ? 'Acknowledge & close tenure' : 'Acknowledge report'} <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {stage === 'history' && (
        <div className="modal-backdrop history-backdrop">
          <section className="history-modal">
            <header className="history-header">
              <Crest />
              <div>
                <div className="intro-kicker">THE OBJECT YOU HAVE INHERITED</div>
                <h1>Before it was luxury,<br />it was lunch.</h1>
                <p>Three moments from the private archive of Maison Morrow. Read them carefully: every decision that follows asks what made a useful metal box worth keeping for seventy-five years.</p>
              </div>
            </header>
            <div className="history-timeline">
              {historyChapters.map(chapter => (
                <article className="history-chapter" key={chapter.year}>
                  <figure>
                    <img src={`${BASE_URL}${chapter.image}`} alt={chapter.alt} />
                    <figcaption>{chapter.caption}</figcaption>
                  </figure>
                  <div>
                    <span>{chapter.year}</span>
                    <h2>{chapter.title}</h2>
                    <p>{chapter.body}</p>
                  </div>
                </article>
              ))}
            </div>
            <footer className="history-footer">
              <div><Utensils size={19} /><p><strong>Your inheritance:</strong> Make it useful enough to scar, good enough to repair, and rare because the work is slow—not because the story says so.</p></div>
              <button onClick={begin}>Open the first brief <ArrowRight size={18} aria-hidden="true" /></button>
            </footer>
          </section>
        </div>
      )}

      {stage === 'interlude' && (
        <div className="modal-backdrop interlude-backdrop">
          <section className={`interlude-modal status-${companyStatus}`}>
            <div className="interlude-visual" aria-hidden="true">
              <span className="lunchbox-handle" />
              <div className="lunchbox-case"><i /><i /><i /></div>
              <b>{companyStatus === 'bad' ? 'RETURNED' : companyStatus === 'good' ? 'PACKED' : 'IN USE'}</b>
            </div>
            <div className="intro-kicker">{interlude.kicker}</div>
            <h1>{interlude.title}</h1>
            <p>{interlude.body}</p>
            <div className="interlude-ledger">
              <div><span>AURA</span><b>{metrics.aura}</b></div>
              <div><span>CRAFT</span><b>{metrics.craft}</b></div>
              <div><span>RESERVE</span><b>${metrics.cash}m</b></div>
            </div>
            <div className="interlude-stories">
              {interlude.stories.map(story => <p key={story}><Newspaper size={14} />{story}</p>)}
            </div>
            <button onClick={continueInterlude}>Return to the table <ArrowRight size={18} /></button>
          </section>
        </div>
      )}

      {stage === 'end' && (
        <div className="modal-backdrop end-backdrop">
          <section className={`end-modal result-${result}`}>
            <div className="end-seal"><Crown size={31} /></div>
            <div className="intro-kicker">THE 75TH ANNIVERSARY LEDGER</div>
            <h1>{result === 'icon' ? 'A lunchbox worth inheriting.' : result === 'independent' ? 'Tomorrow’s lunch is packed.' : result === 'insolvent' ? 'The last box leaves empty.' : 'Just another lunchbox.'}</h1>
            <p>{result === 'icon'
              ? 'You protected the meal, the maker, and the marks left by use. The next custodian inherits an object more alive than the legend you were given.'
              : result === 'independent'
                ? 'Morrow remains independent and its boxes remain useful. Collectors will debate a few choices over lunch for decades.'
                : result === 'insolvent'
                  ? 'Taste without a reserve is only a beautiful liquidation. The final artisans pack their lunches and leave before dawn.'
                  : 'The company grew and the category noticed. Then the public found something newer, cheaper, and almost identical for carrying lunch.'}</p>
            <div className="final-ledger">
              <div><span>AURA</span><b>{metrics.aura}</b></div>
              <div><span>CRAFT</span><b>{metrics.craft}</b></div>
              <div><span>RESERVE</span><b>${metrics.cash}m</b></div>
              <div><span>PLAYBOOK</span><b>{luxuryScore} / {MAX_LUXURY_SCORE}</b></div>
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
