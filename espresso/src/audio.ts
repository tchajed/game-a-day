const MUSIC_STORAGE_KEY = 'little-peak-music'
const EFFECTS_STORAGE_KEY = 'little-peak-effects'
const LOUD_MACHINES_STORAGE_KEY = 'little-peak-loud-machines'
const LOUD_MACHINE_MULTIPLIER = 4

type LoopingSound = {
  source: AudioBufferSourceNode
  gain: GainNode
  baseVolume: number
}

class CoffeeAudio {
  private context?: AudioContext
  private music?: HTMLAudioElement
  private grinder?: LoopingSound
  private brew?: LoopingSound
  private grinderRequested = false
  private brewRequested = false
  private musicOn = localStorage.getItem(MUSIC_STORAGE_KEY) !== 'off'
  private effectsOn = localStorage.getItem(EFFECTS_STORAGE_KEY) !== 'off'
  private machinesLoud = localStorage.getItem(LOUD_MACHINES_STORAGE_KEY) === 'on'

  get musicEnabled() {
    return this.musicOn
  }

  get effectsEnabled() {
    return this.effectsOn
  }

  get loudMachinesEnabled() {
    return this.machinesLoud
  }

  async unlock() {
    const context = this.getContext()
    if (context?.state === 'suspended') await context.resume()
    if (this.musicOn) await this.startMusic()
  }

  async toggleMusic() {
    this.musicOn = !this.musicOn
    localStorage.setItem(MUSIC_STORAGE_KEY, this.musicOn ? 'on' : 'off')
    if (this.musicOn) {
      await this.unlock()
    } else {
      this.stopMusic()
    }
  }

  toggleEffects() {
    this.effectsOn = !this.effectsOn
    localStorage.setItem(EFFECTS_STORAGE_KEY, this.effectsOn ? 'on' : 'off')
    if (this.effectsOn) this.playPlonk(1.25)
    else this.stopEffects()
  }

  toggleLoudMachines() {
    this.machinesLoud = !this.machinesLoud
    localStorage.setItem(LOUD_MACHINES_STORAGE_KEY, this.machinesLoud ? 'on' : 'off')
    this.updateLoopVolume(this.grinder)
    this.updateLoopVolume(this.brew)
  }

  playPlonk(pitch = 1) {
    if (!this.effectsOn) return
    void this.unlock().then(() => {
      const context = this.context
      if (!this.effectsOn || !context || context.state !== 'running') return
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
    if (!this.effectsOn) return
    this.grinderRequested = true
    void this.unlock().then(() => {
      if (!this.effectsOn || !this.grinderRequested || this.grinder) return
      this.grinder = this.startNoiseLoop(0.1, 520, 1.8)
    })
  }

  stopGrinder() {
    this.grinderRequested = false
    this.stopLoop(this.grinder)
    this.grinder = undefined
  }

  startBrew() {
    if (!this.effectsOn) return
    this.brewRequested = true
    void this.unlock().then(() => {
      if (!this.effectsOn || !this.brewRequested || this.brew) return
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

  private async startMusic() {
    const music = this.getMusic()
    if (!music.paused) return
    try {
      await music.play()
    } catch {
      // Browsers may reject playback until the next direct user interaction.
    }
  }

  private stopMusic() {
    this.music?.pause()
  }

  private getMusic() {
    if (this.music) return this.music
    this.music = new Audio(`${import.meta.env.BASE_URL}assets/coffee-shop-loop.webm`)
    this.music.id = 'background-music'
    this.music.loop = true
    this.music.preload = 'auto'
    this.music.volume = 0.68
    this.music.hidden = true
    document.body.append(this.music)
    return this.music
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
    gain.gain.exponentialRampToValueAtTime(this.machineVolume(volume), context.currentTime + 0.08)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start()
    return { source, gain, baseVolume: volume }
  }

  private machineVolume(baseVolume: number) {
    return baseVolume * (this.machinesLoud ? LOUD_MACHINE_MULTIPLIER : 1)
  }

  private updateLoopVolume(loop?: LoopingSound) {
    const context = this.context
    if (!context || !loop) return
    const now = context.currentTime
    loop.gain.gain.cancelScheduledValues(now)
    loop.gain.gain.setValueAtTime(Math.max(loop.gain.gain.value, 0.0001), now)
    loop.gain.gain.exponentialRampToValueAtTime(this.machineVolume(loop.baseVolume), now + 0.12)
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
