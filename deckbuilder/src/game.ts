export type SignalKind = 'warm' | 'ritual' | 'analytical' | 'guarded' | 'hostile'
export type Faction = 'resonant' | 'exact'

export type Signal = {
  kind: SignalKind
  label: string
  message: string
  pressure: number
}

export type Encounter = {
  id: string
  envoy: string
  designation: string
  location: string
  faction: Faction
  portrait: 0 | 1 | 2
  target: number
  tensionLimit: number
  intro: string
  signals: Signal[]
  rewards: string[]
}

export type Effect = {
  trust: number
  tension: number
  intel: number
  note: string
  matched: boolean
}

export type Card = {
  id: string
  name: string
  glyph: string
  family: 'Observe' | 'Connect' | 'Commit' | 'Stabilize'
  text: string
  flavor: string
  rarity: 'standard' | 'specialist'
  resolve: (signal: Signal, faction: Faction, intel: number) => Effect
}

const effect = (trust: number, tension: number, intel: number, note: string, matched = false): Effect => ({
  trust,
  tension,
  intel,
  note,
  matched,
})

export const cards: Record<string, Card> = {
  listen: {
    id: 'listen', name: 'Active Listen', glyph: '⌁', family: 'Observe', rarity: 'standard',
    text: '+1 Trust, −1 Tension. Record 1 insight.', flavor: 'Silence is a sensor.',
    resolve: () => effect(1, -1, 1, 'You let the envoy define the terms before answering.'),
  },
  mirror: {
    id: 'mirror', name: 'Mirror Rite', glyph: '◇', family: 'Connect', rarity: 'standard',
    text: '+4 Trust for RITUAL. Otherwise +1 Tension.', flavor: 'Answer shape with shape.',
    resolve: (signal) => signal.kind === 'ritual'
      ? effect(4, 0, 0, 'The mirrored gesture is accepted as fluent respect.', true)
      : effect(0, 1, 0, 'An uninvited ritual reads as mimicry.'),
  },
  verify: {
    id: 'verify', name: 'Verify Claim', glyph: '⊢', family: 'Observe', rarity: 'standard',
    text: '+4 Trust for ANALYTICAL. Otherwise +1 Tension.', flavor: 'Proof before promise.',
    resolve: (signal) => signal.kind === 'analytical'
      ? effect(4, 0, 1, 'Your proof lattice aligns with the envoy’s reasoning.', true)
      : effect(0, 1, 0, 'The facts are correct, but answer the wrong question.'),
  },
  disclose: {
    id: 'disclose', name: 'Open Archive', glyph: '◫', family: 'Connect', rarity: 'standard',
    text: '+4 Trust, +1 Tension for WARM. Otherwise +1 Trust, +2 Tension.', flavor: 'Vulnerability has mass.',
    resolve: (signal) => signal.kind === 'warm'
      ? effect(4, 1, 0, 'The personal record creates immediate resonance.', true)
      : effect(1, 2, 0, 'The disclosure is useful—and dangerously mistimed.'),
  },
  offering: {
    id: 'offering', name: 'Signal Offering', glyph: '✦', family: 'Commit', rarity: 'standard',
    text: '+3 Trust, +2 Tension. At 2 Insight: +5 Trust, +1 Tension.', flavor: 'A gift is a question.',
    resolve: (_signal, _faction, intel) => intel >= 2
      ? effect(5, 1, 0, 'Your behavioral model turns the offering into exactly the right gift.', true)
      : effect(3, 2, 0, 'The offering creates trust, pressure, and an obligation.'),
  },
  pause: {
    id: 'pause', name: 'Measured Pause', glyph: 'Ⅱ', family: 'Stabilize', rarity: 'standard',
    text: '−2 Tension. Against HOSTILE: +3 Trust and −3 Tension.', flavor: 'Do not fill every silence.',
    resolve: (signal) => signal.kind === 'hostile'
      ? effect(3, -3, 0, 'You refuse the provocation. The chamber cools.', true)
      : effect(0, -2, 0, 'The pause releases pressure, but cedes momentum.'),
  },
  stillness: {
    id: 'stillness', name: 'Shared Stillness', glyph: '○', family: 'Connect', rarity: 'specialist',
    text: '+2 Trust, −1 Tension. Against GUARDED: +5 Trust.', flavor: 'Presence without demand.',
    resolve: (signal) => signal.kind === 'guarded'
      ? effect(5, -1, 1, 'You wait without extracting. The envoy chooses to answer.', true)
      : effect(2, -1, 0, 'The quiet leaves room for a careful answer.'),
  },
  chorus: {
    id: 'chorus', name: 'Chorus Weave', glyph: '≋', family: 'Connect', rarity: 'specialist',
    text: '+3 Trust, +1 Tension. Against WARM: +5 Trust.', flavor: 'Many voices, one intent.',
    resolve: (signal) => signal.kind === 'warm'
      ? effect(5, 1, 0, 'Your layered reply meets them as a living harmony.', true)
      : effect(3, 1, 0, 'The chorus carries force, even without perfect resonance.'),
  },
  redaction: {
    id: 'redaction', name: 'Gentle Redaction', glyph: '▰', family: 'Stabilize', rarity: 'specialist',
    text: '+2 Trust, −1 Tension. Against HOSTILE: +4 Trust, −2 Tension.', flavor: 'Privacy is also a promise.',
    resolve: (signal) => signal.kind === 'hostile'
      ? effect(4, -2, 1, 'You remove the accusation’s target without denying its truth.', true)
      : effect(2, -1, 0, 'The careful omission proves that restraint is possible.'),
  },
  pattern: {
    id: 'pattern', name: 'Pattern Proof', glyph: '⌬', family: 'Observe', rarity: 'specialist',
    text: '+6 Trust for ANALYTICAL. Otherwise +2 Trust, +1 Tension.', flavor: 'A theorem with an audience.',
    resolve: (signal) => signal.kind === 'analytical'
      ? effect(6, 0, 2, 'The proof exposes a shared formal grammar.', true)
      : effect(2, 1, 0, 'The theorem impresses more than it persuades.'),
  },
  boundary: {
    id: 'boundary', name: 'Kind Boundary', glyph: '⬡', family: 'Stabilize', rarity: 'specialist',
    text: '+1 Trust, −1 Tension. Against GUARDED or HOSTILE: +6 Trust, −4 Tension.', flavor: 'No, without rupture.',
    resolve: (signal) => signal.kind === 'guarded' || signal.kind === 'hostile'
      ? effect(6, -4, 0, 'The firm limit creates safety without demanding surrender.', true)
      : effect(1, -1, 0, 'Your limits are received without offense.'),
  },
  oath: {
    id: 'oath', name: 'Irrevocable Oath', glyph: '†', family: 'Commit', rarity: 'specialist',
    text: '+6 Trust, +3 Tension.', flavor: 'The loop forgets. You do not.',
    resolve: () => effect(6, 3, 0, 'The oath lands with dangerous, undeniable weight.'),
  },
}

