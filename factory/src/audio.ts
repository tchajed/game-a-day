import {
  Compressor,
  Gain,
  MembraneSynth,
  MetalSynth,
  MonoSynth,
  NoiseSynth,
  PolySynth,
  Synth,
  getDraw,
  getTransport,
  start,
  type ToneAudioNode,
} from "tone";
import type { Command, SimState } from "./simulation";

const BPM = 128;
const BEAT_SECONDS = 60 / BPM;
const MASTER_LEVEL = 0.72;
const STEPS_PER_BEAT = 2;
const STEP_SECONDS = BEAT_SECONDS / STEPS_PER_BEAT;

export type SoundtrackId =
  | "assembly-line"
  | "neon-conveyor"
  | "hydraulic-funk"
  | "clockwork-shift"
  | "night-maintenance";

export interface SoundtrackMetadata {
  readonly id: SoundtrackId;
  readonly name: string;
  readonly description: string;
}

/** Stable, UI-safe metadata for the five soundtrack choices. */
export const SOUNDTRACKS: readonly SoundtrackMetadata[] = [
  {
    id: "assembly-line",
    name: "Assembly Line",
    description: "Relentless C-minor machinery with straight steel percussion.",
  },
  {
    id: "neon-conveyor",
    name: "Neon Conveyor",
    description: "Bright F-Dorian arpeggios over a skipping electro pulse.",
  },
  {
    id: "hydraulic-funk",
    name: "Hydraulic Funk",
    description: "Rubbery syncopated bass, ghost kicks, and clipped brass-like stabs.",
  },
  {
    id: "clockwork-shift",
    name: "Clockwork Shift",
    description: "A triangle-wave clockwork phrase grouped in threes against the factory beat.",
  },
  {
    id: "night-maintenance",
    name: "Night Maintenance",
    description: "Sparse low machinery and long, uneasy after-hours harmonies.",
  },
];

export const DEFAULT_SOUNDTRACK_ID: SoundtrackId = "assembly-line";

export function isSoundtrackId(value: string): value is SoundtrackId {
  return SOUNDTRACKS.some((track) => track.id === value);
}

export function getSoundtrackMetadata(id: SoundtrackId): SoundtrackMetadata {
  return SOUNDTRACKS.find((track) => track.id === id) ?? SOUNDTRACKS[0]!;
}

export interface ScoreBeat {
  command: Command;
  previous: SimState;
  next: SimState;
}

type MusicalNote = string | string[] | null;
type Waveform = "sine" | "square" | "triangle" | "sawtooth";

type SoundtrackArrangement = {
  bass: Array<string | null>;
  lead: MusicalNote[];
  hatSteps: number[];
  ghostKickSteps: number[];
  accentSteps: number[];
  bassWave: Waveform;
  leadWave: Waveform;
  bassCutoff: number;
  bassVelocity: number;
  leadVelocity: number;
  swing: number;
  bassDuration: number;
  leadDuration: number;
};

