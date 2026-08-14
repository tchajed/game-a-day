export class OfficeAudio {
  private context: AudioContext | null = null
  private hum: OscillatorNode | null = null
  private humGain: GainNode | null = null
  enabled: boolean

  constructor(enabled = true) {
    this.enabled = enabled
  }

  private ensure() {
    if (!this.enabled) return null
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  startAmbience() {
    const context = this.ensure()
    if (!context || this.hum) return
    const hum = context.createOscillator()
    const gain = context.createGain()
    hum.type = 'sine'
    hum.frequency.value = 58
    gain.gain.value = 0.018
    hum.connect(gain).connect(context.destination)
    hum.start()
    this.hum = hum
    this.humGain = gain
  }

  key(correct: boolean) {
    const context = this.ensure()
    if (!context) return
    this.startAmbience()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.type = correct ? 'square' : 'sine'
    oscillator.frequency.setValueAtTime(correct ? 1240 : 92, now)
    oscillator.frequency.exponentialRampToValueAtTime(correct ? 620 : 54, now + (correct ? 0.025 : 0.12))
    gain.gain.setValueAtTime(correct ? 0.025 : 0.1, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (correct ? 0.035 : 0.16))
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.18)
    if (!correct && this.humGain) {
      this.humGain.gain.setValueAtTime(0.001, now)
      this.humGain.gain.linearRampToValueAtTime(0.018, now + 0.3)
    }
  }

  tap() {
    const context = this.ensure()
    if (!context) return
    for (const delay of [0, 0.09]) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const at = context.currentTime + delay
      oscillator.type = 'triangle'
      oscillator.frequency.value = 310
      gain.gain.setValueAtTime(0.05, at)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.035)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + 0.04)
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) {
      this.hum?.stop()
      this.hum = null
      this.humGain = null
      void this.context?.close()
      this.context = null
    }
  }
}
