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
  paper: 0xfff9e9,
  tile: 0xf7eddb,
  tileLine: 0xdfd2bc,
  mint: 0xb9dfcf,
  brown: 0x7b472e,
  coffee: 0x3f251b,
  steel: 0xdce5df,
  steelDark: 0x8da9a3,
  green: 0x69a96f,
}

const css = (color: number) => `#${color.toString(16).padStart(6, '0')}`
type Step = 'dose' | 'tamp' | 'place' | 'lock' | 'ready' | 'brewing' | 'result'

export class EspressoScene extends Phaser.Scene {
  private step: Step = 'dose'
  private dose = 0
  private tampForce = 0
  private tampOffset = 0
  private shotSeconds = 0
  private yieldGrams = 0
  private grinding = false
  private tamping = false
  private lockDragging = false
  private debug = false
  private timeScale = 1

  private statusText!: Phaser.GameObjects.Text
  private scaleText!: Phaser.GameObjects.Text
  private pressureText!: Phaser.GameObjects.Text
  private shotTimeText!: Phaser.GameObjects.Text
  private yieldText!: Phaser.GameObjects.Text
  private grinderButton!: Phaser.GameObjects.Arc
  private grindStream!: Phaser.GameObjects.Graphics
  private grounds!: Phaser.GameObjects.Graphics
  private portafilter!: Phaser.GameObjects.Container
  private tamper!: Phaser.GameObjects.Container
  private pressureNeedle!: Phaser.GameObjects.Graphics
  private groupGlow!: Phaser.GameObjects.Arc
  private lockGuide!: Phaser.GameObjects.Graphics
  private brewButton!: Phaser.GameObjects.Arc
  private streams!: Phaser.GameObjects.Graphics
  private crema!: Phaser.GameObjects.Ellipse
  private resultCard?: Phaser.GameObjects.Container
  private stepPills: Phaser.GameObjects.Container[] = []

  constructor() {
    super('espresso')
  }

  preload() {
    this.load.image('espresso-machine-detail', '/assets/espresso-machine-v2.png')
  }

