import Phaser from 'phaser'

const WIDTH = 1440
const HEIGHT = 900
const FONT = 'Fredoka'

const colors = {
  ink: 0x203b3a,
  deepTeal: 0x245b59,
  teal: 0x2f716b,
  coral: 0xf06a55,
  coralDark: 0xd96350,
  mustard: 0xf7cf68,
  cream: 0xfff3d6,
  tile: 0xf7eddb,
  tileLine: 0xdfd2bc,
  sky: 0x9bd9d2,
  green: 0x79ad72,
  brown: 0x7b472e,
}

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`

type LayerSet = {
  back: Phaser.GameObjects.Container
  middle: Phaser.GameObjects.Container
  counter: Phaser.GameObjects.Container
  front: Phaser.GameObjects.Container
}

export class StorefrontScene extends Phaser.Scene {
  private layers!: LayerSet
  private target = new Phaser.Math.Vector2()
  private current = new Phaser.Math.Vector2()
  private readonly frame = new Phaser.Geom.Rectangle(35, 80, 1370, 790)

  constructor() {
    super('storefront')
  }

  preload() {
    this.load.image('mouse-barista', '/assets/mouse-barista.png')
    this.load.image('rabbit-customer', '/assets/rabbit-customer.png')
    this.load.image('cat-customer', '/assets/cat-customer.png')
  }

  create() {
    this.cameras.main.setBackgroundColor('#f7ddb0')

    this.layers = {
      back: this.add.container(),
      middle: this.add.container(),
      counter: this.add.container(),
      front: this.add.container(),
    }

    const maskShape = this.make.graphics({ x: 0, y: 0 })
    maskShape.fillStyle(0xffffff)
    maskShape.fillRoundedRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height, 38)
    const shopMask = maskShape.createGeometryMask()
    Object.values(this.layers).forEach((layer) => layer.setMask(shopMask))

    this.drawBackground()
    this.drawMiddle()
    this.drawCounter()
    this.drawForeground()
    this.drawFrameAndUi()
    this.configurePointerParallax()

    this.game.canvas.dataset.scene = 'storefront'
    this.game.canvas.setAttribute('role', 'img')
    this.game.canvas.setAttribute(
      'aria-label',
      'Little Peak Coffee, a colorful geometric café storefront with a mouse barista, espresso machine, grinder, rabbit customer, and cat customer.',
    )

    if (new URLSearchParams(window.location.search).get('debug') === 'true') {
      this.addText(1188, 18, 'DEBUG · STOREFRONT', 16, colors.coralDark).setDepth(100)
    }
  }

  update(_time: number, delta: number) {
    const ease = 1 - Math.exp(-Math.min(delta, 40) / 110)
    this.current.x += (this.target.x - this.current.x) * ease
    this.current.y += (this.target.y - this.current.y) * ease

    this.layers.back.setPosition(this.current.x * -5, this.current.y * -3)
    this.layers.middle.setPosition(this.current.x * 7, this.current.y * 5)
    this.layers.counter.setPosition(this.current.x * 13, this.current.y * 8)
    this.layers.front.setPosition(this.current.x * 25, this.current.y * 15)
  }

  private configurePointerParallax() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.target.set(
        Phaser.Math.Clamp((pointer.x / WIDTH - 0.5) * 2, -1, 1),
        Phaser.Math.Clamp((pointer.y / HEIGHT - 0.5) * 2, -1, 1),
      )
    })
    this.input.on('gameout', () => this.target.set(0, 0))
  }

  private drawBackground() {
    const layer = this.layers.back
    const g = this.add.graphics()

    g.fillStyle(colors.coral)
    g.fillRoundedRect(28, 74, 1384, 806, 44)
    g.fillStyle(colors.tile)
    g.fillRect(25, 198, 1390, 570)

    g.lineStyle(2, colors.tileLine, 0.72)
    for (let x = 45; x <= 1415; x += 58) g.lineBetween(x, 198, x, 768)
    for (let y = 198; y <= 768; y += 58) g.lineBetween(25, y, 1415, y)

    g.fillStyle(colors.coral)
    g.fillRect(24, 75, 1392, 126)
    for (let x = 48; x < 1410; x += 240) {
      g.fillStyle(colors.mustard)
      g.fillRect(x, 158, 102, 48)
    }
    for (let x = 65; x < 1400; x += 118) {
      g.fillStyle((Math.floor(x / 118) % 2) ? colors.mustard : colors.coral)
      g.fillCircle(x, 199, 30)
    }
    layer.add(g)

    this.drawWindow(layer, 82, 235, 270, 285, false)
    this.drawWindow(layer, 1110, 235, 245, 285, true)

    layer.add(this.roundedRect(376, 236, 690, 118, 22, colors.deepTeal, colors.ink, 8))
    layer.add(this.addText(720, 263, 'LITTLE PEAK', 31, colors.cream).setOrigin(0.5, 0))
    layer.add(this.addText(458, 313, 'ESPRESSO  3', 17, 0xcce8dd).setOrigin(0.5))
    layer.add(this.addText(682, 313, 'FILTER  4', 17, 0xcce8dd).setOrigin(0.5))
    layer.add(this.addText(884, 313, 'BEANS  16', 17, 0xcce8dd).setOrigin(0.5))

    const bean = this.add.ellipse(1010, 297, 16, 36, colors.mustard)
    bean.setRotation(0.08)
    layer.add(bean)
  }

  private drawWindow(layer: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, flip: boolean) {
    layer.add(this.roundedRect(x, y, width, height, 20, colors.sky, colors.ink, 8))
    const scenery = this.add.graphics()
    scenery.fillStyle(0x8dc38c, 0.94)
    if (flip) {
      scenery.fillTriangle(x + 5, y + height - 52, x + 95, y + 92, x + 170, y + height - 52)
      scenery.fillTriangle(x + 95, y + height - 52, x + width - 5, y + 30, x + width - 5, y + height - 52)
    } else {
      scenery.fillTriangle(x + 5, y + height - 52, x + 95, y + 72, x + 180, y + height - 52)
      scenery.fillTriangle(x + 115, y + height - 52, x + width - 5, y + 32, x + width - 5, y + height - 52)
      scenery.fillStyle(colors.mustard)
      scenery.fillCircle(x + width - 50, y + 50, 27)
    }
    scenery.lineStyle(10, colors.cream, 0.94)
    scenery.lineBetween(x + width / 2, y + 5, x + width / 2, y + height - 5)
    scenery.lineBetween(x + 5, y + height * 0.56, x + width - 5, y + height * 0.56)
    layer.add(scenery)
  }

  private drawMiddle() {
    const layer = this.layers.middle
    this.drawPlant(layer, 334, 500, 0.86)
    this.drawPlant(layer, 1162, 497, 0.92)

    const barista = this.add.image(468, 491, 'mouse-barista').setDisplaySize(390, 390)
    layer.add(barista)
    this.tweens.add({ targets: barista, y: barista.y + 2, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    this.drawEspressoMachine(layer)
    this.drawGrinder(layer)
  }

  private drawEspressoMachine(layer: Phaser.GameObjects.Container) {
    const machine = this.add.container(563, 375)
    const g = this.add.graphics()
    g.fillStyle(colors.mustard)
    g.lineStyle(8, colors.ink)
    g.fillRoundedRect(0, 0, 430, 232, 24)
    g.strokeRoundedRect(0, 0, 430, 232, 24)
    g.fillStyle(0xffe69b)
    g.fillRoundedRect(16, 16, 398, 58, 14)
    g.fillStyle(colors.teal)
    g.fillRect(15, 78, 400, 113)
    g.fillStyle(0xe9f0e7)
    g.fillRect(18, 190, 394, 28)
    g.lineStyle(6, colors.ink)
    g.strokeRect(18, 190, 394, 28)

    g.fillStyle(colors.ink)
    g.fillRoundedRect(32, 34, 73, 26, 10)
    g.fillRoundedRect(325, 34, 73, 26, 10)
    g.lineStyle(9, colors.ink)
    g.lineBetween(86, 78, 86, 119)
    g.lineBetween(344, 78, 344, 119)
    g.fillStyle(0x173d3d)
    g.fillEllipse(86, 117, 80, 25)
    g.fillEllipse(344, 117, 80, 25)
    g.lineStyle(10, colors.ink)
    g.lineBetween(85, 117, 5, 105)
    g.lineBetween(345, 117, 425, 105)
    g.fillStyle(colors.coral)
    g.fillCircle(4, 105, 11)
    g.fillCircle(426, 105, 11)
    g.lineStyle(5, 0x8db7ae)
    g.lineBetween(45, 178, 385, 178)
    machine.add(g)

    machine.add(this.addText(650, 424, '93°', 14, 0xb4ead5).setOrigin(0.5).setPosition(69, 47))
    machine.add(this.addText(650, 424, '93°', 14, 0xb4ead5).setOrigin(0.5).setPosition(361, 47))

    for (let x = 142; x <= 286; x += 36) {
      const button = this.add.circle(x, 47, 10, colors.cream).setStrokeStyle(5, colors.ink)
      machine.add(button)
    }

    const coffee = this.add.graphics()
    coffee.lineStyle(5, colors.brown)
    coffee.lineBetween(77, 125, 77, 176)
    coffee.lineBetween(95, 125, 95, 176)
    machine.add(coffee)
    this.tweens.add({ targets: coffee, alpha: 0.55, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    const cup = this.add.graphics()
    cup.fillStyle(colors.cream)
    cup.lineStyle(6, colors.ink)
    cup.fillRoundedRect(58, 158, 57, 47, 10)
    cup.strokeRoundedRect(58, 158, 57, 47, 10)
    cup.strokeCircle(119, 179, 17)
    cup.fillStyle(colors.brown)
    cup.fillEllipse(86, 160, 49, 10)
    machine.add(cup)
    layer.add(machine)
  }

  private drawGrinder(layer: Phaser.GameObjects.Container) {
    const grinder = this.add.container(1030, 315)
    const g = this.add.graphics()
    g.fillStyle(0xd5ebe5, 0.9)
    g.lineStyle(7, colors.ink)
    const hopper = [
      new Phaser.Math.Vector2(24, 0),
      new Phaser.Math.Vector2(120, 0),
      new Phaser.Math.Vector2(107, 112),
      new Phaser.Math.Vector2(37, 112),
    ]
    g.fillPoints(hopper, true)
    g.strokePoints(hopper, true)
    g.fillStyle(colors.deepTeal)
    g.fillRoundedRect(25, 112, 94, 177, 17)
    g.strokeRoundedRect(25, 112, 94, 177, 17)
    g.fillStyle(0x1d4d4c)
    g.fillRoundedRect(42, 137, 60, 60, 14)
    g.fillStyle(colors.mustard)
    g.fillCircle(72, 158, 9)
    g.fillStyle(colors.ink)
    g.fillRect(49, 213, 47, 35)
    g.fillRoundedRect(8, 278, 128, 26, 12)
    g.fillStyle(colors.brown)
    g.fillEllipse(50, 40, 21, 13)
    g.fillEllipse(81, 28, 21, 13)
    g.fillEllipse(94, 69, 21, 13)
    grinder.add(g)
    layer.add(grinder)
  }

  private drawPlant(layer: Phaser.GameObjects.Container, x: number, y: number, scale: number) {
    const plant = this.add.container(x, y).setScale(scale)
    const g = this.add.graphics()
    g.fillStyle(0x72a867)
    g.fillEllipse(18, 7, 35, 82)
    g.fillStyle(0x4f8e5c)
    g.fillEllipse(52, 8, 35, 88)
    g.fillStyle(0x91bb6b)
    g.fillEllipse(-12, 22, 33, 73)
    g.lineStyle(5, 0x397653)
    g.lineBetween(18, 8, 25, 82)
    g.lineBetween(52, 8, 25, 82)
    g.lineBetween(-12, 22, 25, 82)
    g.fillStyle(0xee8a59)
    g.lineStyle(6, colors.ink)
    const pot = [
      new Phaser.Math.Vector2(-8, 72),
      new Phaser.Math.Vector2(66, 72),
      new Phaser.Math.Vector2(56, 145),
      new Phaser.Math.Vector2(5, 145),
    ]
    g.fillPoints(pot, true)
    g.strokePoints(pot, true)
    g.lineStyle(8, 0xffd49c)
    g.lineBetween(0, 93, 59, 93)
    plant.add(g)
    layer.add(plant)
  }

  private drawCounter() {
    const layer = this.layers.counter
    const g = this.add.graphics()
    g.fillStyle(0xf8e4bd)
    g.lineStyle(8, colors.ink)
    g.fillRoundedRect(18, 618, 1404, 92, 22)
    g.strokeRoundedRect(18, 618, 1404, 92, 22)
    g.fillStyle(0xee805d)
    g.fillRect(18, 682, 1404, 190)
    g.strokeRect(18, 682, 1404, 190)
    g.fillStyle(0xdc6b51)
    g.fillRect(77, 720, 1286, 152)
    g.lineStyle(7, 0xbe5948)
    for (let x = 270; x <= 1240; x += 242) g.lineBetween(x, 683, x, 872)
    g.fillStyle(colors.mustard)
    g.fillRoundedRect(637, 720, 168, 86, 43)
    g.fillStyle(colors.teal)
    g.fillEllipse(721, 768, 68, 62)
    g.lineStyle(5, 0xf8e4bd)
    g.beginPath()
    g.arc(721, 769, 20, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335))
    g.strokePath()
    layer.add(g)
  }

  private drawForeground() {
    const layer = this.layers.front
    const rabbit = this.add.image(94, 748, 'rabbit-customer').setDisplaySize(340, 340)
    const cat = this.add.image(1335, 750, 'cat-customer').setDisplaySize(345, 345)
    layer.add([rabbit, cat])

    const table = this.add.graphics()
    table.fillStyle(0x173e3d)
    table.fillEllipse(720, 888, 820, 170)
    table.fillStyle(colors.teal)
    table.lineStyle(8, colors.ink)
    table.fillEllipse(720, 866, 820, 170)
    table.strokeEllipse(720, 866, 820, 170)
    layer.add(table)

    const cup = this.add.container(690, 776)
    const cupArt = this.add.graphics()
    cupArt.fillStyle(colors.cream)
    cupArt.lineStyle(6, colors.ink)
    cupArt.fillRoundedRect(-37, 0, 74, 78, 15)
    cupArt.strokeRoundedRect(-37, 0, 74, 78, 15)
    cupArt.strokeCircle(47, 37, 23)
    cupArt.fillStyle(colors.brown)
    cupArt.fillEllipse(0, 2, 70, 18)
    cup.add(cupArt)

    const steam = this.addText(0, -62, '〰', 54, colors.cream).setOrigin(0.5).setRotation(Math.PI / 2)
    steam.setAlpha(0.7)
    cup.add(steam)
    this.tweens.add({ targets: steam, y: -69, alpha: 0.25, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
    layer.add(cup)
  }

  private drawFrameAndUi() {
    const border = this.add.graphics().setDepth(50)
    border.lineStyle(9, colors.ink)
    border.strokeRoundedRect(this.frame.x, this.frame.y, this.frame.width, this.frame.height, 38)

    const bean = this.add.graphics().setDepth(60)
    bean.fillStyle(colors.coral)
    bean.lineStyle(3, colors.ink)
    bean.fillEllipse(55, 40, 36, 44)
    bean.strokeEllipse(55, 40, 36, 44)
    bean.lineBetween(47, 55, 64, 25)

    this.addText(86, 14, 'MORNING SHIFT', 13, colors.coralDark).setDepth(60)
    this.addText(86, 31, 'Little Peak Coffee', 30, colors.ink).setDepth(60)

    this.roundedRect(1240, 22, 158, 38, 19, 0xfff8e8, 0xb6c1b8, 2).setDepth(60)
    this.add.circle(1261, 41, 6, 0x59a872).setDepth(61)
    this.addText(1275, 30, 'Open · 8:03 am', 16, 0x415a57).setDepth(61)

    const card = this.add.container(80, 704).setDepth(70).setRotation(-0.012)
    card.add(this.roundedRect(0, 0, 325, 125, 20, 0xfff7e1, colors.ink, 4))
    card.add(this.addText(28, 23, "TODAY'S BAR", 13, colors.coralDark))
    card.add(this.addText(28, 48, 'Good morning.', 28, colors.ink))
    card.add(this.addText(28, 82, 'The first shot is dialing in.', 16, 0x5d6e68))

    const hintBg = this.roundedRect(1153, 805, 225, 30, 10, colors.ink)
    hintBg.setAlpha(0.9).setDepth(70)
    this.addText(1171, 812, 'Move your pointer · parallax', 13, colors.cream).setDepth(71)
  }

  private roundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: number,
    stroke?: number,
    lineWidth = 0,
  ) {
    const graphic = this.add.graphics()
    graphic.fillStyle(fill)
    graphic.fillRoundedRect(x, y, width, height, radius)
    if (stroke !== undefined && lineWidth > 0) {
      graphic.lineStyle(lineWidth, stroke)
      graphic.strokeRoundedRect(x, y, width, height, radius)
    }
    return graphic
  }

  private addText(x: number, y: number, value: string, size: number, color: number) {
    return this.add.text(x, y, value, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: '600',
      color: css(color),
      resolution: 2,
    })
  }
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#f7ddb0',
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  scene: [StorefrontScene],
}
