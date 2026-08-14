import type { GameState } from '../game/engine'
import { Memo } from './Memo'
import { Raven } from './Raven'

const SUPERVISOR_RAVEN = `${import.meta.env.BASE_URL}assets/supervisor-raven.png`
const WATCHER_RAVEN = `${import.meta.env.BASE_URL}assets/watcher-raven.png`

const BUILDINGS = [
  { className: 'western', windows: 30 },
  { className: 'needle', windows: 18 },
  { className: 'central', windows: 42 },
  { className: 'slab', windows: 35 },
  { className: 'east', windows: 24 },
]

function Building({ className, windows }: { className: string; windows: number }) {
  return (
    <div className={`building ${className}`}>
      <div className="antenna" />
      <div className="window-grid">
        {Array.from({ length: windows }, (_, index) => <i key={index} style={{ '--i': index } as React.CSSProperties} />)}
      </div>
      <div className="company-mark" aria-hidden="true">◆</div>
    </div>
  )
}

export function Scene({ state }: { state: GameState }) {
  const stage = state.enactedStage
  const collective = state.scrutiny >= 6 && state.errorPulse > 0
  const ending = state.phase === 'ending' || state.phase === 'complete'
  const additionalRavens = Math.min(5, Math.max(0, state.scrutiny - 1))

  return (
    <div
      className={`game-scene stage-${stage} scrutiny-${state.scrutiny} ${collective ? 'collective-stare' : ''} ${ending ? 'ending' : ''}`}
      data-testid="stage"
      data-stage={stage}
    >
      <div className="sky">
        <div className="moon" />
        <div className="cloud cloud-a" />
        <div className="cloud cloud-b" />
        <div className="giant-raven"><Raven /></div>
      </div>
      <div className="skyline far">
        {BUILDINGS.map((building) => <Building key={building.className} {...building} />)}
      </div>
      <div className="cables">
        <span />
        {Array.from({ length: additionalRavens }, (_, index) => (
          <Raven key={index} className={`distant-raven distant-${index + 1}`} stare={collective} />
        ))}
      </div>
      <div className="detached-shadows">
        {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
      </div>
      <div className="office-shadows" aria-hidden="true">
        {['tall', 'round', 'angular', 'crouched', 'tall', 'angular', 'round', 'crouched'].map((shape, index) => (
          <i className={`office-shadow shadow-${shape}`} key={`${shape}-${index}`} />
        ))}
      </div>
      <div className="window-frame frame-left" />
      <div className="window-frame frame-right" />
      <div className="window-frame frame-top" />
      <div className={`window-raven-wrap ${collective ? 'generated-stare' : ''}`}>
        <img className="window-raven generated-raven" src={WATCHER_RAVEN} alt="" />
        <i className="tap-mark">tap</i>
      </div>
      <div className="rear-office">
        {Array.from({ length: 4 }, (_, index) => (
          <div className={`rear-desk rear-${index + 1}`} key={index}>
            <div className="rear-monitor" />
            {index % 2 === 1
              ? <img className={`rear-raven generated-raven ${collective ? 'generated-stare' : ''}`} src={WATCHER_RAVEN} alt="" />
              : <Raven className="rear-raven" stare={collective} />}
          </div>
        ))}
      </div>
      <div className="foreground">
        <div className="desk-edge" />
        <div className="desk-light-pool" />
        <div className="monitor">
          <div className="monitor-light-bar" aria-hidden="true"><i /><span /></div>
          <div className="monitor-screen"><Memo state={state} /></div>
          <div className="monitor-neck" />
          <div className="monitor-foot" />
          <Raven className="reflection-raven" stare />
        </div>
        <div className="keyboard">
          {Array.from({ length: 26 }, (_, index) => <i key={index} />)}
        </div>
        <div className="clipboard" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="supervisor-perch">
          <img
            key={`supervisor-${state.errorPulse}-${state.completionPulse}`}
            className={`supervisor supervisor-image ${state.phase === 'playing' && state.currentMistakes > 0 ? 'reacting' : ''} ${state.phase === 'transition' ? 'approving' : ''} ${state.mistakes > 0 ? 'watchful' : ''}`}
            src={SUPERVISOR_RAVEN}
            alt="Your raven supervisor"
          />
        </div>
        <div className="final-typist"><Raven stare /><span className="final-wing">.</span></div>
      </div>
      <div className="vignette" />
    </div>
  )
}
