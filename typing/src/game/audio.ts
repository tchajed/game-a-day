const MUSIC_GAIN = 0.32
const LOOK_AHEAD_SECONDS = 0.45
const BEAT_SECONDS = 1.2

export class OfficeAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private humNodes: AudioScheduledSourceNode[] = []
  private humGain: GainNode | null = null
  private droneFilter: BiquadFilterNode | null = null
  private scheduler: number | null = null
  private nextBeatAt = 0
  private beat = 0
  private tension = 0
  private noiseBuffer: AudioBuffer | null = null
  private lastCawAt = -Infinity
  enabled: boolean

  constructor(enabled = true) {
    this.enabled = enabled
  }

  private ensure() {
    if (!this.enabled) return null
    if (!this.context) {
      const context = new AudioContext()
      const master = context.createGain()
      const compressor = context.createDynamicsCompressor()
      const musicBus = context.createGain()
      const sfxBus = context.createGain()

      master.gain.value = 0.86
      musicBus.gain.value = MUSIC_GAIN
      sfxBus.gain.value = 0.72
      compressor.threshold.value = -20
      compressor.knee.value = 14
      compressor.ratio.value = 5
      compressor.attack.value = 0.004
      compressor.release.value = 0.22

      musicBus.connect(master)
      sfxBus.connect(master)
      master.connect(compressor).connect(context.destination)
      this.context = context
      this.master = master
      this.musicBus = musicBus
      this.sfxBus = sfxBus
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const data = buffer.getChannelData(0)
    let brown = 0
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1
      brown = (brown + 0.018 * white) / 1.018
      data[index] = brown * 3.2
    }
    this.noiseBuffer = buffer
    return buffer
  }

  startAmbience() {
    const context = this.ensure()
    if (!context || !this.musicBus || this.humNodes.length) return

    const humGain = context.createGain()
    const humFilter = context.createBiquadFilter()
    humGain.gain.value = 0.03
    humFilter.type = 'lowpass'
    humFilter.frequency.value = 420
    humFilter.Q.value = 1.2
    humGain.connect(humFilter).connect(this.musicBus)

    for (const [frequency, level] of [[59.4, 0.5], [118.8, 0.25], [237.6, 0.06]] as const) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = frequency < 100 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.value = level
      oscillator.connect(gain).connect(humGain)
      oscillator.start()
      this.humNodes.push(oscillator)
    }

    const droneFilter = context.createBiquadFilter()
    const droneGain = context.createGain()
    droneFilter.type = 'lowpass'
    droneFilter.frequency.value = 115
    droneFilter.Q.value = 4.5
    droneGain.gain.value = 0.09
    droneFilter.connect(droneGain).connect(this.musicBus)

    for (const [frequency, detune, level] of [[36.71, -5, 0.52], [36.71, 6, 0.45], [55, -3, 0.18]] as const) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sawtooth'
      oscillator.frequency.value = frequency
      oscillator.detune.value = detune
      gain.gain.value = level
      oscillator.connect(gain).connect(droneFilter)
      oscillator.start()
      this.humNodes.push(oscillator)
    }

    const air = context.createBufferSource()
    const airFilter = context.createBiquadFilter()
    const airGain = context.createGain()
    air.buffer = this.getNoiseBuffer(context)
    air.loop = true
    airFilter.type = 'bandpass'
    airFilter.frequency.value = 760
    airFilter.Q.value = 0.45
    airGain.gain.value = 0.022
    air.connect(airFilter).connect(airGain).connect(this.musicBus)
    air.start()
    this.humNodes.push(air)

    this.humGain = humGain
    this.droneFilter = droneFilter
    this.nextBeatAt = context.currentTime + 0.12
    this.beat = 0
    this.scheduler = window.setInterval(() => this.scheduleMusic(), 100)
    this.scheduleMusic()
    this.setTension(this.tension)
  }

  private scheduleMusic() {
    const context = this.context
    if (!context || !this.musicBus) return
    while (this.nextBeatAt < context.currentTime + LOOK_AHEAD_SECONDS) {
      this.scheduleBeat(this.beat, this.nextBeatAt)
      this.beat += 1
      this.nextBeatAt += BEAT_SECONDS
    }
  }

  private scheduleBeat(beat: number, at: number) {
    const phrase = beat % 16
    const phraseNumber = Math.floor(beat / 16)
    const bassNotes = [36.71, 34.65, 29.14, 38.89]
    const motifNotes = [146.83, 138.59, 116.54, 103.83]

    if (phrase % 4 === 0) {
      const note = bassNotes[(phraseNumber + phrase / 4) % bassNotes.length]!
      this.playBass(note, at)
    }

    const motifStep = [1, 6, 10, 13].indexOf(phrase)
    if (motifStep >= 0) {
      const note = motifNotes[(motifStep + phraseNumber) % motifNotes.length]!
      this.playMemoTone(note, at, motifStep === 3)
    }

    if (this.tension > 0.42 && phrase % 2 === 0) this.playClock(at)
    if (this.tension > 0.78 && (phrase === 3 || phrase === 11)) this.playDissonance(at)
  }

  private playBass(frequency: number, at: number) {
    const context = this.context
    if (!context || !this.musicBus) return
    const oscillator = context.createOscillator()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, at)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.985, at + 1.7)
    filter.type = 'lowpass'
    filter.frequency.value = 125 + this.tension * 65
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.095, at + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.4)
    oscillator.connect(filter).connect(gain).connect(this.musicBus)
    oscillator.start(at)
    oscillator.stop(at + 2.5)
  }

  private playMemoTone(frequency: number, at: number, reversedMood: boolean) {
    const context = this.context
    if (!context || !this.musicBus) return
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    filter.type = 'lowpass'
    filter.frequency.value = 520 + this.tension * 420
    filter.Q.value = 2.8
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.055, at + 0.16)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.8)
    filter.connect(gain).connect(this.musicBus)

    for (const [ratio, level] of [[1, 0.8], [reversedMood ? 1.1892 : 1.4983, 0.2]] as const) {
      const oscillator = context.createOscillator()
      const voiceGain = context.createGain()
      oscillator.type = ratio === 1 ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency * ratio
      oscillator.detune.value = ratio === 1 ? -4 : 5
      voiceGain.gain.value = level
      oscillator.connect(voiceGain).connect(filter)
      oscillator.start(at)
      oscillator.stop(at + 2.9)
    }
  }

  private playClock(at: number) {
    const context = this.context
    if (!context || !this.musicBus) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = this.beat % 4 === 0 ? 880 : 660
    gain.gain.setValueAtTime(0.012 * this.tension, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.025)
    oscillator.connect(gain).connect(this.musicBus)
    oscillator.start(at)
    oscillator.stop(at + 0.03)
  }

  private playDissonance(at: number) {
    const context = this.context
    if (!context || !this.musicBus) return
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.022, at + 0.35)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.1)
    gain.connect(this.musicBus)
    for (const frequency of [73.42, 77.78]) {
      const oscillator = context.createOscillator()
      oscillator.type = 'sawtooth'
      oscillator.frequency.value = frequency
      oscillator.connect(gain)
      oscillator.start(at)
      oscillator.stop(at + 3.2)
    }
  }

  key(correct: boolean) {
    const context = this.ensure()
    if (!context || !this.sfxBus) return
    this.startAmbience()
    const oscillator = context.createOscillator()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = correct ? 'square' : 'sine'
    oscillator.frequency.setValueAtTime(correct ? 1240 : 92, now)
    oscillator.frequency.exponentialRampToValueAtTime(correct ? 620 : 54, now + (correct ? 0.025 : 0.12))
    filter.type = 'lowpass'
    filter.frequency.value = correct ? 1600 : 260
    gain.gain.setValueAtTime(correct ? 0.025 : 0.09, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (correct ? 0.035 : 0.16))
    oscillator.connect(filter).connect(gain).connect(this.sfxBus)
    oscillator.start(now)
    oscillator.stop(now + 0.18)
  }

  caw() {
    const context = this.ensure()
    if (!context || !this.sfxBus) return
    this.startAmbience()
    const now = context.currentTime
    if (now - this.lastCawAt < 0.16) return
    this.lastCawAt = now

    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(now)
      this.musicBus.gain.setValueAtTime(this.musicBus.gain.value, now)
      this.musicBus.gain.exponentialRampToValueAtTime(0.018, now + 0.025)
      this.musicBus.gain.exponentialRampToValueAtTime(MUSIC_GAIN, now + 0.72)
    }

    for (const [delay, startFrequency, duration, level] of [[0, 510, 0.16, 0.2], [0.19, 430, 0.21, 0.15]] as const) {
      const at = now + delay
      const voice = context.createOscillator()
      const overtone = context.createOscillator()
      const voiceFilter = context.createBiquadFilter()
      const voiceGain = context.createGain()
      voice.type = 'sawtooth'
      overtone.type = 'square'
      voice.frequency.setValueAtTime(startFrequency, at)
      voice.frequency.exponentialRampToValueAtTime(startFrequency * 0.48, at + duration)
      overtone.frequency.setValueAtTime(startFrequency * 1.56, at)
      overtone.frequency.exponentialRampToValueAtTime(startFrequency * 0.68, at + duration)
      voiceFilter.type = 'bandpass'
      voiceFilter.frequency.setValueAtTime(920, at)
      voiceFilter.frequency.exponentialRampToValueAtTime(430, at + duration)
      voiceFilter.Q.value = 1.1
      voiceGain.gain.setValueAtTime(0.0001, at)
      voiceGain.gain.exponentialRampToValueAtTime(level, at + 0.012)
      voiceGain.gain.setValueAtTime(level * 0.82, at + duration * 0.45)
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      voice.connect(voiceFilter)
      overtone.connect(voiceFilter)
      voiceFilter.connect(voiceGain).connect(this.sfxBus)
      voice.start(at)
      overtone.start(at)
      voice.stop(at + duration + 0.01)
      overtone.stop(at + duration + 0.01)

      const rasp = context.createBufferSource()
      const raspFilter = context.createBiquadFilter()
      const raspGain = context.createGain()
      rasp.buffer = this.getNoiseBuffer(context)
      raspFilter.type = 'bandpass'
      raspFilter.frequency.setValueAtTime(1500, at)
      raspFilter.frequency.exponentialRampToValueAtTime(650, at + duration)
      raspFilter.Q.value = 0.7
      raspGain.gain.setValueAtTime(0.0001, at)
      raspGain.gain.exponentialRampToValueAtTime(level * 0.8, at + 0.008)
      raspGain.gain.exponentialRampToValueAtTime(0.0001, at + duration * 0.88)
      rasp.connect(raspFilter).connect(raspGain).connect(this.sfxBus)
      rasp.start(at)
      rasp.stop(at + duration)
    }
  }

  tap() {
    const context = this.ensure()
    if (!context || !this.sfxBus) return
    for (const delay of [0, 0.09]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const at = context.currentTime + delay
      oscillator.type = 'triangle'
      oscillator.frequency.value = 310
      gain.gain.setValueAtTime(0.05, at)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035)
      oscillator.connect(gain).connect(this.sfxBus)
      oscillator.start(at)
      oscillator.stop(at + 0.04)
    }
  }

  setTension(value: number) {
    this.tension = Math.max(0, Math.min(1, value))
    if (!this.context) return
    const now = this.context.currentTime
    this.droneFilter?.frequency.cancelScheduledValues(now)
    this.droneFilter?.frequency.linearRampToValueAtTime(115 + this.tension * 105, now + 1.8)
    this.humGain?.gain.cancelScheduledValues(now)
    this.humGain?.gain.linearRampToValueAtTime(0.03 + this.tension * 0.015, now + 1.8)
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) this.dispose()
  }

  dispose() {
    if (this.scheduler !== null) window.clearInterval(this.scheduler)
    this.scheduler = null
    for (const node of this.humNodes) {
      try { node.stop() } catch { /* already stopped */ }
    }
    this.humNodes = []
    this.humGain = null
    this.droneFilter = null
    this.noiseBuffer = null
    void this.context?.close()
    this.context = null
    this.master = null
    this.musicBus = null
    this.sfxBus = null
  }
}