  create() {
    this.debug = new URLSearchParams(window.location.search).get('debug') === 'true'
    this.stepPills = []
    this.resultCard = undefined
    this.resetValues()
    this.cameras.main.setBackgroundColor('#f4d9aa')

    this.drawRoom()
    this.drawHeader()
    this.drawRecipe()
    this.drawGrinder()
    this.drawMachine()
    this.drawWorktop()
    this.drawPortafilter()
    this.drawTamper()
    this.bindPointerControls()
    this.updateUi()

    this.game.canvas.dataset.scene = 'espresso'
    this.game.canvas.setAttribute('role', 'application')
    this.game.canvas.setAttribute(
      'aria-label',
      'Espresso station. Prepare an 18 gram dose, tamp it, lock the portafilter, then pull a 36 gram shot in 25 to 30 seconds.',
    )

    if (this.debug) this.drawDebugControls()
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('storefront'))
  }

  update(_time: number, delta: number) {
    const seconds = Math.min(delta, 50) / 1000

    if (this.step === 'dose' && this.grinding) {
      this.dose = Math.min(22, this.dose + seconds * 5.2)
      this.drawGrounds()
      this.drawGrinding()
      this.updateUi()
      if (this.dose >= 22) this.grinding = false
    }

    if (this.step === 'brewing') {
      this.shotSeconds += seconds * this.timeScale
      const flow = 1.22 + Math.min(this.shotSeconds / 28, 1) * 0.24
      this.yieldGrams = Math.min(52, this.yieldGrams + seconds * this.timeScale * flow)
      this.drawStreams()
      this.updateUi()
      if (this.shotSeconds >= 38 || this.yieldGrams >= 52) this.finishShot()
    }
  }

  private resetValues() {
    this.step = 'dose'
    this.dose = 0
    this.tampForce = 0
    this.tampOffset = 0
    this.shotSeconds = 0
    this.yieldGrams = 0
    this.grinding = false
    this.tamping = false
    this.lockDragging = false
    this.timeScale = this.debug ? 5 : 1
  }

  private drawRoom() {
    const g = this.add.graphics()
    g.fillStyle(colors.tile)
    g.fillRect(0, 0, WIDTH, HEIGHT)
    g.lineStyle(2, colors.tileLine, 0.65)
    for (let x = 0; x <= WIDTH; x += 72) g.lineBetween(x, 88, x, 620)
    for (let y = 88; y <= 620; y += 72) g.lineBetween(0, y, WIDTH, y)

    g.fillStyle(colors.coral)
    g.fillRect(0, 0, WIDTH, 88)
    g.fillStyle(colors.mustard)
    for (let x = 0; x < WIDTH; x += 216) g.fillRect(x, 80, 108, 16)

    g.fillStyle(0xf0c582)
    g.fillRect(0, 620, WIDTH, 280)
    g.fillStyle(0x8e5438)
    g.fillRect(0, 642, WIDTH, 20)
    g.fillStyle(0xaa6945)
    g.fillRect(0, 662, WIDTH, 238)
    g.lineStyle(5, 0x8d543a, 0.45)
    for (let x = 42; x < WIDTH; x += 180) g.lineBetween(x, 662, x, 900)
  }

  private drawHeader() {
    const back = this.add.circle(48, 45, 25, colors.paper).setStrokeStyle(3, colors.ink).setInteractive({ useHandCursor: true })
    this.addText(48, 30, '‹', 30, colors.ink).setOrigin(0.5, 0)
    back.on('pointerdown', () => this.scene.start('storefront'))

    this.addText(86, 17, 'ON BAR', 13, colors.cream)
    this.addText(86, 35, 'Dial in the espresso', 29, colors.cream)

    const names = ['DOSE', 'TAMP', 'LOCK', 'BREW']
    names.forEach((name, index) => {
      const pill = this.add.container(655 + index * 126, 24)
      const bg = this.roundedRect(0, 0, 108, 39, 19, index === 0 ? colors.mustard : colors.paper)
      bg.setAlpha(index === 0 ? 1 : 0.45)
      pill.add([bg, this.addText(54, 10, name, 14, colors.ink).setOrigin(0.5, 0)])
      this.stepPills.push(pill)
    })

    const status = this.roundedRect(1175, 21, 230, 44, 22, colors.deepTeal)
    status.setAlpha(0.94)
    this.statusText = this.addText(1290, 32, '18.0 g', 17, colors.cream).setOrigin(0.5, 0)
  }

  private drawRecipe() {
    const card = this.add.container(1110, 120).setRotation(0.012)
    card.add(this.roundedRect(0, 0, 285, 315, 24, colors.paper, colors.ink, 5))
    card.add(this.add.circle(142, 17, 12, colors.coral).setStrokeStyle(3, colors.ink))
    card.add(this.addText(28, 35, 'HOUSE RECIPE', 14, colors.coralDark))
    card.add(this.addText(28, 60, 'Little Peak', 31, colors.ink))
    card.add(this.addText(28, 104, 'ESPRESSO', 14, colors.teal))

    this.recipeRow(card, 28, 137, 'DOSE', '18.0 g')
    this.recipeRow(card, 28, 181, 'YIELD', '36 g')
    this.recipeRow(card, 28, 225, 'TIME', '25–30 s')

    const rule = this.add.graphics()
    rule.lineStyle(2, colors.tileLine)
    rule.lineBetween(28, 273, 257, 273)
    card.add(rule)
    card.add(this.addText(28, 282, 'LEVEL  •  FIRM', 14, colors.deepTeal))
  }

  private recipeRow(card: Phaser.GameObjects.Container, x: number, y: number, label: string, value: string) {
    card.add(this.addText(x, y, label, 14, 0x71807b))
    card.add(this.addText(x + 229, y - 5, value, 24, colors.ink).setOrigin(1, 0))
  }

  private drawGrinder() {
    const grinder = this.add.container(70, 135)
    const g = this.add.graphics()
    g.fillStyle(0xd8ebe6, 0.95)
    g.lineStyle(7, colors.ink)
    g.beginPath()
    g.moveTo(53, 0)
    g.lineTo(221, 0)
    g.lineTo(198, 151)
    g.lineTo(78, 151)
    g.closePath()
    g.fillPath()
    g.strokePath()

    g.fillStyle(colors.brown)
    for (const [x, y, r] of [[91, 42, 14], [139, 71, 16], [180, 37, 13], [111, 112, 12], [170, 115, 15]] as const) {
      g.fillEllipse(x, y, r * 1.5, r)
    }

    g.fillStyle(colors.deepTeal)
    g.fillRoundedRect(65, 151, 146, 313, 25)
    g.strokeRoundedRect(65, 151, 146, 313, 25)
    g.fillStyle(0x183f3e)
    g.fillRoundedRect(87, 182, 102, 84, 17)
    g.fillStyle(colors.mint)
    g.fillRoundedRect(104, 202, 68, 31, 8)
    g.fillStyle(colors.ink)
    g.fillRect(111, 291, 55, 80)
    g.fillRoundedRect(55, 445, 166, 32, 15)
    grinder.add(g)

    grinder.add(this.addText(138, 210, '2.4', 18, colors.deepTeal).setOrigin(0.5, 0))
    grinder.add(this.addText(138, 276, 'GRIND', 13, colors.cream).setOrigin(0.5, 0))

    this.grinderButton = this.add.circle(138, 330, 29, colors.coral).setStrokeStyle(6, colors.ink)
    this.grinderButton.setInteractive({ useHandCursor: true })
    grinder.add(this.grinderButton)

    const fork = this.add.graphics()
    fork.lineStyle(12, colors.ink)
    fork.lineBetween(111, 386, 111, 433)
    fork.lineBetween(165, 386, 165, 433)
    fork.lineBetween(111, 430, 165, 430)
    grinder.add(fork)
    this.grindStream = this.add.graphics().setDepth(7)
    this.tweens.add({ targets: this.grinderButton, scale: 1.1, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.InOut' })

    this.grinderButton.on('pointerdown', () => {
      if (this.step !== 'dose') return
      this.grinding = true
      this.grinderButton.setFillStyle(colors.mustard)
    })
  }

  private drawMachine() {
    this.add.image(812, 400, 'espresso-machine-detail').setDisplaySize(535, 428).setDepth(1)

    this.brewButton = this.add.circle(898, 278, 25, colors.coral, 0.16)
      .setStrokeStyle(5, colors.coral, 0.78)
      .setDepth(9)
      .setInteractive({ useHandCursor: true })

    this.groupGlow = this.add.circle(812, 351, 72, colors.mustard, 0).setStrokeStyle(8, colors.coral, 0)
    this.groupGlow.setDepth(10)
    this.lockGuide = this.add.graphics().setDepth(12).setVisible(false)

    const shotScale = this.add.container(812, 548).setDepth(5)
    const scaleG = this.add.graphics()
    scaleG.fillStyle(colors.steel)
    scaleG.lineStyle(6, colors.ink)
    scaleG.fillRoundedRect(-111, -38, 222, 82, 20)
    scaleG.strokeRoundedRect(-111, -38, 222, 82, 20)
    scaleG.fillStyle(0xb8cac5)
    scaleG.fillRoundedRect(-92, -52, 184, 25, 10)
    scaleG.lineStyle(4, colors.ink)
    scaleG.strokeRoundedRect(-92, -52, 184, 25, 10)
    scaleG.fillStyle(colors.ink)
    scaleG.fillRoundedRect(-91, -16, 84, 40, 9)
    scaleG.fillRoundedRect(7, -16, 84, 40, 9)
    shotScale.add(scaleG)
    shotScale.add(this.addText(-49, 27, 'TIME', 11, colors.teal).setOrigin(0.5, 0))
    shotScale.add(this.addText(49, 27, 'YIELD', 11, colors.teal).setOrigin(0.5, 0))
    this.shotTimeText = this.addText(-49, -9, '0.0', 22, colors.mint).setOrigin(0.5, 0)
    this.yieldText = this.addText(49, -9, '0.0', 22, colors.mustard).setOrigin(0.5, 0)
    shotScale.add([this.shotTimeText, this.yieldText])

    const cup = this.add.container(812, 437).setDepth(7)
    const cupG = this.add.graphics()
    cupG.fillStyle(colors.cream)
    cupG.lineStyle(6, colors.ink)
    cupG.fillRoundedRect(-49, 0, 98, 76, 16)
    cupG.strokeRoundedRect(-49, 0, 98, 76, 16)
    cupG.strokeCircle(59, 32, 23)
    cupG.fillStyle(0xe1c79b)
    cupG.fillEllipse(0, 3, 88, 20)
    cup.add(cupG)
    this.crema = this.add.ellipse(0, 3, 82, 15, colors.brown).setVisible(false)
    cup.add(this.crema)

    this.streams = this.add.graphics().setDepth(11)
  }

  private drawWorktop() {
    const doseScale = this.add.container(65, 525).setDepth(2)
    const scaleG = this.add.graphics()
    scaleG.fillStyle(colors.steel)
    scaleG.lineStyle(7, colors.ink)
    scaleG.fillRoundedRect(0, 0, 445, 126, 24)
    scaleG.strokeRoundedRect(0, 0, 445, 126, 24)
    scaleG.fillStyle(0xb8cac5)
    scaleG.fillRoundedRect(22, 14, 242, 66, 18)
    scaleG.lineStyle(4, colors.ink)
    scaleG.strokeRoundedRect(22, 14, 242, 66, 18)
    scaleG.fillStyle(colors.ink)
    scaleG.fillRoundedRect(274, 52, 150, 55, 12)
    doseScale.add(scaleG)
    doseScale.add(this.addText(32, 94, 'DOSE SCALE', 13, colors.teal))
    this.scaleText = this.addText(349, 61, '0.0 g', 28, colors.mint).setOrigin(0.5, 0)
    doseScale.add(this.scaleText)

    const mat = this.roundedRect(335, 675, 405, 158, 27, colors.deepTeal, colors.ink, 7)
    mat.setAlpha(0.96)
    this.addText(365, 790, 'TAMP MAT', 13, colors.mint)

    const gauge = this.add.container(778, 678)
    const gg = this.add.graphics()
    gg.fillStyle(colors.paper)
    gg.lineStyle(6, colors.ink)
    gg.fillCircle(83, 83, 78)
    gg.strokeCircle(83, 83, 78)
    gg.lineStyle(4, colors.tileLine)
    for (let angle = 205; angle <= 335; angle += 26) {
      const a = Phaser.Math.DegToRad(angle)
      gg.lineBetween(83 + Math.cos(a) * 55, 83 + Math.sin(a) * 55, 83 + Math.cos(a) * 67, 83 + Math.sin(a) * 67)
    }
    gauge.add(gg)
    gauge.add(this.addText(83, 91, 'TAMP', 12, colors.teal).setOrigin(0.5, 0))
    this.pressureText = this.addText(83, 112, '0 kg', 18, colors.ink).setOrigin(0.5, 0)
    gauge.add(this.pressureText)
    this.pressureNeedle = this.add.graphics()
    gauge.add(this.pressureNeedle)
    this.drawPressureNeedle()
  }

  private drawPortafilter() {
    this.portafilter = this.add.container(208, 565).setDepth(8)
    const shadow = this.add.ellipse(45, 14, 270, 48, colors.ink, 0.18)
    const g = this.add.graphics()
    g.fillStyle(colors.steel)
    g.lineStyle(7, colors.ink)
    g.fillEllipse(0, 0, 150, 83)
    g.strokeEllipse(0, 0, 150, 83)
    g.fillStyle(0x6f8580)
    g.fillEllipse(0, 0, 121, 59)
    g.fillStyle(0x283c39)
    g.fillRoundedRect(66, -14, 186, 28, 13)
    g.lineStyle(6, colors.ink)
    g.strokeRoundedRect(66, -14, 186, 28, 13)
    g.fillStyle(colors.coral)
    g.fillRoundedRect(207, -22, 78, 44, 19)
    g.strokeRoundedRect(207, -22, 78, 44, 19)
    this.grounds = this.add.graphics()
    this.portafilter.add([shadow, g, this.grounds])
    this.portafilter.setInteractive(new Phaser.Geom.Rectangle(-80, -50, 365, 100), Phaser.Geom.Rectangle.Contains)
    this.portafilter.input!.draggable = true
    this.portafilter.input!.cursor = 'pointer'
    this.input.setDraggable(this.portafilter)
  }

  private drawTamper() {
    this.tamper = this.add.container(558, 735).setDepth(15).setVisible(false)
    const g = this.add.graphics()
    g.fillStyle(colors.coral)
    g.lineStyle(6, colors.ink)
    g.fillRoundedRect(-29, -107, 58, 81, 22)
    g.strokeRoundedRect(-29, -107, 58, 81, 22)
    g.fillStyle(colors.steel)
    g.fillRect(-11, -28, 22, 44)
    g.fillEllipse(0, 17, 94, 27)
    g.strokeEllipse(0, 17, 94, 27)
    this.tamper.add(g)
    this.tamper.setSize(105, 140).setInteractive({ draggable: true, useHandCursor: true })
    this.input.setDraggable(this.tamper)
  }

  private bindPointerControls() {
    this.input.on('pointerup', () => {
      if (this.grinding) {
        this.grinding = false
        this.grindStream.clear()
        this.grinderButton.setFillStyle(colors.coral)
        if (this.dose >= 16.5) this.completeDose()
      }
      if (this.tamping) this.completeTamp()
      this.tamping = false
      this.lockDragging = false
    })

    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      if (object === this.tamper && this.step === 'tamp') {
        this.tweens.killTweensOf(this.tamper)
        this.tamping = true
      }
    })

    this.input.on('drag', (pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      if (object === this.tamper && this.step === 'tamp') {
        const x = Phaser.Math.Clamp(dragX, 410, 570)
        const y = Phaser.Math.Clamp(dragY, 676, 774)
        this.tamper.setPosition(x, y)
        this.tampOffset = Math.abs(x - 470)
        this.tampForce = Phaser.Math.Clamp((y - 688) * 0.19, 0, 17)
        this.drawPressureNeedle()
        this.updateUi()
      }

      if (object === this.portafilter && this.step === 'place') {
        this.portafilter.setPosition(dragX, dragY)
        if (Phaser.Math.Distance.Between(dragX, dragY, 812, 351) < 95) this.snapToGroup()
      }
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.lockDragging || this.step !== 'lock') return
      let angle = Math.atan2(pointer.y - 351, pointer.x - 812)
      if (angle < 0) angle += Math.PI * 2
      angle = Phaser.Math.Clamp(angle, 0, 2.35)
      this.portafilter.setRotation(angle)
      if (angle < 0.2) this.completeLock()
    })

    this.portafilter.on('pointerdown', () => {
      if (this.step === 'lock') this.lockDragging = true
    })

    this.brewButton.on('pointerdown', () => {
      if (this.step === 'ready') this.startShot()
      else if (this.step === 'brewing') this.finishShot()
    })
  }

  private completeDose() {
    this.step = 'tamp'
    this.portafilter.disableInteractive()
    this.tamper.setPosition(470, 680).setVisible(false)
    this.tweens.add({
      targets: this.portafilter,
      x: 470,
      y: 735,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.tamper.setVisible(true)
        this.tweens.add({ targets: this.tamper, y: 690, duration: 430, yoyo: true, repeat: -1, ease: 'Sine.InOut' })
      },
    })
    this.updateUi()
  }

  private completeTamp() {
    if (this.tampForce < 8) {
      this.tamper.setPosition(470, 680)
      return
    }
    this.step = 'place'
    this.tamper.setVisible(false)
    this.portafilter.setInteractive(new Phaser.Geom.Rectangle(-80, -50, 365, 100), Phaser.Geom.Rectangle.Contains)
    this.portafilter.input!.draggable = true
    this.portafilter.input!.cursor = 'pointer'
    this.input.setDraggable(this.portafilter)
    this.groupGlow.setFillStyle(colors.mustard, 0.16).setStrokeStyle(8, colors.coral, 0.85)
    this.tweens.add({ targets: this.groupGlow, scale: 1.09, alpha: 0.45, duration: 650, yoyo: true, repeat: -1 })
    this.updateUi()
  }

  private snapToGroup() {
    this.step = 'lock'
    this.portafilter.setPosition(812, 351).setRotation(2.35)
    this.portafilter.setDepth(13)
    this.groupGlow.setVisible(false)
    this.lockGuide.setVisible(true)
    this.drawLockGuide()
    this.updateUi()
  }

  private completeLock() {
    this.step = 'ready'
    this.lockDragging = false
    this.portafilter.setRotation(0).disableInteractive()
    this.lockGuide.setVisible(false)
    this.brewButton.setFillStyle(colors.coral)
    this.tweens.add({ targets: this.brewButton, scale: 1.16, duration: 500, yoyo: true, repeat: -1 })
    this.updateUi()
  }

  private startShot() {
    this.step = 'brewing'
    this.shotSeconds = 0
    this.yieldGrams = 0
    this.brewButton.setFillStyle(colors.green)
    this.tweens.killTweensOf(this.brewButton)
    this.brewButton.setScale(1)
    this.crema.setVisible(true).setScale(0.1)
    this.updateUi()
  }

  private finishShot() {
    if (this.step !== 'brewing') return
    this.step = 'result'
    this.brewButton.setFillStyle(colors.coral)
    this.drawStreams()
    this.updateUi()
    this.time.delayedCall(450, () => this.showResult())
  }

  private showResult() {
    const doseError = Math.abs(this.dose - 18)
    const ratioError = Math.abs(this.yieldGrams / Math.max(this.dose, 1) - 2)
    const timeGood = this.shotSeconds >= 25 && this.shotSeconds <= 30
    const tampGood = this.tampForce >= 10 && this.tampForce <= 17 && this.tampOffset <= 28
    const success = doseError <= 0.5 && ratioError <= 0.12 && timeGood && tampGood

    let title = 'One more adjustment.'
    let note = 'Close. Taste it, then pull another.'
    if (success) {
      title = 'Sweet and balanced.'
      note = 'Syrupy body · cocoa · toasted almond'
    } else if (doseError > 0.5) {
      note = this.dose < 18 ? 'Thin body — the dose ran light.' : 'Heavy and muddy — the dose ran high.'
    } else if (!timeGood) {
      note = this.shotSeconds < 25 ? 'Bright and sharp — it ran too fast.' : 'Dry and bitter — it ran too long.'
    } else if (ratioError > 0.12) {
      note = this.yieldGrams < this.dose * 2 ? 'Short and intense — a little more yield.' : 'Thin finish — the yield ran long.'
    } else if (!tampGood) {
      note = 'Uneven extraction — keep the tamp level.'
    }

    const veil = this.add.rectangle(720, 450, 1440, 900, colors.ink, 0.42).setDepth(90).setInteractive()
    const card = this.add.container(720, 438).setDepth(91)
    card.add(this.roundedRect(-335, -225, 670, 450, 32, colors.paper, colors.ink, 7))
    card.add(this.addText(0, -182, success ? 'SHOT DIALED IN' : 'TASTE & ADJUST', 14, success ? colors.green : colors.coralDark).setOrigin(0.5, 0))
    card.add(this.addText(0, -145, title, 36, colors.ink).setOrigin(0.5, 0))
    card.add(this.addText(0, -92, note, 18, 0x5d6e68).setOrigin(0.5, 0))

    this.metric(card, -220, 0, this.dose.toFixed(1), 'g IN', doseError <= 0.5)
    this.metric(card, 0, 0, this.yieldGrams.toFixed(1), 'g OUT', ratioError <= 0.12)
    this.metric(card, 220, 0, this.shotSeconds.toFixed(1), 'SECONDS', timeGood)

    const button = this.roundedRect(-137, 125, 274, 62, 25, success ? colors.teal : colors.coral, colors.ink, 5)
    button.setInteractive({ useHandCursor: true })
    card.add(button)
    card.add(this.addText(0, 141, success ? 'BACK TO THE BAR' : 'PULL ANOTHER', 17, colors.cream).setOrigin(0.5, 0))
    button.on('pointerdown', () => {
      veil.destroy()
      if (success) this.scene.start('storefront', { dialedIn: true })
      else this.scene.restart()
    })
    this.resultCard = card
  }

  private metric(card: Phaser.GameObjects.Container, x: number, y: number, value: string, label: string, good: boolean) {
    const bg = this.roundedRect(x - 83, y - 40, 166, 114, 19, good ? 0xdcefdc : 0xf7e1cf)
    card.add(bg)
    card.add(this.addText(x, y - 24, value, 31, colors.ink).setOrigin(0.5, 0))
    card.add(this.addText(x, y + 18, label, 12, good ? 0x4f8457 : colors.coralDark).setOrigin(0.5, 0))
  }

  private drawGrinding() {
    this.grindStream.clear()
    this.grindStream.lineStyle(7, colors.brown, 0.82)
    this.grindStream.lineBetween(201, 501, 206, 548)
    this.grindStream.fillStyle(0xa76639, 0.95)
    for (let i = 0; i < 7; i++) {
      const y = 505 + ((this.dose * 17 + i * 11) % 40)
      this.grindStream.fillCircle(201 + (i % 3) * 4, y, 2)
    }
  }

  private drawGrounds() {
    this.grounds.clear()
    if (this.dose <= 0) return
    const fullness = Phaser.Math.Clamp(this.dose / 18, 0.08, 1.15)
    this.grounds.fillStyle(colors.coffee)
    this.grounds.fillEllipse(0, -1, 111 * Math.min(fullness * 1.7, 1), 53 * Math.min(fullness * 1.7, 1))
    this.grounds.fillStyle(0x9a5c35, 0.9)
    const dots = Math.floor(this.dose * 1.6)
    for (let i = 0; i < dots; i++) {
      const angle = i * 2.399
      const radius = Math.sqrt(i / Math.max(dots, 1)) * 48
      this.grounds.fillCircle(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.42 - 2, 1.8)
    }
  }

  private drawPressureNeedle() {
    if (!this.pressureNeedle) return
    this.pressureNeedle.clear()
    const angle = Phaser.Math.DegToRad(205 + (this.tampForce / 17) * 130)
    this.pressureNeedle.lineStyle(6, this.tampForce >= 10 ? colors.green : colors.coral)
    this.pressureNeedle.lineBetween(83, 83, 83 + Math.cos(angle) * 53, 83 + Math.sin(angle) * 53)
    this.pressureNeedle.fillStyle(colors.ink)
    this.pressureNeedle.fillCircle(83, 83, 8)
  }

  private drawLockGuide() {
    this.lockGuide.clear()
    this.lockGuide.lineStyle(8, colors.coral, 0.85)
    this.lockGuide.beginPath()
    this.lockGuide.arc(812, 351, 112, 0.22, 2.18, true)
    this.lockGuide.strokePath()
    this.lockGuide.fillStyle(colors.coral)
    this.lockGuide.fillTriangle(914, 302, 936, 311, 922, 327)
  }

  private drawStreams() {
    this.streams.clear()
    if (this.step !== 'brewing') return
    this.streams.lineStyle(7, colors.brown, 0.95)
    this.streams.lineBetween(790, 378, 792, 439)
    this.streams.lineBetween(834, 378, 832, 439)
    this.streams.lineStyle(2, colors.mustard, 0.8)
    this.streams.lineBetween(788, 381, 790, 438)
    this.streams.lineBetween(832, 381, 830, 438)
    this.crema.setScale(Phaser.Math.Clamp(this.yieldGrams / 12, 0.1, 1))
  }

  private updateUi() {
    if (!this.statusText) return
    this.scaleText.setText(`${this.dose.toFixed(1)} g`)
    this.pressureText.setText(`${this.tampForce.toFixed(0)} kg`)
    this.shotTimeText.setText(this.shotSeconds.toFixed(1))
    this.yieldText.setText(this.yieldGrams.toFixed(1))

    const current = this.step === 'dose' ? 0 : this.step === 'tamp' ? 1 : ['place', 'lock'].includes(this.step) ? 2 : 3
    this.stepPills.forEach((pill, index) => {
      const bg = pill.list[0] as Phaser.GameObjects.Graphics
      bg.setAlpha(index === current ? 1 : index < current ? 0.72 : 0.42)
    })

    if (this.step === 'dose') {
      this.statusText.setText(this.dose < 16.5 ? 'HOLD GRIND TO 18.0' : `${this.dose.toFixed(1)} g  •  RELEASE`)
      this.scaleText.setColor(css(Math.abs(this.dose - 18) <= 0.5 ? colors.mustard : colors.mint))
    } else if (this.step === 'tamp') {
      this.statusText.setText(this.tampForce < 8 ? 'DRAG TAMP DOWN' : `${this.tampForce.toFixed(0)} kg  •  RELEASE`)
    } else if (this.step === 'place') {
      this.statusText.setText('DRAG TO GROUP')
    } else if (this.step === 'lock') {
      this.statusText.setText('TURN TO LOCK')
    } else if (this.step === 'ready') {
      this.statusText.setText('PRESS BREW')
    } else if (this.step === 'brewing') {
      this.statusText.setText('STOP AT 36.0 g')
    } else {
      this.statusText.setText('TASTING…')
    }
  }

  private drawDebugControls() {
    const bg = this.roundedRect(1134, 459, 261, 116, 18, colors.ink)
    bg.setDepth(80)
    this.addText(1154, 472, 'DEBUG · 5× SHOT CLOCK', 13, colors.mustard).setDepth(81)
    const perfect = this.roundedRect(1153, 508, 222, 43, 15, colors.coral)
    perfect.setDepth(81).setInteractive({ useHandCursor: true })
    this.addText(1264, 519, 'PERFECT SETUP', 14, colors.cream).setOrigin(0.5, 0).setDepth(82)
    perfect.on('pointerdown', () => {
      if (this.step === 'result') return
      this.dose = 18
      this.tampForce = 15
      this.tampOffset = 0
      this.drawGrounds()
      this.tamper?.setVisible(false)
      this.portafilter.setPosition(812, 351).setRotation(0).disableInteractive().setDepth(13)
      this.groupGlow.setVisible(false)
      this.lockGuide.setVisible(false)
      this.step = 'ready'
      this.updateUi()
    })
  }

  private roundedRect(x: number, y: number, width: number, height: number, radius: number, fill: number, stroke?: number, lineWidth = 0) {
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
