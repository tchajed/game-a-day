import * as Tone from 'tone';
import { BPM, type BeatEvent } from './level';

const MASTER_LEVEL = 0.62;
const BASS_NOTES = ['C2', 'C2', 'Eb2', 'G1', 'Ab1', 'Ab1', 'Bb1', 'G1'];

// An eight-bar C-minor journey: settled, open, then a bright dominant turnaround.
const HARMONY: string[][] = [
  ['C3', 'Eb3', 'G3'],
  ['Ab2', 'C3', 'Eb3'],
  ['Eb3', 'G3', 'Bb3'],
  ['Bb2', 'D3', 'F3'],
  ['C3', 'Eb3', 'G3'],
  ['F2', 'Ab2', 'C3'],
  ['Ab2', 'C3', 'Eb3'],
  ['G2', 'B2', 'D3'],
];

// One note or rest per eighth note. The second half answers the opening motif.
const MELODY: Array<string | null> = [
  'G4', null, 'C5', 'Eb5', 'G5', 'Eb5', 'C5', null,
  'Ab4', 'C5', 'Eb5', null, 'C5', 'Ab4', 'G4', null,
  'G4', 'Bb4', 'Eb5', 'G5', 'F5', 'Eb5', 'Bb4', null,
  'F4', 'Bb4', 'D5', 'F5', 'D5', 'Bb4', 'G4', null,
  'C5', null, 'Eb5', 'G5', 'Bb5', 'G5', 'Eb5', 'C5',
  'Ab4', 'C5', 'F5', 'Ab5', 'G5', 'F5', 'C5', null,
  'Eb5', 'C5', 'Ab4', 'C5', 'Eb5', 'G5', 'Ab5', null,
  'D5', 'B4', 'G4', 'B4', 'D5', 'F5', 'G5', null,
];

export class BeatAudio {
  private transport = Tone.getTransport();
  private kick?: Tone.MembraneSynth;
  private hat?: Tone.NoiseSynth;
  private bass?: Tone.MonoSynth;
  private melody?: Tone.Synth;
  private harmony?: Tone.PolySynth;
  private cue?: Tone.FMSynth;
  private master?: Tone.Gain;
  private eventIds: number[] = [];
  private muted = false;
  private started = false;

  constructor(private events: BeatEvent[], muted: boolean, private speed = 1) {
    this.muted = muted;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await Tone.start();

    this.master = new Tone.Gain(this.muted ? 0 : MASTER_LEVEL).toDestination();
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
    this.melody = new Tone.Synth({
      oscillator: { type: 'triangle8' },
      envelope: { attack: 0.006, decay: 0.09, sustain: 0.12, release: 0.12 },
    }).connect(this.master);
    this.melody.volume.value = -9;
    this.harmony = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine4' },
      envelope: { attack: 0.035, decay: 0.22, sustain: 0.22, release: 0.45 },
    }).connect(this.master);
    this.harmony.volume.value = -12;
    this.cue = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 8,
      envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.08 },
    }).connect(this.master);

    this.transport.stop();
    this.transport.cancel();
    this.transport.position = 0;
    this.transport.bpm.value = BPM * this.speed;
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

      if (eighth % 8 === 0) {
        const chord = HARMONY[Math.floor(eighth / 8) % HARMONY.length];
        this.harmony?.triggerAttackRelease(chord, '2n.', time, 0.28);
      }
      const melodyNote = MELODY[eighth % MELODY.length];
      if (melodyNote) {
        const velocity = eighth % 8 === 0 || eighth % 8 === 4 ? 0.52 : 0.36;
        this.melody?.triggerAttackRelease(melodyNote, '16n', time, velocity);
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
      }, `${cueBeat * this.transport.PPQ}i`));
    }

    this.transport.start('+0.08');
  }

  hit(action: 'jump' | 'duck', quality: 'perfect' | 'good'): void {
    if (!this.started) return;
    const time = Tone.now();
    const note = action === 'jump' ? 'C7' : 'C4';
    this.cue?.triggerAttackRelease(note, '32n', time, quality === 'perfect' ? 0.8 : 0.45);
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.transport.bpm.rampTo(BPM * speed, 0.05);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.master?.gain.rampTo(muted ? 0 : MASTER_LEVEL, 0.08);
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
    this.melody?.dispose();
    this.harmony?.dispose();
    this.cue?.dispose();
    this.master?.dispose();
    this.started = false;
  }
}
