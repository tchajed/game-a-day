import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Braces, ChefHat, ChevronRight, CircleHelp, Clock3, Code2, FastForward, Gauge, Music2, PanelRightOpen, Pause, Play, RotateCcw, Settings2, Sparkles, Utensils, VolumeX } from 'lucide-react'
import { ACTIONS, ACTION_LABELS, DEFAULT_CONFIG, configFromRuleCode, createGame, tick, type ActionKind, type ChefId, type GameConfig, type GameState, type PizzaKind } from './engine'

type ProgramMode = 'assist' | 'rules' | 'script' | 'auto'
type Theme = 'bistro' | 'blueprint' | 'diner' | 'paper'

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

const THEMES: { id: Theme; name: string; subtitle: string; colors: string[] }[] = [
  { id: 'bistro', name: 'Soft bistro', subtitle: 'warm & tactile', colors: ['#f2ead9', '#e35d4f', '#3e8a79'] },
  { id: 'blueprint', name: 'Blueprint', subtitle: 'cool & technical', colors: ['#dbe8ec', '#266b85', '#e39b46'] },
  { id: 'diner', name: 'Night diner', subtitle: 'dark & electric', colors: ['#17272a', '#ff6b63', '#5dd4b4'] },
  { id: 'paper', name: 'Paper plan', subtitle: 'ink & highlighter', colors: ['#f5f0df', '#2c2b29', '#e8bd44'] },
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

function Kitchen({ game }: { game: GameState }) {
  const visibleAtTable = [0, 1, 2].map(table => game.orders.filter(o => o.table === table && !['done', 'left'].includes(o.state)).at(-1))
  return <section className="kitchen-card" aria-label="Kitchen simulation">
    <div className="kitchen">
      <div className="wall-label">TWO TOP <span>· OPEN KITCHEN ·</span></div>
      <div className="tile-lines" />
      <div className="station pantry"><span>DOUGH</span><div className="sacks"><i /><i /></div></div>
      <div className="station prep"><span>PREP</span><div className="board">✦</div></div>
      <div className="station ovens"><span>OVENS</span>{[0, 1].map(id => { const oven = game.ovens.find(o => o.id === id); return <div className="oven" key={id}><b>{oven ? (oven.loading ? 'LOAD' : `${Math.max(0, oven.timeLeft).toFixed(0)}s`) : '—'}</b>{oven && !oven.loading && <Pizza kind={game.orders.find(o => o.id === oven.orderId)?.kind ?? 'tomato'} stage="baking" small />}</div> })}</div>
      <div className="station counters"><span>COUNTERS</span><div className="counter-row">{game.counters.map(c => <div className="counter" key={c.id}>{c.kind === 'base' && <span className="dough-disc" title="Prepared dough" />}{c.kind === 'topped' && <Pizza kind={game.orders.find(o => o.id === c.orderId)?.kind ?? 'tomato'} stage="raw" small />}{c.kind.startsWith('working') && <span className="work-dots">···</span>}</div>)}</div></div>
      <div className="station pass"><span>PASS</span><div className="pass-row">{game.pass.map(p => <Pizza key={p.orderId} kind={game.orders.find(o => o.id === p.orderId)?.kind ?? 'tomato'} small />)}</div></div>
      {visibleAtTable.map((order, table) => <div className={`table table-${table}`} key={table}>
        <span className="table-no">0{table + 1}</span>
        <div className="guest"><i /></div>
        {order ? <>
          <div className={`patience ${order.patience < 10 ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, order.patience / 35 * 100)}%` }} /></div>
          <div className="order-bubble">{order.state === 'dirty' || order.state === 'clearing' ? <Utensils size={13} /> : order.state === 'eating' ? <span className="eating-mark">yum</span> : <Pizza kind={order.kind} stage="order" small />}</div>
        </> : <span className="empty-table">free</span>}
      </div>)}
      {Object.values(game.chefs).map(chef => <div className={`chef chef-${chef.id.toLowerCase()}`} key={chef.id} style={{ left: `${chef.position.x}%`, top: `${chef.position.y}%`, '--chef': chef.color } as React.CSSProperties}>
        {chef.action && <span className="task-bubble">{chef.action.label.replace(/ .*/, '')}<b>{Math.ceil(chef.action.timeLeft)}</b></span>}
        <div className="chef-body"><ChefHat size={21} /><i /></div>
        {chef.action && <span className={`carried-item carried-${chef.action.kind}`}>
          {chef.action.kind === 'clear' ? <span className="dirty-plate"><i /><i /></span> : chef.action.kind === 'knead' ? <span className="dough-ball" /> : <Pizza kind={game.orders.find(o => o.id === chef.action?.orderId)?.kind ?? 'tomato'} stage={chef.action.kind === 'serve' ? 'cooked' : 'raw'} small />}
        </span>}
        <strong>{chef.id}</strong>
      </div>)}
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

function Results({ game, restart }: { game: GameState; restart: () => void }) {
  const stars = game.served >= 8 ? 3 : game.served >= 6 ? 2 : game.served >= 4 ? 1 : 0
  return <div className="modal-backdrop"><div className="results-modal"><span className="eyebrow">SHIFT REPORT</span><div className="stars">{[0, 1, 2].map(i => <Sparkles key={i} className={i < stars ? 'earned' : ''} fill="currentColor" />)}</div><h2>{stars === 3 ? 'Beautiful service.' : stars === 2 ? 'A solid little kitchen.' : stars === 1 ? 'Some hungry lessons.' : 'Back to the whiteboard.'}</h2><p>Your agents served <b>{game.served} of 9</b> tables and earned <b>{game.score} tips</b>.</p><div className="result-bars"><span>Guests served<i style={{ width: `${game.served / 9 * 100}%` }} /></span><span>Tables retained<i style={{ width: `${(9 - game.lost) / 9 * 100}%` }} /></span></div><button className="run-button" onClick={restart}><RotateCcw size={17} />Reprogram shift</button></div></div>
}

export default function App() {
  const query = useMemo(() => new URLSearchParams(location.search), [])
  const [theme, setTheme] = useState<Theme>('bistro')
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

  return <main className={`app theme-${theme}`}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><ChefHat size={22} /></span><div><h1>TWO TOP</h1><small>A PROGRAMMED KITCHEN</small></div></div>
      <div className="top-actions">
        <div className="theme-picker">{THEMES.map(t => <button key={t.id} title={`${t.name} — ${t.subtitle}`} aria-label={`Use ${t.name} style`} onClick={() => setTheme(t.id)} className={theme === t.id ? 'active' : ''} style={{ '--swatch-a': t.colors[0], '--swatch-b': t.colors[1], '--swatch-c': t.colors[2] } as React.CSSProperties}><i /><i /><i /></button>)}</div>
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
          <div className="speed-control"><FastForward size={14} />{([1, 2, 4] as const).map(s => <button className={game.speed === s ? 'active' : ''} onClick={() => speedTo(s)} key={s}>{s}×</button>)}</div>
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
