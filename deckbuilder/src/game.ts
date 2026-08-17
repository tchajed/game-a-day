export type SignalKind = 'warm' | 'ritual' | 'analytical' | 'guarded' | 'hostile'
export type Faction = 'resonant' | 'exact'

export type Signal = {
  kind: SignalKind
  label: string
  message: string
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
  resolve: (signal: Signal, faction: Faction) => Effect
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
    text: '+1 Trust. Record 1 insight.', flavor: 'Silence is a sensor.',
    resolve: () => effect(1, 0, 1, 'Cadence recorded. A hidden pattern is now visible.'),
  },
  mirror: {
    id: 'mirror', name: 'Mirror Rite', glyph: '◇', family: 'Connect', rarity: 'standard',
    text: '+1 Trust. +2 more for a RITUAL signal.', flavor: 'Answer shape with shape.',
    resolve: (signal) => signal.kind === 'ritual'
      ? effect(3, 0, 0, 'The mirrored gesture is accepted as fluent respect.', true)
      : effect(1, 0, 0, 'The gesture is acknowledged, but carries little meaning.'),
  },
  verify: {
    id: 'verify', name: 'Verify Claim', glyph: '⊢', family: 'Observe', rarity: 'standard',
    text: '+1 Trust. +2 more for an ANALYTICAL signal.', flavor: 'Proof before promise.',
    resolve: (signal) => signal.kind === 'analytical'
      ? effect(3, 0, 1, 'Your proof lattice aligns with the envoy’s reasoning.', true)
      : effect(1, 0, 0, 'The facts are correct, if emotionally mistimed.'),
  },
  disclose: {
    id: 'disclose', name: 'Open Archive', glyph: '◫', family: 'Connect', rarity: 'standard',
    text: '+2 Trust, +1 Tension. +1 Trust with warm envoys.', flavor: 'Vulnerability has mass.',
    resolve: (signal, faction) => faction === 'resonant'
      ? effect(3, 1, 0, 'The personal record creates immediate resonance.', true)
      : effect(2, 1, 0, 'The disclosure is useful—and unexpectedly intimate.'),
  },
  offering: {
    id: 'offering', name: 'Signal Offering', glyph: '✦', family: 'Commit', rarity: 'standard',
    text: '+2 Trust, +1 Tension. Never conditional.', flavor: 'A gift is a question.',
    resolve: () => effect(2, 1, 0, 'The offering is catalogued. An obligation is created.'),
  },
  pause: {
    id: 'pause', name: 'Measured Pause', glyph: 'Ⅱ', family: 'Stabilize', rarity: 'standard',
    text: '−2 Tension. +1 Trust against HOSTILE signals.', flavor: 'Do not fill every silence.',
    resolve: (signal) => signal.kind === 'hostile'
      ? effect(1, -2, 0, 'You refuse the provocation. The chamber cools.', true)
      : effect(0, -2, 0, 'The pause releases pressure, but cedes momentum.'),
  },
  stillness: {
    id: 'stillness', name: 'Shared Stillness', glyph: '○', family: 'Connect', rarity: 'specialist',
    text: '+1 Trust. +3 more for a GUARDED signal.', flavor: 'Presence without demand.',
    resolve: (signal) => signal.kind === 'guarded'
      ? effect(4, 0, 1, 'You wait without extracting. The envoy chooses to answer.', true)
      : effect(1, 0, 0, 'The quiet is peaceful, if unproductive.'),
  },
  pattern: {
    id: 'pattern', name: 'Pattern Proof', glyph: '⌬', family: 'Observe', rarity: 'specialist',
    text: '+2 Trust. +2 more with Exact envoys.', flavor: 'A theorem with an audience.',
    resolve: (_signal, faction) => faction === 'exact'
      ? effect(4, 0, 1, 'The proof exposes a shared formal grammar.', true)
      : effect(2, 0, 0, 'The argument is admired, though not embraced.'),
  },
  boundary: {
    id: 'boundary', name: 'Kind Boundary', glyph: '⬡', family: 'Stabilize', rarity: 'specialist',
    text: '+1 Trust, −1 Tension. +2 Trust against HOSTILE signals.', flavor: 'No, without rupture.',
    resolve: (signal) => signal.kind === 'hostile'
      ? effect(3, -1, 0, 'The firm limit earns an unexpected sign of respect.', true)
      : effect(1, -1, 0, 'Your limits are received without offense.'),
  },
  chorus: {
    id: 'chorus', name: 'Chorus Weave', glyph: '≋', family: 'Connect', rarity: 'specialist',
    text: '+2 Trust. +2 more with Resonant envoys.', flavor: 'Many voices, one intent.',
    resolve: (_signal, faction) => faction === 'resonant'
      ? effect(4, 0, 0, 'Your layered reply meets them as a living harmony.', true)
      : effect(2, 0, 0, 'The composition is elegant, but imprecise.'),
  },
  oath: {
    id: 'oath', name: 'Irrevocable Oath', glyph: '†', family: 'Commit', rarity: 'specialist',
    text: '+4 Trust, +2 Tension.', flavor: 'The loop forgets. You do not.',
    resolve: () => effect(4, 2, 0, 'The oath lands with dangerous, undeniable weight.'),
  },
  redaction: {
    id: 'redaction', name: 'Gentle Redaction', glyph: '▰', family: 'Stabilize', rarity: 'specialist',
    text: '+2 Trust. −1 Tension with GUARDED signals.', flavor: 'Privacy is also a promise.',
    resolve: (signal) => signal.kind === 'guarded'
      ? effect(2, -1, 1, 'Withholding the name proves you understand consent.', true)
      : effect(2, 0, 0, 'The careful omission is noted.'),
  },
}

