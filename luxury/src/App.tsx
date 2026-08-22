import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Clock3,
  Crown,
  Gem,
  Hammer,
  LockKeyhole,
  Radio,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { addDelta, CRISES, deltaLabel, evaluate, INITIAL_METRICS, type Metrics } from './game'
import { playStamp, startMusic, stopMusic, updateMusic } from './audio'

const DECISION_SECONDS = 22
const params = new URLSearchParams(window.location.search)
const DEBUG = params.get('debug') === 'true'
const MUSIC_OFF = params.get('music') === 'off'

type Stage = 'intro' | 'decision' | 'outcome' | 'end'
type Selection = { choiceIndex: number; timedOut: boolean }
type Aftershock = { text: string; delta: string }

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
  const [quarter, setQuarter] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>({ ...INITIAL_METRICS })
  const [selection, setSelection] = useState<Selection | null>(null)
  const [remaining, setRemaining] = useState(DECISION_SECONDS)
  const [aftershock, setAftershock] = useState<Aftershock | null>(null)
  const [luxuryScore, setLuxuryScore] = useState(0)
  const [musicOn, setMusicOn] = useState(!MUSIC_OFF)
  const [history, setHistory] = useState<number[]>([])

  const crisis = CRISES[quarter]
  const selectedChoice = selection ? crisis.choices[selection.choiceIndex] : null
  const result = stage === 'end' ? evaluate(metrics, luxuryScore) : null

  useEffect(() => {
    updateMusic(quarter, (metrics.aura + metrics.craft) / 200)
  }, [quarter, metrics.aura, metrics.craft])

  const choose = useCallback((choiceIndex: number, timedOut = false) => {
    if (stage !== 'decision') return
    const choice = CRISES[quarter].choices[choiceIndex]
    setMetrics(current => addDelta(current, choice.now))
    setLuxuryScore(score => score + choice.luxury)
    setHistory(current => [...current, choiceIndex])
    setSelection({ choiceIndex, timedOut })
    setAftershock(null)
    setStage('outcome')
    playStamp(choice.luxury >= 1)
  }, [quarter, stage])

  useEffect(() => {
    if (stage !== 'decision') return
    setRemaining(DEBUG ? 99 : DECISION_SECONDS)
    const duration = (DEBUG ? 99 : DECISION_SECONDS) * 1000
    const end = Date.now() + duration
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds <= 0) {
        window.clearInterval(interval)
        choose(CRISES[quarter].timeoutChoice, true)
      }
    }, 200)
    return () => window.clearInterval(interval)
  }, [choose, quarter, stage])

  useEffect(() => {
    const api = { choose, getState: () => ({ stage, quarter, metrics, history }) }
    ;(window as Window & { __MORROW__?: typeof api }).__MORROW__ = api
  }, [choose, history, metrics, quarter, stage])

  function begin() {
    setStage('decision')
    if (musicOn) void startMusic()
  }

  function advance() {
    if (!selectedChoice) return
    const settled = addDelta(metrics, selectedChoice.later)
    setMetrics(settled)
    setAftershock({ text: selectedChoice.consequence, delta: deltaLabel(selectedChoice.later) })
    setSelection(null)
    if (quarter === CRISES.length - 1 || settled.cash < 0) {
      setStage('end')
      return
    }
    setQuarter(current => current + 1)
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
    setQuarter(0)
    setMetrics({ ...INITIAL_METRICS })
    setSelection(null)
    setRemaining(DECISION_SECONDS)
    setAftershock(null)
    setLuxuryScore(0)
    setHistory([])
    if (!MUSIC_OFF) setMusicOn(true)
  }

  const competitorRows = useMemo(() => {
    const q = quarter + 1
    return [
      { name: 'PackIt', model: 'units', value: `${(3.1 + q * 0.4).toFixed(1)}m`, rise: '+18%' },
      { name: 'BentoBase', model: 'units', value: `${(1.8 + q * 0.25).toFixed(1)}m`, rise: '+31%' },
      { name: 'Tomorrow®', model: 'social mentions', value: `${Math.round(42 + q * 17)}k`, rise: '+92%' },
    ]
  }, [quarter])

  const timerClass = remaining <= 7 ? 'timer urgent' : 'timer'

  return (
    <main className={`game-shell stage-${stage}`}>
      <header className="topbar">
        <div className="brand-lockup"><Crest /><div><span className="eyebrow">Maison Morrow</span><strong>Objects for the private hour</strong></div></div>
        <div className="tenure"><span>CEO TENURE</span><b>{Math.min(quarter + 1, 8)} / 8</b></div>
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
          <section className="playbook panel">
            <div className="panel-title"><LockKeyhole size={14} /><span>The 1949 playbook</span></div>
            <p>Never chase volume.</p>
            <p>Protect the object.</p>
            <p>Access is the product.</p>
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
          {aftershock && stage === 'decision' && (
            <div className="aftershock" role="status">
              <Sparkles size={16} />
              <div><b>LAST QUARTER, NOW VISIBLE</b><span>{aftershock.text}</span></div>
              <strong>{aftershock.delta || 'No ledger movement'}</strong>
            </div>
          )}

          {(stage === 'decision' || stage === 'outcome' || stage === 'intro') && (
            <article className="crisis-card">
              <div className="crisis-topline">
                <span>{crisis.quarter}</span>
                <div className={timerClass} aria-label={`${remaining} seconds remaining`}>
                  <Clock3 size={14} /><b>{stage === 'decision' ? remaining : '—'}</b>
                </div>
              </div>
              <div className="source">From the {crisis.source}</div>
              <h1>{crisis.headline}</h1>
              <p className="brief">{crisis.brief}</p>
              <blockquote>{crisis.note}</blockquote>

              <div className="choices" aria-label="Decision choices">
                {crisis.choices.map((choice, index) => (
                  <button
                    className={`choice ${selection?.choiceIndex === index ? 'selected' : ''}`}
                    key={choice.id}
                    onClick={() => choose(index)}
                    disabled={stage !== 'decision'}
                    data-luxury={choice.luxury}
                  >
                    <span className="choice-number">0{index + 1}</span>
                    <span><b>{choice.title}</b><small>{choice.detail}</small></span>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>

              {stage === 'decision' && <p className="deadline-copy">If you do not decide, the board will protect this quarter.</p>}

              {stage === 'outcome' && selectedChoice && (
                <div className="outcome" role="dialog" aria-label="Decision outcome">
                  <span className="outcome-label">{selection?.timedOut ? 'THE BOARD DECIDED' : 'THE SEAL IS SET'}</span>
                  <p>{selectedChoice.response}</p>
                  <div className="immediate"><b>NOW</b><span>{deltaLabel(selectedChoice.now) || 'No immediate ledger movement'}</span></div>
                  <small>Its deeper consequence will surface next quarter.</small>
                  <button className="advance-button" onClick={advance}>
                    {quarter === CRISES.length - 1 ? 'Open the legacy ledger' : 'Enter the next quarter'} <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </article>
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
            <div className="intro-kicker">PARIS · 75TH YEAR · EMERGENCY SESSION</div>
            <h1>You inherit a legend<br />that cannot pay Friday.</h1>
            <p>Eight quarters. Protect what makes a Morrow impossible to replace. The market will reward every shortcut—at first.</p>
            <div className="intro-rule"><span>READ THE ROOM</span><span>TRUST THE PLAYBOOK</span><span>WATCH THE DELAY</span></div>
            <button onClick={begin}>Assume the seal <ArrowRight size={17} /></button>
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
          DEBUG <button onClick={() => choose(crisis.choices.findIndex(choice => choice.luxury === 2))}>Counsel’s pick</button>
          <button onClick={() => choose(crisis.timeoutChoice)}>Board’s pick</button>
        </div>
      )}
    </main>
  )
}

export default App
