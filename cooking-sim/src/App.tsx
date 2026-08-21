import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Braces, ChefHat, ChevronRight, CircleHelp, Clock3, Code2, FastForward, Gauge, Grid2X2, Layers3, Music2, PanelRightOpen, Pause, Play, RotateCcw, Ruler, Settings2, SkipForward, Sparkles, Utensils, VolumeX } from 'lucide-react'
import { ACTIONS, ACTION_LABELS, DEFAULT_CONFIG, configFromRuleCode, createGame, finishSimulation, tick, type ActionKind, type ChefAction, type ChefId, type GameConfig, type GameState, type PizzaKind } from './engine'

type ProgramMode = 'assist' | 'rules' | 'script' | 'auto'
type Design = 'classic' | 'schematic' | 'dispatch' | 'playset'

const RULE_CODE = `Mise {
  top().oldest()
  bake().when(oven.free)
  knead().until(bases <= 2)
  serve().ifUrgent()
}
Sunny {
  serve().hotFirst()
  clear().oldest()
  bake().when(pass.hasSpace)
  top().help()
}`

const SCRIPT_CODE = `chef Mise {
  when order.needs_topping -> top oldest
  when oven.free -> bake oldest
  when bases < 2 -> knead
  otherwise -> serve
}

chef Sunny {
  when pass.ready -> serve hottest
  when table.dirty -> clear oldest
  when oven.free -> bake oldest
  otherwise -> top oldest
}`

const DESIGNS: { id: Design; name: string; subtitle: string; icon: React.ReactNode }[] = [
  { id: 'classic', name: 'Bistro', subtitle: 'The original warm interface', icon: <Layers3 size={15} /> },
  { id: 'schematic', name: 'Plan', subtitle: 'A precise kitchen floor plan', icon: <Ruler size={15} /> },
  { id: 'dispatch', name: 'Rail', subtitle: 'A brisk service dispatch board', icon: <Grid2X2 size={15} /> },
  { id: 'playset', name: 'Playset', subtitle: 'A chunky tabletop diorama', icon: <Sparkles size={15} /> },
]

function cloneConfig(config: GameConfig): GameConfig { return structuredClone(config) }

function useKitchenAudio(enabled: boolean, events: GameState['events']) {
  const context = useRef<AudioContext | null>(null)
  const lastEvent = useRef(-1)
  useEffect(() => {
    if (!enabled || !events.length || events[0].id === lastEvent.current) return
    lastEvent.current = events[0].id
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    context.current ??= new AudioCtor()
    const ctx = context.current
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.type = events[0].tone === 'bad' ? 'sawtooth' : 'sine'
    osc.frequency.value = events[0].tone === 'good' ? 620 : events[0].tone === 'bad' ? 160 : 380
    gain.gain.setValueAtTime(0.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.12)
  }, [enabled, events])
}

type PizzaStage = 'raw' | 'baking' | 'cooked' | 'order'

function Pizza({ kind, small = false, stage = 'cooked' }: { kind: PizzaKind; small?: boolean; stage?: PizzaStage }) {
  return <span className={`pizza pizza-${kind} pizza-${stage} ${small ? 'pizza-small' : ''}`} aria-label={`${stage} ${kind} pizza`}>
    <span className="pizza-surface" />
    <i className="topping topping-1" /><i className="topping topping-2" /><i className="topping topping-3" /><i className="topping topping-4" />
    <em className="pizza-garnish" />
  </span>
}

function isTraveling(action: ChefAction) {
  return action.timeLeft - action.workTime > 0.02
}

function actionDestination(action: ChefAction, game: GameState) {
  if (action.kind === 'serve' || action.kind === 'clear') {
    const table = game.orders.find(order => order.id === action.orderId)?.table ?? 0
    return `→ table 0${table + 1}`
  }
  return action.kind === 'bake' ? '→ ovens' : action.kind === 'top' ? '→ prep' : '→ dough'
}

