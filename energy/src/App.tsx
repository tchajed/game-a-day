import { useCallback, useEffect, useRef, useState } from 'react'
import WorldCanvas from './WorldCanvas'
import {
  BUILDINGS,
  LEVELS,
  ROBOT_MTTF,
  ROLES,
  assignRescue,
  assignWorker,
  canRepair,
  formatCredits,
  formatTime,
  getBuildingCost,
  initialState,
  moveWorker,
  placeBlueprint,
  roleNeededFor,
  stepGame,
  type BuildingType,
  type GameState,
} from './game'
import './styles.css'

const params = new URLSearchParams(location.search)
const debug = params.get('debug') === 'true'
const musicOff = params.get('music') === 'off'
const initialLevel = debug && params.get('level') === '2' ? 1 : 0
const buildingOrder: BuildingType[] = ['pylon', 'solar']

function useSimulation() {
  const [state, setState] = useState<GameState>(() => initialState(debug, initialLevel))
  const ref = useRef(state)
  ref.current = state
  const mutate = useCallback((fn: (state: GameState) => GameState) => {
    setState(state => {
      const next = fn(state)
      ref.current = next
      return next
    })
  }, [])
  useEffect(() => {
    let frame = 0
    let previous = performance.now()
    let accumulator = 0
    const loop = (now: number) => {
      accumulator += Math.min(250, now - previous)
      previous = now
      while (accumulator >= 100) {
        mutate(state => stepGame(state, .1))
        accumulator -= 100
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [mutate])
  return { state, mutate, ref }
}

export default function App() {
  const { state, mutate, ref } = useSimulation()
  const [music, setMusic] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const level = LEVELS[state.level]
  const selected = state.workers.find(worker => worker.id === state.selectedWorker)
  const stalled = state.workers.filter(worker => worker.status === 'stalled').length
  const timeLeft = level.timeLimit === null ? null : Math.max(0, level.timeLimit - state.elapsed)

  const selectBuild = useCallback((type: BuildingType) => {
    mutate(state => {
      if (state.level === 0) return { ...state, toast: 'Training sites are already marked. Select a specialist, then click a blueprint.' }
      return {
        ...state,
        buildMode: state.buildMode === type ? null : type,
        toast: state.buildMode === type ? 'Build tool cancelled.' : `${BUILDINGS[type].name}: click terrain to place. Esc cancels.`,
      }
    })
  }, [mutate])

  const handleGround = useCallback((x: number, y: number) => {
    mutate(state => {
      if (state.buildMode) return placeBlueprint(state, state.buildMode, x, y)
      if (state.selectedWorker !== null) {
        const worker = state.workers.find(item => item.id === state.selectedWorker)
        if (worker?.status === 'stalled') return { ...state, toast: `${worker.name} is down. It requires ${ROLES[roleNeededFor(worker.role)].name}.` }
        return moveWorker(state, state.selectedWorker, x, y)
      }
      return { ...state, toast: 'Select a unit or choose a structure.' }
    })
  }, [mutate])

  const handleBuilding = useCallback((id: number) => {
    mutate(state => {
      const building = state.buildings.find(item => item.id === id)
      if (!building || building.status === 'complete') return state
      if (state.selectedWorker === null) return { ...state, toast: 'Select a working specialist before assigning this blueprint.' }
      const worker = state.workers.find(item => item.id === state.selectedWorker)
      if (worker?.status === 'stalled') return { ...state, toast: `${worker.name} is stalled. Repair it before assigning work.` }
      return assignWorker(state, state.selectedWorker, id)
    })
  }, [mutate])

  const handleWorker = useCallback((id: number) => {
    mutate(state => {
      const target = state.workers.find(worker => worker.id === id)
      const selectedWorker = state.workers.find(worker => worker.id === state.selectedWorker)
      if (!target) return state
      if (target.status === 'stalled' && selectedWorker && selectedWorker.id !== target.id && selectedWorker.status !== 'stalled') {
        return assignRescue(state, selectedWorker.id, target.id)
      }
      return {
        ...state,
        selectedWorker: id,
        buildMode: null,
        toast: target.status === 'stalled'
          ? `${target.name} needs ${ROLES[roleNeededFor(target.role)].name}. Select one, then click this failure.`
          : `${target.name} selected · repairs ${ROLES[ROLES[target.role].repairs].name}.`,
      }
    })
  }, [mutate])

  const toggleMusic = () => {
    if (musicOff) return
    if (music) {
      audio.current?.close()
      audio.current = null
      setMusic(false)
      return
    }
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const oscillator2 = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'; oscillator.frequency.value = 48
    oscillator2.type = 'triangle'; oscillator2.frequency.value = 72
    gain.gain.value = .018
    oscillator.connect(gain); oscillator2.connect(gain); gain.connect(context.destination)
    oscillator.start(); oscillator2.start()
    audio.current = context
    setMusic(true)
  }

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') mutate(state => ({ ...state, buildMode: null, toast: 'Build tool cancelled.' }))
      const type = buildingOrder.find(item => BUILDINGS[item].key === event.key)
      if (type) selectBuild(type)
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [mutate, selectBuild])

  useEffect(() => {
    if (!debug) return
    ;(window as unknown as { __ENERGY__: unknown }).__ENERGY__ = {
      getState: () => ref.current,
      step: (milliseconds: number) => mutate(state => stepGame(state, milliseconds / 1000)),
      setCash: (cash: number) => mutate(state => ({ ...state, cash })),
      level: (index: number) => mutate(() => initialState(true, Math.max(0, Math.min(1, index)))),
      restart: () => mutate(state => initialState(true, state.level)),
      place: (type: BuildingType, x: number, y: number) => mutate(state => placeBlueprint(state, type, x, y)),
      assign: (workerId: number, buildingId: number) => mutate(state => assignWorker(state, workerId, buildingId)),
      rescue: (workerId: number, targetId: number) => mutate(state => assignRescue(state, workerId, targetId)),
      move: (workerId: number, x: number, y: number) => mutate(state => moveWorker(state, workerId, x, y)),
    }
  }, [mutate, ref])

  return <main>
    <header>
      <div className="brand">
        <span className="brand-mark">G∞</span>
        <div><b>GRID<span>WORKS</span></b><small>AEOLUS FRONTIER</small></div>
      </div>
      <div className="topstats">
        <Stat label={`DIRECTIVE ${level.number}`} value={level.name} />
        <Stat label={timeLeft === null ? 'RUN TIME' : 'STORM ETA'} value={formatTime(timeLeft ?? state.elapsed)} hot={timeLeft !== null && timeLeft < 30} />
        <Stat label="AVAILABLE" value={formatCredits(state.cash)} test="cash" />
        <Stat label="GRID OUTPUT" value={`${state.generation.toFixed(0)} / ${level.targetGeneration} MW`} test="generation" glow />
        <Stat label="CREW STATUS" value={stalled ? `${stalled} FAILED` : `${state.workers.length} ONLINE`} hot={stalled > 0} />
      </div>
      <button className="audio" data-testid="music-toggle" onClick={toggleMusic}>{musicOff ? 'AUDIO OFF' : music ? '■ HUM' : '♪ HUM'}</button>
    </header>

    <section className="playfield">
      <WorldCanvas state={state} onGround={handleGround} onBuilding={handleBuilding} onWorker={handleWorker} />
      <div className="scanlines" />
      <aside className="right-panel">
        <div className="mission-card">
          <small>FIELD OPERATIONS DIRECTIVE</small>
          <div className="level-tag">DIRECTIVE {level.number}</div>
          <h2>{level.name}</h2>
          <p>{level.directive}</p>
          <strong>{level.goal}</strong>
        </div>
        <div className={`repair-cycle ${stalled ? 'alert' : ''}`}>
          {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map(role => <div key={role} style={{ '--role': ROLES[role].color } as React.CSSProperties}>
            <i>{ROLES[role].glyph}</i><b>{ROLES[role].name}</b><span>REPAIRS<br />{ROLES[ROLES[role].repairs].name}</span>
          </div>)}
        </div>
        <div className={`system-feed ${state.toast.startsWith('⚠') || state.toast.startsWith('INCOMPATIBLE') ? 'critical' : ''}`}>
          <small>SYSTEM FEED</small><p>{state.toast}</p>
        </div>
        <div className="roster">
          <div className="panel-title"><span>FIELD TRIADS</span><small>IDLE UNITS DO NOT WEAR</small></div>
          <div className="roster-scroll">
            {state.workers.map(worker => {
              const role = ROLES[worker.role]
              const repairable = worker.status === 'stalled' && selected && canRepair(selected, worker)
              return <button
                key={worker.id}
                data-testid={`worker-${worker.id}`}
                className={`${state.selectedWorker === worker.id ? 'selected' : ''} ${worker.status === 'stalled' ? 'stalled' : ''} ${repairable ? 'repairable' : ''}`}
                style={{ '--role': role.color } as React.CSSProperties}
                onClick={() => handleWorker(worker.id)}
              >
                <i>{worker.status === 'stalled' ? '!' : role.glyph}</i>
                <span><b>{worker.name}</b><small>{worker.status === 'building' ? 'CONSTRUCTING' : worker.status === 'rescuing' ? 'FIELD REBOOT' : worker.status.toUpperCase()}</small></span>
                <strong>{worker.status === 'stalled' ? `NEEDS ${ROLES[roleNeededFor(worker.role)].name}` : `${role.specialty} · ↑${ROLES[role.repairs].name}`}</strong>
                <em />
              </button>
            })}
          </div>
        </div>
      </aside>
      {state.phase !== 'playing' && <div className={`result ${state.phase}`}>
        <small>{state.phase === 'won' ? 'DIRECTIVE COMPLETE' : 'DIRECTIVE FAILED'}</small>
        <h1>{state.phase === 'won' ? state.level === 0 ? 'TRIAD CERTIFIED' : 'FRONTIER ONLINE' : 'CREW LOCKOUT'}</h1>
        <p>{state.phase === 'won' ? `${state.generation} MW stable · ${state.workers.reduce((sum, worker) => sum + worker.repairs, 0)} field reboots` : state.toast}</p>
        {state.phase === 'won' && state.level === 0
          ? <button data-testid="next-level" onClick={() => mutate(() => initialState(debug, 1))}>BEGIN FRONTIER →</button>
          : <button data-testid="restart-level" onClick={() => mutate(() => initialState(debug, state.level))}>{state.phase === 'won' ? 'PLAY AGAIN' : 'RETRY DIRECTIVE'}</button>}
      </div>}
    </section>

    <section className="command-deck">
      <div className="deck-heading"><small>CONSTRUCTION</small><b>{state.level === 0 ? 'ASSIGN MARKED SITES' : state.buildMode ? `${BUILDINGS[state.buildMode].name.toUpperCase()} TOOL ACTIVE` : 'EXPAND THE GRID'}</b><span>{state.level === 0 ? 'SERVO → PYLON · ARC → SOLAR' : 'PLACE → ASSIGN SPECIALIST → HOLD RESERVE'}</span></div>
      <div className="build-list">
        {buildingOrder.map(type => {
          const building = BUILDINGS[type]
          const cost = getBuildingCost(state, type)
          return <button key={type} data-testid={`build-${type}`} disabled={state.level === 0} className={`${state.buildMode === type ? 'active' : ''} ${state.cash < cost ? 'expensive' : ''}`} onClick={() => selectBuild(type)}>
            <kbd>{building.key}</kbd><i>{building.icon}</i>
            <span><b>{building.name}</b><small>{state.level === 0 ? 'PRE-FUNDED TRAINING SITE' : building.note}</small></span>
            <strong>{state.level === 0 ? 'MARKED' : formatCredits(cost)}</strong>
          </button>
        })}
      </div>
      <div className="protocol-note"><b>REPAIR RING</b><span>OPTIC <i>→</i> ARC <i>→</i> SERVO <i>→</i> OPTIC</span><small>Send balanced triads—not pairs.</small></div>
    </section>
    {debug && <div className="debug-tools"><button onClick={() => mutate(state => ({ ...state, cash: state.cash + 5000 }))}>+₡5K</button><button onClick={() => mutate(() => initialState(true, state.level === 0 ? 1 : 0))}>SKIP LEVEL</button></div>}
  </main>
}

function Stat({ label, value, hot, glow, test }: { label: string; value: string; hot?: boolean; glow?: boolean; test?: string }) {
  return <div className={`${hot ? 'hot' : ''} ${glow ? 'glow' : ''}`}><small>{label}</small><b data-testid={test}>{value}</b></div>
}
