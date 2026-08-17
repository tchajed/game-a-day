import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, AudioLines, Bot, ChevronRight, CircleHelp, Clock3, Code2,
  FastForward, LibraryBig, LockKeyhole, Music2, RotateCcw,
  Satellite, ShieldCheck, Sparkles, Terminal, VolumeX, X,
} from 'lucide-react'
import { cards, encounters, resolveCard, startingDeck, type Card, type Encounter } from './game'
import './index.css'
import './fieldbook.css'

type Phase = 'talk' | 'reward' | 'failed' | 'complete'
type View = 'mission' | 'workshop' | 'archive'
type LogEntry = { turn: number; kind: 'system' | 'signal' | 'response' | 'intel'; text: string }

type GameState = {
  encounterIndex: number
  turn: number
  trust: number
  tension: number
  intel: number
  phase: Phase
  hand: string[]
  drawPile: string[]
  discard: string[]
  logs: LogEntry[]
}

const DEBUG = new URLSearchParams(window.location.search).get('debug') === 'true'
const MUSIC_DISABLED = new URLSearchParams(window.location.search).get('music') === 'off'

function makeGame(encounterIndex: number, deck: string[]): GameState {
  const encounter = encounters[encounterIndex]
  return {
    encounterIndex,
    turn: 0,
    trust: 0,
    tension: 0,
    intel: 0,
    phase: 'talk',
    hand: deck.slice(0, 2),
    drawPile: deck.slice(2),
    discard: [],
    logs: [
      { turn: 0, kind: 'system', text: `CHANNEL OPEN // ${encounter.location}` },
      { turn: 0, kind: 'signal', text: encounter.signals[0].message },
    ],
  }
}

const familyClass: Record<Card['family'], string> = {
  Observe: 'observe', Connect: 'connect', Commit: 'commit', Stabilize: 'stabilize',
}