function Kitchen({ game }: { game: GameState }) {
  const visibleAtTable = [0, 1, 2].map(table => game.orders.filter(o => o.table === table && !['done', 'left'].includes(o.state)).at(-1))
  const chefs = Object.values(game.chefs)
  const activeCounters = new Set(chefs.filter(chef => chef.action?.counterId !== undefined && !isTraveling(chef.action)).map(chef => chef.action?.counterId))
  return <section className="kitchen-card" aria-label="Kitchen simulation">
    <div className="kitchen">
      <div className="wall-label">TWO TOP <span>· OPEN KITCHEN ·</span></div>
      <div className="tile-lines" />
      <div className="station pantry"><span>DOUGH</span><div className="sacks"><i /><i /></div></div>
      <div className="station prep"><span>PREP</span><div className="board">✦</div></div>
      <div className="station ovens"><span>OVENS</span>{[0, 1].map(id => { const oven = game.ovens.find(o => o.id === id); const loader = chefs.find(chef => chef.action?.kind === 'bake' && chef.action.orderId === oven?.orderId); const atOven = loader?.action && !isTraveling(loader.action); return <div className="oven" key={id}><b>{oven ? (oven.loading ? (atOven ? 'LOAD' : 'NEXT') : `${Math.max(0, oven.timeLeft).toFixed(0)}s`) : '—'}</b>{oven && !oven.loading && <Pizza kind={game.orders.find(o => o.id === oven.orderId)?.kind ?? 'tomato'} stage="baking" small />}</div> })}</div>
      <div className="station counters"><span>COUNTERS</span><div className="counter-row">{game.counters.map(c => <div className="counter" key={c.id}>{c.kind === 'base' && <span className="dough-disc" title="Prepared dough" />}{c.kind === 'topped' && <Pizza kind={game.orders.find(o => o.id === c.orderId)?.kind ?? 'tomato'} stage="raw" small />}{c.kind.startsWith('working') && (activeCounters.has(c.id) ? <span className="work-dots">···</span> : <span className="queued-mark">next</span>)}</div>)}</div></div>
      <div className="station pass"><span>PASS</span><div className="pass-row">{game.pass.map(p => <Pizza key={p.orderId} kind={game.orders.find(o => o.id === p.orderId)?.kind ?? 'tomato'} small />)}</div></div>
      {visibleAtTable.map((order, table) => <div className={`table table-${table} ${order ? 'table-occupied' : ''}`} key={table}>
        <span className="table-no">0{table + 1}</span>
        {order ? <>
          <div className={`guest guest-look-${order.id % 6} ${order.patience < 10 ? 'guest-worried' : ''}`} aria-label={`Customer at table ${table + 1}`}>
            <span className="guest-body"><i className="guest-arm guest-arm-left" /><i className="guest-arm guest-arm-right" /></span>
            <span className="guest-head"><i className="guest-face" /></span>
          </div>
          <div className={`patience ${order.patience < 10 ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, order.patience / 35 * 100)}%` }} /></div>
          <div className="order-bubble">{order.state === 'dirty' || order.state === 'clearing' ? <Utensils size={13} /> : order.state === 'eating' ? <span className="eating-mark">yum</span> : <Pizza kind={order.kind} stage="order" small />}</div>
        </> : <span className="empty-table">free</span>}
      </div>)}
      {chefs.map(chef => {
        const action = chef.action
        const traveling = action ? isTraveling(action) : false
        const phaseTime = action ? (traveling ? action.timeLeft - action.workTime : action.timeLeft) : 0
        const showCarriedItem = action && (action.kind !== 'clear' || !traveling)
        return <div className={`chef chef-${chef.id.toLowerCase()} ${traveling ? 'chef-traveling' : ''}`} key={chef.id} style={{ left: `${chef.position.x}%`, top: `${chef.position.y}%`, '--chef': chef.color } as React.CSSProperties}>
          {action && <span className={`task-bubble ${traveling ? 'traveling' : 'working'}`}><span>{traveling ? actionDestination(action, game) : action.label.replace(/ .*/, '')}</span><b>{Math.max(1, Math.ceil(phaseTime))}s</b></span>}
          <div className="chef-person">
            <span className="chef-body"><i className="chef-arm chef-arm-left" /><i className="chef-arm chef-arm-right" /></span>
            <span className="chef-head"><ChefHat size={24} /></span>
          </div>
          {showCarriedItem && <span className={`carried-item carried-${action.kind}`}>
            {action.kind === 'clear' ? <span className="dirty-plate"><i /><i /></span> : action.kind === 'knead' ? <span className="dough-ball" /> : <Pizza kind={game.orders.find(o => o.id === action.orderId)?.kind ?? 'tomato'} stage={action.kind === 'serve' ? 'cooked' : 'raw'} small />}
          </span>}
          <strong>{chef.id}</strong>
        </div>
      })}
      {game.status === 'planning' && <div className="kitchen-idle"><Bot size={22} /><b>Chefs waiting for program</b></div>}
    </div>
  </section>
}