// These are independent double-time phrases (two steps per game beat). Their
// lengths and accents deliberately cross the four-beat press cycle, so the
// soundtrack breathes around the simulation rather than merely sonifying it.
const ARRANGEMENTS: Record<SoundtrackId, SoundtrackArrangement> = {
  "assembly-line": {
    bass: ["C1", null, "C1", "Eb1", null, "C1", "F1", null, "C1", null, "Bb0", "C1", "G0", null, "Bb0", null],
    lead: [null, "G4", null, "Eb4", null, null, "Bb4", null, "G4", null, null, "F4", null, "Eb4", null, null],
    hatSteps: [1, 3, 5, 7, 9, 11, 13, 15],
    ghostKickSteps: [6, 11, 14],
    accentSteps: [0, 8],
    bassWave: "square",
    leadWave: "square",
    bassCutoff: 420,
    bassVelocity: 0.31,
    leadVelocity: 0.09,
    swing: 0,
    bassDuration: 0.18,
    leadDuration: 0.07,
  },
  "neon-conveyor": {
    bass: ["F1", null, "C2", null, "Eb1", null, "G1", null, "F1", null, "Ab1", null, "Bb1", "C2", null, "Eb1"],
    lead: ["F4", "Ab4", "C5", null, "Eb5", "C5", "G4", null, "Ab4", "C5", "D5", null, "G4", "Bb4", "C5", "Eb5"],
    hatSteps: [1, 2, 5, 6, 9, 10, 13, 14],
    ghostKickSteps: [3, 10, 15],
    accentSteps: [0, 6, 12],
    bassWave: "sawtooth",
    leadWave: "triangle",
    bassCutoff: 680,
    bassVelocity: 0.25,
    leadVelocity: 0.105,
    swing: 0.035,
    bassDuration: 0.2,
    leadDuration: 0.085,
  },
  "hydraulic-funk": {
    bass: ["C1", null, null, "C2", "Eb1", null, "G1", null, null, "Bb0", "C1", null, "F1", null, "Gb1", "G1"],
    lead: [null, null, ["Eb4", "G4"], null, null, "Bb4", null, ["F4", "Ab4"], null, "G4", null, null, ["Db4", "F4"], null, null, "G4"],
    hatSteps: [1, 3, 4, 7, 9, 11, 12, 15],
    ghostKickSteps: [3, 7, 10, 15],
    accentSteps: [2, 7, 12],
    bassWave: "sawtooth",
    leadWave: "square",
    bassCutoff: 310,
    bassVelocity: 0.34,
    leadVelocity: 0.085,
    swing: 0.11,
    bassDuration: 0.13,
    leadDuration: 0.055,
  },
  "clockwork-shift": {
    bass: ["D1", null, null, "A0", null, null, "C1", null, null, "G0", null, null, "Bb0", null, "A0", null, "D1", null],
    lead: ["D5", null, "F5", null, "A5", null, "C6", null, "A5", null, "F5", null, "E5", null, "C5", null, "A4", null],
    hatSteps: [0, 3, 6, 9, 12, 15],
    ghostKickSteps: [5, 11, 17],
    accentSteps: [0, 3, 6, 9, 12, 15],
    bassWave: "triangle",
    leadWave: "triangle",
    bassCutoff: 540,
    bassVelocity: 0.28,
    leadVelocity: 0.095,
    swing: 0.02,
    bassDuration: 0.28,
    leadDuration: 0.1,
  },
  "night-maintenance": {
    bass: ["C1", null, null, null, null, "G0", null, null, "Ab0", null, null, null, "Eb1", null, null, "Bb0", null, null, null, "F1", null, null, "G0", null],
    lead: [["C4", "G4"], null, null, null, null, null, "Eb4", null, null, null, ["Ab3", "Eb4"], null, null, null, null, "G4", null, null, ["Bb3", "F4"], null, null, null, null, null],
    hatSteps: [3, 7, 11, 15, 19, 23],
    ghostKickSteps: [10, 22],
    accentSteps: [0, 10, 18],
    bassWave: "sine",
    leadWave: "sine",
    bassCutoff: 260,
    bassVelocity: 0.3,
    leadVelocity: 0.08,
    swing: 0.07,
    bassDuration: 0.38,
    leadDuration: 0.32,
  },
};

type AudioRig = {
  master: Gain;
  compressor: Compressor;
  kick: MembraneSynth;
  bass: MonoSynth;
  hat: MetalSynth;
  metal: MetalSynth;
  snare: NoiseSynth;
  steam: NoiseSynth;
  servo: PolySynth<Synth>;
  music: PolySynth<Synth>;
};

export class FactoryAudio {
  private enabled: boolean;
  private rig: AudioRig | null = null;
  private generation = 0;
  private soundtrackId: SoundtrackId;

