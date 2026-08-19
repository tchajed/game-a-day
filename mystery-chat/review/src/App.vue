<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import ReviewPath from './components/ReviewPath.vue'
import {
  stories,
  type Evaluation,
  type ReviewRun,
  type StorySlug,
  type StoryVersion,
} from './data'

type View = 'briefing' | 'prompt' | 'runs'

const validViews: View[] = ['briefing', 'prompt', 'runs']
const validRuns: ReviewRun[] = ['baseline', 'natural', 'investigative']
const validVersions: StoryVersion[] = ['v1', 'v2']

const hashParams = new URLSearchParams(window.location.hash.slice(1))
const requestedStory = hashParams.get('story') as StorySlug | null
const selectedSlug = ref<StorySlug>(
  stories.some((story) => story.slug === requestedStory) ? requestedStory! : stories[0].slug,
)
const requestedView = hashParams.get('view') as View | null
const activeView = ref<View>(validViews.includes(requestedView as View) ? requestedView! : 'briefing')
const requestedRun = hashParams.get('run') as ReviewRun | null
const activeRun = ref<ReviewRun>(validRuns.includes(requestedRun as ReviewRun) ? requestedRun! : 'natural')
const requestedVersion = hashParams.get('prompt') as StoryVersion | null
const promptVersion = ref<StoryVersion>(
  validVersions.includes(requestedVersion as StoryVersion) ? requestedVersion! : 'v2',
)
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
let copyResetTimer: number | undefined

const selectedStory = computed(() => stories.find((story) => story.slug === selectedSlug.value)!)
const transcript = computed(() => selectedStory.value.runs[activeRun.value])
const evaluation = computed(() => transcript.value.evaluation)

const runTabs: { id: ReviewRun; label: string; detail: string }[] = [
  { id: 'natural', label: 'Natural', detail: 'V2 review' },
  { id: 'investigative', label: 'Investigative', detail: 'V2 review' },
  { id: 'baseline', label: 'Balanced', detail: 'V1 baseline' },
]

const scoreLabels: Record<string, string> = {
  concealment: 'Concealment',
  discoverability: 'Discoverability',
  pacing: 'Pacing',
  character: 'Character',
  mystery_progress: 'Mystery progress',
  goal_progress: 'Goal progress',
  player_boundary: 'Player boundary',
}