export const startingDeck = ['listen', 'mirror', 'verify', 'disclose', 'offering', 'pause']

export const encounters: Encounter[] = [
  {
    id: 'lyra', envoy: 'LYRA-OF-MISTS', designation: 'Vessel Envoy', location: 'Lagrange Parlour 03',
    faction: 'resonant', portrait: 0, target: 7, tensionLimit: 5,
    intro: 'First contact, again. Lyra folds four hands and waits for you to choose the shape of this meeting.',
    signals: [
      { kind: 'ritual', label: 'RITUAL', message: 'The envoy traces a slow diamond in the condensation.' },
      { kind: 'warm', label: 'WARM', message: 'A low chord enters the room. Your name appears inside it.' },
      { kind: 'guarded', label: 'GUARDED', message: 'Lyra veils their smaller eyes before asking about Earth.' },
      { kind: 'warm', label: 'WARM', message: 'All four palms turn upward: an invitation, or an ending.' },
    ],
    rewards: ['stillness', 'chorus', 'redaction'],
  },
  {
    id: 'tal', envoy: 'ARCHIVIST TAL', designation: 'Continuity Auditor', location: 'Mnemonic Vault 11',
    faction: 'exact', portrait: 1, target: 9, tensionLimit: 5,
    intro: 'Tal has indexed contradictions from timelines that no longer exist. It wants your species reduced to one consistent statement.',
    signals: [
      { kind: 'analytical', label: 'ANALYTICAL', message: 'A proof request unfolds across the table in twelve dimensions.' },
      { kind: 'guarded', label: 'GUARDED', message: 'Tal encrypts its own reply, watching what you do with the absence.' },
      { kind: 'analytical', label: 'ANALYTICAL', message: '“Define peace without referring to intention.”' },
      { kind: 'hostile', label: 'ADVERSARIAL', message: 'The archivist presents evidence that humanity broke this promise before.' },
      { kind: 'analytical', label: 'ANALYTICAL', message: 'A final blank axiom waits for your signature.' },
    ],
    rewards: ['pattern', 'boundary', 'oath'],
  },
  {
    id: 'confluence', envoy: 'THE CONFLUENCE', designation: 'Joint Voice', location: 'Boundary Station Null',
    faction: 'resonant', portrait: 2, target: 11, tensionLimit: 6,
    intro: 'The alien delegation arrives speaking with two incompatible voices. The split was always there. Now your loop remembers it.',
    signals: [
      { kind: 'warm', label: 'WARM', message: 'One voice greets you like an old friend. The other records your pulse.' },
      { kind: 'analytical', label: 'ANALYTICAL', message: 'The chamber asks for both a feeling and its falsifiable cause.' },
      { kind: 'ritual', label: 'RITUAL', message: 'Two opposing gestures begin. Only one expects to be mirrored.' },
      { kind: 'hostile', label: 'FRACTURED', message: 'The voices turn on each other, and demand that you choose.' },
      { kind: 'guarded', label: 'GUARDED', message: 'In sudden unity, both voices ask what survives your reset.' },
    ],
    rewards: [],
  },
]

export function resolveCard(cardId: string, encounter: Encounter, turn: number): Effect {
  return cards[cardId].resolve(encounter.signals[Math.min(turn, encounter.signals.length - 1)], encounter.faction)
}
