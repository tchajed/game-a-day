import { useCallback, useEffect, useRef, useState } from 'react'
import WorldCanvas from './WorldCanvas'
import {
  BUILDINGS,
  ROBOT_MTTF,
  addWorker,
  assignRescue,
  assignWorker,
  formatCredits,
  formatTime,
  getBuildingCost,
  getWorkerDeployCost,
  initialState,
  moveWorker,
  placeBlueprint,
  stepGame,
  type BuildingType,
  type GameState,
} from './game'
import './styles.css'

const params = new URLSearchParams(location.search)
const debug = params.get('debug') === 'true'
const musicOff = params.get('music') === 'off'
const buildingOrder: BuildingType[] = ['pylon', 'solar']

function useSimulation() {
  const [state, setState] = useState<GameState>(() => initialState(debug))
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
  const stalled = state.workers.filter(worker => worker.status === 'stalled').length
  const deployCost = getWorkerDeployCost(state)

  const selectBuild = useCallback((type: BuildingType) => {
    mutate(state => ({
      ...state,
      buildMode: state.buildMode === type ? null : type,
      toast: state.buildMode === type
        ? 'Build tool cancelled.'
        : `${BUILDINGS[type].name}: click the terrain to place. Esc cancels.`,
    }))
  }, [mutate])

  const handleGround = useCallback((x: number, y: number) => {
    mutate(state => {
      if (state.buildMode) return placeBlueprint(state, state.buildMode, x, y)
      if (state.selectedWorker !== null) {
        const worker = state.workers.find(item => item.id === state.selectedWorker)
        if (worker?.status === 'stalled') return { ...state, toast: `${worker.name} cannot move. Select a working unit and click the failure.` }
        return moveWorker(state, state.selectedWorker, x, y)
      }
      return { ...state, toast: 'Select a unit or choose a structure.' }
    })
  }, [mutate])

  const handleBuilding = useCallback((id: number) => {
    mutate(state => {
      const building = state.buildings.find(item => item.id === id)
      if (!building || building.status === 'complete') return state
      if (state.selectedWorker === null) return { ...state, toast: 'Select a working unit before assigning this blueprint.' }
      const worker = state.workers.find(item => item.id === state.selectedWorker)
      if (worker?.status === 'stalled') return { ...state, toast: `${worker.name} is stalled. Another unit must rescue it first.` }
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
          ? `${target.name} is down. Select a working unit, then click ${target.name} to dispatch a rescue.`
          : `${target.name} selected.`,
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
    oscillator.type = 'sine'
    oscillator.frequency.value = 48
    oscillator2.type = 'triangle'
    oscillator2.frequency.value = 72
    gain.gain.value = .018
    oscillator.connect(gain)
    oscillator2.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator2.start()
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
      restart: () => mutate(() => initialState(true)),
      place: (type: BuildingType, x: number, y: number) => mutate(state => placeBlueprint(state, type, x, y)),
      assign: (workerId: number, buildingId: number) => mutate(state => assignWorker(state, workerId, buildingId)),
      rescue: (workerId: number, targetId: number) => mutate(state => assignRescue(state, workerId, targetId)),
      move: (workerId: number, x: number, y: number) => mutate(state => moveWorker(state, workerId, x, y)),
      addWorker: () => mutate(addWorker),
    }
  }, [mutate, ref])

  return <main>
    <header>
      <div className="brand">
        <span className="brand-mark">G∞</span>
        <div><b>GRID<span>WORKS</span></b><small>AEOLUS FRONTIER</small></div>
      </div>
      <div className="topstats">
        <Stat label="RUN TIME" value={formatTime(state.elapsed)} />
        <Stat label="AVAILABLE" value={formatCredits(state.cash)} test="cash" />
        <Stat label="GRID OUTPUT" value={`${state.generation.toFixed(0)} MW`} test="generation" glow />
        <Stat label="LIFETIME EXPORT" value={`${state.totalEnergy.toFixed(2)} MWh`} />
        <Stat label="CREW STATUS" value={stalled ? `${stalled} FAILED` : `${state.workers.length} ONLINE`} hot={stalled > 0} />
      </div>
      <button className="audio" data-testid="music-toggle" onClick={toggleMusic}>{musicOff ? 'AUDIO OFF' : music ? '■ HUM' : '♪ HUM'}</button>
    </header>

    <section className="playfield">
      <WorldCanvas
        state={state}
        onGround={handleGround}
        onBuilding={handleBuilding}
        onWorker={handleWorker}
      />
      <div className="scanlines" />
      <aside className="right-panel">
        <div className="mission-card">
          <small>FIELD OPERATIONS DIRECTIVE</small>
          <h2>KEEP THEM RUNNING</h2>
          <p>Standard units fail after {ROBOT_MTTF} seconds on average. Reach them with another unit to repair.</p>
        </div>
        <div className={`system-feed ${state.toast.startsWith('⚠') ? 'critical' : ''}`}>
          <small>SYSTEM FEED</small><p>{state.toast}</p>
        </div>
        <div className="roster">
          <div className="panel-title"><span>FIELD UNITS</span><button data-testid="add-worker" className={state.cash < deployCost ? 'expensive' : ''} onClick={() => mutate(addWorker)}>+ UNIT {formatCredits(deployCost)}</button></div>
          <div className="roster-scroll">
            {state.workers.map(worker => <button
              key={worker.id}
              className={`${state.selectedWorker === worker.id ? 'selected' : ''} ${worker.status === 'stalled' ? 'stalled' : ''} ${worker.reliable ? 'reliable' : ''}`}
              onClick={() => handleWorker(worker.id)}
            >
              <i>{worker.status === 'stalled' ? '!' : worker.reliable ? '∞' : worker.id.toString().padStart(2, '0')}</i>
              <span><b>{worker.name}</b><small>{worker.status === 'building' ? 'CONSTRUCTING' : worker.status === 'rescuing' ? 'FIELD REPAIR' : worker.status.toUpperCase()}</small></span>
              <strong>{worker.reliable ? 'NO FAILURES · 40% SPEED' : `MTTF ${ROBOT_MTTF}s · ${Math.floor(worker.operatingTime)}s UP`}</strong>
              <em />
            </button>)}
          </div>
        </div>
      </aside>
    </section>

    <section className="command-deck">
      <div className="deck-heading"><small>CONSTRUCTION</small><b>{state.buildMode ? `${BUILDINGS[state.buildMode].name.toUpperCase()} TOOL ACTIVE` : 'EXPAND THE GRID'}</b><span>PLACE → ASSIGN → RESCUE FAILURES</span></div>
      <div className="build-list">
        {buildingOrder.map(type => {
          const building = BUILDINGS[type]
          const cost = getBuildingCost(state, type)
          return <button
            key={type}
            data-testid={`build-${type}`}
            className={`${state.buildMode === type ? 'active' : ''} ${state.cash < cost ? 'expensive' : ''}`}
            onClick={() => selectBuild(type)}
          >
            <kbd>{building.key}</kbd><i>{building.icon}</i>
            <span><b>{building.name}</b><small>{building.note}</small></span>
            <strong>{formatCredits(cost)}</strong>
          </button>
        })}
      </div>
    </section>
    {debug && <button className="debug-cash" onClick={() => mutate(state => ({ ...state, cash: state.cash + 5000 }))}>DEBUG +₡5K</button>}
  </main>
}

function Stat({ label, value, hot, glow, test }: { label: string; value: string; hot?: boolean; glow?: boolean; test?: string }) {
  return <div className={`${hot ? 'hot' : ''} ${glow ? 'glow' : ''}`}><small>{label}</small><b data-testid={test}>{value}</b></div>
}
