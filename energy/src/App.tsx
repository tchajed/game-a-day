import { useCallback, useEffect, useRef, useState } from 'react'
import WorldCanvas from './WorldCanvas'
import {
  BUILDINGS,
  assignWorker,
  formatCredits,
  formatTime,
  getBuildingCost,
  initialState,
  moveWorker,
  placeBlueprint,
  rebootWorker,
  stepGame,
  type BuildingType,
  type GameState,
} from './game'
import './styles.css'

const params = new URLSearchParams(location.search)
const debug = params.get('debug') === 'true'
const musicOff = params.get('music') === 'off'
const buildingOrder: BuildingType[] = ['pylon', 'solar', 'wind', 'geothermal', 'fusion', 'garage']

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
  const selected = state.workers.find(worker => worker.id === state.selectedWorker) ?? null
  const offGrid = state.buildings.filter(building => building.status === 'complete' && !building.connected).length
  const planned = state.buildings.filter(building => building.status !== 'complete').length

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
      if (state.selectedWorker !== null) return moveWorker(state, state.selectedWorker, x, y)
      return { ...state, toast: 'Select a robot or choose a structure.' }
    })
  }, [mutate])

  const handleBuilding = useCallback((id: number) => {
    mutate(state => {
      const building = state.buildings.find(item => item.id === id)
      if (!building || building.status === 'complete') return state
      if (state.selectedWorker === null) return { ...state, toast: 'Select a robot before assigning this blueprint.' }
      return assignWorker(state, state.selectedWorker, id)
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
        <Stat label="NETWORK" value={offGrid ? `${offGrid} OFF GRID` : 'STABLE'} hot={offGrid > 0} />
      </div>
      <button className="audio" data-testid="music-toggle" onClick={toggleMusic}>{musicOff ? 'AUDIO OFF' : music ? '■ HUM' : '♪ HUM'}</button>
    </header>

    <section className="playfield">
      <WorldCanvas
        state={state}
        onGround={handleGround}
        onBuilding={handleBuilding}
        onWorker={id => mutate(state => ({ ...state, selectedWorker: id, buildMode: null, toast: `${state.workers.find(worker => worker.id === id)?.name} selected.` }))}
      />
      <div className="scanlines" />
      <aside className="right-panel">
        <div className="mission-card">
          <small>OPEN-ENDED DIRECTIVE</small>
          <h2>BUILD THE GRID</h2>
          <p>No contract. No deadline. Every connected megawatt earns credits for the next expansion.</p>
          <div><span>PLANNED <b>{planned}</b></span><span>ONLINE <b>{state.buildings.filter(item => item.status === 'complete' && item.connected).length}</b></span></div>
        </div>
        <div className={`system-feed ${state.toast.startsWith('⚠') ? 'critical' : ''}`}>
          <small>SYSTEM FEED</small><p>{state.toast}</p>
        </div>
        <div className="roster">
          <div className="panel-title"><span>FIELD ROBOTS</span><small>DIRECT CONTROL</small></div>
          {state.workers.map(worker => <button
            key={worker.id}
            className={`${state.selectedWorker === worker.id ? 'selected' : ''} ${worker.status === 'stalled' ? 'stalled' : ''}`}
            onClick={() => mutate(state => ({ ...state, selectedWorker: worker.id, buildMode: null, toast: `${worker.name} selected.` }))}
          >
            <i>{worker.status === 'stalled' ? '!' : worker.id.toString().padStart(2, '0')}</i>
            <span><b>{worker.name}</b><small>{worker.status === 'building' ? 'CONSTRUCTING' : worker.status.toUpperCase()}</small></span>
            <em />
          </button>)}
        </div>
        {selected && <div className={`unit-card ${selected.status}`}>
          <div><small>SELECTED UNIT</small><b>{selected.name}</b></div>
          <p>{selected.status === 'stalled' ? 'Task lock failed. Manual reboot required.' : selected.taskId ? 'Click another blueprint to reassign.' : 'Click a blueprint to build, or terrain to move.'}</p>
          {selected.status === 'stalled' && <button data-testid="reboot" onClick={() => mutate(state => rebootWorker(state, selected.id))}>REBOOT {selected.name}</button>}
        </div>}
      </aside>
    </section>

    <section className="command-deck">
      <div className="deck-heading"><small>CONSTRUCTION</small><b>{state.buildMode ? `${BUILDINGS[state.buildMode].name.toUpperCase()} TOOL ACTIVE` : 'CHOOSE A FACILITY'}</b><span>PLACE → SELECT ROBOT → ASSIGN</span></div>
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
