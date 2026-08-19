<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { marked } from 'marked'
import { stories, type Story, type StorySlug } from './data'

type CopyState = 'idle' | 'copied' | 'error'

const initialSlug = window.location.hash.slice(1) as StorySlug
const selectedSlug = ref<StorySlug>(
  stories.some((story) => story.slug === initialSlug) ? initialSlug : stories[0].slug,
)
const copyState = ref<CopyState>('idle')
const debug = new URLSearchParams(window.location.search).get('debug') === 'true'
let resetTimer: number | undefined

const selectedStory = computed(() => stories.find((story) => story.slug === selectedSlug.value)!)
const briefingHtml = computed(() => marked.parse(selectedStory.value.briefing, { async: false }) as string)

function chooseStory(story: Story, shouldScroll = true) {
  selectedSlug.value = story.slug
  copyState.value = 'idle'
  history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${story.slug}`)
  if (shouldScroll) {
    requestAnimationFrame(() => {
      document.querySelector('#story')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

async function copyPrompt() {
  const prompt = selectedStory.value.prompt
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      textarea.setAttribute('readonly', '')
      textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      if (!copied) throw new Error('Copy failed')
    }
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }

  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => (copyState.value = 'idle'), 3500)
}

function handleHashChange() {
  const slug = window.location.hash.slice(1) as StorySlug
  const story = stories.find((item) => item.slug === slug)
  if (story) chooseStory(story, false)
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange)
  if (!window.location.hash) chooseStory(stories[0], false)
})

onBeforeUnmount(() => {
  window.clearTimeout(resetTimer)
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <a class="wordmark" href="#top" aria-label="Mystery Chat home">
        <span class="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>Mystery Chat</span>
      </a>
      <a class="header-link" href="#choose">Choose a story <span>↓</span></a>
    </header>

    <main id="top">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Three conversations · three hidden truths</p>
          <h1>Something is being<br /><em>left unsaid.</em></h1>
          <p class="hero-intro">
            Choose a situation. Copy its unseen prompt into a fresh AI chat. Then ask the
            right questions to discover what is really going on.
          </p>
          <a class="start-link" href="#choose">Choose your conversation <span>↓</span></a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="orbit orbit-one" />
          <div class="orbit orbit-two" />
          <div class="message-card message-one"><span>Everything seems normal.</span><b>For now.</b></div>
          <div class="message-card message-two"><span>What would you</span><b>ask next?</b></div>
          <div class="message-card message-three"><i /><i /><i /></div>
          <div class="signal-star">✦</div>
        </div>
      </section>

      <section class="how-to" aria-labelledby="how-title">
        <div class="section-label">
          <span>How to play</span>
          <b>About 5 minutes</b>
        </div>
        <div class="steps">
          <div class="step">
            <span>1</span>
            <div><strong>Choose a story</strong><p>Read the short, spoiler-free briefing.</p></div>
          </div>
          <div class="step">
            <span>2</span>
            <div><strong>Copy the hidden prompt</strong><p>Paste it into a brand-new AI chat without reading it.</p></div>
          </div>
          <div class="step">
            <span>3</span>
            <div><strong>Stay curious</strong><p>Play your role, follow odd details, and uncover the whole story.</p></div>
          </div>
        </div>
        <div class="setup-note">
          <div class="model-icon" aria-hidden="true">✦</div>
          <div>
            <span>Recommended setup</span>
            <p>Use <strong>GPT 5.6 Sol</strong>, <strong>Claude Sonnet 5</strong>, or <strong>Gemini 3.7 Flash</strong>.</p>
          </div>
          <div class="thinking-chip"><small>Thinking level</small><strong>Medium</strong></div>
        </div>
      </section>

      <section id="choose" class="chooser" aria-labelledby="choose-title">
        <div class="chooser-heading">
          <div>
            <p class="eyebrow">Begin a conversation</p>
            <h2 id="choose-title">Which thread will you pull?</h2>
          </div>
          <p>Each story begins in an ordinary place. None of them stays there.</p>
        </div>

        <div class="story-cards">
          <button
            v-for="story in stories"
            :key="story.slug"
            type="button"
            class="story-card"
            :class="[story.accent, { selected: selectedSlug === story.slug }]"
            :aria-pressed="selectedSlug === story.slug"
            @click="chooseStory(story)"
          >
            <span class="card-top"><b>{{ story.number }}</b><i>Play story ↗</i></span>
            <span class="card-symbol" aria-hidden="true">
              <svg v-if="story.slug === 'absentminded-neighbor'" viewBox="0 0 160 90">
                <path d="M5 68 Q34 55 61 68 T116 68 T169 68" />
                <path d="M24 64l9-27h42l13 27M37 37l17-18 18 18M54 19v45M103 52h43M114 52l12-15 11 15" />
                <circle cx="125" cy="23" r="10" />
              </svg>
              <svg v-else-if="story.slug === 'job-applicant'" viewBox="0 0 160 90">
                <rect x="29" y="10" width="102" height="68" rx="3" />
                <circle cx="80" cy="34" r="10" />
                <path d="M61 64c2-13 10-19 19-19s17 6 19 19M42 19h12M106 19h12M42 69h12M106 69h12" />
              </svg>
              <svg v-else viewBox="0 0 160 90">
                <rect x="24" y="12" width="112" height="66" rx="4" />
                <path d="M24 27h112M34 20h1M42 20h1M50 20h1M36 47h25l8-10 12 25 9-15h34" />
                <circle cx="123" cy="47" r="4" />
              </svg>
            </span>
            <span class="card-label">{{ story.label }}</span>
            <strong class="card-title">{{ story.title }}</strong>
            <span class="card-hook">{{ story.hook }}</span>
          </button>
        </div>
      </section>

      <section id="story" class="story-detail" :class="selectedStory.accent" aria-live="polite">
        <div class="detail-heading">
          <div>
            <p class="eyebrow">Story {{ selectedStory.number }} · Your briefing</p>
            <h2>{{ selectedStory.title }}</h2>
          </div>
          <span class="role-chip">You’ll chat with <strong>{{ selectedStory.roleLabel }}</strong></span>
        </div>

        <div class="detail-grid">
          <div class="briefing-panel">
            <span class="paper-label">What you know</span>
            <div class="briefing-copy" v-html="briefingHtml" />
          </div>

          <aside class="play-panel">
            <div class="play-heading">
              <span>Before you begin</span>
              <strong>Play this story well</strong>
            </div>
            <ol class="story-tips">
              <li v-for="instruction in selectedStory.instructions" :key="instruction">
                <span>→</span><p>{{ instruction }}</p>
              </li>
            </ol>
            <div class="mini-setup">
              <span>AI setup</span>
              <p>Fresh chat · Recommended model · Medium thinking</p>
            </div>
            <button type="button" class="copy-button" :class="copyState" @click="copyPrompt">
              <span aria-hidden="true">{{ copyState === 'copied' ? '✓' : '⧉' }}</span>
              {{ copyState === 'copied' ? 'Prompt copied — go paste it' : copyState === 'error' ? 'Could not copy — try again' : 'Copy hidden prompt' }}
            </button>
            <p class="copy-note">The prompt stays hidden so you can play without spoilers.</p>
          </aside>
        </div>

        <div v-if="debug" class="debug-panel">
          <strong>Debug</strong>
          <span>{{ selectedStory.slug }}</span>
          <span>{{ selectedStory.prompt.length.toLocaleString() }} prompt characters</span>
        </div>
      </section>

      <section class="final-callout">
        <span class="final-mark" aria-hidden="true">?</span>
        <div><p class="eyebrow">One last rule</p><h2>Don’t rush the strange parts.</h2></div>
        <p>The most useful question is rarely “What is the secret?” Ask for specifics. Test the answer. Then ask what changed.</p>
      </section>
    </main>

    <footer>
      <a class="wordmark" href="#top"><span class="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Mystery Chat</span></a>
      <span>Three tiny mysteries for your favorite chatbot.</span>
    </footer>
  </div>
</template>