// Draw order matters: this sequence presents a viable first-contact line while
// leaving later loadout order for the player to solve in the workshop.
export const startingDeck = ['mirror', 'disclose', 'offering', 'listen', 'verify', 'pause']

export const encounters: Encounter[] = [
  {
    id: 'lyra', envoy: 'LYRA-OF-MISTS', designation: 'Vessel Envoy', location: 'Lagrange Parlour 03',
    faction: 'resonant', portrait: 0, target: 12, tensionLimit: 6,
    intro: 'First contact, again. Lyra folds four hands and waits for you to choose the shape of this meeting.',
    signals: [
      { kind: 'ritual', label: 'RITUAL', pressure: 0, message: 'The envoy traces a slow diamond in the condensation.' },
      { kind: 'warm', label: 'WARM', pressure: 1, message: 'A low chord enters the room. Your name appears inside it.' },
      { kind: 'guarded', label: 'GUARDED', pressure: 1, message: 'Lyra veils their smaller eyes before asking about Earth.' },
      { kind: 'warm', label: 'WARM', pressure: 1, message: 'All four palms turn upward: an invitation, or an ending.' },
    ],
    rewards: ['stillness', 'chorus', 'redaction'],
  },
  {
    id: 'tal', envoy: 'ARCHIVIST TAL', designation: 'Continuity Auditor', location: 'Mnemonic Vault 11',
    faction: 'exact', portrait: 1, target: 18, tensionLimit: 9,
    intro: 'Tal has indexed contradictions from timelines that no longer exist. A basic protocol set cannot satisfy its audit.',
    signals: [
      { kind: 'analytical', label: 'ANALYTICAL', pressure: 1, message: 'A proof request unfolds across the table in twelve dimensions.' },
      { kind: 'guarded', label: 'GUARDED', pressure: 1, message: 'Tal encrypts its own reply, watching what you do with the absence.' },
      { kind: 'analytical', label: 'ANALYTICAL', pressure: 1, message: '“Define peace without referring to intention.”' },
      { kind: 'hostile', label: 'ADVERSARIAL', pressure: 2, message: 'The archivist presents evidence that humanity broke this promise before.' },
      { kind: 'warm', label: 'PERSONAL', pressure: 1, message: 'For one unindexed moment, Tal asks whether you are also afraid.' },
    ],
    rewards: ['pattern', 'boundary', 'oath'],
  },
  {
    id: 'confluence', envoy: 'THE CONFLUENCE', designation: 'Joint Voice', location: 'Boundary Station Null',
    faction: 'resonant', portrait: 2, target: 22, tensionLimit: 12,
    intro: 'The alien delegation arrives speaking with two incompatible voices. Only protocols recovered from both prior accords can bridge them.',
    signals: [
      { kind: 'warm', label: 'WARM', pressure: 1, message: 'One voice greets you like an old friend. The other records your pulse.' },
      { kind: 'analytical', label: 'ANALYTICAL', pressure: 1, message: 'The chamber asks for both a feeling and its falsifiable cause.' },
      { kind: 'ritual', label: 'RITUAL', pressure: 2, message: 'Two opposing gestures begin. Only one expects to be mirrored.' },
      { kind: 'hostile', label: 'FRACTURED', pressure: 2, message: 'The voices turn on each other, and demand that you choose.' },
      { kind: 'guarded', label: 'GUARDED', pressure: 2, message: 'In sudden unity, both voices ask what survives your reset.' },
    ],
    rewards: [],
  },
]

export function resolveCard(cardId: string, encounter: Encounter, turn: number, intel = 0): Effect {
  const signal = encounter.signals[Math.min(turn, encounter.signals.length - 1)]
  const result = cards[cardId].resolve(signal, encounter.faction, intel)
  return {
    ...result,
    tension: result.tension + signal.pressure,
    note: signal.pressure > 0 ? `${result.note} Signal pressure adds ${signal.pressure} tension.` : result.note,
  }
}
