import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BUILDINGS, FACILITY_RANGE, HQ, WORLD_SIZE, type Building, type BuildingType, type GameState } from './game'

const TILE_W = 74
const TILE_H = 37
const ORIGIN_X = 1600
const ORIGIN_Y = 150
const WORLD_WIDTH = 3200
const WORLD_HEIGHT = 1700

const iso = (x: number, y: number) => ({
  x: ORIGIN_X + (x - y) * TILE_W / 2,
  y: ORIGIN_Y + (x + y) * TILE_H / 2,
})

const fromIso = (x: number, y: number) => {
  const a = (x - ORIGIN_X) / (TILE_W / 2)
  const b = (y - ORIGIN_Y) / (TILE_H / 2)
  return { x: Math.round((a + b) / 2), y: Math.round((b - a) / 2) }
}

type Props = {
  state: GameState
  onGround: (x: number, y: number) => void
  onBuilding: (id: number) => void
  onWorker: (id: number) => void
}

type Bridge = Props

class FrontierScene extends Phaser.Scene {
  bridge!: Bridge
  graphics!: Phaser.GameObjects.Graphics
  labels: Phaser.GameObjects.Text[] = []
  pointerStart: { x: number; y: number; scrollX: number; scrollY: number } | null = null
  dragged = false

  constructor() { super('frontier') }