function PrioritySlider({ kind, value, onChange }: { kind: ActionKind; value: number; onChange: (v: number) => void }) {
  return <label className="priority-row">
    <span>{ACTION_LABELS[kind]}</span><input aria-label={`${kind} priority`} type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} /><output>{value}</output>
  </label>
}

function AssistEditor({ config, setConfig }: { config: GameConfig; setConfig: (c: GameConfig) => void }) {
  return <div className="assist-editor">
    <div className="agent-columns">{(['Mise', 'Sunny'] as ChefId[]).map((chef, index) => <div className="agent-config" key={chef}>
      <header><span className={`agent-dot agent-${index}`}><ChefHat size={17} /></span><div><b>{chef}</b><small>{config.chefs[chef].label}</small></div></header>
      {ACTIONS.map(kind => <PrioritySlider key={kind} kind={kind} value={config.chefs[chef].priorities[kind]} onChange={value => { const next = cloneConfig(config); next.chefs[chef].priorities[kind] = value; setConfig(next) }} />)}
    </div>)}</div>
    <label className="reserve-control"><span><b>Base buffer</b><small>Keep dough ready, but don't jam 3 counters.</small></span><select value={config.baseReserve} onChange={e => { const next = cloneConfig(config); next.baseReserve = Number(e.target.value); setConfig(next) }}><option value="1">1 base</option><option value="2">2 bases</option><option value="3">3 bases</option></select></label>
  </div>
}

function ProgramPanel({ mode, setMode, config, setConfig, running, onRun, onCollapse }: { mode: ProgramMode; setMode: (m: ProgramMode) => void; config: GameConfig; setConfig: (c: GameConfig) => void; running: boolean; onRun: () => void; onCollapse: () => void }) {
  const [ruleCode, setRuleCode] = useState(RULE_CODE)
  const [scriptCode, setScriptCode] = useState(SCRIPT_CODE)
  const modes: { id: ProgramMode; label: string; icon: React.ReactNode }[] = [
    { id: 'assist', label: 'Tune', icon: <Settings2 size={15} /> }, { id: 'rules', label: 'Rules API', icon: <Code2 size={15} /> }, { id: 'script', label: 'KitchenScript', icon: <Braces size={15} /> }, { id: 'auto', label: 'Autopilot', icon: <Sparkles size={15} /> },
  ]
  function select(next: ProgramMode) {
    setMode(next)
    if (next === 'auto') setConfig(cloneConfig(DEFAULT_CONFIG))
    if (next === 'rules') setConfig(configFromRuleCode(ruleCode))
    if (next === 'script') setConfig(configFromRuleCode(scriptCode))
  }
  return <section className={`program-card ${running ? 'running' : ''}`}>
    <header className="program-head"><div><span className="eyebrow">PROGRAM YOUR CREW</span><h2>Service logic</h2></div><div className="program-head-actions"><span className="status-pill"><i />{running ? 'Program live' : 'Draft mode'}</span><button className="collapse-button" onClick={onCollapse} title="Fold away the logic panel"><ChevronRight size={18} /></button></div></header>
    <nav className="mode-tabs" aria-label="Programming style">{modes.map(m => <button key={m.id} className={mode === m.id ? 'active' : ''} onClick={() => select(m.id)}>{m.icon}{m.label}</button>)}</nav>
    <div className="editor-body">
      {mode === 'assist' && <AssistEditor config={config} setConfig={setConfig} />}
      {mode === 'rules' && <div className="code-editor"><div className="code-caption"><b>Chain the kitchen API</b><span>First matching action wins.</span></div><textarea spellCheck={false} value={ruleCode} onChange={e => { setRuleCode(e.target.value); setConfig(configFromRuleCode(e.target.value)) }} /></div>}
      {mode === 'script' && <div className="code-editor"><div className="code-caption"><b>A tiny coordination language</b><span>Reorder rules to change priorities.</span></div><textarea spellCheck={false} value={scriptCode} onChange={e => { setScriptCode(e.target.value); setConfig(configFromRuleCode(e.target.value)) }} /></div>}
      {mode === 'auto' && <div className="autopilot"><div className="auto-orbit"><Bot size={32} /><i /><i /><i /></div><h3>Watch the reference strategy</h3><p>Mise owns prep. Sunny owns the room. Both jump in when their station is quiet.</p><div className="auto-rule"><span>01</span>Protect the pass <b>→</b> then clear tables</div><div className="auto-rule"><span>02</span>Top to order <b>→</b> keep 2 bases ready</div></div>}
    </div>
    <footer className="program-footer"><span><CircleHelp size={15} />You can pause and reprogram mid-shift.</span><button className="run-button" onClick={onRun}>{running ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}{running ? 'Pause shift' : 'Run program'}</button></footer>
  </section>
}

