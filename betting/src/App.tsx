import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BASE = import.meta.env.BASE_URL
const params = new URLSearchParams(location.search)
const DEBUG = params.get('debug') === 'true'
const MUSIC_DISABLED = params.get('music') === 'off'

const MAX_MINUTES = 3 * 12 * 60
const BET_MINUTES = 5

type Scene = 'world' | 'fox' | 'rabbit' | 'ledger' | 'portrait' | 'tonic' | 'ending' | 'art'
type ArtKey = 'sunny' | 'rain' | 'summer'
type GameKey = 'fox' | 'rabbit'
type Reaction = 'neutral' | 'win' | 'lose'
type Stats = Record<GameKey, { plays: number; wins: number; wagered: number; returned: number }>
type Point = { x: number; y: number }

type Place = {
  id: Scene | 'ad-ledger' | 'ad-portrait' | 'ad-tonic' | 'closed'
  x: number
  y: number
  title: string
  subtitle: string
  kind: 'stall' | 'ad' | 'closed' | 'shop'
}

const ART: Record<ArtKey, { label: string; note: string; fox: string; rabbit: string }> = {
  sunny: {
    label: 'Bright midway',
    note: 'Warm late-morning midway',
    fox: 'art/stall-concepts/fox-d-sunny.webp',
    rabbit: 'art/stall-concepts/rabbit-d-sunny.webp',
  },
  rain: {
    label: 'After the rain',
    note: 'Soft daylight at the carnival edge',
    fox: 'art/stall-concepts/fox-e-after-rain.webp',
    rabbit: 'art/stall-concepts/rabbit-e-after-rain.webp',
  },
  summer: {
    label: 'High summer',
    note: 'Crisp sun and turquoise canvas',
    fox: 'art/stall-concepts/fox-f-high-summer.webp',
    rabbit: 'art/stall-concepts/rabbit-f-high-summer.webp',
  },
}

const basePlaces: Place[] = [
  { id: 'fox', x: 21, y: 20, title: 'The Silver Spin', subtitle: '1 win in 5, if that', kind: 'stall' },
  { id: 'rabbit', x: 78, y: 22, title: "Rabbit's Even Chance", subtitle: 'A generous 3 wins in 5', kind: 'stall' },
  { id: 'closed', x: 39, y: 25, title: 'Turtle Derby', subtitle: 'Closed for rapidity', kind: 'closed' },
  { id: 'closed', x: 61, y: 29, title: "Crow's High Striker", subtitle: 'Testing the hammer', kind: 'closed' },
  { id: 'closed', x: 50, y: 49, title: 'The Lucky Lantern', subtitle: 'Illuminating soon', kind: 'closed' },
  { id: 'ad-ledger', x: 17, y: 70, title: 'Practical Ledgers', subtitle: 'Observe averages responsibly', kind: 'ad' },
  { id: 'ad-portrait', x: 50, y: 77, title: 'Marvelous Moon Portraits', subtitle: 'Meet your better profile', kind: 'ad' },
  { id: 'ad-tonic', x: 83, y: 68, title: "Dr. Stoat's Tonic", subtitle: 'Confidence, vigorously bottled', kind: 'ad' },
]

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function money(value: number) {
  return `$${value.toFixed(0)}`
}

