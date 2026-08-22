let context: AudioContext | null = null
let timer: number | null = null
let step = 0
let active = false
let progress = 0
let health = 0.65

const melodies = [
  [0, 7, 3, 10],
  [0, 3, 7, 12, 10, 7],
  [0, 7, 10, 14, 12, 7, 3, 10],
]

function scheduleTone() {
  if (!active || !context) return
  const now = context.currentTime
  const melody = melodies[Math.min(2, Math.floor(progress / 3))]
  const semitone = melody[step % melody.length]
  const root = health > 0.55 ? 146.83 : 138.59
  const frequency = root * Math.pow(2, semitone / 12)

  const osc = context.createOscillator()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()
  osc.type = step % 4 === 0 ? 'triangle' : 'sine'
  osc.frequency.setValueAtTime(frequency, now)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(700 + progress * 100, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
  osc.connect(filter).connect(gain).connect(context.destination)
  osc.start(now)
  osc.stop(now + 1.25)

  if (step % 4 === 0) {
    const bass = context.createOscillator()
    const bassGain = context.createGain()
    bass.type = 'sine'
    bass.frequency.value = root / 2
    bassGain.gain.setValueAtTime(0.0001, now)
    bassGain.gain.exponentialRampToValueAtTime(0.022, now + 0.08)
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    bass.connect(bassGain).connect(context.destination)
    bass.start(now)
    bass.stop(now + 1.9)
  }

  step += 1
  const pace = Math.max(540, 800 - progress * 25)
  timer = window.setTimeout(scheduleTone, pace)
}

export async function startMusic() {
  if (!context) context = new AudioContext()
  await context.resume()
  if (active) return
  active = true
  scheduleTone()
}

export function stopMusic() {
  active = false
  if (timer !== null) window.clearTimeout(timer)
  timer = null
}

export function updateMusic(nextProgress: number, nextHealth: number) {
  progress = nextProgress
  health = nextHealth
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