  constructor(enabled: boolean, soundtrackId: SoundtrackId = DEFAULT_SOUNDTRACK_ID) {
    this.enabled = enabled;
    this.soundtrackId = soundtrackId;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.rig) {
      this.rig.master.gain.rampTo(enabled ? MASTER_LEVEL : 0, 0.06);
    }
  }

  /** Selects the arrangement used by the next playScore call. */
  setSoundtrack(id: SoundtrackId): void {
    if (id === this.soundtrackId) return;
    this.stopScore();
    this.disposeRig();
    this.soundtrackId = id;
  }

  getSoundtrackId(): SoundtrackId {
    return this.soundtrackId;
  }

  getActiveSoundtrack(): SoundtrackMetadata {
    return getSoundtrackMetadata(this.soundtrackId);
  }

  private createRig(): AudioRig {
    const arrangement = ARRANGEMENTS[this.soundtrackId];
    const compressor = new Compressor({
      threshold: -18,
      ratio: 5,
      attack: 0.003,
      release: 0.16,
    }).toDestination();
    const master = new Gain(this.enabled ? MASTER_LEVEL : 0).connect(compressor);

    const kick = new MembraneSynth({
      pitchDecay: 0.055,
      octaves: 7,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.24, sustain: 0, release: 0.06 },
    }).connect(master);

    const bass = new MonoSynth({
      oscillator: { type: arrangement.bassWave },
      envelope: { attack: 0.004, decay: 0.12, sustain: 0.14, release: 0.08 },
      filter: { type: "lowpass", frequency: arrangement.bassCutoff, Q: 2, rolloff: -24 },
      filterEnvelope: {
        attack: 0.002,
        decay: 0.16,
        sustain: 0.12,
        release: 0.08,
        baseFrequency: 80,
        octaves: 3.2,
      },
    }).connect(master);

    const hat = new MetalSynth({
      envelope: { attack: 0.001, decay: 0.035, release: 0.015 },
      harmonicity: 5.1,
      modulationIndex: 22,
      resonance: 4700,
      octaves: 1.2,
    }).connect(master);
    hat.frequency.value = this.soundtrackId === "night-maintenance" ? 230 : 310;

    const metal = new MetalSynth({
      envelope: { attack: 0.001, decay: 0.2, release: 0.08 },
      harmonicity: 3.1,
      modulationIndex: 30,
      resonance: 980,
      octaves: 2.8,
    }).connect(master);
    metal.frequency.value = 105;

    const snare = new NoiseSynth({
      noise: { type: this.soundtrackId === "hydraulic-funk" ? "pink" : "white" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.025 },
    }).connect(master);

    const steam = new NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.008, decay: 0.28, sustain: 0, release: 0.08 },
    }).connect(master);

    // Servo is reserved for gameplay cues; the quieter music voice keeps those
    // movement/interact sounds distinct even in the busiest arrangement.
    const servo = new PolySynth(Synth, {
      oscillator: { type: "pulse", width: 0.32 },
      envelope: { attack: 0.002, decay: 0.055, sustain: 0, release: 0.035 },
    }).connect(master);
    const music = new PolySynth(Synth, {
      oscillator: { type: arrangement.leadWave },
      envelope: {
        attack: this.soundtrackId === "night-maintenance" ? 0.045 : 0.003,
        decay: arrangement.leadDuration,
        sustain: 0.02,
        release: arrangement.leadDuration,
      },
    }).connect(master);

    return { master, compressor, kick, bass, hat, metal, snare, steam, servo, music };
  }

  private ensureRig(): AudioRig {
    if (!this.rig) this.rig = this.createRig();
    return this.rig;
  }

  async playScore(score: ScoreBeat[], onBeat: (beat: ScoreBeat) => void): Promise<boolean> {
    const generation = ++this.generation;
    if (!this.enabled) return false;

    try {
      await start();
    } catch {
      return false;
    }
    if (generation !== this.generation) return false;

    const rig = this.ensureRig();
    const arrangement = ARRANGEMENTS[this.soundtrackId];
    const transport = getTransport();
    const draw = getDraw();
    transport.stop();
    transport.cancel(0);
    draw.cancel(0);
    transport.position = 0;
    transport.bpm.value = BPM;

    score.forEach((beat, index) => {
      const beatTime = index * BEAT_SECONDS;
      transport.schedule((time) => {
        if (generation !== this.generation) return;
        this.performBeat(rig, beat, index, time);
        draw.schedule(() => {
          if (generation === this.generation) onBeat(beat);
        }, time);
      }, beatTime);
    });

    // Run the arrangement at double the simulation rate. Odd steps can swing
    // late, and phrase lengths of 18/24 steps create accents between game beats.
    for (let step = 0; step < score.length * STEPS_PER_BEAT; step += 1) {
      const stepTime = step * STEP_SECONDS;
      transport.schedule((time) => {
        if (generation === this.generation) this.performMusicStep(rig, arrangement, step, time);
      }, stepTime);
    }

    const stopTime = score.length * BEAT_SECONDS + BEAT_SECONDS;
    // Pausing preserves the end position. Transport.stop() rewinds to zero and
    // can retrigger the first scheduled beat while processing the stop event.
    transport.schedule((time) => transport.pause(time), stopTime);
    transport.start("+0.12", 0);
    return true;
  }

  private performMusicStep(
    rig: AudioRig,
    arrangement: SoundtrackArrangement,
    step: number,
    time: number,
  ): void {
    const phraseStep = step % arrangement.lead.length;
    const rhythmLength = Math.max(
      ...arrangement.hatSteps,
      ...arrangement.ghostKickSteps,
      ...arrangement.accentSteps,
      15,
    ) + 1;
    const rhythmicStep = step % rhythmLength;
    const swingDelay = step % 2 === 1 ? STEP_SECONDS * arrangement.swing : 0;
    const eventTime = time + swingDelay;
    const bassNote = arrangement.bass[step % arrangement.bass.length];
    const leadNote = arrangement.lead[phraseStep];

    if (bassNote) {
      rig.bass.triggerAttackRelease(bassNote, arrangement.bassDuration, eventTime, arrangement.bassVelocity);
    }
    if (leadNote) {
      rig.music.triggerAttackRelease(leadNote, arrangement.leadDuration, eventTime, arrangement.leadVelocity);
    }
    if (arrangement.hatSteps.includes(rhythmicStep)) {
      rig.hat.triggerAttackRelease(0.018, eventTime, step % 4 === 3 ? 0.1 : 0.065);
    }
    if (arrangement.ghostKickSteps.includes(rhythmicStep)) {
      rig.kick.triggerAttackRelease("G1", 0.1, eventTime, 0.2);
    }
    if (arrangement.accentSteps.includes(rhythmicStep)) {
      rig.metal.triggerAttackRelease(0.045, eventTime, 0.08);
    }
  }

  private performBeat(rig: AudioRig, beat: ScoreBeat, index: number, time: number): void {
    const phase = beat.next.beat % 4;
    const downbeat = index % 4 === 0;
    const finalBar = index >= 16;
    const terminal = beat.next.status === "dead" || beat.next.status === "won";

    rig.kick.triggerAttackRelease(downbeat ? "C1" : "G1", 0.18, time, downbeat ? 0.88 : 0.52);
    rig.hat.triggerAttackRelease(0.018, time, downbeat ? 0.12 : 0.075);

    if (index % 4 === 1 || index % 4 === 3) {
      rig.snare.triggerAttackRelease(0.07, time, index % 4 === 3 ? 0.28 : 0.22);
    }
    if (downbeat) {
      rig.metal.triggerAttackRelease(0.08, time, finalBar ? 0.28 : 0.2);
    }

    // The two presses overlap on phase 2: announce that dangerous window with
    // the heaviest factory hit, then vent pressure as they retract.
    if (phase === 1) {
      rig.metal.triggerAttackRelease(0.16, time + 0.018, 0.3);
    } else if (phase === 2) {
      rig.kick.triggerAttackRelease("C0", 0.3, time + 0.012, 0.78);
      rig.metal.triggerAttackRelease(0.24, time + 0.025, 0.48);
    } else if (phase === 3) {
      rig.steam.triggerAttackRelease(0.2, time + 0.035, 0.12);
    }

    this.performCommand(rig, beat, time);

    if (terminal) {
      if (beat.next.status === "dead") this.performFailure(rig, time);
      else this.performSuccess(rig, time);
    }
  }

  private performCommand(rig: AudioRig, beat: ScoreBeat, time: number): void {
    const command = beat.command;
    const moved =
      beat.previous.robot.x !== beat.next.robot.x || beat.previous.robot.y !== beat.next.robot.y;

    if (["up", "right", "down", "left"].includes(command ?? "")) {
      if (moved) {
        // Every direction is the same motor action; facing no longer changes the cue.
        rig.servo.triggerAttackRelease("C5", 0.045, time + 0.045, 0.22);
        rig.servo.triggerAttackRelease("C3", 0.035, time + 0.105, 0.12);
      } else {
        rig.servo.triggerAttackRelease("F#2", 0.09, time + 0.035, 0.28);
      }
      return;
    }

    if (command === "interact") {
      // Pickup and switch activation intentionally share one tactile confirm sound.
      rig.servo.triggerAttackRelease(["C4", "G4"], 0.07, time + 0.025, 0.34);
      rig.metal.triggerAttackRelease(0.12, time + 0.075, 0.34);
    } else if (command === "wait" || command === null) {
      rig.servo.triggerAttackRelease("C3", 0.035, time + 0.06, 0.08);
    }
  }

  private performFailure(rig: AudioRig, time: number): void {
    rig.kick.triggerAttackRelease("C0", 0.5, time + 0.015, 1);
    rig.metal.triggerAttackRelease(0.55, time + 0.025, 0.75);
    rig.snare.triggerAttackRelease(0.28, time + 0.035, 0.55);
    rig.steam.triggerAttackRelease(0.45, time + 0.12, 0.25);
    rig.servo.triggerAttackRelease(["C3", "Db3"], 0.34, time + 0.03, 0.42);
  }

  private performSuccess(rig: AudioRig, time: number): void {
    rig.kick.triggerAttackRelease("C1", 0.35, time + 0.01, 0.9);
    rig.metal.triggerAttackRelease(0.38, time + 0.02, 0.56);
    rig.servo.triggerAttackRelease(["C4", "Eb4", "G4"], 0.22, time + 0.03, 0.46);
    rig.servo.triggerAttackRelease(["F4", "Ab4", "C5"], 0.22, time + 0.22, 0.42);
    rig.servo.triggerAttackRelease(["C4", "G4", "C5"], 0.5, time + 0.43, 0.5);
  }

  stopScore(): void {
    this.generation += 1;
    const transport = getTransport();
    transport.stop();
    transport.cancel(0);
    getDraw().cancel(0);
    this.rig?.bass.triggerRelease();
    this.rig?.servo.releaseAll();
    this.rig?.music.releaseAll();
  }

  private disposeRig(): void {
    if (!this.rig) return;
    const nodes: ToneAudioNode[] = [
      this.rig.kick,
      this.rig.bass,
      this.rig.hat,
      this.rig.metal,
      this.rig.snare,
      this.rig.steam,
      this.rig.servo,
      this.rig.music,
      this.rig.master,
      this.rig.compressor,
    ];
    nodes.forEach((node) => node.dispose());
    this.rig = null;
  }

  dispose(): void {
    this.stopScore();
    this.disposeRig();
  }
}
