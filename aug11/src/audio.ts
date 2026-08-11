const MUSIC_STORAGE_KEY = 'little-peak-music'

type LoopingSound = {
  source: AudioBufferSourceNode
  gain: GainNode
}

class CoffeeAudio {
  private context?: AudioContext
  private musicBus?: GainNode
  private musicTimer?: number
  private musicBar = 0
  private grinder?: LoopingSound
  private brew?: LoopingSound
  private grinderRequested = false
  private brewRequested = false
  private enabled = localStorage.getItem(MUSIC_STORAGE_KEY) !== 'off'

  get musicEnabled() {
    return this.enabled
  }

  async unlock() {
    const context = this.getContext()
    if (!context) return
    if (context.state === 'suspended') await context.resume()
    if (this.enabled) this.startMusic()
  }

  async toggleMusic() {
    this.enabled = !this.enabled
    localStorage.setItem(MUSIC_STORAGE_KEY, this.enabled ? 'on' : 'off')
    if (this.enabled) {
      await this.unlock()
    } else {
      this.stopMusic()
    }
  }

  playPlonk(pitch = 1) {
    void this.unlock().then(() => {
      const context = this.context
      if (!context || context.state !== 'running') return
      const now = context.currentTime
      const gain = context.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
      gain.connect(context.destination)

      const body = context.createOscillator()
      body.type = 'sine'
      body.frequency.setValueAtTime(230 * pitch, now)
      body.frequency.exponentialRampToValueAtTime(145 * pitch, now + 0.18)
      body.connect(gain)
      body.start(now)
      body.stop(now + 0.23)

      const tap = context.createOscillator()
      tap.type = 'triangle'
      tap.frequency.setValueAtTime(560 * pitch, now)
      tap.frequency.exponentialRampToValueAtTime(320 * pitch, now + 0.06)
      tap.connect(gain)
      tap.start(now)
      tap.stop(now + 0.08)
    })
  }

  startGrinder() {
    this.grinderRequested = true
    void this.unlock().then(() => {
      if (!this.grinderRequested || this.grinder) return
      this.grinder = this.startNoiseLoop(0.1, 520, 1.8)
    })
  }

  stopGrinder() {
    this.grinderRequested = false
    this.stopLoop(this.grinder)
    this.grinder = undefined
  }

  startBrew() {
    this.brewRequested = true
    void this.unlock().then(() => {
      if (!this.brewRequested || this.brew) return
      this.brew = this.startNoiseLoop(0.045, 1450, 0.8)
    })
  }

  stopBrew() {
    this.brewRequested = false
    this.stopLoop(this.brew)
    this.brew = undefined
  }

  stopEffects() {
    this.stopGrinder()
    this.stopBrew()
  }

  private getContext() {
    if (this.context) return this.context
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return undefined
    this.context = new AudioContextClass()
    return this.context
  }

  private startMusic() {
    const context = this.context
    if (!context || context.state !== 'running' || this.musicTimer !== undefined) return

    this.musicBus = context.createGain()
    this.musicBus.gain.setValueAtTime(0.0001, context.currentTime)
    this.musicBus.gain.exponentialRampToValueAtTime(0.13, context.currentTime + 0.8)
    this.musicBus.connect(context.destination)
    this.musicBar = 0
    this.scheduleMusicBar()
    this.musicTimer = window.setInterval(() => this.scheduleMusicBar(), 4000)
  }

  private stopMusic() {
    if (this.musicTimer !== undefined) window.clearInterval(this.musicTimer)
    this.musicTimer = undefined
    const context = this.context
    const bus = this.musicBus
    this.musicBus = undefined
    if (!context || !bus) return
    bus.gain.cancelScheduledValues(context.currentTime)
    bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), context.currentTime)
    bus.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4)
    window.setTimeout(() => bus.disconnect(), 500)
  }

  private scheduleMusicBar() {
    const context = this.context
    const bus = this.musicBus
    if (!context || !bus) return

    const chords = [
      [130.81, 164.81, 196, 246.94],
      [110, 138.59, 164.81, 220],
      [87.31, 130.81, 164.81, 196],
      [98, 146.83, 174.61, 220],
    ]
    const melodies = [
      [329.63, 392, 493.88, 392],
      [329.63, 277.18, 329.63, 440],
      [261.63, 329.63, 392, 329.63],
      [293.66, 349.23, 440, 392],
    ]
    const chordIndex = this.musicBar % chords.length
    const chord = chords[chordIndex]
    const start = context.currentTime + 0.06
    chord.forEach((frequency, index) => this.scheduleNote(frequency, start + index * 0.04, 3.7, index === 0 ? 0.52 : 0.3))
    melodies[chordIndex].forEach((frequency, index) => {
      this.scheduleNote(frequency, start + 0.38 + index * 0.9, 0.68, 0.3, 'triangle')
    })
    this.musicBar += 1
  }

  private scheduleNote(
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    timbre: OscillatorType = 'sine',
  ) {
    const context = this.context
    const bus = this.musicBus
    if (!context || !bus) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = timbre
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.35, duration * 0.25))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain)
    gain.connect(bus)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.05)
  }

  private startNoiseLoop(volume: number, frequency: number, q: number) {
    const context = this.context
    if (!context || context.state !== 'running') return undefined
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1

    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const filter = context.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    filter.Q.value = q
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.08)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start()
    return { source, gain }
  }

  private stopLoop(loop?: LoopingSound) {
    const context = this.context
    if (!context || !loop) return
    const now = context.currentTime
    loop.gain.gain.cancelScheduledValues(now)
    loop.gain.gain.setValueAtTime(Math.max(loop.gain.gain.value, 0.0001), now)
    loop.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
    loop.source.stop(now + 0.12)
  }
}

export const coffeeAudio = new CoffeeAudio()