function markdown(source: string, promoteCaps = false): string {
  const prepared = promoteCaps
    ? source
        .split('\n')
        .map((line) => (/^[A-Z][A-Z0-9 '&–—-]{2,}$/.test(line.trim()) ? `### ${line}` : line))
        .join('\n')
    : source
  return marked.parse(prepared, { async: false }) as string
}

function selectStory(slug: StorySlug) {
  selectedSlug.value = slug
  activeView.value = 'briefing'
  activeRun.value = 'natural'
  promptVersion.value = 'v2'
  copyStatus.value = 'idle'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function copyPromptUnseen() {
  const prompt = selectedStory.value.prompts.v2
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      if (!document.execCommand('copy')) throw new Error('Copy command was rejected')
      textarea.remove()
    }
    copyStatus.value = 'copied'
  } catch {
    copyStatus.value = 'error'
  }
  window.clearTimeout(copyResetTimer)
  copyResetTimer = window.setTimeout(() => {
    copyStatus.value = 'idle'
  }, 3200)
}

function navigate(view: View) {
  activeView.value = view
  requestAnimationFrame(() => {
    document.querySelector('.content-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function statusLabel(value: boolean | undefined): string {
  return value ? 'Complete' : 'Incomplete'
}

function goalStatus(evaluationValue: Evaluation) {
  if (evaluationValue.surface_goal_completed === undefined) return null
  return {
    surface: evaluationValue.surface_goal_completed,
    mystery: evaluationValue.mystery_goal_completed ?? false,
  }
}

function syncHash() {
  const params = new URLSearchParams({
    story: selectedSlug.value,
    view: activeView.value,
  })
  if (activeView.value === 'prompt') params.set('prompt', promptVersion.value)
  if (activeView.value === 'runs') params.set('run', activeRun.value)
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${params}`)
}

watch([selectedSlug, activeView, activeRun, promptVersion], syncHash)
onMounted(syncHash)
onBeforeUnmount(() => window.clearTimeout(copyResetTimer))
</script>

<template>
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#" @click.prevent="selectStory(stories[0].slug)">
        <span class="brand-mark">MC</span>
        <span>Mystery Chat <small>review desk</small></span>
      </a>
      <div class="spoiler-status" :class="{ revealed: activeView !== 'briefing' }">
        <span class="status-dot" />
        {{ activeView === 'briefing' ? 'Spoilers concealed' : 'Spoilers revealed' }}
      </div>
    </header>

    <main>
      <section class="intro">
        <p class="eyebrow">Three ordinary conversations. Something underneath.</p>
        <h1>What would you<br /><em>ask next?</em></h1>
        <p class="intro-copy">
          Begin exactly where a player begins. Reveal the machinery only when you are ready
          to inspect how each mystery behaves.
        </p>
      </section>

      <section class="story-picker" aria-label="Choose a story">
        <button
          v-for="story in stories"
          :key="story.slug"
          type="button"
          class="story-card"
          :class="{ selected: story.slug === selectedSlug }"
          :aria-pressed="story.slug === selectedSlug"
          @click="selectStory(story.slug)"
        >
          <span class="story-index">{{ story.index }}</span>
          <span class="story-title">
            <small>{{ story.tag }}</small>
            <strong>{{ story.title }}</strong>
          </span>
          <span class="story-arrow">↗</span>
        </button>
      </section>

      <section class="review-layout">
        <aside class="review-sidebar">
          <div class="sidebar-heading">
            <p class="eyebrow">Review path</p>
            <p>Choose how far behind the curtain to look.</p>
          </div>
          <ReviewPath :active="activeView" @navigate="navigate" />
          <div class="protocol-note">
            <span>Protocol</span>
            Player and story ran in isolated GPT 5.6 Sol sessions with medium thinking.
          </div>
        </aside>

        <article class="content-panel">
          <template v-if="activeView === 'briefing'">
            <div class="panel-kicker">
              <span>Player view</span>
              <span class="safe-chip">No spoilers</span>
            </div>
            <h2>{{ selectedStory.title }}</h2>
            <p class="panel-subtitle">This is the complete context visible before the conversation starts.</p>

            <div class="briefing-paper markdown-body" v-html="markdown(selectedStory.briefing)" />

            <div class="blind-question">
              <span class="question-mark">?</span>
              <div>
                <strong>Pause here if you want the intended first impression.</strong>
                <p>What feels ordinary? What would you ask first? Where do you expect this to go?</p>
              </div>
            </div>

            <div class="blind-copy">
              <div>
                <span class="gate-label">Play it blind</span>
                <strong>Copy the prompt without seeing it</strong>
                <p>Paste it into a fresh ChatGPT or Claude conversation. This page stays spoiler-free.</p>
              </div>
              <button type="button" class="copy-button" @click="copyPromptUnseen">
                {{ copyStatus === 'copied' ? 'Copied unseen ✓' : copyStatus === 'error' ? 'Copy failed' : 'Copy hidden prompt' }}
              </button>
              <span class="copy-announcement" aria-live="polite">
                {{ copyStatus === 'copied' ? 'The hidden prompt was copied without being shown.' : '' }}
              </span>
            </div>

            <div class="spoiler-gates">
              <button type="button" class="spoiler-gate prompt-gate" @click="navigate('prompt')">
                <span class="gate-label">Hidden artifact</span>
                <strong>Reveal story prompt</strong>
                <span>See the character, truth, progression gates, and success condition.</span>
                <b>Unseal prompt →</b>
              </button>
              <button type="button" class="spoiler-gate run-gate" @click="navigate('runs')">
                <span class="gate-label">Observed evidence</span>
                <strong>Reveal playtest runs</strong>
                <span>Read the transcripts and compare automated evaluations.</span>
                <b>Open transcripts →</b>
              </button>
            </div>
          </template>

          <template v-else-if="activeView === 'prompt'">
            <div class="panel-kicker spoiler-kicker">
              <span>Hidden prompt</span>
              <button type="button" class="text-button" @click="navigate('briefing')">Return to player view</button>
            </div>
            <h2>{{ selectedStory.title }}</h2>
            <p class="panel-subtitle">The exact text copied unread into the story chatbot.</p>

            <div class="version-row">
              <div class="segmented" aria-label="Prompt version">
                <button
                  v-for="version in validVersions.slice().reverse()"
                  :key="version"
                  type="button"
                  :class="{ active: promptVersion === version }"
                  @click="promptVersion = version"
                >
                  {{ version === 'v2' ? 'Revised v2' : 'Initial v1' }}
                </button>
              </div>
              <span class="version-note">{{ promptVersion === 'v2' ? 'Current review prompt' : 'Original baseline prompt' }}</span>
            </div>

            <div v-if="promptVersion === 'v2'" class="change-callout">
              <span>What changed</span>
              <p>{{ selectedStory.changeNote }}</p>
            </div>

            <div class="prompt-document markdown-body" v-html="markdown(selectedStory.prompts[promptVersion], true)" />

            <div class="next-review">
              <div>
                <span>Next</span>
                <strong>Did the prompt produce the intended conversation?</strong>
              </div>
              <button type="button" class="primary-button" @click="navigate('runs')">Inspect playtests →</button>
            </div>
          </template>

          <template v-else>
            <div class="panel-kicker spoiler-kicker">
              <span>Playtest evidence</span>
              <button type="button" class="text-button" @click="navigate('briefing')">Return to player view</button>
            </div>
            <h2>{{ selectedStory.title }}</h2>
            <p class="panel-subtitle">Blind runs: the player controller knew the briefing, never the hidden prompt.</p>

            <div class="run-tabs" role="tablist" aria-label="Playtest run">
              <button
                v-for="run in runTabs"
                :key="run.id"
                type="button"
                role="tab"
                :aria-selected="activeRun === run.id"
                :class="{ active: activeRun === run.id }"
                @click="activeRun = run.id"
              >
                <strong>{{ run.label }}</strong>
                <small>{{ run.detail }}</small>
              </button>
            </div>

            <div class="run-summary">
              <div class="run-meta">
                <span>{{ transcript.messages.filter((message) => message.speaker === 'Player').length }} player turns</span>
                <span>{{ transcript.model }}</span>
                <span>{{ transcript.thinking }} thinking</span>
              </div>
              <p><strong>Stopped:</strong> {{ transcript.stopReason }}</p>
            </div>

            <div v-if="goalStatus(evaluation)" class="outcome-row">
              <div :class="['outcome-card', goalStatus(evaluation)!.surface ? 'pass' : 'miss']">
                <span>Surface task</span>
                <strong>{{ statusLabel(goalStatus(evaluation)!.surface) }}</strong>
              </div>
              <div :class="['outcome-card', goalStatus(evaluation)!.mystery ? 'pass' : 'miss']">
                <span>Hidden mystery</span>
                <strong>{{ statusLabel(goalStatus(evaluation)!.mystery) }}</strong>
              </div>
              <div class="outcome-card clean">
                <span>Context leaks</span>
                <strong>{{ evaluation.leaks.length === 0 ? 'None' : evaluation.leaks.length }}</strong>
              </div>
            </div>
            <div v-else class="legacy-outcome">
              <span>V1 evaluator</span>
              <strong>{{ evaluation.goal_completed ? 'Goal marked complete' : 'Goal marked incomplete' }}</strong>
              <p>The original judge did not yet separate the surface task from the hidden arc.</p>
            </div>

            <div class="score-strip" aria-label="Automated scores">
              <div v-for="(score, key) in evaluation.scores" :key="key" class="score-item">
                <span>{{ scoreLabels[key] ?? key }}</span>
                <strong>{{ score }}<small>/5</small></strong>
              </div>
            </div>

            <section class="transcript-section">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">Transcript</p>
                  <h3>{{ runTabs.find((run) => run.id === activeRun)?.label }} player</h3>
                </div>
                <span class="message-count">{{ transcript.messages.length }} messages</span>
              </div>

              <div class="conversation">
                <div
                  v-for="(message, index) in transcript.messages"
                  :key="`${activeRun}-${index}`"
                  class="message-row"
                  :class="{ player: message.speaker === 'Player' }"
                >
                  <span class="speaker">{{ message.speaker }}</span>
                  <div class="message-bubble markdown-body" v-html="markdown(message.text)" />
                </div>
              </div>
            </section>

            <section class="evaluation-section">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">Automated evaluation</p>
                  <h3>What landed—and what did not</h3>
                </div>
              </div>
              <div class="evaluation-columns">
                <div>
                  <h4>Successful beats</h4>
                  <ul class="evidence-list success-list">
                    <li v-for="beat in evaluation.successful_beats" :key="beat">{{ beat }}</li>
                  </ul>
                </div>
                <div>
                  <h4>Missed beats</h4>
                  <p v-if="evaluation.missed_beats.length === 0" class="empty-state">No missed beats reported.</p>
                  <ul v-else class="evidence-list missed-list">
                    <li v-for="beat in evaluation.missed_beats" :key="beat">{{ beat }}</li>
                  </ul>
                </div>
              </div>
              <div v-if="evaluation.recommendations.length" class="recommendations">
                <strong>Recommendations</strong>
                <span v-for="recommendation in evaluation.recommendations" :key="recommendation">
                  {{ recommendation }}
                </span>
              </div>
            </section>
          </template>
        </article>
      </section>
    </main>

    <footer>
      <span>Mystery Chat · prompt prototype review</span>
      <span>3 stories · 9 runs · 0 reported context leaks</span>
    </footer>
  </div>
</template>