function timeLabel(minutes: number) {
  if (minutes >= MAX_MINUTES) return 'Carnival closed'
  const day = Math.floor(minutes / 720) + 1
  const inDay = minutes % 720
  const total = 9 * 60 + inDay
  const hour = Math.floor(total / 60)
  const minute = total % 60
  const shown = hour > 12 ? hour - 12 : hour
  return `DAY ${day} · ${shown}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

function useCarnivalMusic() {
  const [on, setOn] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current)
    timer.current = null
    audio.current?.close()
    audio.current = null
    setOn(false)
  }, [])

  const toggle = useCallback(() => {
    if (on) return stop()
    const ctx = new AudioContext()
    audio.current = ctx
    const notes = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2]
    let i = 0
    const play = () => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = notes[i++ % notes.length]
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.45)
    }
    play()
    timer.current = window.setInterval(play, 520)
    setOn(true)
  }, [on, stop])

  useEffect(() => stop, [stop])
  return { on, toggle }
}

export default function App() {
  const [scene, setScene] = useState<Scene>('world')
  const [returnScene, setReturnScene] = useState<Scene>('world')
  const [art, setArt] = useState<ArtKey>('summer')
  const [balance, setBalance] = useState(100)
  const [minutes, setMinutes] = useState(0)
  const [bet, setBet] = useState(5)
  const [reaction, setReaction] = useState<Reaction>('neutral')
  const [result, setResult] = useState('The carnival has made several claims.')
  const [stats, setStats] = useState<Stats>({
    fox: { plays: 0, wins: 0, wagered: 0, returned: 0 },
    rabbit: { plays: 0, wins: 0, wagered: 0, returned: 0 },
  })
  const [ledger, setLedger] = useState(false)
  const [portrait, setPortrait] = useState(false)
  const [tonic, setTonic] = useState(false)
  const [revealed, setRevealed] = useState<string[]>([])
  const [player, setPlayer] = useState<Point>({ x: 50, y: 56 })
  const [target, setTarget] = useState<Point | null>(null)
  const [gaze, setGaze] = useState<{ id: string; progress: number } | null>(null)
  const randomSeed = useRef(Number(params.get('seed')) || 481516)
  const music = useCarnivalMusic()

  const random = useCallback(() => {
    randomSeed.current = (randomSeed.current * 1664525 + 1013904223) >>> 0
    return randomSeed.current / 4294967296
  }, [])

  const places = useMemo(() => {
    const shops: Place[] = []
    if (revealed.includes('ad-ledger')) shops.push({ id: 'ledger', x: 17, y: 57, title: 'Practical Ledgers', subtitle: 'Owl accounting, while supplies last', kind: 'shop' })
    if (revealed.includes('ad-portrait')) shops.push({ id: 'portrait', x: 50, y: 65, title: 'Moon Portraits', subtitle: 'Ornate. Accurate-ish.', kind: 'shop' })
    if (revealed.includes('ad-tonic')) shops.push({ id: 'tonic', x: 83, y: 55, title: "Dr. Stoat's Tonic", subtitle: 'Uncommonly sparkling', kind: 'shop' })
    return [...basePlaces, ...shops]
  }, [revealed])

  const nearest = useMemo(() => {
    return places
      .map((place) => ({ place, d: distance(player, place) }))
      .filter(({ place, d }) => d < (place.kind === 'ad' ? 10 : 8))
      .sort((a, b) => a.d - b.d)[0]?.place
  }, [places, player])

  const enter = useCallback((place?: Place) => {
    if (!place || place.kind === 'closed' || place.kind === 'ad') return
    setScene(place.id as Scene)
    setReaction('neutral')
    setResult(place.id === 'fox' ? '“Honestly? One spin in five pays. On a charitable day.”' : place.id === 'rabbit' ? '“Three in five. Practically wages.”' : '')
  }, [])

  useEffect(() => {
    if (scene !== 'world') return
    const keys = new Set<string>()
    let frame = 0
    let last = performance.now()
    const down = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase())
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearest) enter(nearest)
    }
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase())
    const tick = (now: number) => {
      const dt = Math.min(32, now - last) / 1000
      last = now
      let dx = 0
      let dy = 0
      if (keys.has('a') || keys.has('arrowleft')) dx--
      if (keys.has('d') || keys.has('arrowright')) dx++
      if (keys.has('w') || keys.has('arrowup')) dy--
      if (keys.has('s') || keys.has('arrowdown')) dy++
      setPlayer((old) => {
        let next = old
        if (dx || dy) {
          const length = Math.hypot(dx, dy)
          next = { x: old.x + (dx / length) * 23 * dt, y: old.y + (dy / length) * 23 * dt }
          setTarget(null)
        } else if (target) {
          const vx = target.x - old.x
          const vy = target.y - old.y
          const length = Math.hypot(vx, vy)
          if (length < 0.5) {
            setTarget(null)
            return target
          }
          next = { x: old.x + (vx / length) * Math.min(length, 18 * dt), y: old.y + (vy / length) * Math.min(length, 18 * dt) }
        }
        return { x: Math.max(4, Math.min(96, next.x)), y: Math.max(7, Math.min(90, next.y)) }
      })
      frame = requestAnimationFrame(tick)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    frame = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      cancelAnimationFrame(frame)
    }
  }, [enter, nearest, scene, target])

  useEffect(() => {
    if (scene !== 'world') return
    const ad = places.find((p) => p.kind === 'ad' && distance(player, p) < 9 && !revealed.includes(p.id))
    if (!ad || target) {
      setGaze(null)
      return
    }
    setGaze((old) => old?.id === ad.id ? old : { id: ad.id, progress: 0 })
    const timer = window.setInterval(() => {
      setGaze((old) => {
        if (!old || old.id !== ad.id) return old
        const progress = old.progress + 4
        if (progress >= 100) {
          setRevealed((items) => [...items, ad.id])
          setResult(`The advertisement appears satisfied. A shop has arrived.`)
          return null
        }
        return { ...old, progress }
      })
    }, 100)
    return () => clearInterval(timer)
  }, [places, player, revealed, scene, target])

  useEffect(() => {
    if (scene === 'fox' || scene === 'rabbit') setReaction('neutral')
  }, [scene])

  useEffect(() => {
    if (minutes >= MAX_MINUTES && scene !== 'ending') setScene('ending')
  }, [minutes, scene])

  useEffect(() => {
    window.__BAD_BET__ = {
      getState: () => ({ scene, balance, minutes, stats, ledger, revealed, player, art }),
      travel: (x: number, y: number) => setPlayer({ x, y }),
      open: (next: Scene) => setScene(next),
    }
  }, [art, balance, ledger, minutes, player, revealed, scene, stats])

  const playBets = (game: GameKey, count: number) => {
    let cash = balance
    let elapsed = minutes
    let played = 0
    let wins = 0
    let returned = 0
    let lastWin = false
    while (played < count && cash >= bet && elapsed < MAX_MINUTES) {
      cash -= bet
      const chance = game === 'fox' ? 0.42 : 0.4
      lastWin = random() < chance
      if (lastWin) {
        const payout = game === 'fox' ? bet * 3 : bet * 2
        cash += payout
        returned += payout
        wins++
      }
      played++
      elapsed += BET_MINUTES
    }
    setBalance(cash)
    setMinutes(elapsed)
    setStats((old) => ({
      ...old,
      [game]: {
        plays: old[game].plays + played,
        wins: old[game].wins + wins,
        wagered: old[game].wagered + played * bet,
        returned: old[game].returned + returned,
      },
    }))
    const net = cash - balance
    if (!played) {
      setReaction('neutral')
      setResult('Your purse declines the opportunity.')
    } else {
      setReaction(net >= 0 ? 'win' : 'lose')
      if (played === 1) setResult(lastWin ? (game === 'fox' ? `Three times back. The fox looks pleasantly surprised.` : `You win. Rabbit looks professionally delighted.`) : (game === 'fox' ? `Nothing. “Yes. Usually that.”` : `The coin disagrees with the advertisement.`))
      else setResult(`${played} wagers: ${wins} paid, ${played - wins} did not. Net ${net >= 0 ? '+' : ''}${money(net)}.`)
    }
  }

  const reset = () => {
    setBalance(100)
    setMinutes(0)
    setStats({ fox: { plays: 0, wins: 0, wagered: 0, returned: 0 }, rabbit: { plays: 0, wins: 0, wagered: 0, returned: 0 } })
    setLedger(false)
    setPortrait(false)
    setTonic(false)
    setRevealed([])
    setPlayer({ x: 50, y: 56 })
    setScene('world')
    randomSeed.current = Number(params.get('seed')) || 481516
  }

  const openArt = () => {
    setReturnScene(scene)
    setScene('art')
  }

  return (
    <main className={`app scene-${scene}`}>
      <header className="hud">
        <button className="brand" onClick={() => setScene('world')} aria-label="Return to carnival map">
          <span>BAD</span> BET
        </button>
        <div className="time"><span>{timeLabel(minutes)}</span><i style={{ width: `${Math.min(100, (minutes / MAX_MINUTES) * 100)}%` }} /></div>
        <div className="cash" aria-label={`Balance ${money(balance)}`}><small>PURSE</small>{money(balance)}</div>
        {portrait && <span className="portrait-badge" title="A marvelous portrait. It does nothing.">✦</span>}
        <button className="icon-button" onClick={openArt}>ART STUDY</button>
        <button className="icon-button music" disabled={MUSIC_DISABLED} onClick={music.toggle}>{MUSIC_DISABLED ? 'MUSIC OFF' : music.on ? 'MUSIC ON' : 'MUSIC OFF'}</button>
      </header>

      {scene === 'world' && (
        <World
          places={places}
          player={player}
          target={target}
          nearest={nearest}
          gaze={gaze}
          revealed={revealed}
          result={result}
          onMove={setTarget}
          onEnter={enter}
        />
      )}
      {(scene === 'fox' || scene === 'rabbit') && (
        <BettingStall
          game={scene}
          art={art}
          reaction={reaction}
          balance={balance}
          bet={bet}
          result={result}
          stats={stats}
          hasLedger={ledger}
          onBet={setBet}
          onPlay={(count) => playBets(scene, count)}
          onLeave={() => setScene('world')}
        />
      )}
      {(scene === 'ledger' || scene === 'portrait' || scene === 'tonic') && (
        <Shop
          type={scene}
          balance={balance}
          owned={scene === 'ledger' ? ledger : scene === 'portrait' ? portrait : tonic}
          onBuy={(cost) => {
            if (balance < cost) return setResult('The shopkeeper recommends returning with additional money.')
            setBalance((cash) => cash - cost)
            if (scene === 'ledger') setLedger(true)
            if (scene === 'portrait') setPortrait(true)
            if (scene === 'tonic') setTonic(true)
            setResult(scene === 'ledger' ? 'The ledger quietly begins remembering everything.' : scene === 'portrait' ? 'It is a very flattering expense.' : 'You feel exactly as lucky as before, but more carbonated.')
          }}
          onLeave={() => setScene('world')}
          result={result}
        />
      )}
      {scene === 'art' && <ArtStudy selected={art} onSelect={setArt} onClose={() => setScene(returnScene === 'art' ? 'world' : returnScene)} />}
      {scene === 'ending' && <Ending balance={balance} stats={stats} ledger={ledger} tonic={tonic} onReset={reset} />}

      {DEBUG && (
        <aside className="debug-panel">
          DEBUG
          <button onClick={() => setBalance((v) => v + 100)}>+$100</button>
          <button onClick={() => setRevealed(['ad-ledger', 'ad-portrait', 'ad-tonic'])}>Reveal shops</button>
          <button onClick={() => setMinutes((v) => Math.min(MAX_MINUTES, v + 720))}>+1 day</button>
          <button onClick={() => setScene('ending')}>End</button>
        </aside>
      )}
    </main>
  )
}

function World({ places, player, target, nearest, gaze, revealed, result, onMove, onEnter }: {
  places: Place[]
  player: Point
  target: Point | null
  nearest?: Place
  gaze: { id: string; progress: number } | null
  revealed: string[]
  result: string
  onMove: (point: Point) => void
  onEnter: (place: Place) => void
}) {
  return (
    <section className="world-wrap">
      <div
        className="world"
        aria-label="Carnival map. Click anywhere to walk, or use WASD."
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('.place')) return
          const box = e.currentTarget.getBoundingClientRect()
          onMove({ x: ((e.clientX - box.left) / box.width) * 100, y: ((e.clientY - box.top) / box.height) * 100 })
        }}
      >
        <div className="sun" />
        <div className="tent big-tent"><i /><i /><i /></div>
        <div className="path path-a" /><div className="path path-b" /><div className="path path-c" />
        <div className="bunting b1">◆　◆　◆　◆　◆　◆　◆　◆</div>
        <div className="bunting b2">◆　◆　◆　◆　◆　◆</div>
        {places.map((place, index) => (
          <button
            key={`${place.id}-${index}`}
            className={`place ${place.kind} ${nearest === place ? 'near' : ''} ${place.kind === 'shop' ? 'materialized' : ''}`}
            style={{ left: `${place.x}%`, top: `${place.y}%` }}
            onClick={() => {
              if (distance(player, place) < 9) onEnter(place)
              else onMove({ x: place.x, y: place.y + (place.kind === 'ad' ? 5 : 7) })
            }}
          >
            <span className="place-shape">{place.kind === 'ad' ? '▥' : place.kind === 'closed' ? '▤' : place.kind === 'shop' ? '⌂' : '▲'}</span>
            <strong>{place.title}</strong>
            <small>{place.subtitle}</small>
            {place.kind === 'ad' && revealed.includes(place.id) && <em>ADVERTISEMENT SATISFIED</em>}
            {gaze?.id === place.id && <span className="gaze"><i style={{ width: `${gaze.progress}%` }} /></span>}
          </button>
        ))}
        <div className={`player ${target ? 'walking' : ''}`} style={{ left: `${player.x}%`, top: `${player.y}%` }}>
          <span className="player-hat">◆</span><span className="player-head" /><span className="player-body" /><i className="player-shadow" />
        </div>
      </div>
      <div className="world-caption">
        <p>{nearest?.kind === 'ad' && !revealed.includes(nearest.id) ? 'Stand still. Give the advertisement your complete attention.' : nearest?.kind === 'closed' ? `${nearest.title} is professionally unavailable.` : nearest ? `Press E or tap again to visit ${nearest.title}.` : result}</p>
        <span>CLICK TO WALK · WASD / ARROWS · E TO ENTER</span>
      </div>
    </section>
  )
}

function BettingStall({ game, art, reaction, balance, bet, result, stats, hasLedger, onBet, onPlay, onLeave }: {
  game: GameKey
  art: ArtKey
  reaction: Reaction
  balance: number
  bet: number
  result: string
  stats: Stats
  hasLedger: boolean
  onBet: (bet: number) => void
  onPlay: (count: number) => void
  onLeave: () => void
}) {
  const fox = game === 'fox'
  const data = stats[game]
  const rate = data.plays ? Math.round((data.wins / data.plays) * 100) : 0
  const roi = data.wagered ? data.returned / data.wagered : 0
  return (
    <section className={`stall-screen ${game}`}>
      <div className="stall-artboard">
        <img className="stall-background" src={`${BASE}art/stalls/backgrounds/${game}-evening.webp`} alt={`A small artificially lit evening carnival ${fox ? 'slot-machine' : 'coin-toss'} booth`} />
        <img key={`${game}-${reaction}`} className={`stall-character ${reaction}`} src={`${BASE}art/stalls/characters/${game}-${reaction}.png`} alt={`${fox ? 'Female fox' : 'Male tattooed rabbit'} operator reacting ${reaction === 'neutral' ? 'attentively' : reaction === 'win' ? 'to the player winning' : 'to the player losing'}`} />
      </div>
      <div className="stall-vignette" />
      <button className="back" onClick={onLeave}>← MIDWAY</button>
      <div className="dealer-copy">
        <small>{fox ? 'THE SILVER SPIN' : "RABBIT'S EVEN CHANCE"}</small>
        <h1>{fox ? '“It is not a very generous machine.”' : '“Three in five. You have my word.”'}</h1>
        <p>{fox ? 'Claimed chance: 1 in 5 · Winners return 3×' : 'Claimed chance: 3 in 5 · Winners return 2×'}</p>
      </div>
      <div className="bet-console">
        <p className="result" aria-live="polite">{result}</p>
        <div className="bet-row">
          <div className="amounts">
            <span>WAGER</span>
            {[1, 5, 10, 25, 50].map((n) => <button className={bet === n ? 'selected' : ''} key={n} onClick={() => onBet(n)} disabled={n > balance}>{money(n)}</button>)}
          </div>
          <div className="plays">
            <button className="primary" onClick={() => onPlay(1)} disabled={balance < bet}>PLAY ONCE</button>
            <button onClick={() => onPlay(10)} disabled={balance < bet}>×10</button>
            <button onClick={() => onPlay(25)} disabled={balance < bet}>×25</button>
          </div>
        </div>
        {hasLedger ? (
          <div className="ledger-strip">
            <span><b>{data.plays}</b> wagers</span>
            <span><b>{data.wins}</b> paid</span>
            <span><b>{rate}%</b> observed win rate</span>
            <span><b>{roi.toFixed(2)}×</b> returned per $1</span>
          </div>
        ) : <div className="ledger-locked">No records kept. Your recollection remains proudly unverified.</div>}
      </div>
    </section>
  )
}

const SHOP_DATA = {
  ledger: { icon: '▦', title: 'Practical Ledgers & Forecasting', keeper: 'OWL, SOLE PROPRIETOR', cost: 18, copy: 'Records every wager, result, observed win rate, and average return. Astonishingly unglamorous. Potentially useful.', buy: 'BUY LEDGER — $18' },
  portrait: { icon: '◒', title: 'Marvelous Moon Portraits', keeper: 'LUNAR LIKENESSES WHILE-U-WAIT', cost: 25, copy: 'An ornate portrait revealing the beauty of your inner beast. Your outer finances remain unchanged.', buy: 'SIT FOR PORTRAIT — $25' },
  tonic: { icon: '⚗', title: "Dr. Stoat's Invigorating Tonic", keeper: 'FORMULATED WITH CONFIDENCE', cost: 30, copy: 'Sparkling botanical confidence in a handsome bottle. No specific claims regarding chance are legally available.', buy: 'DRINK TONIC — $30' },
}

function Shop({ type, balance, owned, onBuy, onLeave, result }: { type: 'ledger' | 'portrait' | 'tonic'; balance: number; owned: boolean; onBuy: (cost: number) => void; onLeave: () => void; result: string }) {
  const shop = SHOP_DATA[type]
  return (
    <section className={`shop-screen ${type}`}>
      <button className="back dark" onClick={onLeave}>← MIDWAY</button>
      <div className="shop-card">
        <div className="shop-icon">{shop.icon}</div>
        <small>{shop.keeper}</small>
        <h1>{shop.title}</h1>
        <p>{shop.copy}</p>
        <div className="shop-placeholder">PROCEDURAL ART PLACEHOLDER</div>
        <button className="shop-buy" disabled={owned || balance < shop.cost} onClick={() => onBuy(shop.cost)}>{owned ? 'ALREADY PURCHASED' : shop.buy}</button>
        <em>{result}</em>
      </div>
    </section>
  )
}

function ArtStudy({ selected, onSelect, onClose }: { selected: ArtKey; onSelect: (art: ArtKey) => void; onClose: () => void }) {
  return (
    <section className="art-study">
      <div className="art-heading">
        <div><small>STALL ART DIRECTION · DAYLIGHT PASS</small><h1>Choose a shared atmosphere</h1><p>The fox and rabbit stay paired so the carnival feels like one place. This is a temporary in-game review tool.</p></div>
        <button className="close-art" onClick={onClose}>DONE</button>
      </div>
      <div className="concepts">
        {(Object.keys(ART) as ArtKey[]).map((key) => (
          <article className={selected === key ? 'selected' : ''} key={key}>
            <button onClick={() => onSelect(key)}>
              <div className="pair"><img src={`${BASE}${ART[key].fox}`} alt={`Female fox stall, ${ART[key].label}`} /><img src={`${BASE}${ART[key].rabbit}`} alt={`Male rabbit stall, ${ART[key].label}`} /></div>
              <span><b>{ART[key].label}</b><small>{ART[key].note}</small><i>{selected === key ? 'IN USE' : 'USE THIS PAIR'}</i></span>
            </button>
          </article>
        ))}
      </div>
      <p className="art-note">All other game artwork remains procedural or placeholder pending approval of these stalls.</p>
    </section>
  )
}

function Ending({ balance, stats, ledger, tonic, onReset }: { balance: number; stats: Stats; ledger: boolean; tonic: boolean; onReset: () => void }) {
  const total = stats.fox.plays + stats.rabbit.plays
  const verdict = balance >= 175 ? 'THE CARNIVAL REGRETS YOUR ATTENTION TO DETAIL' : balance >= 100 ? 'YOU LEAVE WITH YOUR PURSE AND A SUSPICION' : balance > 0 ? 'A MODEST TUITION IN PROBABILITY' : 'THE CARNIVAL THANKS YOU FOR YOUR COMPLETE PARTICIPATION'
  return (
    <section className="ending">
      <div className="end-card">
        <small>AFTER THREE PERFECTLY REASONABLE DAYS</small>
        <h1>The tents are gone.</h1>
        <div className="final-money">{money(balance)}</div>
        <p>{verdict}</p>
        <div className="end-stats"><span>{total}<small>TOTAL WAGERS</small></span><span>{stats.fox.plays}<small>SILVER SPINS</small></span><span>{stats.rabbit.plays}<small>COIN TOSSES</small></span><span>{ledger ? 'YES' : 'NO'}<small>KEPT RECORDS</small></span></div>
        {tonic && <em>You remain invigorated.</em>}
        <button onClick={onReset}>RETURN NEXT SEASON</button>
      </div>
    </section>
  )
}

declare global {
  interface Window {
    __BAD_BET__: {
      getState: () => unknown
      travel: (x: number, y: number) => void
      open: (scene: Scene) => void
    }
  }
}
