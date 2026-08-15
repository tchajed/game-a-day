export class FactoryAudio {
  private context: AudioContext | null = null;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.context) void this.context.suspend();
    if (enabled && this.context) void this.context.resume();
  }

  private async ensureContext(): Promise<AudioContext | null> {
    if (!this.enabled) return null;
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    return this.context;
  }

  async tick(beat: number, alert = false): Promise<void> {
    const context = await this.ensureContext();
    if (!context) return;
    const now = context.currentTime;

    const click = context.createOscillator();
    const clickGain = context.createGain();
    click.type = alert ? "sawtooth" : "square";
    click.frequency.setValueAtTime(alert ? 120 : beat % 4 === 1 ? 820 : 520, now);
    click.frequency.exponentialRampToValueAtTime(alert ? 55 : 260, now + 0.045);
    clickGain.gain.setValueAtTime(alert ? 0.09 : 0.045, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    click.connect(clickGain).connect(context.destination);
    click.start(now);
    click.stop(now + 0.08);

    const bass = context.createOscillator();
    const bassGain = context.createGain();
    bass.type = "triangle";
    const notes = [55, 65.41, 73.42, 49];
    bass.frequency.setValueAtTime(notes[Math.floor((beat - 1) / 4) % notes.length] ?? 55, now);
    bassGain.gain.setValueAtTime(beat % 2 === 1 ? 0.026 : 0.015, now);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    bass.connect(bassGain).connect(context.destination);
    bass.start(now);
    bass.stop(now + 0.3);
  }

  async success(): Promise<void> {
    const context = await this.ensureContext();
    if (!context) return;
    const now = context.currentTime;
    [0, 0.12, 0.24].forEach((delay, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = [440, 554.37, 659.25][index] ?? 440;
      gain.gain.setValueAtTime(0.05, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.18);
    });
  }

  dispose(): void {
    if (this.context) void this.context.close();
    this.context = null;
  }
}