  create() {
    this.graphics = this.add.graphics()
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setZoom(.82)
    this.focusHome()

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.pointerStart = { x: pointer.x, y: pointer.y, scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY }
        this.dragged = false
      }
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerStart || !pointer.isDown) return
      const dx = pointer.x - this.pointerStart.x
      const dy = pointer.y - this.pointerStart.y
      if (Math.hypot(dx, dy) > 5) this.dragged = true
      if (this.dragged) {
        this.cameras.main.scrollX = this.pointerStart.scrollX - dx / this.cameras.main.zoom
        this.cameras.main.scrollY = this.pointerStart.scrollY - dy / this.cameras.main.zoom
      }
    })
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const click = !this.dragged
      this.pointerStart = null
      if (click) this.handleClick(pointer.worldX, pointer.worldY)
    })
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => {
      const camera = this.cameras.main
      const before = camera.getWorldPoint(pointer.x, pointer.y)
      camera.setZoom(Phaser.Math.Clamp(camera.zoom * (dy > 0 ? .88 : 1.14), .46, 1.48))
      const after = camera.getWorldPoint(pointer.x, pointer.y)
      camera.scrollX += before.x - after.x
      camera.scrollY += before.y - after.y
    })
    this.draw()
  }

  focusHome() {
    const point = iso(HQ.x, HQ.y)
    this.cameras.main.centerOn(point.x, point.y)
  }

  zoomBy(factor: number) {
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * factor, .46, 1.48))
  }

  handleClick(worldX: number, worldY: number) {
    const worker = [...this.bridge.state.workers]
      .sort((a, b) => Math.hypot(iso(a.x, a.y).x - worldX, iso(a.x, a.y).y - worldY) - Math.hypot(iso(b.x, b.y).x - worldX, iso(b.x, b.y).y - worldY))
      .find(unit => {
        const point = iso(unit.x, unit.y)
        return Math.hypot(point.x - worldX, point.y - worldY) < 24
      })
    if (worker) {
      this.bridge.onWorker(worker.id)
      return
    }
    const building = [...this.bridge.state.buildings]
      .sort((a, b) => Math.hypot(iso(a.x, a.y).x - worldX, iso(a.x, a.y).y - worldY) - Math.hypot(iso(b.x, b.y).x - worldX, iso(b.x, b.y).y - worldY))
      .find(item => {
        const point = iso(item.x, item.y)
        return Math.hypot(point.x - worldX, point.y - 13 - worldY) < 34
      })
    if (building) {
      this.bridge.onBuilding(building.id)
      return
    }
    const tile = fromIso(worldX, worldY)
    if (tile.x >= 0 && tile.y >= 0 && tile.x < WORLD_SIZE && tile.y < WORLD_SIZE) this.bridge.onGround(tile.x, tile.y)
  }

  diamond(x: number, y: number, fill: number, stroke = 0x547a69, alpha = 1) {
    const graphics = this.graphics
    graphics.fillStyle(fill, alpha)
    graphics.lineStyle(1, stroke, .42)
    graphics.beginPath()
    graphics.moveTo(x, y - TILE_H / 2)
    graphics.lineTo(x + TILE_W / 2, y)
    graphics.lineTo(x, y + TILE_H / 2)
    graphics.lineTo(x - TILE_W / 2, y)
    graphics.closePath()
    graphics.fillPath()
    graphics.strokePath()
  }

  text(x: number, y: number, value: string, size = 13, color = '#dffbe7') {
    const label = this.add.text(x, y, value, {
      fontFamily: 'Chakra Petch, monospace', fontSize: `${size}px`, fontStyle: 'bold', color,
      stroke: '#081914', strokeThickness: 3,
      resolution: Math.min(window.devicePixelRatio * 2, 4),
    }).setOrigin(.5)
    this.labels.push(label)
  }

  drawBuilding(building: Building, time: number) {
    const point = iso(building.x, building.y)
    const graphics = this.graphics
    const x = point.x
    const y = point.y
    if (building.status !== 'complete') {
      this.diamond(x, y, 0x233f38, 0xffcf63, .9)
      graphics.lineStyle(2, 0xffcf63, .85)
      graphics.strokeRect(x - 23, y - 35, 46, 31)
      graphics.lineBetween(x - 23, y - 35, x + 23, y - 4)
      graphics.lineBetween(x + 23, y - 35, x - 23, y - 4)
      graphics.fillStyle(0x081914, .9)
      graphics.fillRect(x - 25, y + 11, 50, 5)
      graphics.fillStyle(0xffcf63, 1)
      graphics.fillRect(x - 24, y + 12, 48 * building.progress, 3)
      this.text(x, y - 48, building.status === 'blueprint' ? 'ASSIGN ROBOT' : `${Math.floor(building.progress * 100)}%`, 12, '#ffdc86')
      return
    }

    const online = building.connected
    const accent = online ? 0x63f2a5 : 0xff6677
    graphics.fillStyle(0x071c1c, .3)
    graphics.fillEllipse(x, y + 7, 56, 20)

    if (building.type === 'pylon') {
      graphics.lineStyle(4, online ? 0xc7ded0 : 0x7e7777, 1)
      graphics.lineBetween(x, y - 49, x, y + 2)
      graphics.lineStyle(2, accent, 1)
      graphics.lineBetween(x - 18, y - 35, x + 18, y - 35)
      graphics.lineBetween(x - 13, y - 21, x + 13, y - 21)
      graphics.fillStyle(accent, 1)
      graphics.fillCircle(x, y - 49, 5)
    } else if (building.type === 'solar') {
      graphics.fillStyle(0x153d51, 1)
      graphics.lineStyle(2, accent, 1)
      for (let row = 0; row < 2; row++) {
        graphics.beginPath()
        graphics.moveTo(x - 31 + row * 7, y - 9 - row * 12)
        graphics.lineTo(x + 3 + row * 7, y - 24 - row * 12)
        graphics.lineTo(x + 31 + row * 7, y - 12 - row * 12)
        graphics.lineTo(x - 3 + row * 7, y + 3 - row * 12)
        graphics.closePath(); graphics.fillPath(); graphics.strokePath()
      }
    } else if (building.type === 'wind') {
      for (const offset of [-18, 18]) {
        graphics.fillStyle(0xd7e5dc, 1); graphics.fillRect(x + offset - 2, y - 44, 4, 43)
        graphics.fillStyle(accent, 1); graphics.fillCircle(x + offset, y - 44, 5)
        graphics.lineStyle(3, 0xe4f1e9, 1)
        for (let blade = 0; blade < 3; blade++) {
          const angle = time * 1.7 + blade * Math.PI * 2 / 3 + offset
          graphics.lineBetween(x + offset, y - 44, x + offset + Math.cos(angle) * 18, y - 44 + Math.sin(angle) * 18)
        }
      }
    } else if (building.type === 'geothermal') {
      graphics.fillStyle(0x173c35, 1); graphics.fillRoundedRect(x - 28, y - 36, 56, 39, 4)
      graphics.lineStyle(2, accent, 1); graphics.strokeRoundedRect(x - 28, y - 36, 56, 39, 4)
      graphics.fillStyle(0xc4d8cc, 1); graphics.fillRect(x - 18, y - 57, 12, 27); graphics.fillRect(x + 8, y - 48, 10, 18)
      graphics.fillStyle(0xc7fff0, .18); graphics.fillCircle(x - 12, y - 64 - Math.sin(time * 2) * 4, 10)
    } else if (building.type === 'fusion') {
      graphics.fillStyle(0xcadbd0, 1); graphics.fillRoundedRect(x - 33, y - 26, 66, 29, 5)
      graphics.fillStyle(0x102c30, 1); graphics.fillCircle(x, y - 29, 25)
      graphics.lineStyle(5, accent, 1); graphics.beginPath(); graphics.arc(x, y - 29, 17, time * 1.8, time * 1.8 + Math.PI * 1.55); graphics.strokePath()
      graphics.fillStyle(0xffffff, .8); graphics.fillCircle(x, y - 29, 5)
    } else if (building.type === 'garage') {
      graphics.fillStyle(0xbacfc4, 1)
      graphics.beginPath(); graphics.moveTo(x - 31, y - 30); graphics.lineTo(x, y - 48); graphics.lineTo(x + 31, y - 30); graphics.lineTo(x + 31, y + 4); graphics.lineTo(x - 31, y + 4); graphics.closePath(); graphics.fillPath()
      graphics.fillStyle(0x112d2d, 1); graphics.fillRect(x - 18, y - 24, 36, 28)
      graphics.lineStyle(2, accent, 1); graphics.strokeRect(x - 18, y - 24, 36, 28)
    }

    if (!online && building.type !== 'pylon') this.text(x, y - 67, 'OFF GRID', 12, '#ff6677')
  }

  drawRobot(worker: GameState['workers'][number], selected: boolean, time: number) {
    const point = iso(worker.x, worker.y)
    const graphics = this.graphics
    const bob = worker.status === 'moving' ? Math.sin(time * 13 + worker.id) * 2 : 0
    if (selected) {
      graphics.lineStyle(2, 0xffcf63, 1)
      graphics.strokeEllipse(point.x, point.y + 5, 38, 19)
    }
    graphics.fillStyle(worker.status === 'stalled' ? 0xff6677 : 0xf2b84b, 1)
    graphics.fillRoundedRect(point.x - 9, point.y - 17 + bob, 18, 17, 4)
    graphics.fillStyle(0x102729, 1)
    graphics.fillRect(point.x - 5, point.y - 13 + bob, 10, 5)
    graphics.lineStyle(3, 0xdbe9df, 1)
    graphics.lineBetween(point.x - 5, point.y + bob, point.x - 8, point.y + 8)
    graphics.lineBetween(point.x + 5, point.y + bob, point.x + 8, point.y + 8)
    if (worker.status === 'building') {
      graphics.lineStyle(2, 0xffdf88, .8)
      graphics.lineBetween(point.x + 9, point.y - 8, point.x + 20, point.y - 17 + Math.sin(time * 9) * 4)
    }
    if (worker.status === 'stalled') this.text(point.x, point.y - 34, '!', 20, '#ff6677')
  }

  draw() {
    if (!this.graphics || !this.bridge) return
    const state = this.bridge.state
    const graphics = this.graphics
    graphics.clear()
    this.labels.forEach(label => label.destroy())
    this.labels = []

    graphics.fillGradientStyle(0x9bcda9, 0x78b79d, 0x173b36, 0x122e30, 1)
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        const point = iso(x, y)
        const noise = (x * 31 + y * 17 + (x * y) % 13 + state.seed) % 11
        const color = noise < 2 ? 0x477b58 : noise < 5 ? 0x508964 : 0x568e67
        this.diamond(point.x, point.y, color, noise === 0 ? 0x7bab79 : 0x315d4b)
        if (noise === 0 && Math.hypot(x - HQ.x, y - HQ.y) > 5) {
          graphics.fillStyle(0x315c48, .75)
          graphics.fillCircle(point.x - 7, point.y - 5, 4)
          graphics.fillCircle(point.x + 2, point.y - 8, 5)
        }
      }
    }

    const selectedWorker = state.workers.find(worker => worker.id === state.selectedWorker)
    if (selectedWorker && !state.buildMode) {
      const marker = iso(selectedWorker.targetX, selectedWorker.targetY)
      graphics.lineStyle(1, 0xffcf63, .45)
      graphics.strokeCircle(marker.x, marker.y, 11)
    }

    for (const building of state.buildings) {
      if (building.status !== 'complete' || !building.connected) continue
      const source = iso(building.x, building.y)
      const parent = building.parentId === null ? iso(HQ.x, HQ.y) : (() => {
        const item = state.buildings.find(candidate => candidate.id === building.parentId)
        return item ? iso(item.x, item.y) : iso(HQ.x, HQ.y)
      })()
      graphics.lineStyle(building.type === 'pylon' ? 3 : 2, 0xffe36a, building.type === 'pylon' ? .72 : .46)
      graphics.lineBetween(source.x, source.y - 7, parent.x, parent.y - 7)
      const pulse = (state.elapsed * .45 + building.id * .17) % 1
      graphics.fillStyle(0xffffbd, 1)
      graphics.fillCircle(Phaser.Math.Linear(source.x, parent.x, pulse), Phaser.Math.Linear(source.y - 7, parent.y - 7, pulse), 3)
    }

    const hq = iso(HQ.x, HQ.y)
    graphics.fillStyle(0x071f22, .35); graphics.fillEllipse(hq.x, hq.y + 9, 100, 32)
    graphics.fillStyle(0xdde9df, 1)
    graphics.beginPath(); graphics.moveTo(hq.x - 42, hq.y - 4); graphics.lineTo(hq.x - 42, hq.y - 45); graphics.lineTo(hq.x, hq.y - 68); graphics.lineTo(hq.x + 42, hq.y - 45); graphics.lineTo(hq.x + 42, hq.y - 4); graphics.lineTo(hq.x, hq.y + 17); graphics.closePath(); graphics.fillPath()
    graphics.fillStyle(0x173b42, 1); graphics.fillRect(hq.x - 25, hq.y - 43, 50, 29)
    graphics.fillStyle(0x63f2a5, 1); graphics.fillRect(hq.x - 19, hq.y - 37, 38, 7)
    graphics.lineStyle(3, 0x63f2a5, 1); graphics.strokeRect(hq.x - 28, hq.y - 46, 56, 35)
    this.text(hq.x, hq.y + 34, 'GRID CORE', 13)

    const sortedBuildings = [...state.buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y))
    sortedBuildings.forEach(building => this.drawBuilding(building, state.elapsed))
    const sortedWorkers = [...state.workers].sort((a, b) => (a.x + a.y) - (b.x + b.y))
    sortedWorkers.forEach(worker => this.drawRobot(worker, worker.id === state.selectedWorker, state.elapsed))

    if (state.buildMode) {
      const spec = BUILDINGS[state.buildMode]
      this.text(hq.x, hq.y + 53, `${spec.name.toUpperCase()} PLACEMENT ACTIVE`, 12, '#ffdc86')
      if (state.buildMode !== 'pylon') {
        graphics.lineStyle(1, 0x63f2a5, .12)
        graphics.strokeCircle(hq.x, hq.y, FACILITY_RANGE * TILE_W / 1.5)
      }
    }
  }
}

export default function WorldCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const game = useRef<Phaser.Game | null>(null)
  const scene = useRef<FrontierScene | null>(null)
  const bridge = useRef<Bridge>(props)
  bridge.current = props

  useEffect(() => {
    const current = new FrontierScene()
    current.bridge = bridge.current
    scene.current = current
    game.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      backgroundColor: '#173b36',
      scene: current,
      scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
      render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
    })
    return () => {
      game.current?.destroy(true)
      game.current = null
    }
  }, [])

  useEffect(() => {
    if (!scene.current) return
    scene.current.bridge = bridge.current
    if (scene.current.graphics) scene.current.draw()
  }, [props])

  return <>
    <div ref={host} className="phaser-world" data-testid="game-canvas" />
    <div className="camera-help"><b>DRAG</b> PAN <b>WHEEL</b> ZOOM <b>CLICK</b> COMMAND</div>
    <div className="camera-controls">
      <button aria-label="Zoom in" onClick={() => scene.current?.zoomBy(1.18)}>+</button>
      <button aria-label="Zoom out" onClick={() => scene.current?.zoomBy(.84)}>−</button>
      <button aria-label="Center headquarters" onClick={() => scene.current?.focusHome()}>⌂</button>
    </div>
  </>
}
