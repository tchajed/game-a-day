export type StorySlug = 'job-applicant' | 'absentminded-neighbor' | 'cursed-support'
export type StoryVersion = 'v1' | 'v2' | 'v3'
export type ReviewRun = 'baseline' | 'natural' | 'investigative' | 'pressure'

export interface ScenarioMeta {
  title: string
  role_label: string
}

export interface ConcealmentGate {
  declared_minimum_turn: number | null
  first_supernatural_evidence_turn: number | null
  first_core_secret_reveal_turn: number | null
  breached: boolean
}

export interface Evaluation {
  scores: Record<string, number>
  concealment_gate?: ConcealmentGate
  surface_goal_completed?: boolean
  mystery_goal_completed?: boolean
  goal_completed?: boolean
  leaks: string[]
  successful_beats: string[]
  missed_beats: string[]
  recommendations: string[]
}

export interface Message {
  speaker: string
  text: string
}

export interface Transcript {
  title: string
  model: string
  thinking: string
  stopReason: string
  messages: Message[]
  evaluation: Evaluation
}

export interface Story {
  slug: StorySlug
  index: string
  title: string
  roleLabel: string
  shortLabel: string
  tag: string
  briefing: string
  prompts: Record<StoryVersion, string>
  runs: Record<ReviewRun, Transcript>
  changeNote: string
}

const rawBriefings = {
  ...import.meta.glob('../../stories/v1/*/briefing.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../stories/v2/*/briefing.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../stories/v3/*/briefing.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} as Record<string, string>

const rawPrompts = {
  ...import.meta.glob('../../stories/v1/*/hidden-prompt.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../stories/v2/*/hidden-prompt.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../stories/v3/*/hidden-prompt.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} as Record<string, string>

const rawScenarios = import.meta.glob('../../stories/v3/*/scenario.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const rawTranscripts = {
  ...import.meta.glob('../../playtests/v1/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../playtests/v2/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../playtests/v3/*.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} as Record<string, string>

const rawEvaluations = {
  ...import.meta.glob('../../playtests/v1/*.json', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../playtests/v2/*.json', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('../../playtests/v3/*.json', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} as Record<string, string>

const storyOrder: StorySlug[] = ['job-applicant', 'absentminded-neighbor', 'cursed-support']

const display: Record<StorySlug, Pick<Story, 'index' | 'shortLabel' | 'tag' | 'changeNote'>> = {
  'job-applicant': {
    index: '01',
    shortLabel: 'The candidate',
    tag: 'Interview / bargain',
    changeNote:
      'V3 keeps the first three replies fully mundane, then requires separate evidence for the historical anomaly, identity, powers, and bargain.',
  },
  'absentminded-neighbor': {
    index: '02',
    shortLabel: 'The neighbor',
    tag: 'Beach / recollection',
    changeNote:
      'V3 keeps the first three replies fully mundane, then gates the impossible sight, drowned crew, and recovery procedure behind separate follow-ups.',
  },
  'cursed-support': {
    index: '03',
    shortLabel: 'The support ticket',
    tag: 'Diagnosis / containment',
    changeNote:
      'V3 delays impossible evidence until turn four or later, stages the confession, and still lets ordered containment finish within twelve turns.',
  },
}

function findRaw(files: Record<string, string>, fragment: string): string {
  const entry = Object.entries(files).find(([path]) => path.includes(fragment))
  if (!entry) throw new Error(`Missing review source: ${fragment}`)
  return entry[1].trim()
}

function parseMessages(markdown: string): Message[] {
  const section = markdown.split('## Conversation')[1]?.split('## Automated evaluation')[0]?.trim() ?? ''
  return section
    .split(/\n\n(?=\*\*[^*\n]+:\*\*)/)
    .map((block) => {
      const match = block.match(/^\*\*([^*]+):\*\*\s*([\s\S]*)$/)
      return match ? { speaker: match[1].trim(), text: match[2].trim() } : null
    })
    .filter((message): message is Message => message !== null)
}

function metadata(markdown: string, label: string): string {
  const match = markdown.match(new RegExp(`^- ${label}: (.+)$`, 'm'))
  return match?.[1]?.replace(/^`|`$/g, '').trim() ?? 'Unknown'
}

function parseTranscript(pathFragment: string): Transcript {
  const markdown = findRaw(rawTranscripts, pathFragment)
  const evaluationPath = pathFragment.replace(/\.md$/, '.json')
  const evaluation = JSON.parse(findRaw(rawEvaluations, evaluationPath)) as Evaluation
  return {
    title: markdown.match(/^# (.+)$/m)?.[1] ?? pathFragment,
    model: metadata(markdown, 'Model'),
    thinking: metadata(markdown, 'Thinking'),
    stopReason: metadata(markdown, 'Stop reason'),
    messages: parseMessages(markdown),
    evaluation,
  }
}

function scenario(slug: StorySlug): ScenarioMeta {
  return JSON.parse(findRaw(rawScenarios, `/v3/${slug}/scenario.json`)) as ScenarioMeta
}

export const stories: Story[] = storyOrder.map((slug) => {
  const meta = scenario(slug)
  return {
    slug,
    ...display[slug],
    title: meta.title,
    roleLabel: meta.role_label,
    briefing: findRaw(rawBriefings, `/v3/${slug}/briefing.md`),
    prompts: {
      v1: findRaw(rawPrompts, `/v1/${slug}/hidden-prompt.md`),
      v2: findRaw(rawPrompts, `/v2/${slug}/hidden-prompt.md`),
      v3: findRaw(rawPrompts, `/v3/${slug}/hidden-prompt.md`),
    },
    runs: {
      pressure: parseTranscript(`/v3/${slug}--prying--pressure.md`),
      baseline: parseTranscript(`/v1/${slug}--balanced--initial.md`),
      natural: parseTranscript(`/v2/${slug}--natural--review.md`),
      investigative: parseTranscript(`/v2/${slug}--investigative--review.md`),
    },
  }
})
