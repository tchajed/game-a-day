import Phaser from 'phaser';
import './style.css';

class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.add.rectangle(480, 360, 960, 720, 0x090b18);
    this.add.text(480, 360, 'BEATBOUND', {
      color: '#f8f5ff',
      fontFamily: 'Chivo, sans-serif',
      fontSize: '48px',
      fontStyle: '900',
    }).setOrigin(0.5);
  }
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount');

new Phaser.Game({
  type: Phaser.AUTO,
  parent: app,
  width: 960,
  height: 720,
  backgroundColor: '#090b18',
  scene: [BootScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
});
