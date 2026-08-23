let context: AudioContext | null = null
let music: HTMLAudioElement | null = null

const SOUNDTRACK_URL = `${import.meta.env.BASE_URL}audio/atelier-of-bursars.mp3`

function getMusic() {
  if (!music) {
    music = new Audio(SOUNDTRACK_URL)
    music.loop = true
    music.preload = 'auto'
    music.volume = 0.45
  }
  return music
}

export async function startMusic() {
  if (!context) context = new AudioContext()
  await context.resume()
  await getMusic().play()
}

export function stopMusic() {
  music?.pause()
}

export function playStamp(good: boolean) {
  if (!context || context.state !== 'running') return
  const now = context.currentTime
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(good ? 440 : 196, now)
  osc.frequency.exponentialRampToValueAtTime(good ? 660 : 130, now + 0.14)
  gain.gain.setValueAtTime(0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.connect(gain).connect(context.destination)
  osc.start(now)
  osc.stop(now + 0.23)
}
