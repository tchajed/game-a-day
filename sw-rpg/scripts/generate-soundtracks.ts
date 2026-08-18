import { Midi } from '@tonejs/midi';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

type ThemeOptions = {
  name: string;
  bpm: number;
  key: string;
  scale: 'major' | 'minor';
};

type TrackSpec = {
  name: string;
  channel: number;
  program: number;
};

const PPQ = 480;
const outputDirectory = join(import.meta.dir, '..', 'public', 'assets', 'music');

function makeTheme(options: ThemeOptions) {
  const midi = new Midi();
  midi.name = options.name;
  midi.header.setTempo(options.bpm);
  midi.header.timeSignatures = [{ ticks: 0, timeSignature: [4, 4], measures: 0 }];
  midi.header.keySignatures = [{ ticks: 0, key: options.key, scale: options.scale }];
  midi.header.update();
  return midi;
}

function addTrack(midi: Midi, spec: TrackSpec) {
  const track = midi.addTrack();
  track.name = spec.name;
  track.channel = spec.channel;
  track.instrument.number = spec.program;
  return track;
}

function note(track: ReturnType<typeof addTrack>, pitch: string, beat: number, duration: number, velocity = 0.75) {
  track.addNote({
    name: pitch,
    ticks: Math.round(beat * PPQ),
    durationTicks: Math.round(duration * PPQ),
    velocity
  });
}

function chord(track: ReturnType<typeof addTrack>, pitches: string[], beat: number, duration: number, velocity = 0.5) {
  pitches.forEach(pitch => note(track, pitch, beat, duration, velocity));
}