function AlienPortrait({ encounter, speaking = true }: { encounter: Encounter; speaking?: boolean }) {
  const variant = encounter.portrait
  return (
    <div className={`portrait portrait-${variant} ${speaking ? 'speaking' : ''}`} aria-label={`Field sketch of ${encounter.envoy}`}>
      <div className="orbit orbit-a" /><div className="orbit orbit-b" />
      <svg viewBox="0 0 320 320" role="img">
        <defs>
          <linearGradient id={`body-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={variant === 1 ? '#b9aeff' : '#92fbe5'} />
            <stop offset="1" stopColor={variant === 2 ? '#f3a6ff' : '#396c9f'} />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {variant === 0 && <>
          <path className="alien-line" d="M82 242 C46 216 50 166 90 140 M238 242 C274 216 270 166 230 140 M107 253 C78 277 65 287 54 310 M213 253 C242 277 255 287 266 310" />
          <path className="alien-body" d="M160 42 C223 42 249 102 227 166 C216 202 207 243 160 270 C113 243 104 202 93 166 C71 102 97 42 160 42Z" fill={`url(#body-${variant})`} />
          <path className="alien-mask" d="M112 106 Q160 75 208 106 L191 190 Q160 214 129 190Z" />
          <ellipse className="alien-eye" cx="132" cy="139" rx="11" ry="19" /><ellipse className="alien-eye" cx="188" cy="139" rx="11" ry="19" />
          <circle className="small-eye" cx="119" cy="174" r="5" /><circle className="small-eye" cx="201" cy="174" r="5" />
          <path className="alien-line fine" d="M138 191 Q160 203 182 191 M105 86 Q160 48 215 86" />
        </>}
        {variant === 1 && <>
          <path className="alien-line" d="M160 20 L160 56 M95 47 L117 76 M225 47 L203 76 M48 112 L88 125 M272 112 L232 125" />
          <path className="alien-body" d="M160 48 L223 94 L240 191 L199 267 L121 267 L80 191 L97 94Z" fill={`url(#body-${variant})`} />
          <path className="alien-mask" d="M108 106 L160 76 L212 106 L201 192 L160 224 L119 192Z" />
          <path className="alien-eye wide" d="M119 142 Q160 112 201 142 Q160 174 119 142Z" />
          <circle className="pupil" cx="160" cy="142" r="9" />
          <path className="alien-line fine" d="M127 188 H193 M141 201 H179 M111 247 L76 306 M209 247 L244 306" />
        </>}
        {variant === 2 && <>
          <path className="alien-line" d="M73 264 C46 180 86 72 145 61 M247 264 C274 180 234 72 175 61 M110 267 L73 310 M210 267 L247 310" />
          <path className="alien-body split-a" d="M153 43 C90 57 74 129 102 203 C114 236 129 257 153 276Z" fill={`url(#body-${variant})`} />
          <path className="alien-body split-b" d="M167 43 C230 57 246 129 218 203 C206 236 191 257 167 276Z" fill="#7874c9" />
          <path className="alien-mask" d="M110 104 Q160 69 210 104 L196 202 Q160 229 124 202Z" />
          <ellipse className="alien-eye" cx="132" cy="145" rx="10" ry="18" /><path className="alien-eye wide" d="M169 145 Q189 126 207 145 Q189 163 169 145Z" />
          <path className="alien-line fine" d="M160 72 V236 M131 192 Q145 203 156 194 M164 194 Q177 205 191 189" />
        </>}
      </svg>
      <div className="scanline" />
      <div className="portrait-tag"><span>FIGURE OBSERVED</span><i /></div>
    </div>
  )
}

function CardView({ card, selected, disabled, compact, onClick }: { card: Card; selected?: boolean; disabled?: boolean; compact?: boolean; onClick?: () => void }) {
  return (
    <button className={`card ${familyClass[card.family]} ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`} disabled={disabled} onClick={onClick}>
      <span className="card-corners" />
      <div className="card-top"><span className="family">{card.family}</span><span className="glyph">{card.glyph}</span></div>
      <div className="card-art"><span>{card.glyph}</span><i /><i /></div>
      <div className="card-copy"><strong>{card.name}</strong><p>{card.text}</p></div>
      <div className="card-flavor">“{card.flavor}”</div>
    </button>
  )
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'trust' | 'tension' }) {
  return (
    <div className={`meter ${tone}`}>
      <div className="meter-label"><span>{label}</span><strong>{value}<small> / {max}</small></strong></div>
      <div className="meter-track"><span style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div>
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('mission')
  const [loop, setLoop] = useState(7)
  const [deck, setDeck] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('null-deck-v2') || 'null') || startingDeck } catch { return startingDeck }
  })
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('null-unlocked-v2') || 'null') || startingDeck } catch { return startingDeck }
  })
  const [game, setGame] = useState<GameState>(() => makeGame(0, deck))
  const [selected, setSelected] = useState<string | null>(null)
  const [music, setMusic] = useState(false)
  const [help, setHelp] = useState(false)
  const audioRef = useRef<{ ctx: AudioContext; nodes: AudioNode[] } | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const encounter = encounters[game.encounterIndex]
  const signal = encounter.signals[Math.min(game.turn, encounter.signals.length - 1)]

  useEffect(() => { localStorage.setItem('null-deck-v2', JSON.stringify(deck)) }, [deck])
  useEffect(() => { localStorage.setItem('null-unlocked-v2', JSON.stringify(unlocked)) }, [unlocked])
  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [game.logs])

  const stopMusic = () => {
    audioRef.current?.ctx.close()
    audioRef.current = null
    setMusic(false)
  }
  const toggleMusic = () => {
    if (music) { stopMusic(); return }
    if (MUSIC_DISABLED) return
    const ctx = new AudioContext()
    const master = ctx.createGain(); master.gain.value = 0.035; master.connect(ctx.destination)
    const nodes: AudioNode[] = [master]
    ;[55, 82.5, 110].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain()
      oscillator.type = index === 1 ? 'triangle' : 'sine'; oscillator.frequency.value = frequency
      gain.gain.value = index === 0 ? 0.45 : 0.16
      oscillator.connect(gain); gain.connect(master); oscillator.start(); nodes.push(oscillator, gain)
    })
    audioRef.current = { ctx, nodes }; setMusic(true)
  }
  useEffect(() => () => { audioRef.current?.ctx.close() }, [])

  const playCard = (cardId: string) => {
    setGame(current => {
      if (current.phase !== 'talk' || !current.hand.includes(cardId)) return current
      const effect = resolveCard(cardId, encounters[current.encounterIndex], current.turn, current.intel)
      const newTrust = Math.max(0, current.trust + effect.trust)
      const newTension = Math.max(0, current.tension + effect.tension)
      const newIntel = current.intel + effect.intel
      const nextTurn = current.turn + 1
      const won = newTrust >= encounter.target && newTension < encounter.tensionLimit
      const failed = newTension >= encounter.tensionLimit || (!won && nextTurn >= encounter.signals.length)
      const hand = current.hand.filter(id => id !== cardId)
      let drawPile = [...current.drawPile]
      let discard = [...current.discard, cardId]
      if (!drawPile.length && discard.length) { drawPile = [...discard]; discard = [] }
      if (drawPile.length) hand.push(drawPile.shift()!)
      const resultText = `${cards[cardId].name}: ${effect.trust > 0 ? `+${effect.trust} trust` : 'no trust'}${effect.tension ? `, ${effect.tension > 0 ? '+' : ''}${effect.tension} tension` : ''}. ${effect.note}`
      const nextLogs: LogEntry[] = [
        ...current.logs,
        { turn: current.turn, kind: 'response', text: resultText },
        ...(effect.intel ? [{ turn: current.turn, kind: 'intel' as const, text: newIntel >= 2 ? `Pattern threshold reached: affiliation model ${encounters[current.encounterIndex].faction.toUpperCase()} confirmed.` : 'Partial behavioral model saved to the persistent archive.' }] : []),
        ...(!won && !failed ? [{ turn: nextTurn, kind: 'signal' as const, text: encounters[current.encounterIndex].signals[nextTurn].message }] : []),
      ]
      return { ...current, trust: newTrust, tension: newTension, intel: newIntel, turn: nextTurn, hand, drawPile, discard, logs: nextLogs, phase: won ? (current.encounterIndex === encounters.length - 1 ? 'complete' : 'reward') : failed ? 'failed' : 'talk' }
    })
    setSelected(null)
  }

  useEffect(() => {
    const handler = (event: Event) => playCard((event as CustomEvent<string>).detail)
    window.addEventListener('null-protocol-play', handler)
    return () => window.removeEventListener('null-protocol-play', handler)
  })

  useEffect(() => {
    const api = {
      getState: () => ({ ...game, encounter: encounter.id, deck }),
      play: (cardId: string) => window.dispatchEvent(new CustomEvent('null-protocol-play', { detail: cardId })),
      cards: () => game.hand,
    }
    ;(window as typeof window & { __NULL_PROTOCOL__?: typeof api }).__NULL_PROTOCOL__ = api
  }, [game, encounter.id, deck])

  const restartTalk = () => {
    setLoop(value => value + 1)
    setGame(makeGame(game.encounterIndex, deck))
    setSelected(null)
  }
  const chooseReward = (cardId: string) => {
    if (!unlocked.includes(cardId)) setUnlocked(items => [...items, cardId])
    const nextIndex = game.encounterIndex + 1
    setGame(makeGame(nextIndex, deck))
    setSelected(null)
    setView('workshop')
  }
  const restartCampaign = () => {
    setLoop(value => value + 1)
    setGame(makeGame(0, deck))
    setSelected(null)
    setView('mission')
  }
  const toggleDeckCard = (cardId: string) => {
    if (deck.includes(cardId)) {
      if (deck.length > 2) setDeck(items => items.filter(id => id !== cardId))
    } else if (deck.length < 6) setDeck(items => [...items, cardId])
  }
  const moveDeckCard = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= deck.length) return
    setDeck(items => {
      const reordered = [...items]
      ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
      return reordered
    })
  }
  const applyDeck = () => {
    if (deck.length !== 6) return
    setGame(makeGame(game.encounterIndex, deck))
    setSelected(null)
    setView('mission')
  }

  const factionKnown = game.intel >= 2 || game.encounterIndex === 2 || DEBUG
  const selectedCard = selected ? cards[selected] : null
  const preview = selectedCard ? resolveCard(selectedCard.id, encounter, game.turn, game.intel) : undefined
  const missionSteps = encounters.map((item, index) => ({ ...item, status: index < game.encounterIndex ? 'done' : index === game.encounterIndex ? 'active' : 'locked' }))
  const allCardIds = useMemo(() => Object.keys(cards), [])

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setView('mission')}><span className="brand-mark"><Satellite /></span><span><b>NULL</b> PROTOCOL<small>INTERSTELLAR LIAISON FIELD OFFICE</small></span></button>
        <nav>
          <button className={view === 'mission' ? 'active' : ''} onClick={() => setView('mission')}><Bot /> Conversation</button>
          <button className={view === 'workshop' ? 'active' : ''} onClick={() => setView('workshop')}><LibraryBig /> Deck of Methods</button>
          <button className={view === 'archive' ? 'active' : ''} onClick={() => setView('archive')}><Archive /> Field Notes <span>{Math.min(3, game.encounterIndex + (game.intel >= 2 ? 1 : 0))}</span></button>
        </nav>
        <div className="header-tools">
          <div className="loop-chip"><Clock3 /><span>ATTEMPT <b>{String(loop).padStart(2, '0')}</b></span></div>
          <button className="icon-button" onClick={() => setHelp(true)} aria-label="How to play"><CircleHelp /></button>
          <button className={`icon-button ${music ? 'lit' : ''}`} onClick={toggleMusic} aria-label="Toggle ambient music" title={MUSIC_DISABLED ? 'Music disabled by URL' : 'Toggle ambient music'}>{music ? <Music2 /> : <VolumeX />}</button>
        </div>
      </header>

      {view === 'mission' && <main className="mission-view">
        <aside className="mission-rail">
          <div className="eyebrow"><span /> Today’s contacts</div>
          <h2>THE BRIDGE<br />CONVERSATIONS</h2>
          <p>Three talks. Infinite attempts. Your notes survive.</p>
          <div className="mission-list">
            {missionSteps.map((step, index) => <div key={step.id} className={`mission-step ${step.status}`}>
              <div className="step-index">{step.status === 'done' ? '✓' : `0${index + 1}`}</div>
              <div><small>{step.status === 'done' ? 'ACCORD REACHED' : step.status === 'active' ? 'IN CONVERSATION' : 'WAITING'}</small><strong>{step.envoy}</strong><span>{step.location}</span></div>
              {step.status === 'locked' && <LockKeyhole />}
            </div>)}
          </div>
          <div className="automation-card"><Code2 /><div><span>DECISION PROGRAM</span><strong>NOT YET DRAFTED</strong><small>Manual fieldwork first</small></div><LockKeyhole /></div>
        </aside>

        <section className="contact-stage">
          <div className="stage-head">
            <div><div className="eyebrow"><span /> First delegate</div><h1>{encounter.envoy}</h1><p>{encounter.designation} <i>•</i> {encounter.location}</p></div>
            <div className={`affiliation ${factionKnown ? 'known' : ''}`}><small>LIKELY AFFILIATION</small><strong>{factionKnown ? (encounter.faction === 'resonant' ? 'RESONANT' : 'EXACT') : 'UNRESOLVED'}</strong><span>{factionKnown ? 'HIGH CONFIDENCE' : `${game.intel}/2 INSIGHTS`}</span></div>
          </div>
          <div className="contact-body">
            <div className="portrait-wrap">
              <AlienPortrait encounter={encounter} speaking={game.phase === 'talk'} />
              <div className={`signal-chip ${signal.kind}`}><AudioLines /><div><small>CURRENT SIGNAL</small><strong>{signal.label}</strong></div><b className="signal-pressure">+{signal.pressure} TENSION</b></div>
            </div>
            <div className="transcript-panel">
              <div className="panel-title"><Terminal /><span>CONVERSATION NOTES</span><i>WRITING</i></div>
              <div className="transcript">
                <p className="intro-copy">{encounter.intro}</p>
                {game.logs.map((log, index) => <div className={`log ${log.kind}`} key={`${index}-${log.text}`}><span>{log.kind === 'signal' ? encounter.envoy.split(' ')[0] : log.kind === 'response' ? 'NEGOTIATOR' : log.kind === 'intel' ? 'FIELD NOTE' : 'OFFICE'}</span><p>{log.text}</p></div>)}
                <div ref={logsEndRef} />
              </div>
              <div className="intel-strip"><Archive /><span>Recorded observations</span><div>{[0, 1, 2].map(n => <i key={n} className={game.intel > n ? 'filled' : ''} />)}</div><b>{game.intel}</b></div>
            </div>
          </div>
          <div className="status-row">
            <Meter label="ACCORD / TRUST" value={game.trust} max={encounter.target} tone="trust" />
            <div className="turn-counter"><small>EXCHANGE</small><strong>{Math.min(game.turn + 1, encounter.signals.length)} <span>/ {encounter.signals.length}</span></strong></div>
            <Meter label="DIPLOMATIC TENSION" value={game.tension} max={encounter.tensionLimit} tone="tension" />
          </div>
        </section>

        <aside className="hand-panel">
          <div className="hand-head"><div><span>YOUR RESPONSE</span><h2>Choose one method</h2></div><div className="deck-count"><span>{game.drawPile.length}</span><small>DRAW<br />PILE</small></div></div>
          <div className="hand-cards">
            {game.hand.map(cardId => <CardView key={cardId} card={cards[cardId]} selected={selected === cardId} disabled={game.phase !== 'talk'} onClick={() => setSelected(cardId)} />)}
          </div>
          <div className={`response-preview ${selectedCard ? 'ready' : ''}`}>
            {selectedCard && preview ? <>
              <div className="preview-top"><span>PROJECTED RESPONSE</span>{preview.matched && <b><Sparkles /> SIGNAL MATCH</b>}</div>
              <div className="preview-values"><span className={preview.trust > 0 ? 'plus' : ''}>+{preview.trust} TRUST</span><span className={preview.tension > 0 ? 'minus' : preview.tension < 0 ? 'plus' : ''}>{preview.tension > 0 ? '+' : ''}{preview.tension} TENSION <small>NET</small></span>{preview.intel > 0 && <span>+{preview.intel} INSIGHT</span>}</div>
              <button className="transmit" onClick={() => playCard(selectedCard.id)}>USE THIS METHOD <ChevronRight /></button>
            </> : <><Satellite /><p>Select one of the two drawn methods.<br /><span>The other remains in hand.</span></p></>}
          </div>
          <div className="manual-note"><ShieldCheck /><span><b>MANUAL FIELDWORK</b> Every outcome is shown for validation.</span></div>
        </aside>

        {game.phase !== 'talk' && <div className="result-overlay">
          <div className={`result-modal ${game.phase}`}>
            {game.phase === 'reward' && <>
              <div className="result-icon"><Sparkles /></div><div className="eyebrow"><span /> ACCORD REACHED</div>
              <h2>A new method<br />survives the loop.</h2><p>Choose one response to add to your permanent fieldbook. Rebuild your six-card deck before the next contact.</p>
              <div className="reward-cards">{encounter.rewards.map(id => <CardView key={id} card={cards[id]} compact onClick={() => chooseReward(id)} />)}</div>
              <small className="choose-note">CHOOSE ONE • THE OTHERS ARE LOST TO THIS TIMELINE</small>
            </>}
            {game.phase === 'failed' && <>
              <div className="result-icon danger"><X /></div><div className="eyebrow danger"><span /> LINK COLLAPSED</div>
              <h2>This version of the<br />conversation is over.</h2><p>Your deck and recovered methods persist. Reset the chamber or reorder your draw before approaching {encounter.envoy} again.</p>
              <button className="primary-action" onClick={restartTalk}><RotateCcw /> BEGIN NEXT ATTEMPT</button>
              <button className="text-action" onClick={() => setView('workshop')}>REBUILD DECK FIRST</button>
            </>}
            {game.phase === 'complete' && <>
              <div className="result-icon"><ShieldCheck /></div><div className="eyebrow"><span /> NULL PROTOCOL COMPLETE</div>
              <h2>Two voices.<br />One fragile accord.</h2><p>You found the split hidden inside the delegation—and taught a machine to negotiate with both halves. For now, the loop can end.</p>
              <div className="final-stats"><div><b>{loop}</b><span>FINAL ATTEMPT</span></div><div><b>{unlocked.length}</b><span>METHODS</span></div><div><b>3</b><span>ACCORDS</span></div></div>
              <button className="primary-action" onClick={restartCampaign}><RotateCcw /> BEGIN ANOTHER TIMELINE</button>
            </>}
          </div>
        </div>}

        {DEBUG && <div className="debug-tools"><b>DEBUG</b><button onClick={() => setGame(g => ({ ...g, trust: Math.max(0, encounter.target - 1) }))}>Near win</button><button onClick={() => setGame(g => ({ ...g, intel: 3 }))}>Reveal</button><button onClick={() => setGame(g => ({ ...g, phase: game.encounterIndex === 2 ? 'complete' : 'reward' }))}><FastForward /> Resolve</button></div>}
      </main>}

      {view === 'workshop' && <main className="workshop-view">
        <section className="workshop-head"><div><div className="eyebrow"><span /> Prepared techniques</div><h1>DECK OF METHODS</h1><p>Choose and order six methods for the next contact. Draw order runs left to right.</p></div><div className={`deck-requirement ${deck.length === 6 ? 'valid' : ''}`}><span>{deck.length}</span><div><b>/ 6 METHODS</b><small>{deck.length === 6 ? 'LOADOUT VALID' : 'SELECT SIX TO DEPLOY'}</small></div></div></section>
        <section className="deck-workspace">
          <div className="active-deck"><div className="section-title"><div><small>ACTIVE LOADOUT • DRAW LEFT TO RIGHT</small><h2>Negotiator 01</h2></div><button onClick={() => setDeck(startingDeck)}><RotateCcw /> RESET</button></div>
            <div className="deck-slots">{Array.from({ length: 6 }).map((_, index) => deck[index] ? <div className="slot-wrap" key={deck[index]}><CardView card={cards[deck[index]]} compact onClick={() => toggleDeckCard(deck[index])} /><button className="remove-card" onClick={() => toggleDeckCard(deck[index])}><X /></button><div className="slot-order"><button disabled={index === 0} onClick={() => moveDeckCard(index, -1)}>←</button><span>DRAW {index + 1}</span><button disabled={index === deck.length - 1} onClick={() => moveDeckCard(index, 1)}>→</button></div></div> : <div className="empty-slot" key={`slot-${index}`}><span>+</span><small>EMPTY SLOT</small></div>)}</div>
            <button className="deploy-button" disabled={deck.length !== 6} onClick={applyDeck}><Bot /> PREPARE FOR CONVERSATION <ChevronRight /></button>
          </div>
          <div className="library"><div className="section-title"><div><small>FIELD NOTEBOOK</small><h2>Known Methods</h2></div><span className="owned-count">{unlocked.length} / {allCardIds.length} RECOVERED</span></div>
            <div className="library-grid">{allCardIds.map(id => unlocked.includes(id) ? <div className={`library-item ${deck.includes(id) ? 'in-deck' : ''}`} key={id}><CardView card={cards[id]} compact onClick={() => toggleDeckCard(id)} /><span className="deck-tag">{deck.includes(id) ? 'IN DECK' : deck.length < 6 ? '+ ADD' : 'DECK FULL'}</span></div> : <div className="locked-card" key={id}><LockKeyhole /><strong>UNKNOWN METHOD</strong><span>Reach accord to recover</span></div>)}</div>
          </div>
        </section>
      </main>}

      {view === 'archive' && <main className="archive-view">
        <div className="archive-header"><div className="eyebrow"><span /> Notes that survive the loop</div><h1>CONTACT FIELDBOOK</h1><p>Observations recovered by your negotiators across discarded timelines.</p></div>
        <div className="archive-grid">{encounters.map((item, index) => {
          const discovered = index < game.encounterIndex || (index === game.encounterIndex && game.intel >= 2) || DEBUG
          return <article className={discovered ? '' : 'undiscovered'} key={item.id}>
            <div className="archive-portrait">{discovered ? <AlienPortrait encounter={item} speaking={false} /> : <CircleHelp />}</div>
            <div className="archive-copy"><small>CONTACT 0{index + 1}</small><h2>{discovered ? item.envoy : 'UNRESOLVED ENTITY'}</h2><span>{discovered ? item.designation : 'Insufficient observation'}</span>
              <dl><div><dt>AFFILIATION</dt><dd>{discovered ? item.faction.toUpperCase() : '—'}</dd></div><div><dt>TRUST VECTOR</dt><dd>{discovered ? (item.faction === 'resonant' ? 'RITUAL / WARMTH' : 'PROOF / LIMITS') : '—'}</dd></div></dl>
              <p>{discovered ? (item.faction === 'resonant' ? 'Responds to relational signals, shared rituals, and deliberate vulnerability.' : 'Responds to verifiable claims, coherent boundaries, and formal patterns.') : 'Play observation methods during contact to classify this entity.'}</p>
            </div>
          </article>})}</div>
      </main>}

      {help && <div className="help-overlay" onClick={() => setHelp(false)}><div className="help-modal" onClick={event => event.stopPropagation()}><button className="close-help" onClick={() => setHelp(false)}><X /></button><div className="eyebrow"><span /> FIELD MANUAL</div><h2>Read the signal.<br />Choose the response.</h2><ol><li><b>Reach Trust</b><span>Fill the green Accord meter before exchanges run out.</span></li><li><b>Watch Net Tension</b><span>Each signal adds its listed pressure to your card. A filled red meter collapses the link.</span></li><li><b>Plan the Draw</b><span>Your first two methods form the hand. Each play draws the next card from left to right.</span></li><li><b>Keep Better Cards</b><span>Later contacts require recovered methods. Choose one reward, then rebuild exactly six.</span></li></ol><button className="primary-action" onClick={() => setHelp(false)}>RETURN TO CONTACT</button></div></div>}
    </div>
  )
}

export default App
