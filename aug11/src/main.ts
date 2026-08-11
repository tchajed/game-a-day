import '@fontsource/fredoka/600.css'
import Phaser from 'phaser'
import { coffeeAudio } from './audio'
import { gameConfig } from './game'
import './styles.css'

declare global {
  interface Window {
    __coffeeGame?: Phaser.Game
  }
}

function createAudioControls() {
  const controls = document.createElement('div')
  controls.id = 'audio-controls'
  controls.setAttribute('aria-label', 'Audio controls')

  const musicButton = document.createElement('button')
  const effectsButton = document.createElement('button')
  const machinesButton = document.createElement('button')
  const buttons = [musicButton, effectsButton, machinesButton]
  buttons.forEach((button) => {
    button.type = 'button'
    button.className = 'audio-toggle'
    controls.append(button)
  })
  musicButton.id = 'music-toggle'
  effectsButton.id = 'effects-toggle'
  machinesButton.id = 'machines-toggle'

  const updateLabels = () => {
    musicButton.textContent = coffeeAudio.musicEnabled ? '♫  MUSIC ON' : '♫  MUSIC OFF'
    musicButton.setAttribute('aria-pressed', String(coffeeAudio.musicEnabled))
    musicButton.title = coffeeAudio.musicEnabled ? 'Turn relaxing music off' : 'Turn relaxing music on'

    effectsButton.textContent = coffeeAudio.effectsEnabled ? '♬  SFX ON' : '♬  SFX OFF'
    effectsButton.setAttribute('aria-pressed', String(coffeeAudio.effectsEnabled))
    effectsButton.title = coffeeAudio.effectsEnabled ? 'Turn sound effects off' : 'Turn sound effects on'

    machinesButton.textContent = `⚙  LOUD MACHINES ${coffeeAudio.loudMachinesEnabled ? 'ON' : 'OFF'}`
    machinesButton.setAttribute('aria-pressed', String(coffeeAudio.loudMachinesEnabled))
    machinesButton.disabled = !coffeeAudio.effectsEnabled
    machinesButton.title = coffeeAudio.loudMachinesEnabled
      ? 'Return the grinder and espresso machine to normal volume'
      : 'Make the machines annoyingly loud'
  }

  controls.addEventListener('pointerdown', (event) => event.stopPropagation())
  musicButton.addEventListener('click', async () => {
    await coffeeAudio.toggleMusic()
    updateLabels()
  })
  effectsButton.addEventListener('click', () => {
    coffeeAudio.toggleEffects()
    updateLabels()
  })
  machinesButton.addEventListener('click', () => {
    coffeeAudio.toggleLoudMachines()
    updateLabels()
  })
  updateLabels()
  document.body.append(controls)
}

async function startGame() {
  await document.fonts.load('600 32px "Fredoka"', 'Little Peak Coffee · Good morning')
  await document.fonts.ready
  createAudioControls()
  window.addEventListener('pointerdown', () => void coffeeAudio.unlock(), { capture: true, once: true })
  window.__coffeeGame = new Phaser.Game(gameConfig)
}

void startGame()
