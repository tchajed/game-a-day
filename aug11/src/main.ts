import '@fontsource/fredoka/600.css'
import Phaser from 'phaser'
import { gameConfig } from './game'
import './styles.css'

declare global {
  interface Window {
    __coffeeGame?: Phaser.Game
  }
}

async function startGame() {
  await document.fonts.load('600 32px "Fredoka"', 'Little Peak Coffee · Good morning')
  await document.fonts.ready
  window.__coffeeGame = new Phaser.Game(gameConfig)
}

void startGame()