function ScoreStrip({ game }: { game: GameState }) {
  return <div className="score-strip">
    <div><Clock3 size={16} /><span>SHIFT</span><b>{Math.max(0, Math.ceil(game.shiftLength - game.time))}<small>s</small></b></div>
    <div><Utensils size={16} /><span>SERVED</span><b>{game.served}<small>/9</small></b></div>
    <div><Gauge size={16} /><span>WALKOUTS</span><b className={game.lost ? 'bad' : ''}>{game.lost}</b></div>
    <div className="score"><span>TIPS</span><b>{game.score.toLocaleString()}</b></div>
  </div>
}

const WAIT_PHASES = [
  { key: 'seated', label: 'Waiting for prep', color: '#dc5c4d' },
  { key: 'topped', label: 'Waiting for oven', color: '#d09236' },
  { key: 'ready', label: 'Waiting on pass', color: '#3d8977' },
  { key: 'dirty', label: 'Waiting to clear', color: '#795b91' },
] as const

function formatSeconds(value: number) { return `${value.toFixed(value >= 10 ? 0 : 1)}s` }

function Results({ game, restart }: { game: GameState; restart: () => void }) {
  const stars = game.served >= 8 ? 3 : game.served >= 6 ? 2 : game.served >= 4 ? 1 : 0
  const waits = WAIT_PHASES.map(phase => ({ ...phase, value: game.stats.orderStateTime[phase.key] }))
  const maxWait = Math.max(1, ...waits.map(wait => wait.value))
  const bottleneck = waits.reduce((largest, wait) => wait.value > largest.value ? wait : largest)
  const completedJourneys = game.stats.orders.map(order => (order.finishedAt ?? order.leftAt ?? game.time) - order.arrivedAt)
  const averageJourney = completedJourneys.reduce((sum, time) => sum + time, 0) / Math.max(1, completedJourneys.length)

  return <div className="modal-backdrop"><div className="results-modal">
    <div className="result-scroll">
      <header className="result-heading"><div><span className="eyebrow">SHIFT REPORT</span><h2>{stars === 3 ? 'Beautiful service.' : stars === 2 ? 'A solid little kitchen.' : stars === 1 ? 'Some hungry lessons.' : 'Back to the whiteboard.'}</h2><p>Your agents served <b>{game.served} of 9</b> tables and earned <b>{game.score} tips</b>.</p></div><div className="stars">{[0, 1, 2].map(i => <Sparkles key={i} className={i < stars ? 'earned' : ''} fill="currentColor" />)}</div></header>
      <div className="result-summary">
        <div><span>AVG. GUEST JOURNEY</span><b>{formatSeconds(averageJourney)}</b><small>arrival to cleared / left</small></div>
        <div><span>BIGGEST WAIT</span><b>{bottleneck.label.replace('Waiting ', '')}</b><small>{formatSeconds(bottleneck.value)} across all parties</small></div>
        <div><span>OUTCOME</span><b>{game.served} served · {game.lost} lost</b><small>{game.score.toLocaleString()} total tips</small></div>
      </div>

      <section className="report-section"><div className="report-title"><span className="eyebrow">WHERE GUESTS WAITED</span><small>Cumulative party-seconds</small></div><div className="wait-chart">{waits.map(wait => <div className="wait-row" key={wait.key}><span><i style={{ background: wait.color }} />{wait.label}</span><div><i style={{ width: `${wait.value / maxWait * 100}%`, background: wait.color }} /></div><b>{formatSeconds(wait.value)}</b></div>)}</div></section>

      <section className="report-section"><div className="report-title"><span className="eyebrow">CREW TIME</span><small>Work vs. walking vs. idle</small></div><div className="crew-stats">{(Object.keys(game.stats.chefs) as ChefId[]).map((chefId, index) => { const chef = game.stats.chefs[chefId]; const total = Math.max(1, chef.work + chef.travel + chef.idle); return <div className="crew-row" key={chefId}><div className={`crew-name agent-${index}`}><ChefHat size={15} /><b>{chefId}</b><small>{Object.values(chef.actions).reduce((sum, count) => sum + count, 0)} jobs</small></div><div className="utilization"><div className="util-bar"><i className="util-work" style={{ width: `${chef.work / total * 100}%` }} /><i className="util-travel" style={{ width: `${chef.travel / total * 100}%` }} /><i className="util-idle" style={{ width: `${chef.idle / total * 100}%` }} /></div><span><b>{Math.round(chef.work / total * 100)}%</b> work <b>{Math.round(chef.travel / total * 100)}%</b> walking <b>{Math.round(chef.idle / total * 100)}%</b> idle</span></div></div> })}</div></section>

      <section className="report-section timeline-section"><div className="report-title"><span className="eyebrow">SERVICE TIMELINE</span><small>● oven&nbsp;&nbsp;◆ pass&nbsp;&nbsp;▲ served</small></div><div className="timeline-axis"><span>0s</span><span>{Math.round(game.shiftLength / 2)}s</span><span>{game.shiftLength}s</span></div><div className="timeline">{game.stats.orders.map(stat => { const order = game.orders.find(item => item.id === stat.orderId); const end = stat.finishedAt ?? stat.leftAt ?? game.time; const pct = (time: number) => Math.min(100, time / game.shiftLength * 100); return <div className="timeline-row" key={stat.orderId}><b>T{(order?.table ?? 0) + 1}</b><span className={`timeline-track ${stat.leftAt !== undefined ? 'lost' : ''}`}><i className="ticket-span" style={{ left: `${pct(stat.arrivedAt)}%`, width: `${Math.max(1, pct(end) - pct(stat.arrivedAt))}%` }} />{stat.ovenAt !== undefined && <i className="timeline-mark oven-mark" style={{ left: `${pct(stat.ovenAt)}%` }} title={`Oven at ${formatSeconds(stat.ovenAt)}`} />}{stat.readyAt !== undefined && <i className="timeline-mark ready-mark" style={{ left: `${pct(stat.readyAt)}%` }} title={`On pass at ${formatSeconds(stat.readyAt)}`} />}{stat.servedAt !== undefined && <i className="timeline-mark served-mark" style={{ left: `${pct(stat.servedAt)}%` }} title={`Served at ${formatSeconds(stat.servedAt)}`} />}</span><small>{stat.leftAt !== undefined ? 'LEFT' : 'SERVED'}</small></div> })}</div></section>
    </div>
    <footer className="result-footer"><span><i className="legend-work" /> work <i className="legend-travel" /> walking <i className="legend-idle" /> idle</span><button className="run-button" onClick={restart}><RotateCcw size={17} />Reprogram shift</button></footer>
  </div></div>
}

