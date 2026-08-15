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
const BASS_PATTERN = ["C1", "C1", "Eb1", "C1", "F1", "Eb1", "Bb0", "G0"];

export interface ScoreBeat {
  command: Command;
  previous: SimState;
  next: SimState;
}

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
};

export class FactoryAudio {
  private enabled: boolean;
  private rig: AudioRig | null = null;
  private generation = 0;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.rig) {
      this.rig.master.gain.rampTo(enabled ? MASTER_LEVEL : 0, 0.06);
    }
  }

  private createRig(): AudioRig {
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
      oscillator: { type: "square" },
      envelope: { attack: 0.004, decay: 0.12, sustain: 0.14, release: 0.08 },
      filter: { type: "lowpass", frequency: 420, Q: 2, rolloff: -24 },
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
    hat.frequency.value = 310;

    const metal = new MetalSynth({
      envelope: { attack: 0.001, decay: 0.2, release: 0.08 },
      harmonicity: 3.1,
      modulationIndex: 30,
      resonance: 980,
      octaves: 2.8,
    }).connect(master);
    metal.frequency.value = 105;

    const snare = new NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.025 },
    }).connect(master);

    const steam = new NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.008, decay: 0.28, sustain: 0, release: 0.08 },
    }).connect(master);

    const servo = new PolySynth(Synth, {
      oscillator: { type: "pulse", width: 0.32 },
      envelope: { attack: 0.002, decay: 0.055, sustain: 0, release: 0.035 },
    }).connect(master);

    return { master, compressor, kick, bass, hat, metal, snare, steam, servo };
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

      transport.schedule((time) => {
        if (generation === this.generation) {
          rig.hat.triggerAttackRelease(0.025, time, index % 4 === 3 ? 0.13 : 0.08);
        }
      }, beatTime + BEAT_SECONDS / 2);
    });

    const stopTime = score.length * BEAT_SECONDS + BEAT_SECONDS;
    // Pausing preserves the end position. Transport.stop() rewinds to zero and
    // can retrigger the first scheduled beat while processing the stop event.
    transport.schedule((time) => transport.pause(time), stopTime);
    transport.start("+0.12", 0);
    return true;
  }

  private performBeat(rig: AudioRig, beat: ScoreBeat, index: number, time: number): void {
    const phase = beat.next.beat % 4;
    const downbeat = index % 4 === 0;
    const finalBar = index >= 16;
    const terminal = beat.next.status === "dead" || beat.next.status === "won";

    rig.kick.triggerAttackRelease(downbeat ? "C1" : "G1", 0.18, time, downbeat ? 0.88 : 0.52);
    rig.bass.triggerAttackRelease(
      BASS_PATTERN[index % BASS_PATTERN.length] ?? "C1",
      finalBar ? 0.24 : 0.18,
      time,
      downbeat ? 0.48 : 0.32,
    );
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
  }

  dispose(): void {
    this.stopScore();
    if (!this.rig) return;
    const nodes: ToneAudioNode[] = [
      this.rig.kick,
      this.rig.bass,
      this.rig.hat,
      this.rig.metal,
      this.rig.snare,
      this.rig.steam,
      this.rig.servo,
      this.rig.master,
      this.rig.compressor,
    ];
    nodes.forEach((node) => node.dispose());
    this.rig = null;
  }
}
