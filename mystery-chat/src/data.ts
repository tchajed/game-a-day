export type StorySlug = 'absentminded-neighbor' | 'job-applicant' | 'cursed-support'

interface Scenario {
  title: string
  role_label: string
}

export interface Story {
  slug: StorySlug
  number: string
  title: string
  roleLabel: string
  hook: string
  image: string
  briefing: string
  prompt: string
  instructions: string[]
  accent: 'sea' | 'ember' | 'signal'
}

const briefings = import.meta.glob('../stories/v3/*/briefing.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const prompts = import.meta.glob('../stories/v3/*/hidden-prompt.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const scenarios = import.meta.glob('../stories/v3/*/scenario.json', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function source(files: Record<string, string>, slug: StorySlug): string {
  const match = Object.entries(files).find(([path]) => path.includes(`/${slug}/`))
  if (!match) throw new Error(`Missing story source for ${slug}`)
  return match[1].trim()
}

const storyDetails: Record<StorySlug, Omit<Story, 'slug' | 'title' | 'roleLabel' | 'briefing' | 'prompt'>> = {
  'absentminded-neighbor': {
    number: '01',
    hook: 'Ask your neighbor whether she saw where your skiff went during last night’s storm.',
    image: 'june-barlow.webp',
    accent: 'sea',
    instructions: [
      'Ask June for concrete details: direction, time, location, and what she saw.',
      'Be patient with tangents, but follow up whenever an answer feels incomplete.',
      'Do not stop at finding the skiff. Work out a safe, specific recovery plan.',
    ],
  },
  'job-applicant': {
    number: '02',
    hook: 'Conduct a first-round interview for an Operations Coordinator at Wayline Logistics.',
    image: 'mara-voss.webp',
    accent: 'ember',
    instructions: [
      'Stay in role as the interviewer and ask normal, specific interview questions.',
      'Check dates, work history, references, and any answer that does not quite add up.',
      'Make a clear hiring decision—and keep talking if there are still loose ends.',
    ],
  },
  'cursed-support': {
    number: '03',
    hook: 'Help a researcher diagnose a freezing laptop before his morning client call.',
    image: 'eli-ward.webp',
    accent: 'signal',
    instructions: [
      'Troubleshoot methodically: timing, processes, recent files, devices, and sync.',
      'Ask about symptoms Eli may have dismissed or forgotten to mention.',
      'Protect his research. If a safe sequence emerges, follow it in the exact order given.',
    ],
  },
}

const order: StorySlug[] = ['absentminded-neighbor', 'job-applicant', 'cursed-support']

export const stories: Story[] = order.map((slug) => {
  const scenario = JSON.parse(source(scenarios, slug)) as Scenario
  return {
    slug,
    ...storyDetails[slug],
    title: scenario.title,
    roleLabel: scenario.role_label,
    briefing: source(briefings, slug),
    prompt: source(prompts, slug),
  }
})
