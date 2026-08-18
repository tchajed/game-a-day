import * as Tone from 'tone';
import { BPM, type BeatEvent } from './level';

const BASS_NOTES = ['C2', 'C2', 'Eb2', 'G1', 'Ab1', 'Ab1', 'Bb1', 'G1'];

export class BeatAudio {
  private transport = Tone.getTransport();
  private kick?: Tone.MembraneSynth;
  private hat?: Tone.NoiseSynth;
  private bass?: Tone.MonoSynth;
  private cue?: Tone.FMSynth;
  private master?: Tone.Gain;
  private eventIds: number[] = [];
  private muted = false;
  private started = false;

  constructor(private events: BeatEvent[], muted: boolean) {
    this.muted = muted;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await Tone.start();

    this.master = new Tone.Gain(this.muted ? 0 : 0.72).toDestination();
    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 7,
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.08 },
    }).connect(this.master);
    this.hat = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.035, sustain: 0 },
    }).connect(this.master);
    this.bass = new Tone.MonoSynth({
      oscillator: { type: 'square4' },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.16, sustain: 0.28, release: 0.12 },
      filterEnvelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.2, baseFrequency: 70, octaves: 2.8 },
    }).connect(this.master);
    this.cue = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 8,
      envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.08 },
    }).connect(this.master);

    this.transport.stop();
    this.transport.cancel();
    this.transport.position = 0;
    this.transport.bpm.value = BPM;
    this.transport.swing = 0.08;
    this.transport.swingSubdivision = '8n';

    let eighth = 0;
    this.eventIds.push(this.transport.scheduleRepeat((time) => {
      const beat = Math.floor(eighth / 2);
      if (eighth % 2 === 0) {
        this.kick?.triggerAttackRelease(beat % 4 === 0 ? 'C1' : 'G1', beat % 4 === 0 ? '8n' : '16n', time, beat % 4 === 0 ? 1 : 0.5);
        if (beat % 2 === 0) {
          const note = BASS_NOTES[Math.floor(beat / 2) % BASS_NOTES.length];
          this.bass?.triggerAttackRelease(note, '8n', time, 0.85);
        }
      } else {
        this.hat?.triggerAttackRelease('32n', time, 0.17);
      }
      eighth += 1;
    }, '8n'));

    for (const event of this.events) {
      const cueBeat = event.beat - 1;
      this.eventIds.push(this.transport.schedule((time) => {
        if (event.action === 'jump') {
          this.cue?.triggerAttackRelease('C6', '32n', time, 0.8);
          this.cue?.triggerAttackRelease('G6', '32n', time + 0.09, 0.65);
        } else {
          this.cue?.triggerAttackRelease('G3', '16n', time, 0.75);
        }
      }, cueBeat * (60 / BPM)));
    }

    this.transport.start('+0.08');
  }

  hit(action: 'jump' | 'duck', quality: 'perfect' | 'good'): void {
    if (!this.started) return;
    const time = Tone.now();
    const note = action === 'jump' ? 'C7' : 'C4';
    this.cue?.triggerAttackRelease(note, '32n', time, quality === 'perfect' ? 0.8 : 0.45);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.master?.gain.rampTo(muted ? 0 : 0.72, 0.08);
  }

  isMuted(): boolean {
    return this.muted;
  }

  stop(): void {
    this.transport.stop();
    this.transport.cancel();
    for (const id of this.eventIds) this.transport.clear(id);
    this.eventIds = [];
    this.kick?.dispose();
    this.hat?.dispose();
    this.bass?.dispose();
    this.cue?.dispose();
    this.master?.dispose();
    this.started = false;
  }
}
