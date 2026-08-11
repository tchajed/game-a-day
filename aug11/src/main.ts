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

function createMusicButton() {
  const button = document.createElement('button')
  button.id = 'music-toggle'
  button.type = 'button'

  const updateLabel = () => {
    const enabled = coffeeAudio.musicEnabled
    button.textContent = enabled ? '♫  MUSIC ON' : '♫  MUSIC OFF'
    button.setAttribute('aria-pressed', String(enabled))
    button.title = enabled ? 'Turn relaxing music off' : 'Turn relaxing music on'
  }

  button.addEventListener('pointerdown', (event) => event.stopPropagation())
  button.addEventListener('click', async () => {
    await coffeeAudio.toggleMusic()
    updateLabel()
  })
  updateLabel()
  document.body.append(button)
}

async function startGame() {
  await document.fonts.load('600 32px "Fredoka"', 'Little Peak Coffee · Good morning')
  await document.fonts.ready
  createMusicButton()
  window.addEventListener('pointerdown', () => void coffeeAudio.unlock(), { capture: true, once: true })
  window.__coffeeGame = new Phaser.Game(gameConfig)
}

void startGame()
