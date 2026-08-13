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

type Mode = 'welcome' | 'world' | 'fox' | 'rabbit' | 'ledger' | 'portrait' | 'tonic' | 'poster' | 'ending'
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
  poster: 'ad-ledger' | 'ad-portrait' | 'ad-tonic' | null
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
  { id: 'fox', x: 27, y: 29, title: 'The Silver Spin', subtitle: 'WIN PAYS 3×', kind: 'stall' },
  { id: 'rabbit', x: 73, y: 29, title: "Rabbit's Generous Toss", subtitle: 'WIN PAYS 2×', kind: 'stall' },
  { id: 'closed', x: 12, y: 49, title: 'Turtle Derby', subtitle: 'CLOSED', kind: 'closed' },
  { id: 'closed', x: 88, y: 49, title: 'The Lucky Lantern', subtitle: 'CLOSED', kind: 'closed' },
  { id: 'ad-ledger', x: 11, y: 84, title: 'Weathered Notice Board', subtitle: 'OLD NOTICES & LOCAL NEWS', kind: 'ad' },
  { id: 'ad-portrait', x: 34, y: 86, title: 'Town Notice Board', subtitle: 'PINS, PAPER & OLD INK', kind: 'ad' },
  { id: 'ad-tonic', x: 89, y: 84, title: 'Crooked Notice Board', subtitle: 'NOTICES OF UNCERTAIN IMPORTANCE', kind: 'ad' },
]

const initialStats = (): Stats => ({
  fox: { plays: 0, wins: 0, wagered: 0, returned: 0, manualPlays: 0 },
  rabbit: { plays: 0, wins: 0, wagered: 0, returned: 0, manualPlays: 0 },
})

