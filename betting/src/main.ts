import Phaser from 'phaser'
import './styles.css'

const BASE = import.meta.env.BASE_URL
const params = new URLSearchParams(location.search)
const DEBUG = params.get('debug') === 'true'
const MUSIC_DISABLED = params.get('music') === 'off'
const MAX_MINUTES = 3 * 12 * 60
const BET_MINUTES = 5
const TEXT_RESOLUTION = Math.min(window.devicePixelRatio || 1, 2)
const FONTS = {
  display: 'Rye, Georgia, serif',
  body: '"Bree Serif", Georgia, serif',
  ui: '"Barlow Condensed", Arial, sans-serif',
}

type Mode = 'world' | 'fox' | 'rabbit' | 'ledger' | 'portrait' | 'tonic' | 'ending'
type GameKey = 'fox' | 'rabbit'
type Reaction = 'neutral' | 'win' | 'lose'
type Point = { x: number; y: number }
type Place = {
  id: Mode | 'ad-ledger' | 'ad-portrait' | 'ad-tonic' | 'closed'
  x: number
  y: number
  title: string
  subtitle: string
  kind: 'stall' | 'ad' | 'closed' | 'shop'
}
type BetCount = 1 | 5 | 10
type BetResult = { id: number; won: boolean; wager: number; payout: number; streak: number }
type GameStats = { plays: number; wins: number; wagered: number; returned: number; manualPlays: number }
type Stats = Record<GameKey, GameStats>

type State = {
  mode: Mode
  balance: number
  minutes: number
  bet: number
  reaction: Reaction
  result: string
  stats: Stats
  histories: Record<GameKey, BetResult[]>
  betCounts: Record<GameKey, BetCount>
  nextResultId: number
  ledger: boolean
  portrait: boolean
  tonic: boolean
  revealed: string[]
  player: Point
  target: Point | null
}

const COLORS = {
  ink: 0x21182f,
  cream: 0xffedbd,
  red: 0xc84438,
  gold: 0xefb64f,
  teal: 0x176d70,
  grass: 0x4ca571,
  path: 0xdfb970,
  pathEdge: 0xa97845,
}

const basePlaces: Place[] = [
  { id: 'fox', x: 21, y: 20, title: 'The Silver Spin', subtitle: 'WIN PAYS 3×', kind: 'stall' },
  { id: 'rabbit', x: 78, y: 22, title: "Rabbit's Generous Toss", subtitle: 'WIN PAYS 2×', kind: 'stall' },
  { id: 'closed', x: 39, y: 25, title: 'Turtle Derby', subtitle: 'CLOSED', kind: 'closed' },
  { id: 'closed', x: 61, y: 29, title: "Crow's High Striker", subtitle: 'CLOSED', kind: 'closed' },
  { id: 'closed', x: 50, y: 49, title: 'The Lucky Lantern', subtitle: 'CLOSED', kind: 'closed' },
  { id: 'ad-ledger', x: 17, y: 70, title: 'Practical Ledgers', subtitle: 'KEEP WATCHING', kind: 'ad' },
  { id: 'ad-portrait', x: 50, y: 77, title: 'Moon Portraits', subtitle: 'KEEP WATCHING', kind: 'ad' },
  { id: 'ad-tonic', x: 83, y: 68, title: "Dr. Stoat's Tonic", subtitle: 'KEEP WATCHING', kind: 'ad' },
]

const initialStats = (): Stats => ({
  fox: { plays: 0, wins: 0, wagered: 0, returned: 0, manualPlays: 0 },
  rabbit: { plays: 0, wins: 0, wagered: 0, returned: 0, manualPlays: 0 },
})

const initialState = (): State => ({
  mode: 'world', balance: 100, minutes: 0, bet: 5, reaction: 'neutral',
  result: 'Pick a game. Press your luck.', stats: initialStats(),
  histories: { fox: [], rabbit: [] }, betCounts: { fox: 1, rabbit: 1 }, nextResultId: 1,
  ledger: false, portrait: false, tonic: false, revealed: [],
  player: { x: 50, y: 56 }, target: null,
})

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const money = (value: number) => `$${value.toFixed(0)}`
const signedMoney = (value: number) => `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`
const placeKey = (place?: Place) => place ? `${place.id}:${place.title}` : ''

