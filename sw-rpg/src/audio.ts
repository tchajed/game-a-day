import { Midi, type Track } from '@tonejs/midi';
import * as Tone from 'tone';

export type MusicTheme = 'overworld' | 'battle';

type NoteEvent = {
  name: string;
  midi: number;
  duration: number;
  velocity: number;
};

type ThemePlayback = {
  parts: Tone.Part<NoteEvent>[];
  nodes: Tone.ToneAudioNode[];
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export class GameAudio {
  enabled = new URLSearchParams(location.search).get('music') !== 'off';
  private started = false;
  private loading?: Promise<void>;
  private desiredTheme: MusicTheme = 'overworld';
  private activeTheme?: MusicTheme;
  private themes = new Map<MusicTheme, ThemePlayback>();
  private musicBus?: Tone.Volume;
  private effectsBus?: Tone.Volume;

  setTheme(theme: MusicTheme) {
    this.desiredTheme = theme;
    if (this.started && this.enabled) this.playTheme(theme);
  }

  unlock() {
    if (!this.enabled) return;
    this.loading ??= this.start();
  }

  private async start() {
    await Tone.start();
    this.started = true;
    this.musicBus = new Tone.Volume(-9).toDestination();
    this.effectsBus = new Tone.Volume(-13).toDestination();
    const [overworld, battle] = await Promise.all([
      Midi.fromUrl(assetUrl('assets/music/overworld.mid')),
      Midi.fromUrl(assetUrl('assets/music/battle.mid'))
    ]);
    this.themes.set('overworld', this.buildTheme(overworld, 'overworld'));
    this.themes.set('battle', this.buildTheme(battle, 'battle'));
    if (this.enabled) this.playTheme(this.desiredTheme);
  }

  private buildTheme(midi: Midi, theme: MusicTheme): ThemePlayback {
    const parts: Tone.Part<NoteEvent>[] = [];
    const nodes: Tone.ToneAudioNode[] = [];
    const finalTick = Math.max(...midi.tracks.flatMap(track => track.notes.map(note => note.ticks + note.durationTicks)));
    const loopTicks = Math.ceil(finalTick / (midi.header.ppq * 4)) * midi.header.ppq * 4;
    const loopEnd = midi.header.ticksToSeconds(loopTicks);

    midi.tracks.forEach(track => {
      if (track.channel === 9) {
        const kick = new Tone.MembraneSynth({
          pitchDecay: 0.025,
          octaves: 5,
          envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.05 }
        }).connect(this.musicBus!);
        const noise = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.07, sustain: 0, release: 0.025 }
        }).connect(this.musicBus!);
        kick.volume.value = theme === 'battle' ? -7 : -11;
        noise.volume.value = theme === 'battle' ? -14 : -18;
        nodes.push(kick, noise);
        const part = this.makePart(track, loopEnd, (time, event) => {
          if (event.midi <= 36) kick.triggerAttackRelease(theme === 'battle' ? 'C1' : 'C2', 0.1, time, event.velocity);
          else noise.triggerAttackRelease(event.midi >= 46 ? 0.14 : 0.055, time, event.velocity);
        });
        parts.push(part);
        return;
      }

      const isBass = /bass/i.test(track.name);
      const isHarmony = /chord|stab/i.test(track.name);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: isBass ? 'square' : isHarmony ? 'triangle' : theme === 'battle' ? 'sawtooth' : 'square' },
        envelope: isBass
          ? { attack: 0.008, decay: 0.12, sustain: 0.28, release: 0.12 }
          : isHarmony
            ? { attack: 0.025, decay: 0.18, sustain: 0.24, release: 0.32 }
            : { attack: 0.006, decay: 0.09, sustain: 0.2, release: 0.1 }
      }).connect(this.musicBus!);
      synth.volume.value = isBass ? -7 : isHarmony ? -14 : /arpeggio|pulse/i.test(track.name) ? -14 : -8;
      nodes.push(synth);
      const part = this.makePart(track, loopEnd, (time, event) => {
        synth.triggerAttackRelease(event.name, Math.max(0.04, event.duration * 0.9), time, event.velocity * 0.78);
      });
      parts.push(part);
    });
    return { parts, nodes };
  }

  private makePart(track: Track, loopEnd: number, callback: (time: number, event: NoteEvent) => void) {
    const events = track.notes.map(note => ({
      time: note.time,
      name: note.name,
      midi: note.midi,
      duration: note.duration,
      velocity: note.velocity
    }));
    const part = new Tone.Part<NoteEvent>(callback, events);
    part.loop = true;
    part.loopEnd = loopEnd;
    return part;
  }

  private playTheme(theme: MusicTheme) {
    const playback = this.themes.get(theme);
    if (!playback || this.activeTheme === theme || !this.musicBus) return;
    this.activeTheme = theme;
    this.musicBus.mute = false;
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    transport.seconds = 0;
    this.themes.forEach(value => value.parts.forEach(part => part.stop()));
    playback.parts.forEach(part => part.start(0));
    transport.start('+0.04');
  }

  sfx(freq = 440, duration = 0.12, type: OscillatorType = 'square') {
    if (!this.started || !this.effectsBus) return;
    const synth = new Tone.Synth({
      oscillator: { type },
      envelope: { attack: 0.002, decay: duration * 0.45, sustain: 0.08, release: duration * 0.55 }
    }).connect(this.effectsBus);
    synth.triggerAttackRelease(freq, duration, Tone.now());
    window.setTimeout(() => synth.dispose(), Math.ceil((duration + 0.15) * 1000));
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (this.musicBus) this.musicBus.mute = false;
      this.unlock();
      if (this.started) this.playTheme(this.desiredTheme);
    } else {
      if (this.musicBus) this.musicBus.mute = true;
      Tone.getTransport().pause();
      this.activeTheme = undefined;
    }
    return this.enabled;
  }
}