const initialState = (): State => ({
  mode: 'welcome', balance: 100, minutes: 0, bet: 5, reaction: 'neutral',
  result: 'Pick a game. Press your luck.', stats: initialStats(),
  histories: { fox: [], rabbit: [] }, betCounts: { fox: 1, rabbit: 1 }, nextResultId: 1,
  ledger: false, portrait: false, tonic: false, revealed: [],
  player: { x: 50, y: 89 }, target: null, poster: null,
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
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'e' | 'enter' | 'escape', Phaser.Input.Keyboard.Key>
  private placeContainers = new Map<string, Phaser.GameObjects.Container>()
  private playerContainer?: Phaser.GameObjects.Container
  private caption?: Phaser.GameObjects.Text
  private nearestKey = ''
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
    this.load.image('poster-ad-ledger', `${BASE}art/posters/practical-ledgers.png`)
    this.load.image('poster-ad-portrait', `${BASE}art/posters/moon-portraits.png`)
    this.load.image('poster-ad-tonic', `${BASE}art/posters/stoat-tonic.png`)
    this.load.image('shop-ledger', `${BASE}art/shops/practical-ledgers-evening.webp`)
    this.load.image('shop-portrait', `${BASE}art/shops/moon-portraits-evening.webp`)
    this.load.image('shop-tonic', `${BASE}art/shops/stoat-tonic-evening.webp`)
    this.load.image('carnival-welcome', `${BASE}art/entrance/bad-bet-welcome.webp`)
  }

  create() {
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W, a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S, d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E, enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as Record<'w' | 'a' | 's' | 'd' | 'e' | 'enter' | 'escape', Phaser.Input.Keyboard.Key>
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
    if (!this.keys) return
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape) && !['welcome', 'world', 'ending'].includes(this.state.mode)) {
      this.go('world')
      return
    }
    if (this.state.mode !== 'world' || !this.playerContainer) return
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
  }

  private get top() { return this.scale.height < 620 ? 64 : 76 }
  private get bottom() { return this.scale.height < 620 ? 72 : 82 }
  private get worldHeight() { return Math.max(240, this.scale.height - this.top - this.bottom) }

  private places() {
    const shops: Place[] = []
    if (this.state.revealed.includes('ad-ledger')) shops.push({ id: 'ledger', x: 25, y: 67, title: 'Practical Ledgers', subtitle: 'OPEN', kind: 'shop' })
    if (this.state.revealed.includes('ad-portrait')) shops.push({ id: 'portrait', x: 62, y: 69, title: 'Moon Portraits', subtitle: 'OPEN', kind: 'shop' })
    if (this.state.revealed.includes('ad-tonic')) shops.push({ id: 'tonic', x: 79, y: 66, title: "Dr. Stoat's Tonic", subtitle: 'OPEN', kind: 'shop' })
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
    if (this.state.mode === 'welcome') this.renderWelcome()
    else if (this.state.mode === 'world') this.renderWorld()
    else if (this.state.mode === 'fox' || this.state.mode === 'rabbit') this.renderStall(this.state.mode)
    else if (this.state.mode === 'poster') this.renderPoster()
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
    if (DEBUG) {
      const timeX = compact ? 92 : 136
      const timeW = compact ? Math.min(210, width * 0.38) : Math.min(360, width * 0.34)
      const timeY = h / 2 - 15
      graphics.fillStyle(0x352340).fillRect(timeX, timeY, timeW, 30)
      graphics.lineStyle(2, COLORS.ink).strokeRect(timeX, timeY, timeW, 30)
      graphics.fillStyle(COLORS.red).fillRect(timeX + 2, timeY + 2, (timeW - 4) * Math.min(1, this.state.minutes / MAX_MINUTES), 26)
      this.add.text(timeX + timeW / 2, h / 2, timeLabel(this.state.minutes), {
        fontFamily: FONTS.ui, fontSize: compact ? '12px' : '14px', fontStyle: 'bold', color: '#ffffff', letterSpacing: 0.5,
      }).setOrigin(0.5).setDepth(10002)
    }

    this.add.text(width - (compact ? 78 : 190), h / 2, compact ? money(this.state.balance) : `PURSE  ${money(this.state.balance)}`, {
      fontFamily: FONTS.body, fontSize: compact ? '22px' : '28px', color: '#21182f',
    }).setOrigin(0.5).setDepth(10002)
    if (!compact) this.button(width - 53, h / 2 - 2, 90, 31, MUSIC_DISABLED ? 'MUSIC OFF' : this.music.on ? 'MUSIC ON' : 'MUSIC OFF', () => {
      if (!MUSIC_DISABLED) this.music.toggle()
      this.renderMode()
    }, { fill: COLORS.cream, color: '#21182f', stroke: COLORS.ink, font: 12, depth: 10002 })
  }

  private renderWelcome() {
    const { width, height } = this.scale
    this.add.rectangle(0, 0, width, height, 0x130d1b).setOrigin(0)
    const availableH = height - this.top
    const artW = Math.min(width, availableH * 1.5)
    const artH = artW / 1.5
    const artX = width / 2, artY = this.top + availableH / 2
    this.add.image(artX, artY, 'carnival-welcome').setDisplaySize(artW, artH)
    if (artW < width) this.add.rectangle(0, this.top, width, availableH, 0x120c1a, .24).setOrigin(0)
    const panelW = artW * .55
    const titleY = artY - artH * .14
    this.add.text(artX, titleY, 'THE BAD BET CARNIVAL', {
      fontFamily: FONTS.display, fontSize: `${clamp(artW / 24, 28, 58)}px`, color: '#3a2030',
      align: 'center', wordWrap: { width: panelW }, stroke: '#f3dba7', strokeThickness: 1,
    }).setOrigin(.5)
    this.add.text(artX, titleY + clamp(artH * .12, 50, 92), 'OPEN THREE NIGHTS ONLY\nCASH PRIZES · ALL WAGERS FINAL', {
      fontFamily: FONTS.body, fontSize: `${clamp(artW / 58, 17, 27)}px`, color: '#4e3030',
      align: 'center', lineSpacing: 6, wordWrap: { width: panelW * .88 },
    }).setOrigin(.5)
    this.add.text(artX, artY + artH * .085, 'Odds furnished by the concessionaires.\nManagement does not check their arithmetic.', {
      fontFamily: FONTS.ui, fontSize: `${clamp(artW / 85, 13, 19)}px`, fontStyle: 'bold', color: '#6f4738',
      letterSpacing: .7, align: 'center', lineSpacing: 5, wordWrap: { width: panelW * .82 },
    }).setOrigin(.5)
    this.entryTicketButton(artX, artY + artH * .22, Math.min(270, panelW * .7), () => this.go('world'))
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
    const p = (x: number, y: number) => new Phaser.Math.Vector2(w * x, h * y)
    g.fillStyle(0x245f50).fillRect(0, 0, w, h)
    g.fillStyle(0x31745a).fillPoints([
      p(0, .1), p(.18, .04), p(.36, .09), p(.55, .02), p(.75, .08), p(1, .03), p(1, 1), p(0, 1),
    ], true)

    // An irregular, trampled fairground clearing reads as earth rather than a racetrack.
    const clearing = [p(.5, .16), p(.75, .19), p(.93, .36), p(.97, .64), p(.87, .87), p(.62, .96), p(.38, .95), p(.13, .87), p(.035, .65), p(.07, .37), p(.25, .19)]
    g.fillStyle(0x9c764b, .72).fillPoints(clearing, true)
    g.lineStyle(Math.max(9, h * .018), 0x6c543c, .3).strokePoints(clearing, true)

    const paths: Array<{ curve: Phaser.Curves.Curve; width: number }> = [
      { curve: new Phaser.Curves.CubicBezier(p(.5, 1), p(.5, .84), p(.49, .7), p(.5, .55)), width: .095 },
      { curve: new Phaser.Curves.CubicBezier(p(.48, .57), p(.43, .49), p(.35, .41), p(.27, .35)), width: .067 },
      { curve: new Phaser.Curves.CubicBezier(p(.52, .57), p(.57, .49), p(.65, .41), p(.73, .35)), width: .067 },
      { curve: new Phaser.Curves.CubicBezier(p(.48, .58), p(.34, .63), p(.22, .58), p(.12, .55)), width: .06 },
      { curve: new Phaser.Curves.CubicBezier(p(.52, .58), p(.66, .63), p(.78, .58), p(.88, .55)), width: .06 },
      { curve: new Phaser.Curves.Line(p(.34, .62), p(.25, .73)), width: .052 },
      { curve: new Phaser.Curves.Line(p(.5, .77), p(.62, .76)), width: .052 },
      { curve: new Phaser.Curves.Line(p(.67, .62), p(.79, .72)), width: .052 },
      { curve: new Phaser.Curves.CubicBezier(p(.49, .84), p(.35, .82), p(.22, .85), p(.11, .89)), width: .047 },
      { curve: new Phaser.Curves.Line(p(.49, .89), p(.34, .91)), width: .047 },
      { curve: new Phaser.Curves.CubicBezier(p(.51, .84), p(.67, .82), p(.79, .85), p(.89, .89)), width: .047 },
    ]
    paths.forEach(({ curve, width }) => g.lineStyle(Math.max(14, h * (width + .018)), 0x725238, .85).strokePoints(curve.getPoints(36)))
    paths.forEach(({ curve, width }) => g.lineStyle(Math.max(10, h * width), 0xc69a5b, 1).strokePoints(curve.getPoints(36)))
    g.fillStyle(0xc69a5b).fillEllipse(w * .5, h * .57, w * .23, h * .15)

    // Packed-earth variation, scuffs, grass clumps, and stones break up flat fills.
    for (let i = 0; i < 190; i++) {
      const x = ((i * 83 + 17) % 997) / 997 * w
      const y = (.17 + ((i * 47 + 29) % 887) / 887 * .8) * h
      const nearCenter = Math.abs(x / w - .5) < .43 && y / h > .18
      if (nearCenter && i % 3) {
        g.fillStyle(i % 4 ? 0x77583e : 0xe0b870, .22).fillEllipse(x, y, 2 + i % 7, 1 + i % 3)
      } else {
        g.fillStyle(i % 5 ? 0x183f38 : 0xd6ad55, .65).fillEllipse(x, y, 2 + i % 4, 1 + i % 2)
      }
    }
    for (let i = 0; i < 18; i++) {
      const x = w * (.41 + (i % 5) * .045), y = h * (.72 + Math.floor(i / 5) * .045)
      g.lineStyle(1.5, 0x6a4c35, .38).strokeEllipse(x, y, 4, 8)
    }
  }

  private drawScenery() {
    const w = this.scale.width
    const h = this.worldHeight
    const y0 = this.top
    const fence = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .17)
    fence.lineStyle(4, 0x163f39).lineBetween(w * .035, h * .17, w * .39, h * .17).lineBetween(w * .61, h * .17, w * .965, h * .17)
    for (const x of [.05, .11, .17, .23, .29, .35, .65, .71, .77, .83, .89, .95]) {
      fence.fillStyle(0x2d5144).fillRect(w * x - 3, h * .135, 6, h * .055)
      fence.fillStyle(COLORS.gold).fillTriangle(w * x - 4, h * .135, w * x + 4, h * .135, w * x, h * .12)
    }

    const tent = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .46)
    const tx = w * .5
    tent.fillStyle(0x392732, .45).fillEllipse(tx, h * .46, w * .23, h * .045)
    tent.fillStyle(0x7c2e39).fillPoints([
      new Phaser.Math.Vector2(w * .405, h * .35), new Phaser.Math.Vector2(w * .595, h * .35),
      new Phaser.Math.Vector2(w * .61, h * .47), new Phaser.Math.Vector2(w * .39, h * .47),
    ], true)
    tent.fillStyle(0xf1d49d).fillTriangle(tx, h * .19, w * .4, h * .36, w * .6, h * .36)
    tent.fillStyle(COLORS.red).fillTriangle(tx, h * .19, w * .4, h * .36, w * .44, h * .36)
    tent.fillStyle(COLORS.red).fillTriangle(tx, h * .19, w * .48, h * .36, w * .52, h * .36)
    tent.fillStyle(COLORS.red).fillTriangle(tx, h * .19, w * .56, h * .36, w * .6, h * .36)
    tent.lineStyle(3, COLORS.ink).strokeTriangle(tx, h * .19, w * .4, h * .36, w * .6, h * .36).strokeRect(w * .39, h * .35, w * .22, h * .12)
    tent.fillStyle(0x21182f).fillTriangle(w * .47, h * .47, tx, h * .38, w * .53, h * .47)
    tent.lineStyle(3, COLORS.gold).lineBetween(tx, h * .19, tx, h * .135)
    tent.fillStyle(COLORS.gold).fillTriangle(tx, h * .135, w * .523, h * .15, tx, h * .165)
    for (let i = 0; i < 9; i++) tent.fillStyle(COLORS.gold).fillCircle(w * (.405 + i * .024), h * .355, 2.3)

    const bunting = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .2)
    const points = [{ x: .1, y: .2 }, { x: .5, y: .13 }, { x: .9, y: .2 }]
    for (let segment = 0; segment < 2; segment++) {
      const a = points[segment], b = points[segment + 1]
      bunting.lineStyle(2, COLORS.ink, .8).lineBetween(w * a.x, h * a.y, w * b.x, h * b.y)
      for (let i = 1; i < 9; i++) {
        const t = i / 9, x = w * Phaser.Math.Linear(a.x, b.x, t), y = h * Phaser.Math.Linear(a.y, b.y, t)
        bunting.fillStyle((i + segment) % 2 ? COLORS.gold : COLORS.red).fillTriangle(x - 5, y, x + 5, y, x, y + 10)
      }
    }

    // The foreground fence opens into a proper arrival gate rather than sealing the player in.
    const foreground = this.add.graphics().setPosition(0, y0).setDepth(y0 + h * .975)
    foreground.lineStyle(7, 0x285044).lineBetween(0, h * .97, w * .43, h * .97).lineBetween(w * .57, h * .97, w, h * .97)
    for (const x of [.02, .12, .22, .32, .42, .58, .68, .78, .88, .98]) {
      foreground.fillStyle(0x183934).fillRect(w * x - 5, h * .925, 10, h * .075)
      foreground.fillStyle(COLORS.gold).fillTriangle(w * x - 7, h * .925, w * x + 7, h * .925, w * x, h * .905)
    }
    foreground.fillStyle(0x34252c).fillRect(w * .435, h * .88, 12, h * .12).fillRect(w * .555, h * .88, 12, h * .12)
    foreground.fillStyle(COLORS.gold).fillCircle(w * .435 + 6, h * .875, 7).fillCircle(w * .555 + 6, h * .875, 7)
    foreground.lineStyle(6, 0x34252c).beginPath().moveTo(w * .44, h * .9).lineTo(w * .47, h * .86).lineTo(w * .53, h * .86).lineTo(w * .56, h * .9).strokePath()
    this.add.text(w * .5, y0 + h * .855, 'MIDWAY', {
      fontFamily: FONTS.display, fontSize: `${clamp(w / 70, 14, 22)}px`, color: '#ffe2a1', stroke: '#21182f', strokeThickness: 4,
    }).setOrigin(.5).setDepth(y0 + h * .978)
  }

  private createPlace(place: Place, index: number) {
    const x = place.x / 100 * this.scale.width
    const y = this.top + place.y / 100 * this.worldHeight
    const container = this.add.container(x, y).setDepth(y)
    const hierarchyScale = place.kind === 'stall' ? 1.15 : place.kind === 'closed' ? .84 : place.kind === 'ad' ? .8 : 1
    const scale = (.76 + place.y / 100 * .3) * hierarchyScale
    container.setScale(scale)
    const highlight = this.add.graphics().lineStyle(4, 0xfff2a8, .95).strokeEllipse(0, -2, place.kind === 'ad' ? 78 : 116, place.kind === 'ad' ? 24 : 31)
    highlight.fillStyle(0xffef96, .13).fillEllipse(0, -2, place.kind === 'ad' ? 78 : 116, place.kind === 'ad' ? 24 : 31).setName('highlight')
    highlight.setVisible(false)
    const art = this.add.graphics().fillStyle(0x173e3a, .45).fillEllipse(4, 2, place.kind === 'ad' ? 72 : 105, place.kind === 'ad' ? 20 : 28)
    if (place.kind === 'ad') this.drawBillboard(art, place, index)
    else this.drawBooth(art, place, index)
    container.add([highlight, art])
    const title = this.add.text(0, place.kind === 'ad' ? -52 : -34, place.title, {
      fontFamily: FONTS.body, fontSize: place.kind === 'ad' ? '16px' : '18px',
      color: '#fff2ca', backgroundColor: '#241a32ee', padding: { x: 8, y: 4 }, align: 'center', wordWrap: { width: 168 },
    }).setOrigin(.5).setName('title')
    title.setVisible(place.kind !== 'ad')
    const subtitle = this.add.text(0, 18, place.subtitle, {
      fontFamily: FONTS.ui, fontSize: '13px', fontStyle: 'bold', color: '#291d32', backgroundColor: '#ffe5a8f2',
      padding: { x: 8, y: 4 }, align: 'center', letterSpacing: 0.5,
    }).setOrigin(.5, 0).setName('subtitle')
    container.add([title, subtitle])
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
      if (place.kind === 'stall') {
        for (let i = 0; i < 7; i++) g.fillStyle(COLORS.gold).fillCircle(-36 + i * 12, -67, 2.4)
      }
      if (shop) {
        g.fillStyle(COLORS.gold)
        if (place.id === 'ledger') g.fillRect(-13, -45, 24, 22).lineStyle(2, COLORS.ink).strokeRect(-13, -45, 24, 22)
        else if (place.id === 'portrait') g.fillCircle(0, -34, 12).fillStyle(COLORS.ink).fillCircle(5, -38, 11)
        else g.fillRoundedRect(-8, -47, 16, 25, 5).lineStyle(2, COLORS.ink).strokeRoundedRect(-8, -47, 16, 25, 5)
      }
    }
    if (closed) {
      g.lineStyle(6, 0xd7c9a5).lineBetween(-38, -59, 34, -10)
      g.lineStyle(2, COLORS.ink).lineBetween(-38, -62, 37, -11)
    }
  }

  private drawBillboard(g: Phaser.GameObjects.Graphics, _place: Place, index: number) {
    g.fillStyle(0x39271f).fillRect(-38, -113, 76, 13)
    g.fillStyle(0xead7a2).fillRect(-34, -110, 68, 7)
    g.fillStyle(0x4b3228).fillRect(-39, -62, 7, 65).fillRect(31, -62, 7, 65)
    g.fillStyle(0x271d24).fillPoints([new Phaser.Math.Vector2(-49, -101), new Phaser.Math.Vector2(41, -101), new Phaser.Math.Vector2(50, -91), new Phaser.Math.Vector2(-40, -91)], true)
    g.fillStyle(0x70503a).fillRect(-46, -94, 88, 58).lineStyle(4, COLORS.ink).strokeRect(-46, -94, 88, 58)
    const papers = [
      { x: -35, y: -86, w: 28, h: 39, color: 0xdbc894 },
      { x: -4, y: -88, w: 36, h: 45, color: index % 2 ? 0xc9b57c : 0xe7d9a8 },
      { x: 18, y: -81, w: 19, h: 32, color: 0xb8a171 },
    ]
    papers.forEach((paper, paperIndex) => {
      g.fillStyle(paper.color).fillRect(paper.x, paper.y, paper.w, paper.h)
      g.lineStyle(2, 0x49373a).strokeRect(paper.x, paper.y, paper.w, paper.h)
      g.fillStyle(paperIndex === 1 ? 0x8d3438 : 0x3c5f58).fillCircle(paper.x + paper.w / 2, paper.y + 4, 2)
      g.lineStyle(1, 0x59453d, .8).lineBetween(paper.x + 4, paper.y + 12, paper.x + paper.w - 4, paper.y + 12)
        .lineBetween(paper.x + 4, paper.y + 18, paper.x + paper.w - 7, paper.y + 18)
    })
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
      const place = this.places().find((item) => containerKey.startsWith(`${placeKey(item)}:`))
      ;(container.getByName('highlight') as Phaser.GameObjects.Graphics | null)?.setVisible(near)
      ;(container.getByName('title') as Phaser.GameObjects.Text | null)?.setVisible(near || place?.kind !== 'ad')
      ;(container.getByName('subtitle') as Phaser.GameObjects.Text | null)?.setVisible(near)
    })
    this.caption?.setText(this.captionCopy())
  }

  private nearestPlace() {
    return this.places().map((place) => ({ place, d: distance(this.state.player, place) }))
      .filter(({ place, d }) => d < (place.kind === 'ad' ? 10 : 8)).sort((a, b) => a.d - b.d)[0]?.place
  }

  private captionCopy() {
    const nearest = this.nearestPlace()
    if (nearest?.kind === 'ad' && !this.state.revealed.includes(nearest.id)) return 'E  ·  INSPECT NOTICE BOARD'
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
    if (place.kind === 'closed') return
    if (place.kind === 'ad') {
      this.state.poster = place.id as State['poster']
      this.state.mode = 'poster'
      this.state.target = null
      this.renderMode()
      return
    }
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

  private renderPoster() {
    const id = this.state.poster
    if (!id) return this.go('world')
    const { width, height } = this.scale
    const newlyRead = !this.state.revealed.includes(id)
    if (newlyRead) {
      this.state.revealed.push(id)
      this.state.result = 'A new stall is being assembled somewhere nearby.'
    }
    this.add.rectangle(0, 0, width, height, 0x17101f).setOrigin(0)
    const boardW = Math.min(width * .92, 760)
    const boardH = Math.min(height - this.top - 30, 690)
    this.add.rectangle(width / 2, this.top + 15, boardW, boardH, 0x6d4935).setOrigin(.5, 0).setStrokeStyle(9, 0x2c2026)
    for (let i = 0; i < 18; i++) {
      const y = this.top + 34 + i * (boardH - 38) / 18
      this.add.line(0, 0, width / 2 - boardW / 2 + 12, y, width / 2 + boardW / 2 - 12, y + (i % 3 - 1) * 3, 0x3f2b29, .45).setOrigin(0)
    }
    const posterH = Math.min(boardH - 70, 610)
    const posterW = posterH * 2 / 3
    this.add.image(width / 2, this.top + 31 + posterH / 2, `poster-${id}`).setDisplaySize(posterW, posterH).setRotation(id === 'ad-portrait' ? .014 : id === 'ad-tonic' ? -.012 : .008)
    this.add.circle(width / 2, this.top + 45, 7, id === 'ad-tonic' ? COLORS.teal : COLORS.red).setStrokeStyle(2, COLORS.ink)
    this.button(width / 2 - boardW / 2 + 82, this.top + 48, 128, 40, '← STEP BACK', () => this.go('world'), { fill: COLORS.ink, stroke: COLORS.cream, font: 13, depth: 20 })
    if (newlyRead) this.add.text(width / 2, this.top + boardH - 28, 'Something stirs elsewhere on the midway.', {
      fontFamily: FONTS.body, fontSize: '17px', color: '#fff0c9', backgroundColor: '#21182fdd', padding: { x: 12, y: 6 },
    }).setOrigin(.5).setDepth(20)
  }

  private renderShop(type: 'ledger' | 'portrait' | 'tonic') {
    const data = {
      ledger: { title: 'Practical Ledgers', keeper: 'OWL, SOLE PROPRIETOR', cost: 10, copy: 'Tracks every wager, win, and dollar returned. Astonishingly unglamorous. Potentially useful.', buy: 'BUY LEDGER  ·  $10' },
      portrait: { title: 'Marvelous Moon Portraits', keeper: 'LIKENESSES WHILE-U-WAIT', cost: 15, copy: 'A handsome souvenir of your inner beast. Lovingly rendered. Strategically irrelevant.', buy: 'SIT FOR PORTRAIT  ·  $15' },
      tonic: { title: "Dr. Stoat's Tonic", keeper: 'FORMULATED WITH CONFIDENCE', cost: 20, copy: 'Sparkling confidence in every bottle. Your odds remain exactly as they were.', buy: 'DRINK TONIC  ·  $20' },
    }[type]
    const owned = this.state[type]
    const { width, height } = this.scale
    this.add.rectangle(0, 0, width, height, 0x130c19).setOrigin(0)
    const availableH = height - this.top - 12
    const artW = Math.min(width - 20, availableH * 1.5)
    const artH = artW / 1.5
    const artX = width / 2, artY = this.top + 6 + artH / 2
    this.add.image(artX, artY, `shop-${type}`).setDisplaySize(artW, artH)
    this.add.rectangle(artX, artY, artW, artH, 0x170d21, .12).setStrokeStyle(4, COLORS.gold)

    const short = artH < 470
    const narrow = artW < 680
    const left = artX - artW / 2
    const top = artY - artH / 2
    const backW = narrow ? 96 : 122
    this.button(left + backW / 2 + 12, top + 30, backW, 38, '← MIDWAY', () => this.go('world'), {
      fill: COLORS.ink, stroke: COLORS.cream, font: narrow ? 12 : 14, depth: 20,
    })

    const titleX = narrow ? artX : left + artW * .53
    const titleY = top + (short ? 18 : 24)
    this.add.text(titleX, titleY, data.keeper, {
      fontFamily: FONTS.ui, fontSize: `${narrow ? 11 : 14}px`, fontStyle: 'bold', letterSpacing: 1,
      color: '#f6d378', backgroundColor: '#21182fdd', padding: { x: 9, y: 5 },
    }).setOrigin(.5, 0).setDepth(12)
    this.add.text(titleX, titleY + (short ? 30 : 38), data.title, {
      fontFamily: FONTS.display, fontSize: `${clamp(artW / (narrow ? 27 : 33), 25, 43)}px`, color: '#fff0c4',
      stroke: '#21182f', strokeThickness: 6, align: 'center', wordWrap: { width: artW * (narrow ? .72 : .53) },
    }).setOrigin(.5, 0).setDepth(12)

    const copyW = narrow ? artW * .82 : artW * .31
    const copyX = narrow ? artX : left + artW * .185
    const copyY = narrow ? top + artH * .52 : top + artH * .39
    this.add.text(copyX, copyY, data.copy, {
      fontFamily: FONTS.body, fontSize: `${clamp(artW / 62, 15, 21)}px`, color: '#fff1cf',
      backgroundColor: '#21182fe8', padding: { x: 14, y: short ? 8 : 12 }, align: narrow ? 'center' : 'left',
      wordWrap: { width: copyW - 28 }, lineSpacing: 4, fixedWidth: copyW,
    }).setOrigin(.5, .5).setDepth(12)

    const buttonY = top + artH - (short ? 44 : 54)
    const buttonW = Math.min(310, artW * (narrow ? .64 : .38))
    this.button(artX, buttonY, buttonW, short ? 40 : 46, owned ? 'PURCHASED' : data.buy, () => this.buy(type, data.cost), {
      fill: owned ? 0x726a5c : COLORS.red, stroke: COLORS.cream, font: narrow ? 13 : 16, depth: 15,
      disabled: owned || this.state.balance < data.cost,
    })
    if (this.state.result) this.add.text(artX, buttonY - (short ? 31 : 37), this.state.result, {
      fontFamily: FONTS.ui, fontSize: `${narrow ? 12 : 14}px`, fontStyle: 'bold', color: '#fff0b7',
      backgroundColor: '#21182fdd', padding: { x: 10, y: 4 }, align: 'center', wordWrap: { width: artW * .72 }, letterSpacing: .5,
    }).setOrigin(.5).setDepth(14)
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

  private entryTicketButton(x: number, y: number, width: number, action: () => void) {
    const height = 54
    const halfW = width / 2
    const halfH = height / 2
    const points = [
      { x: 7, y: 0 }, { x: width - 7, y: 0 },
      { x: width, y: 7 }, { x: width, y: halfH - 7 }, { x: width - 7, y: halfH },
      { x: width, y: halfH + 7 }, { x: width, y: height - 7 }, { x: width - 7, y: height },
      { x: 7, y: height }, { x: 0, y: height - 7 }, { x: 0, y: halfH + 7 },
      { x: 7, y: halfH }, { x: 0, y: halfH - 7 }, { x: 0, y: 7 },
    ]
    const container = this.add.container(x, y).setDepth(10)
    const shadow = this.add.polygon(0, 4, points, 0x120c1a, .72)
    const ticket = this.add.polygon(0, 0, points, 0xe8d49c)
    ticket.setStrokeStyle(3, 0x4b2829)
    const detail = this.add.graphics()
    detail.lineStyle(1, 0x9b4b43, .9).strokeRect(-halfW + 11, -halfH + 7, width - 22, height - 14)
    detail.lineStyle(1, 0x9b4b43, .55)
    for (let dashY = -17; dashY < 18; dashY += 7) {
      detail.lineBetween(-halfW + 33, dashY, -halfW + 33, dashY + 3)
      detail.lineBetween(halfW - 33, dashY, halfW - 33, dashY + 3)
    }
    const label = this.add.text(0, 0, 'ADMIT ONE', {
      fontFamily: FONTS.body, fontSize: '18px', fontStyle: 'bold', color: '#5b292c', letterSpacing: 1.2,
    }).setOrigin(.5)
    container.add([shadow, ticket, detail, label])
    ticket.setInteractive({ useHandCursor: true })
      .on('pointerover', () => container.setScale(1.025))
      .on('pointerdown', () => container.setScale(.97))
      .on('pointerout', () => container.setScale(1))
      .on('pointerup', () => {
        this.tweens.add({ targets: container, scale: 1.05, duration: 55, yoyo: true, ease: 'Sine.Out', onComplete: action })
      })
    return container
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