function timeLabel(minutes: number) {
  if (minutes >= MAX_MINUTES) return 'Carnival closed'
  const day = Math.floor(minutes / 720) + 1
  const total = 9 * 60 + minutes % 720
  const hour = Math.floor(total / 60)
  return `DAY ${day} · ${hour > 12 ? hour - 12 : hour}:${String(total % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

class CarnivalMusic {
  on = false
  private audio: AudioContext | null = null
  private timer: number | null = null

  toggle() {
    if (this.on) return this.stop()
    const ctx = new AudioContext()
    this.audio = ctx
    const notes = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2]
    let index = 0
    const play = () => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.value = notes[index++ % notes.length]
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.45)
    }
    play()
    this.timer = window.setInterval(play, 520)
    this.on = true
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    void this.audio?.close()
    this.audio = null
    this.on = false
  }
}

class BadBetScene extends Phaser.Scene {
  private state = initialState()
  private music = new CarnivalMusic()
  private randomSeed = Number(params.get('seed')) || 481516
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'e' | 'enter', Phaser.Input.Keyboard.Key>
  private placeContainers = new Map<string, Phaser.GameObjects.Container>()
  private playerContainer?: Phaser.GameObjects.Container
  private caption?: Phaser.GameObjects.Text
  private nearestKey = ''
  private gaze: { id: string; progress: number } | null = null
  private elapsed = 0
  private historyScroll: Record<GameKey, number> = { fox: 0, rabbit: 0 }
  private historyViews = new Map<GameKey, { strip: Phaser.GameObjects.Container; chips: Phaser.GameObjects.Container[]; latestX: number; maxOffset: number; left: number; right: number; top: number; bottom: number }>()
  private resultContainers = new Map<number, Phaser.GameObjects.Container>()

  constructor() { super('BadBet') }

  preload() {
    for (const game of ['fox', 'rabbit']) {
      this.load.image(`${game}-background`, `${BASE}art/stalls/backgrounds/${game}-evening.webp`)
      for (const reaction of ['neutral', 'win', 'lose']) {
        this.load.image(`${game}-${reaction}`, `${BASE}art/stalls/characters/${game}-${reaction}.png`)
      }
    }
  }

  create() {
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W, a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S, d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E, enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    }) as Record<'w' | 'a' | 's' | 'd' | 'e' | 'enter', Phaser.Input.Keyboard.Key>
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleWorldPointer(pointer))
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const game = this.state.mode === 'fox' || this.state.mode === 'rabbit' ? this.state.mode : null
      const view = game ? this.historyViews.get(game) : null
      if (!game || !view || pointer.x < view.left || pointer.x > view.right || pointer.y < view.top || pointer.y > view.bottom) return
      this.scrollHistory(game, -deltaY * .55)
    })
    this.scale.on('resize', () => this.renderMode())
    this.renderMode()
    this.installDebugApi()
  }

  update(_time: number, delta: number) {
    if (this.state.mode !== 'world' || !this.playerContainer || !this.keys) return
    const dt = Math.min(delta, 32) / 1000
    this.elapsed += delta
    let dx = 0
    let dy = 0
    if (this.cursors?.left.isDown || this.keys.a.isDown) dx--
    if (this.cursors?.right.isDown || this.keys.d.isDown) dx++
    if (this.cursors?.up.isDown || this.keys.w.isDown) dy--
    if (this.cursors?.down.isDown || this.keys.s.isDown) dy++

    if (Phaser.Input.Keyboard.JustDown(this.keys.e) || Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
      const nearest = this.nearestPlace()
      if (nearest) this.enter(nearest)
    }

    const wasTargeting = Boolean(this.state.target)
    let next = this.state.player
    let walking = false
    if (dx || dy) {
      const length = Math.hypot(dx, dy)
      next = { x: next.x + dx / length * 23 * dt, y: next.y + dy / length * 23 * dt }
      walking = true
      this.state.target = null
    } else if (this.state.target) {
      const vx = this.state.target.x - next.x
      const vy = this.state.target.y - next.y
      const length = Math.hypot(vx, vy)
      if (length < 0.45) {
        next = this.state.target
        this.state.target = null
      } else {
        const step = Math.min(length, 18 * dt)
        next = { x: next.x + vx / length * step, y: next.y + vy / length * step }
        walking = true
      }
    }

    next = { x: clamp(next.x, 3, 97), y: clamp(next.y, 8, 93) }
    if (walking) this.state.player = this.resolveCollision(this.state.player, next)
    this.updatePlayerVisual(walking, dx)
    this.updateProximity()
    this.updateGaze(delta, walking || wasTargeting)
  }

  private get top() { return this.scale.height < 620 ? 64 : 76 }
  private get bottom() { return this.scale.height < 620 ? 72 : 82 }
  private get worldHeight() { return Math.max(240, this.scale.height - this.top - this.bottom) }

  private places() {
    const shops: Place[] = []
    if (this.state.revealed.includes('ad-ledger')) shops.push({ id: 'ledger', x: 17, y: 57, title: 'Practical Ledgers', subtitle: 'OPEN', kind: 'shop' })
    if (this.state.revealed.includes('ad-portrait')) shops.push({ id: 'portrait', x: 50, y: 65, title: 'Moon Portraits', subtitle: 'OPEN', kind: 'shop' })
    if (this.state.revealed.includes('ad-tonic')) shops.push({ id: 'tonic', x: 83, y: 55, title: "Dr. Stoat's Tonic", subtitle: 'OPEN', kind: 'shop' })
    return [...basePlaces, ...shops]
  }

  private random() {
    this.randomSeed = (this.randomSeed * 1664525 + 1013904223) >>> 0
    return this.randomSeed / 4294967296
  }

  private renderMode() {
    this.children.removeAll(true)
    this.placeContainers.clear()
    this.historyViews.clear()
    this.resultContainers.clear()
    this.playerContainer = undefined
    this.caption = undefined
    if (this.state.mode === 'world') this.renderWorld()
    else if (this.state.mode === 'fox' || this.state.mode === 'rabbit') this.renderStall(this.state.mode)
    else if (this.state.mode === 'ending') this.renderEnding()
    else this.renderShop(this.state.mode)
    this.renderHud()
    if (DEBUG) this.renderDebug()
    this.children.getAll().forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text) child.setResolution(TEXT_RESOLUTION)
    })
  }

  private renderHud() {
    const { width } = this.scale
    const h = this.top
    const graphics = this.add.graphics().setDepth(10000)
    graphics.fillStyle(COLORS.cream).fillRect(0, 0, width, h)
    graphics.fillStyle(COLORS.ink).fillRect(0, h - 4, width, 4)
    graphics.fillStyle(COLORS.gold).fillRect(0, h, width, 4)

    const compact = width < 720
    this.button(compact ? 45 : 70, h / 2 - 2, compact ? 76 : 112, 40, 'BAD BET', () => this.go('world'), {
      fill: COLORS.red, font: compact ? 17 : 21, family: FONTS.display, depth: 10001,
    })
    const timeX = compact ? 92 : 136
    const timeW = compact ? Math.min(210, width * 0.38) : Math.min(360, width * 0.34)
    const timeY = h / 2 - 15
    graphics.fillStyle(0x352340).fillRect(timeX, timeY, timeW, 30)
    graphics.lineStyle(2, COLORS.ink).strokeRect(timeX, timeY, timeW, 30)
    graphics.fillStyle(COLORS.red).fillRect(timeX + 2, timeY + 2, (timeW - 4) * Math.min(1, this.state.minutes / MAX_MINUTES), 26)
    this.add.text(timeX + timeW / 2, h / 2, timeLabel(this.state.minutes), {
      fontFamily: FONTS.ui, fontSize: compact ? '12px' : '14px', fontStyle: 'bold', color: '#ffffff', letterSpacing: 0.5,
    }).setOrigin(0.5).setDepth(10002)

    this.add.text(width - (compact ? 78 : 190), h / 2, compact ? money(this.state.balance) : `PURSE  ${money(this.state.balance)}`, {
      fontFamily: FONTS.body, fontSize: compact ? '22px' : '28px', color: '#21182f',
    }).setOrigin(0.5).setDepth(10002)
    if (!compact) this.button(width - 53, h / 2 - 2, 90, 31, MUSIC_DISABLED ? 'MUSIC OFF' : this.music.on ? 'MUSIC ON' : 'MUSIC OFF', () => {
      if (!MUSIC_DISABLED) this.music.toggle()
      this.renderMode()
    }, { fill: COLORS.cream, color: '#21182f', stroke: COLORS.ink, font: 12, depth: 10002 })
  }

  private renderWorld() {
    this.drawGround()
    this.drawScenery()
    this.places().forEach((place, index) => this.createPlace(place, index))
    this.createPlayer()
    const panel = this.add.rectangle(0, this.scale.height - this.bottom, this.scale.width, this.bottom, COLORS.ink).setOrigin(0).setDepth(9000)
    panel.setStrokeStyle(5, COLORS.gold)
    this.caption = this.add.text(28, this.scale.height - this.bottom / 2, this.captionCopy(), {
      fontFamily: FONTS.body, fontSize: `${clamp(this.scale.width / 58, 18, 24)}px`,
      color: '#fff2c4', wordWrap: { width: this.scale.width * 0.65 },
    }).setOrigin(0, 0.5).setDepth(9001)
    if (this.scale.width > 800) this.add.text(this.scale.width - 24, this.scale.height - this.bottom / 2, 'CLICK TO WALK   ·   WASD / ARROWS   ·   E TO ENTER', {
      fontFamily: FONTS.ui, fontSize: '13px', fontStyle: 'bold', color: '#cfc2d5', letterSpacing: 0.4,
    }).setOrigin(1, 0.5).setDepth(9001)
    this.updateProximity(true)
  }

  private drawGround() {
    const w = this.scale.width
    const h = this.worldHeight
    const g = this.add.graphics().setPosition(0, this.top).setDepth(-1000)
    g.fillStyle(COLORS.grass).fillRect(0, 0, w, h)
    g.fillStyle(0x276d61).fillRect(0, 0, w, h * 0.12)
    g.fillStyle(0x3d9270).fillTriangle(0, h * 0.12, w * 0.24, h * 0.035, w * 0.48, h * 0.12)
    g.fillStyle(0x358369).fillTriangle(w * 0.32, h * 0.12, w * 0.63, h * 0.02, w * 0.88, h * 0.12)
    g.fillStyle(0x2c765f).fillTriangle(w * 0.7, h * 0.12, w * 0.9, h * 0.05, w, h * 0.12)
    const loop = new Phaser.Curves.Ellipse(w * 0.5, h * 0.51, w * 0.43, h * 0.31)
    const loopPoints = loop.getPoints(90)
    g.lineStyle(Math.max(36, h * 0.085), COLORS.pathEdge).strokePoints(loopPoints, true)
    g.lineStyle(Math.max(29, h * 0.068), COLORS.path).strokePoints(loopPoints, true)
    const paths = [
      new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(w * .12, h * .63), new Phaser.Math.Vector2(w * .35, h * .48), new Phaser.Math.Vector2(w * .66, h * .48), new Phaser.Math.Vector2(w * .88, h * .4)),
      new Phaser.Curves.CubicBezier(new Phaser.Math.Vector2(w * .23, h * .48), new Phaser.Math.Vector2(w * .38, h * .6), new Phaser.Math.Vector2(w * .62, h * .7), new Phaser.Math.Vector2(w * .82, h * .82)),
    ]
    paths.forEach((path) => {
      const points = path.getPoints(45)
      g.lineStyle(Math.max(28, h * .064), COLORS.pathEdge).strokePoints(points)
      g.lineStyle(Math.max(22, h * .05), COLORS.path).strokePoints(points)
    })
    for (let i = 0; i < 100; i++) {
      const x = ((i * 83) % 997) / 997 * w
      const y = (.14 + ((i * 47) % 887) / 887 * .82) * h
      const size = 1 + y / h * 1.5
      g.fillStyle(i % 4 ? 0x2b8664 : 0xf0c658, .72).fillEllipse(x, y, size * 1.8, size)
    }
  }

  private drawScenery() {
    const w = this.scale.width
    const h = this.worldHeight
    const y0 = this.top
    const fence = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .135)
    fence.lineStyle(4, 0x164d48).lineBetween(w * .05, h * .145, w * .95, h * .145)
    for (let x = w * .06; x < w * .96; x += w * .055) {
      fence.fillStyle(0x244f47).fillRect(x - 3, h * .115, 6, h * .055)
      fence.fillStyle(COLORS.gold).fillTriangle(x - 4, h * .115, x + 4, h * .115, x, h * .1)
    }
    const tent = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .17)
    const tx = w * .5, ty = h * .2
    tent.fillStyle(0x713044).fillEllipse(tx, ty + h * .014, w * .14, h * .035)
    tent.fillStyle(0xf5dfad).fillTriangle(tx, ty - h * .13, tx - w * .07, ty, tx + w * .07, ty)
    tent.fillStyle(COLORS.red).fillTriangle(tx, ty - h * .13, tx - w * .045, ty, tx - w * .014, ty)
    tent.fillStyle(COLORS.red).fillTriangle(tx, ty - h * .13, tx + w * .014, ty, tx + w * .045, ty)
    tent.lineStyle(3, COLORS.ink).strokeTriangle(tx, ty - h * .13, tx - w * .07, ty, tx + w * .07, ty)
    tent.lineStyle(3, COLORS.ink).lineBetween(tx, ty - h * .13, tx, ty - h * .17)
    tent.fillStyle(COLORS.gold).fillTriangle(tx, ty - h * .17, tx + 18, ty - h * .155, tx, ty - h * .145)
    const bunting = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .22)
    const sx = w * .13, ex = w * .87, ry = h * .205
    bunting.lineStyle(2, COLORS.ink, .8).lineBetween(sx, ry, ex, ry + h * .025)
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Linear(sx, ex, i / 15), y = Phaser.Math.Linear(ry, ry + h * .025, i / 15)
      bunting.fillStyle(i % 2 ? COLORS.gold : COLORS.red).fillTriangle(x - 5, y, x + 5, y, x, y + 10)
    }
    const foreground = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .965)
    foreground.lineStyle(7, 0x28584b).lineBetween(0, h * .96, w, h * .98)
    for (let x = w * .02; x < w; x += w * .1) {
      foreground.fillStyle(0x183f3b).fillRect(x, h * .925, 10, h * .075)
      foreground.fillStyle(COLORS.gold).fillTriangle(x - 2, h * .925, x + 12, h * .925, x + 5, h * .905)
    }
  }

  private createPlace(place: Place, index: number) {
    const x = place.x / 100 * this.scale.width
    const y = this.top + place.y / 100 * this.worldHeight
    const container = this.add.container(x, y).setDepth(y)
    const scale = .76 + place.y / 100 * .3
    container.setScale(scale)
    const highlight = this.add.graphics().lineStyle(4, 0xfff2a8, .95).strokeEllipse(0, -2, place.kind === 'ad' ? 78 : 116, place.kind === 'ad' ? 24 : 31)
    highlight.fillStyle(0xffef96, .13).fillEllipse(0, -2, place.kind === 'ad' ? 78 : 116, place.kind === 'ad' ? 24 : 31).setName('highlight')
    const art = this.add.graphics().fillStyle(0x173e3a, .45).fillEllipse(4, 2, place.kind === 'ad' ? 72 : 105, place.kind === 'ad' ? 20 : 28)
    if (place.kind === 'ad') this.drawBillboard(art, place, index)
    else this.drawBooth(art, place, index)
    container.add([highlight, art])
    const title = this.add.text(0, place.kind === 'ad' ? -52 : -34, place.title, {
      fontFamily: FONTS.body, fontSize: place.kind === 'ad' ? '16px' : '18px',
      color: '#fff2ca', backgroundColor: '#241a32ee', padding: { x: 8, y: 4 }, align: 'center', wordWrap: { width: 168 },
    }).setOrigin(.5).setName('title')
    const subtitle = this.add.text(0, 18, place.subtitle, {
      fontFamily: FONTS.ui, fontSize: '13px', fontStyle: 'bold', color: '#291d32', backgroundColor: '#ffe5a8f2',
      padding: { x: 8, y: 4 }, align: 'center', letterSpacing: 0.5,
    }).setOrigin(.5, 0).setName('subtitle')
    const gazeBack = this.add.rectangle(0, 35, 84, 7, 0x24182e).setName('gazeBack')
    const gazeFill = this.add.rectangle(-40, 35, 0, 3, 0xffef83).setOrigin(0, .5).setName('gazeFill')
    container.add([title, subtitle, gazeBack, gazeFill])
    this.placeContainers.set(`${placeKey(place)}:${index}`, container)
  }

  private drawBooth(g: Phaser.GameObjects.Graphics, place: Place, index: number) {
    const closed = place.kind === 'closed', shop = place.kind === 'shop'
    const main = closed ? 0x6c7674 : shop ? COLORS.teal : place.id === 'rabbit' ? 0x9d3440 : COLORS.red
    const side = closed ? 0x4e5d5a : shop ? 0x0e5055 : 0x7a2834
    const stripe = closed ? 0xa8aaa0 : COLORS.cream
    const points = (...values: number[]) => Array.from({ length: values.length / 2 }, (_, i) => new Phaser.Math.Vector2(values[i * 2], values[i * 2 + 1]))
    g.fillStyle(side).fillPoints(points(38, -67, 57, -56, 57, -8, 38, 2), true)
    g.lineStyle(3, COLORS.ink).strokePoints(points(38, -67, 57, -56, 57, -8, 38, 2), true)
    g.fillStyle(main).fillRect(-43, -68, 82, 70).lineStyle(3, COLORS.ink).strokeRect(-43, -68, 82, 70)
    g.fillStyle(COLORS.ink).fillRect(-33, -50, 63, 30)
    if (closed) g.lineStyle(5, 0xb6ae91).lineBetween(-30, -46, 28, -24).lineBetween(-28, -23, 29, -47)
    else {
      g.fillStyle(0xf5cb6a).fillCircle(place.id === 'fox' ? -10 : 11, -34, 8)
      g.fillStyle(0xf8e6bd).fillCircle(place.id === 'rabbit' ? -13 : 13, -34, 5)
    }
    g.fillStyle(0x5f2b37).fillRect(-48, -21, 94, 13).lineStyle(3, COLORS.ink).strokeRect(-48, -21, 94, 13)
    const canopy = points(-51, -76, 31, -76, 53, -63, -36, -63)
    g.fillStyle(stripe).fillPoints(canopy, true)
    g.fillStyle(main).fillPoints(points(-31, -76, -12, -76, -5, -63, -24, -63), true)
    g.fillStyle(main).fillPoints(points(8, -76, 27, -76, 46, -63, 27, -63), true)
    g.lineStyle(3, COLORS.ink).strokePoints(canopy, true)
    if (place.kind === 'stall' || shop) {
      g.fillStyle(stripe).fillTriangle(-43, -76, -4, -119, 36, -76)
      g.fillStyle(main).fillTriangle(-19, -76, -4, -119, 8, -76)
      g.lineStyle(3, COLORS.ink).strokeTriangle(-43, -76, -4, -119, 36, -76)
      g.lineStyle(2, COLORS.ink).lineBetween(-4, -119, -4, -137)
      g.fillStyle(index % 2 ? COLORS.red : COLORS.gold).fillTriangle(-4, -137, 17, -128, -4, -122)
    }
  }

  private drawBillboard(g: Phaser.GameObjects.Graphics, place: Place, index: number) {
    g.fillStyle(0x4b3a35).fillRect(-31, -58, 6, 58).fillRect(26, -58, 6, 58)
    g.fillStyle(0x2c252d).fillPoints([new Phaser.Math.Vector2(-42, -97), new Phaser.Math.Vector2(34, -97), new Phaser.Math.Vector2(46, -88), new Phaser.Math.Vector2(-31, -88)], true)
    g.fillStyle(index % 2 ? 0x7a3152 : COLORS.gold).fillRect(-42, -91, 78, 48)
    g.fillStyle(0xe8d7ad).fillRect(-34, -83, 62, 31).lineStyle(4, COLORS.ink).strokeRect(-42, -91, 78, 48)
    g.lineStyle(2, place.id === 'ad-tonic' ? COLORS.teal : COLORS.red).strokeCircle(-3, -67, 11).lineBetween(-16, -50, 11, -84)
  }

  private createPlayer() {
    const container = this.add.container()
    const shadow = this.add.ellipse(2, 2, 34, 12, 0x173b38, .55)
    const legs = this.add.graphics().fillStyle(0x171426).fillRect(-9, -10, 7, 17).fillRect(3, -10, 7, 17).setName('legs')
    const body = this.add.graphics().fillStyle(0x284f72).fillRoundedRect(-15, -42, 30, 34, 8)
    body.lineStyle(3, COLORS.ink).strokeRoundedRect(-15, -42, 30, 34, 8).fillStyle(0xce845b).fillCircle(0, -52, 11)
    body.lineStyle(3, COLORS.ink).strokeCircle(0, -52, 11).fillStyle(0x43254f).fillTriangle(-17, -60, 0, -79, 18, -60)
    body.fillStyle(COLORS.gold).fillRect(-15, -61, 31, 4)
    container.add([shadow, legs, body])
    this.playerContainer = container
    this.updatePlayerVisual(Boolean(this.state.target), 0)
  }

  private updatePlayerVisual(walking: boolean, direction: number) {
    if (!this.playerContainer) return
    const x = this.state.player.x / 100 * this.scale.width
    const y = this.top + this.state.player.y / 100 * this.worldHeight
    const scale = .7 + this.state.player.y / 100 * .36
    const bob = walking ? Math.sin(this.elapsed * .018) * 2.5 : 0
    this.playerContainer.setPosition(x, y + bob).setDepth(y + 1).setScale(direction < 0 ? -scale : scale, scale)
    const legs = this.playerContainer.getByName('legs') as Phaser.GameObjects.Graphics | null
    if (legs) legs.rotation = walking ? Math.sin(this.elapsed * .024) * .09 : 0
  }

  private updateProximity(force = false) {
    const nearest = this.nearestPlace()
    const key = placeKey(nearest)
    if (!force && key === this.nearestKey) return
    this.nearestKey = key
    this.placeContainers.forEach((container, containerKey) => {
      const near = Boolean(key && containerKey.startsWith(`${key}:`))
      ;(container.getByName('highlight') as Phaser.GameObjects.Graphics | null)?.setVisible(near)
      ;(container.getByName('subtitle') as Phaser.GameObjects.Text | null)?.setVisible(near)
    })
    this.caption?.setText(this.captionCopy())
  }

  private updateGaze(delta: number, moving: boolean) {
    const ad = this.places().find((place) => place.kind === 'ad' && distance(this.state.player, place) < 9 && !this.state.revealed.includes(place.id))
    if (!ad || moving || this.state.target) this.gaze = null
    else if (!this.gaze || this.gaze.id !== ad.id) this.gaze = { id: ad.id, progress: 0 }
    else {
      this.gaze.progress += delta / 25
      if (this.gaze.progress >= 100) {
        this.state.revealed.push(ad.id)
        this.state.result = 'A new shop opens on the midway.'
        this.gaze = null
        this.renderMode()
        return
      }
    }
    this.placeContainers.forEach((container, key) => {
      const place = this.places().find((item) => key.startsWith(`${placeKey(item)}:`))
      const active = Boolean(place && this.gaze?.id === place.id)
      const back = container.getByName('gazeBack') as Phaser.GameObjects.Rectangle | null
      const fill = container.getByName('gazeFill') as Phaser.GameObjects.Rectangle | null
      back?.setVisible(active)
      fill?.setVisible(active)
      if (fill && active) fill.width = 80 * (this.gaze?.progress ?? 0) / 100
    })
  }

  private nearestPlace() {
    return this.places().map((place) => ({ place, d: distance(this.state.player, place) }))
      .filter(({ place, d }) => d < (place.kind === 'ad' ? 10 : 8)).sort((a, b) => a.d - b.d)[0]?.place
  }

  private captionCopy() {
    const nearest = this.nearestPlace()
    if (nearest?.kind === 'ad' && !this.state.revealed.includes(nearest.id)) return 'KEEP WATCHING…'
    if (nearest?.kind === 'closed') return `${nearest.title}  ·  CLOSED`
    if (nearest) return `E  ·  ENTER ${nearest.title.toUpperCase()}`
    return this.state.result
  }

  private handleWorldPointer(pointer: Phaser.Input.Pointer) {
    if (this.state.mode !== 'world' || pointer.y < this.top || pointer.y > this.top + this.worldHeight) return
    const point = { x: pointer.x / this.scale.width * 100, y: (pointer.y - this.top) / this.worldHeight * 100 }
    const clicked = this.places().map((place) => ({ place, d: Math.hypot((place.x - point.x) * .8, place.y - point.y) })).sort((a, b) => a.d - b.d)[0]
    if (clicked && clicked.d < 9) {
      if (distance(this.state.player, clicked.place) < 9) this.enter(clicked.place)
      else this.state.target = { x: clicked.place.x, y: clamp(clicked.place.y + (clicked.place.kind === 'ad' ? 5 : 7), 8, 93) }
    } else this.state.target = point
  }

  private resolveCollision(old: Point, next: Point) {
    const blocked = (point: Point) => this.places().some((place) => {
      const rx = place.kind === 'ad' ? 2.8 : 4.8, ry = place.kind === 'ad' ? 2.2 : 3.5
      return ((point.x - place.x) / rx) ** 2 + ((point.y - (place.y - 1)) / ry) ** 2 < 1
    })
    if (!blocked(next)) return next
    if (!blocked({ x: next.x, y: old.y })) return { x: next.x, y: old.y }
    if (!blocked({ x: old.x, y: next.y })) return { x: old.x, y: next.y }
    return old
  }

  private enter(place: Place) {
    if (place.kind === 'closed' || place.kind === 'ad') return
    this.state.mode = place.id as Mode
    this.state.reaction = 'neutral'
    this.state.result = place.id === 'fox' || place.id === 'rabbit' ? 'PLACE YOUR BET' : ''
    this.state.target = null
    this.renderMode()
  }

  private renderStall(game: GameKey) {
    const { width, height } = this.scale
    const fox = game === 'fox'
    const compact = width < 760
    this.add.rectangle(0, 0, width, height, 0x120b1a).setOrigin(0)
    const availableH = height - this.top - 18
    const artW = Math.min(width - 24, availableH * 1.5)
    const artH = artW / 1.5
    const artX = width / 2, artY = this.top + 10 + artH / 2
    this.add.image(artX, artY, `${game}-background`).setDisplaySize(artW, artH)
    const character = this.add.image(fox ? artX + artW * .25 : artX - artW * .25, artY + artH * .1, `${game}-${this.state.reaction}`).setName('dealer')
    character.setDisplaySize(character.width / character.height * artH * .9, artH * .9)
    this.add.rectangle(0, this.top, width, height - this.top, 0x160d26, .13).setOrigin(0)
    this.button(72, this.top + 38, 122, 42, '← MIDWAY', () => this.go('world'), { fill: COLORS.cream, color: '#21182f', stroke: COLORS.ink, font: 14, depth: 50 })
    this.add.text(width / 2, this.top + 22, fox ? 'THE SILVER SPIN' : "RABBIT'S GENEROUS TOSS", {
      fontFamily: FONTS.ui, fontSize: '15px', fontStyle: 'bold', letterSpacing: 1.2, color: '#f3c15b', backgroundColor: '#2b1730dd', padding: { x: 12, y: 6 },
    }).setOrigin(.5, 0).setDepth(20)
    this.add.text(width / 2, this.top + 64, fox ? '“About one in five.”' : '“Three wins in five!”', {
      fontFamily: FONTS.body, fontSize: `${clamp(width / 30, 28, 46)}px`, color: '#fff0c9',
      stroke: '#160b1c', strokeThickness: 5, align: 'center', wordWrap: { width: width * .72 },
    }).setOrigin(.5, 0).setDepth(20)

    const consoleH = compact ? (this.state.ledger ? 262 : 225) : (this.state.ledger ? 224 : 187)
    const consoleY = height - consoleH - 14
    const latest = this.state.histories[game].at(-1)
    if (latest && latest.streak >= 2) {
      this.add.text(width / 2, consoleY - 25, `${latest.won ? 'WIN' : 'MISS'} AGAIN · ${latest.streak} IN A ROW`, {
        fontFamily: FONTS.ui, fontSize: `${clamp(width / 70, 14, 18)}px`, fontStyle: 'bold', letterSpacing: .5,
        color: latest.won ? '#21182f' : '#fff3ce', backgroundColor: latest.won ? '#efb64f' : '#c84438',
        padding: { x: 14, y: 8 }, stroke: '#21182f', strokeThickness: 2,
      }).setOrigin(.5).setDepth(45).setName('streakBadge')
    }

    const panel = this.add.rectangle(width / 2, consoleY, width * .94, consoleH, 0x1a1126, .97).setOrigin(.5, 0).setDepth(30)
    panel.setStrokeStyle(2, COLORS.gold)
    this.add.text(width / 2, consoleY + 10, this.state.result, {
      fontFamily: FONTS.body, fontSize: `${clamp(width / 58, 18, 23)}px`, color: '#fff4cf', align: 'center', wordWrap: { width: width * .84 },
    }).setOrigin(.5, 0).setDepth(31).setName('resultText')
    this.renderResultHistory(game, consoleY + 39, 46)

    const amounts = [1, 5, 10, 25, 50]
    const buttonW = width < 650 ? 40 : 52
    const buttonGap = width < 650 ? 4 : 6
    const startX = compact ? Math.max(18, width / 2 - 150) : width * .08
    const controlY = consoleY + 115
    this.add.text(startX - 10, controlY, 'BET', { fontFamily: FONTS.ui, fontSize: '15px', fontStyle: 'bold', color: '#dfb654', letterSpacing: 1 }).setOrigin(1, .5).setDepth(31)
    amounts.forEach((amount, index) => this.button(startX + 52 + index * (buttonW + buttonGap), controlY, buttonW, 30, money(amount), () => {
      this.state.bet = amount
      this.renderMode()
    }, { fill: this.state.bet === amount ? COLORS.gold : COLORS.ink, color: this.state.bet === amount ? '#21182f' : '#fff1c7', stroke: 0x9c7d58, font: 14, depth: 32, disabled: amount > this.state.balance }))

    const stats = this.state.stats[game]
    const count = this.state.betCounts[game]
    const playY = compact ? consoleY + 159 : controlY
    const playX = compact ? Math.max(88, width / 2 - 70) : Math.max(width * .7, startX + 52 + amounts.length * (buttonW + buttonGap) + 42)
    this.button(playX, playY, 116, 36, count === 1 ? (fox ? 'SPIN ONCE' : 'TOSS ONCE') : `PLAY ×${count}`, () => this.playBets(game, count), { fill: COLORS.red, font: 14, depth: 32, disabled: this.state.balance < this.state.bet })
    this.button(playX + 82, playY, 58, 36, stats.manualPlays < 5 ? `×5 · ${stats.manualPlays}/5` : '×5', () => this.toggleBetCount(game, 5), {
      fill: count === 5 ? COLORS.gold : COLORS.ink, color: count === 5 ? '#21182f' : '#fff1c7', stroke: 0x9c7d58, font: 12, depth: 32, disabled: stats.manualPlays < 5,
    })
    this.button(playX + 150, playY, 68, 36, stats.manualPlays < 10 ? `×10 · ${stats.manualPlays}/10` : '×10', () => this.toggleBetCount(game, 10), {
      fill: count === 10 ? COLORS.gold : COLORS.ink, color: count === 10 ? '#21182f' : '#fff1c7', stroke: 0x9c7d58, font: 12, depth: 32, disabled: stats.manualPlays < 10,
    })
    const hintY = compact ? consoleY + 184 : consoleY + 139
    this.add.text(playX + 48, hintY, count === 1 ? `MULTI-BET  ·  ${stats.manualPlays}/10 PLAYS` : `MULTI-BET  ·  ×${count}`, {
      fontFamily: FONTS.ui, fontSize: '13px', fontStyle: 'bold', color: '#bca884', align: 'center', letterSpacing: .5,
    }).setOrigin(.5, 0).setDepth(31)
    if (this.state.ledger) this.renderLedger(game, compact ? consoleY + 204 : consoleY + 163)
  }

  private renderResultHistory(game: GameKey, y: number, height: number) {
    const { width } = this.scale
    const left = width < 650 ? 46 : 76
    const right = width - left
    const viewportW = right - left
    const history = this.state.histories[game]
    this.add.rectangle(width / 2, y, viewportW, height, 0x0e0916, .94).setOrigin(.5, 0).setDepth(31).setStrokeStyle(1, 0x66516f)
    this.add.text(left + 7, y + 2, 'RESULTS', { fontFamily: FONTS.ui, fontSize: '11px', fontStyle: 'bold', color: '#a996b6', letterSpacing: .6 }).setDepth(34)

    if (!history.length) {
      this.add.text(width / 2, y + height / 2 + 3, 'Your results roll in here.', { fontFamily: FONTS.body, fontSize: '14px', color: '#a698ad' }).setOrigin(.5).setDepth(33)
      return
    }

    const step = 64
    const contentW = history.length * step
    const maxOffset = Math.max(0, contentW - viewportW)
    this.historyScroll[game] = clamp(this.historyScroll[game], 0, maxOffset)
    const latestX = maxOffset ? right - contentW : left
    const strip = this.add.container(latestX + this.historyScroll[game], y).setDepth(33)
    const chips: Phaser.GameObjects.Container[] = []
    history.forEach((result, index) => {
      const net = result.payout - result.wager
      const chip = this.add.container(index * step + step / 2, height / 2 + 3)
      const background = this.add.rectangle(0, 0, 58, 30, result.won ? 0x236e5d : 0x6d2938)
      if (index === history.length - 1) background.setStrokeStyle(2, COLORS.gold)
      const label = this.add.text(0, 0, result.won ? `WIN ${money(net)}` : `MISS −${money(result.wager)}`, {
        fontFamily: FONTS.ui, fontSize: '12px', fontStyle: 'bold', color: '#fff1cf', align: 'center',
      }).setOrigin(.5)
      chip.add([background, label])
      strip.add(chip)
      chips.push(chip)
      this.resultContainers.set(result.id, chip)
    })
    const view = { strip, chips, latestX, maxOffset, left, right, top: y, bottom: y + height }
    this.historyViews.set(game, view)
    this.updateHistoryVisibility(view)
    this.button(left - 20, y + height / 2, 28, 30, '‹', () => this.scrollHistory(game, 180), { fill: COLORS.ink, stroke: 0x66516f, font: 18, depth: 35, disabled: maxOffset === 0 })
    this.button(right + 20, y + height / 2, 28, 30, '›', () => this.scrollHistory(game, -180), { fill: COLORS.ink, stroke: 0x66516f, font: 18, depth: 35, disabled: maxOffset === 0 })
  }

  private scrollHistory(game: GameKey, delta: number) {
    const view = this.historyViews.get(game)
    if (!view) return
    this.historyScroll[game] = clamp(this.historyScroll[game] + delta, 0, view.maxOffset)
    this.tweens.killTweensOf(view.strip)
    this.tweens.add({
      targets: view.strip, x: view.latestX + this.historyScroll[game], duration: 150, ease: 'Sine.Out',
      onUpdate: () => this.updateHistoryVisibility(view), onComplete: () => this.updateHistoryVisibility(view),
    })
  }

  private updateHistoryVisibility(view: { strip: Phaser.GameObjects.Container; chips: Phaser.GameObjects.Container[]; left: number; right: number }) {
    view.chips.forEach((chip) => {
      const center = view.strip.x + chip.x
      chip.setVisible(center - 29 >= view.left && center + 29 <= view.right)
    })
  }

  private toggleBetCount(game: GameKey, count: Exclude<BetCount, 1>) {
    const needed = count
    if (this.state.stats[game].manualPlays < needed) return
    this.state.betCounts[game] = this.state.betCounts[game] === count ? 1 : count
    this.renderMode()
  }

  private renderLedger(game: GameKey, y: number) {
    const data = this.state.stats[game]
    const rate = data.plays ? Math.round(data.wins / data.plays * 100) : 0
    const roi = data.wagered ? data.returned / data.wagered : 0
    const items = [`${data.plays}\nWAGERS`, `${data.wins}\nPAID`, `${rate}%\nWIN RATE`, `${roi.toFixed(2)}×\nRETURN / $1`]
    items.forEach((copy, index) => {
      const w = this.scale.width * .205
      this.add.text(this.scale.width * .09 + index * w, y, copy, {
        fontFamily: FONTS.ui, fontSize: '14px', fontStyle: 'bold', color: '#ffe5a0', backgroundColor: '#272035', padding: { x: 6, y: 7 }, align: 'center', fixedWidth: w - 3, letterSpacing: .4,
      }).setDepth(33)
    })
  }

  private playBets(game: GameKey, count: BetCount | number) {
    let cash = this.state.balance, elapsed = this.state.minutes, played = 0, wins = 0, returned = 0, lastWin = false
    const outcomes: BetResult[] = []
    const data = this.state.stats[game]
    const manualBefore = data.manualPlays
    while (played < count && cash >= this.state.bet && elapsed < MAX_MINUTES) {
      cash -= this.state.bet
      lastWin = this.random() < (game === 'fox' ? .3 : .55)
      const payout = lastWin ? (game === 'fox' ? this.state.bet * 3 : this.state.bet * 2) : 0
      if (lastWin) {
        cash += payout
        returned += payout
        wins++
      }
      const previous = this.state.histories[game].at(-1)
      const outcome: BetResult = {
        id: this.state.nextResultId++, won: lastWin, wager: this.state.bet, payout,
        streak: previous?.won === lastWin ? previous.streak + 1 : 1,
      }
      this.state.histories[game].push(outcome)
      outcomes.push(outcome)
      played++
      elapsed += BET_MINUTES
    }
    const net = cash - this.state.balance
    this.state.balance = cash
    this.state.minutes = elapsed
    data.plays += played
    data.wins += wins
    data.wagered += played * this.state.bet
    data.returned += returned
    if (count === 1) data.manualPlays += played
    if (!played) {
      this.state.reaction = 'neutral'; this.state.result = 'NOT ENOUGH CASH'
    } else {
      this.state.reaction = net >= 0 ? 'win' : 'lose'
      this.state.result = played === 1
        ? lastWin ? `WIN  ·  ${game === 'fox' ? '3×' : '2×'} PAID` : 'NO PAYOUT'
        : `${played} PLAYS  ·  ${wins} WINS  ·  ${signedMoney(net)}`
      const unlocks = []
      if (manualBefore < 5 && data.manualPlays >= 5) unlocks.push('×5')
      if (manualBefore < 10 && data.manualPlays >= 10) unlocks.push('×10')
      if (unlocks.length) this.state.result += `  ·  ${unlocks.join(' & ')} UNLOCKED`
    }
    this.historyScroll[game] = 0
    if (elapsed >= MAX_MINUTES) this.state.mode = 'ending'
    this.renderMode()
    if (this.state.mode === game && outcomes.length) this.animateBetResults(game, outcomes)
  }

  private animateBetResults(game: GameKey, outcomes: BetResult[]) {
    const dealer = this.children.getByName('dealer') as Phaser.GameObjects.Image | null
    const resultText = this.children.getByName('resultText') as Phaser.GameObjects.Text | null
    const badge = this.children.getByName('streakBadge') as Phaser.GameObjects.Text | null
    const view = this.historyViews.get(game)
    const latest = outcomes.at(-1)
    const stagger = outcomes.length > 1 ? 65 : 0

    if (view) {
      const travel = Math.min(outcomes.length * 64, view.right - view.left)
      view.strip.x = view.latestX + travel
      this.updateHistoryVisibility(view)
      this.tweens.add({
        targets: view.strip, x: view.latestX, duration: 220 + outcomes.length * stagger, ease: 'Cubic.Out',
        onUpdate: () => this.updateHistoryVisibility(view), onComplete: () => this.updateHistoryVisibility(view),
      })
    }
    outcomes.forEach((outcome, index) => {
      const chip = this.resultContainers.get(outcome.id)
      if (!chip) return
      chip.setAlpha(0).setScale(.55).setY(chip.y - 8)
      this.tweens.add({ targets: chip, alpha: 1, scale: 1, y: chip.y + 8, delay: 70 + index * stagger, duration: 190, ease: 'Back.Out' })
    })
    if (dealer && latest) {
      const baseY = dealer.y
      this.tweens.add({ targets: dealer, y: baseY - (latest.won ? 13 : 6), angle: latest.won ? -2 : 2, duration: 120, yoyo: true, repeat: latest.streak >= 2 ? 1 : 0, ease: 'Sine.InOut' })
    }
    if (resultText) {
      resultText.setAlpha(.25).setScale(.96)
      this.tweens.add({ targets: resultText, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' })
    }
    if (badge) {
      badge.setAlpha(0).setScale(.35).setAngle(-3)
      this.tweens.add({ targets: badge, alpha: 1, scale: 1, angle: 0, delay: Math.max(80, (outcomes.length - 1) * stagger), duration: 300, ease: 'Back.Out' })
    }
  }

  private renderShop(type: 'ledger' | 'portrait' | 'tonic') {
    const data = {
      ledger: { icon: '▦', title: 'Practical Ledgers', keeper: 'OWL, SOLE PROPRIETOR', cost: 10, copy: 'Tracks wagers, wins, and return.', buy: 'BUY LEDGER  ·  $10' },
      portrait: { icon: '◒', title: 'Moon Portraits', keeper: 'LIKENESSES WHILE-U-WAIT', cost: 15, copy: 'A handsome souvenir. No strategic value.', buy: 'SIT FOR PORTRAIT  ·  $15' },
      tonic: { icon: '⚗', title: "Dr. Stoat's Tonic", keeper: 'FORMULATED WITH CONFIDENCE', cost: 20, copy: 'Sparkling confidence. Same odds.', buy: 'DRINK TONIC  ·  $20' },
    }[type]
    const owned = this.state[type]
    const { width, height } = this.scale
    this.add.rectangle(0, 0, width, height, 0x281835).setOrigin(0)
    this.button(72, this.top + 38, 122, 42, '← MIDWAY', () => this.go('world'), { fill: COLORS.ink, stroke: COLORS.cream, font: 14, depth: 5 })
    const cardTop = this.top + 14
    const cardW = Math.min(680, width * .9), cardH = Math.min(560, height - cardTop - 14)
    const card = this.add.rectangle(width / 2, cardTop, cardW, cardH, 0xf8e9bd).setOrigin(.5, 0)
    card.setStrokeStyle(7, COLORS.red)
    this.add.text(width / 2, cardTop + 24, data.icon, { fontFamily: FONTS.body, fontSize: '52px', color: '#fff0b9', backgroundColor: '#176d70', padding: { x: 20, y: 8 } }).setOrigin(.5, 0)
    this.add.text(width / 2, cardTop + 112, data.keeper, { fontFamily: FONTS.ui, fontSize: '14px', fontStyle: 'bold', letterSpacing: 1, color: '#9c4a3f' }).setOrigin(.5, 0)
    this.add.text(width / 2, cardTop + 138, data.title, { fontFamily: FONTS.display, fontSize: `${clamp(width / 30, 28, 40)}px`, color: '#25162c', align: 'center', wordWrap: { width: cardW * .84 } }).setOrigin(.5, 0)
    this.add.text(width / 2, cardTop + cardH * .56, data.copy, { fontFamily: FONTS.body, fontSize: '21px', color: '#25162c', align: 'center', wordWrap: { width: cardW * .76 }, lineSpacing: 5 }).setOrigin(.5, 0)
    this.button(width / 2, cardTop + cardH - 64, Math.min(310, cardW * .74), 48, owned ? 'PURCHASED' : data.buy, () => this.buy(type, data.cost), { fill: owned ? 0xc8b997 : 0xa53335, stroke: COLORS.ink, font: 16, depth: 5, disabled: owned || this.state.balance < data.cost })
    this.add.text(width / 2, cardTop + cardH - 32, this.state.result, { fontFamily: FONTS.ui, fontSize: '15px', fontStyle: 'bold', color: '#5d4860', align: 'center', wordWrap: { width: cardW * .8 }, letterSpacing: .5 }).setOrigin(.5, 0)
  }

  private buy(type: 'ledger' | 'portrait' | 'tonic', cost: number) {
    if (this.state.balance < cost || this.state[type]) return
    this.state.balance -= cost
    this.state[type] = true
    this.state.result = type === 'ledger' ? 'LEDGER EQUIPPED' : type === 'portrait' ? 'PORTRAIT ACQUIRED' : 'THOROUGHLY INVIGORATED'
    this.renderMode()
  }

  private renderEnding() {
    const { width, height } = this.scale
    this.add.rectangle(0, 0, width, height, 0x1b1124).setOrigin(0)
    const total = this.state.stats.fox.plays + this.state.stats.rabbit.plays
    const verdict = this.state.balance >= 175 ? 'THE CARNIVAL REGRETS YOUR ATTENTION TO DETAIL' : this.state.balance >= 100 ? 'YOU LEAVE WITH YOUR PURSE AND A SUSPICION' : this.state.balance > 0 ? 'A MODEST TUITION IN PROBABILITY' : 'THE CARNIVAL THANKS YOU FOR YOUR COMPLETE PARTICIPATION'
    const cardW = Math.min(720, width * .92), cardH = Math.min(570, height - this.top - 30)
    const card = this.add.rectangle(width / 2, this.top + 15, cardW, cardH, 0xf8e9bd).setOrigin(.5, 0)
    card.setStrokeStyle(7, COLORS.ink)
    this.add.text(width / 2, this.top + 42, 'AFTER THREE PERFECTLY REASONABLE DAYS', { fontFamily: FONTS.ui, fontSize: '14px', fontStyle: 'bold', letterSpacing: 1, color: '#9c4a3f' }).setOrigin(.5, 0)
    this.add.text(width / 2, this.top + 78, 'The tents are gone.', { fontFamily: FONTS.display, fontSize: `${clamp(width / 20, 36, 58)}px`, color: '#25162c' }).setOrigin(.5, 0)
    this.add.text(width / 2, this.top + 155, money(this.state.balance), { fontFamily: FONTS.body, fontSize: `${clamp(width / 10, 70, 120)}px`, color: '#b13437' }).setOrigin(.5, 0)
    this.add.text(width / 2, this.top + 270, verdict, { fontFamily: FONTS.ui, fontSize: '16px', fontStyle: 'bold', letterSpacing: .6, color: '#25162c', align: 'center', wordWrap: { width: cardW * .8 } }).setOrigin(.5, 0)
    const stats = [`${total}\nTOTAL WAGERS`, `${this.state.stats.fox.plays}\nSILVER SPINS`, `${this.state.stats.rabbit.plays}\nCOIN TOSSES`, `${this.state.ledger ? 'YES' : 'NO'}\nKEPT RECORDS`]
    stats.forEach((copy, index) => this.add.text(width / 2 - cardW * .36 + index * cardW * .24, this.top + 330, copy, { fontFamily: FONTS.ui, fontSize: '16px', fontStyle: 'bold', color: '#25162c', align: 'center', fixedWidth: cardW * .22, backgroundColor: '#ead8aa', padding: { y: 12 }, letterSpacing: .3 }).setOrigin(.5, 0))
    this.button(width / 2, this.top + cardH - 52, 240, 48, 'RETURN NEXT SEASON', () => this.reset(), { fill: 0xa53335, stroke: COLORS.ink, font: 16, depth: 5 })
  }

  private button(x: number, y: number, width: number, height: number, label: string, action: () => void, options: { fill?: number; color?: string; stroke?: number; font?: number; family?: string; depth?: number; disabled?: boolean } = {}) {
    const disabled = options.disabled ?? false
    const container = this.add.container(x, y).setDepth(options.depth ?? 1).setAlpha(disabled ? .38 : 1)
    const background = this.add.rectangle(0, 0, width, height, options.fill ?? COLORS.red)
    if (options.stroke !== undefined) background.setStrokeStyle(2, options.stroke)
    const text = this.add.text(0, 0, label, { fontFamily: options.family ?? FONTS.ui, fontSize: `${options.font ?? 14}px`, fontStyle: 'bold', color: options.color ?? '#fff6da', align: 'center', letterSpacing: .4 }).setOrigin(.5)
    container.add([background, text])
    if (!disabled) {
      background.setInteractive({ useHandCursor: true })
        .on('pointerover', () => container.setScale(1.03))
        .on('pointerdown', () => container.setScale(.94))
        .on('pointerout', () => container.setScale(1))
        .on('pointerup', () => {
          this.tweens.add({ targets: container, scale: 1.06, duration: 55, yoyo: true, ease: 'Sine.Out', onComplete: action })
        })
    }
    return container
  }

  private go(mode: Mode) {
    this.state.mode = mode
    this.state.target = null
    this.renderMode()
  }

  private reset() {
    this.state = initialState()
    this.randomSeed = Number(params.get('seed')) || 481516
    this.gaze = null
    this.historyScroll = { fox: 0, rabbit: 0 }
    this.renderMode()
    this.installDebugApi()
  }

  private renderDebug() {
    const y = this.scale.height - 18
    let x = this.scale.width - 34
    const actions: Array<[string, () => void, number]> = [
      ['END', () => this.go('ending'), 50],
      ['+1 DAY', () => { this.state.minutes = Math.min(MAX_MINUTES, this.state.minutes + 720); this.renderMode() }, 68],
      ['REVEAL', () => { this.state.revealed = ['ad-ledger', 'ad-portrait', 'ad-tonic']; this.renderMode() }, 65],
      ['+$100', () => { this.state.balance += 100; this.renderMode() }, 58],
    ]
    actions.forEach(([label, action, width]) => {
      this.button(x, y, width, 22, label, action, { fill: 0x002200, color: '#00ff00', stroke: 0x00ff00, font: 8, depth: 20000 })
      x -= width + 5
    })
  }

  private installDebugApi() {
    window.__BAD_BET__ = {
      getState: () => structuredClone(this.state),
      travel: (x, y) => { this.state.player = { x, y }; if (this.state.mode === 'world') this.updatePlayerVisual(false, 0) },
      open: (mode) => this.go(mode),
      play: (game, count = 1) => {
        this.state.mode = game
        this.playBets(game, count)
      },
    }
  }
}

await Promise.all([
  document.fonts.load(`16px ${FONTS.display}`),
  document.fonts.load(`16px ${FONTS.body}`),
  document.fonts.load(`600 16px ${FONTS.ui}`),
]).catch(() => undefined)

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#21182f',
  render: { antialias: true, pixelArt: false, roundPixels: true },
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  scene: BadBetScene,
})

declare global {
  interface Window {
    __BAD_BET__: {
      getState: () => State
      travel: (x: number, y: number) => void
      open: (mode: Mode) => void
      play: (game: GameKey, count?: number) => void
    }
  }
}