function writeOverworld() {
  const midi = makeTheme({ name: 'Route 404 — Eastbound Adventure', bpm: 126, key: 'C', scale: 'major' });
  const lead = addTrack(midi, { name: 'Adventure Lead', channel: 0, program: 80 });
  const arpeggio = addTrack(midi, { name: 'Sparkle Arpeggio', channel: 1, program: 10 });
  const harmony = addTrack(midi, { name: 'Warm Chords', channel: 2, program: 48 });
  const bass = addTrack(midi, { name: 'Walking Bass', channel: 3, program: 38 });
  const drums = addTrack(midi, { name: 'Trail Drums', channel: 9, program: 0 });

  const progression = [
    ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
    ['C4', 'E4', 'G4'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
    ['A3', 'C4', 'E4'], ['E3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'],
    ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4']
  ];
  const bassRoots = ['C2', 'A1', 'F1', 'G1', 'C2', 'E2', 'F1', 'G1', 'A1', 'E2', 'F1', 'C2', 'F1', 'G1', 'C2', 'G1'];
  const bassFifths = ['G2', 'E2', 'C2', 'D2', 'G2', 'B2', 'C2', 'D2', 'E2', 'B2', 'C2', 'G2', 'C2', 'D2', 'G2', 'D2'];

  progression.forEach((pitches, bar) => {
    const start = bar * 4;
    chord(harmony, pitches, start, 1.8, 0.42);
    chord(harmony, pitches, start + 2, 1.8, 0.34);
    const arp = [pitches[0], pitches[1], pitches[2], pitches[1], pitches[0], pitches[1], pitches[2], pitches[1]];
    arp.forEach((pitch, step) => note(arpeggio, pitch.replace(/\d/, octave => String(Number(octave) + 1)), start + step * 0.5, 0.35, step % 2 ? 0.45 : 0.58));
    note(bass, bassRoots[bar], start, 1.4, 0.72);
    note(bass, bassFifths[bar], start + 2, 0.85, 0.58);
    note(bass, bassRoots[bar], start + 3, 0.7, 0.62);

    for (let step = 0; step < 8; step++) note(drums, step % 2 ? 'F#2' : 'F#2', start + step * 0.5, 0.12, step % 2 ? 0.32 : 0.45);
    note(drums, 'C2', start, 0.18, 0.75);
    note(drums, 'D2', start + 1, 0.16, 0.62);
    note(drums, 'C2', start + 2, 0.18, 0.68);
    note(drums, 'D2', start + 3, 0.16, 0.67);
  });

  const melody: Array<Array<[string, number]>> = [
    [['E5',.5],['G5',.5],['A5',1],['G5',.5],['E5',.5],['D5',1]],
    [['C5',.5],['E5',.5],['A5',1],['G5',1],['E5',1]],
    [['F5',.5],['A5',.5],['C6',1],['A5',.5],['G5',.5],['F5',1]],
    [['D5',.5],['G5',.5],['B5',1],['A5',.5],['G5',.5],['D6',1]],
    [['E6',.5],['D6',.5],['C6',1],['G5',.5],['E5',.5],['G5',1]],
    [['B5',.5],['G5',.5],['E5',1],['G5',.5],['B5',.5],['D6',1]],
    [['C6',1],['A5',.5],['F5',.5],['A5',1],['G5',1]],
    [['B5',.5],['A5',.5],['G5',1],['D5',.5],['G5',.5],['B5',1]],
    [['A5',.5],['C6',.5],['E6',1],['D6',.5],['C6',.5],['A5',1]],
    [['G5',.5],['B5',.5],['E6',1],['D6',1],['B5',1]],
    [['A5',.5],['C6',.5],['F6',1],['E6',.5],['C6',.5],['A5',1]],
    [['G5',.5],['E5',.5],['C5',1],['E5',.5],['G5',.5],['C6',1]],
    [['A5',.5],['C6',.5],['F6',1],['E6',.5],['C6',.5],['A5',1]],
    [['B5',.5],['D6',.5],['G6',1],['F6',.5],['D6',.5],['B5',1]],
    [['E6',.5],['D6',.5],['C6',1],['G5',.5],['E5',.5],['C6',1]],
    [['D6',.5],['B5',.5],['G5',1],['A5',.5],['B5',.5],['G5',1]]
  ];
  melody.forEach((bar, barIndex) => {
    let cursor = barIndex * 4;
    bar.forEach(([pitch, duration]) => {
      note(lead, pitch, cursor, duration * 0.82, barIndex >= 12 ? 0.82 : 0.72);
      cursor += duration;
    });
  });
  return midi;
}

function writeBattle() {
  const midi = makeTheme({ name: 'Route 404 — Interrupt Storm', bpm: 156, key: 'E', scale: 'minor' });
  const lead = addTrack(midi, { name: 'Battle Lead', channel: 0, program: 81 });
  const pulse = addTrack(midi, { name: 'Urgent Pulse', channel: 1, program: 87 });
  const stabs = addTrack(midi, { name: 'Brass Stabs', channel: 2, program: 62 });
  const bass = addTrack(midi, { name: 'Battle Bass', channel: 3, program: 38 });
  const drums = addTrack(midi, { name: 'Battle Drums', channel: 9, program: 16 });

  const roots = ['E2','E2','C2','D2','E2','G2','F#2','B1','E2','C2','A1','B1','E2','G2','F#2','B1'];
  const powerChords = [
    ['E3','B3'],['E3','B3'],['C3','G3'],['D3','A3'],['E3','B3'],['G3','D4'],['F#3','C#4'],['B2','F#3'],
    ['E3','B3'],['C3','G3'],['A2','E3'],['B2','F#3'],['E3','B3'],['G3','D4'],['F#3','C#4'],['B2','F#3']
  ];

  powerChords.forEach((pitches, bar) => {
    const start = bar * 4;
    chord(stabs, pitches, start, 0.55, 0.68);
    chord(stabs, pitches, start + 1.5, 0.3, 0.52);
    chord(stabs, pitches, start + 3, 0.7, 0.72);
    for (let step = 0; step < 8; step++) {
      note(pulse, step % 4 === 3 ? pitches[1] : pitches[0], start + step * 0.5, 0.28, step % 2 ? 0.37 : 0.55);
      note(drums, 'F#2', start + step * 0.5, 0.1, step % 2 ? 0.42 : 0.56);
    }
    note(bass, roots[bar], start, 0.7, 0.86);
    note(bass, roots[bar], start + 1, 0.35, 0.68);
    note(bass, roots[bar], start + 1.5, 0.35, 0.64);
    note(bass, roots[bar], start + 2, 0.7, 0.78);
    note(bass, roots[bar], start + 3, 0.75, 0.84);
    note(drums, 'C2', start, 0.16, 0.92);
    note(drums, 'D2', start + 1, 0.15, 0.82);
    note(drums, 'C2', start + 2, 0.16, 0.88);
    note(drums, 'D2', start + 3, 0.15, 0.86);
    if (bar % 4 === 3) note(drums, 'A#2', start + 3.5, 0.45, 0.78);
  });

  const motifs = [
    ['E5','G5','B5','E6','D6','B5','G5','F#5'], ['E5','G5','A#5','B5','G5','F#5','D5','B4'],
    ['E5','G5','C6','B5','G5','E5','D#5','E5'], ['F#5','A5','D6','C6','A5','F#5','E5','D5'],
    ['E5','B5','G5','E6','D6','B5','G5','B5'], ['G5','B5','D6','G6','F#6','D6','B5','A5'],
    ['F#5','A5','C#6','F#6','E6','C#6','A5','G5'], ['F#5','B5','D6','F#6','D6','B5','A#5','F#5']
  ];
  for (let bar = 0; bar < 16; bar++) {
    const motif = motifs[bar % motifs.length];
    motif.forEach((pitch, step) => note(lead, pitch, bar * 4 + step * 0.5, step % 4 === 3 ? 0.42 : 0.3, bar >= 8 ? 0.88 : 0.76));
  }
  return midi;
}

await mkdir(outputDirectory, { recursive: true });
await Bun.write(join(outputDirectory, 'overworld.mid'), writeOverworld().toArray());
await Bun.write(join(outputDirectory, 'battle.mid'), writeBattle().toArray());
console.log('Wrote overworld.mid and battle.mid');