export default function App() {
  const query = useMemo(() => new URLSearchParams(location.search), [])
  const [design, setDesign] = useState<Design>('dispatch')
  const [mode, setMode] = useState<ProgramMode>('assist')
  const [config, setConfig] = useState<GameConfig>(() => cloneConfig(DEFAULT_CONFIG))
  const [game, setGame] = useState<GameState>(() => createGame())
  const [programOpen, setProgramOpen] = useState(true)
  const [music, setMusic] = useState(query.get('music') !== 'off')
  const debug = query.get('debug') === 'true'
  useKitchenAudio(music, game.events)

  useEffect(() => {
    if (game.status !== 'running') return
    let previous = performance.now(); let id = 0
    const frame = (now: number) => {
      const dt = Math.min(0.08, (now - previous) / 1000) * game.speed; previous = now
      setGame(current => tick(current, dt, config)); id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame); return () => cancelAnimationFrame(id)
  }, [game.status, game.speed, config])

  function runPause() {
    const starting = game.status !== 'running'
    if (starting) setProgramOpen(false)
    setGame(current => ({ ...current, status: starting ? 'running' : 'paused' }))
  }
  function restart() { setGame(createGame('planning')); setProgramOpen(true) }
  function speedTo(speed: 1 | 2 | 4) { setGame(g => ({ ...g, speed })) }
  function skipToEnd() {
    setProgramOpen(false)
    setGame(current => finishSimulation(current, config))
  }

  return <main className={`app design-${design}`}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><ChefHat size={22} /></span><div><h1>TWO TOP</h1><small>A PROGRAMMED KITCHEN</small></div></div>
      <div className="top-actions">
        <div className="design-picker" aria-label="Simulation design">{DESIGNS.map(option => <button key={option.id} title={`${option.name} — ${option.subtitle}`} aria-label={`Use ${option.name} design`} aria-pressed={design === option.id} onClick={() => setDesign(option.id)} className={design === option.id ? 'active' : ''}>{option.icon}<span>{option.name}</span></button>)}</div>
        <button className="icon-button" onClick={() => setMusic(!music)} title={music ? 'Mute sounds' : 'Enable sounds'}>{music ? <Music2 size={18} /> : <VolumeX size={18} />}</button>
        <button className="reset-button" onClick={restart}><RotateCcw size={15} /> Reset</button>
      </div>
    </header>
    <div className={`game-shell ${programOpen ? '' : 'program-folded'}`}>
      <div className="simulation-column">
        <ScoreStrip game={game} />
        <Kitchen game={game} />
        <div className="sim-footer">
          <div className="event-feed">{game.events.length ? <><i className={`event-dot ${game.events[0].tone}`} /><b>{game.events[0].text}</b><span>{Math.floor(game.events[0].time)}s</span></> : <><i className="event-dot" /><b>Doors open when your program runs</b></>}</div>
          <div className="speed-control"><FastForward size={14} />{([1, 2, 4] as const).map(s => <button className={game.speed === s ? 'active' : ''} onClick={() => speedTo(s)} key={s}>{s}×</button>)}<button className="skip-button" onClick={skipToEnd} title="Simulate the rest immediately"><SkipForward size={13} />Skip to end</button></div>
        </div>
      </div>
      {programOpen ? <ProgramPanel mode={mode} setMode={setMode} config={config} setConfig={setConfig} running={game.status === 'running'} onRun={runPause} onCollapse={() => setProgramOpen(false)} /> : <aside className="folded-program">
        <div className="folded-status"><span><Bot size={18} /><i /></span><div><b>{game.status === 'running' ? 'Program running' : 'Program paused'}</b><small>{mode === 'assist' ? 'Tuned priorities' : mode === 'rules' ? 'Rules API' : mode === 'script' ? 'KitchenScript' : 'Autopilot'}</small></div></div>
        <button className="edit-logic-button" onClick={() => setProgramOpen(true)}><PanelRightOpen size={17} />Edit logic</button>
        <button className="folded-pause" onClick={runPause}>{game.status === 'running' ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}{game.status === 'running' ? 'Pause' : 'Resume'}</button>
      </aside>}
    </div>
    <footer className="page-note"><span>Today’s menu</span><Pizza kind="tomato" small /> tomato <b>·</b><Pizza kind="mushroom" small /> mushroom <b>·</b> dishes clean themselves, thankfully.</footer>
    {debug && <button className="debug-win" onClick={() => setGame(g => ({ ...g, time: g.shiftLength - .1 }))}>end shift</button>}
    {game.status === 'ended' && <Results game={game} restart={restart} />}
  </main>
}
