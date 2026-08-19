<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import { stories, type StorySlug } from './data'

type CopyState = 'idle' | 'copied' | 'error'

function storySlugFromPath(): StorySlug | null {
  const finalSegment = window.location.pathname.split('/').filter(Boolean).at(-1)
  return stories.some((story) => story.slug === finalSegment)
    ? (finalSegment as StorySlug)
    : null
}

function rootPath(): string {
  const slug = storySlugFromPath()
  if (slug) return window.location.pathname.slice(0, -slug.length)
  return window.location.pathname.endsWith('/')
    ? window.location.pathname
    : `${window.location.pathname}/`
}

const activeSlug = ref<StorySlug | null>(storySlugFromPath())
const copyState = ref<CopyState>('idle')
const debug = new URLSearchParams(window.location.search).get('debug') === 'true'
let resetTimer: number | undefined

const activeStory = computed(() => stories.find((story) => story.slug === activeSlug.value) ?? null)
const briefingHtml = computed(() =>
  activeStory.value ? (marked.parse(activeStory.value.briefing, { async: false }) as string) : '',
)

function storyHref(slug: StorySlug): string {
  return `${rootPath()}${slug}${window.location.search}`
}

function homeHref(): string {
  return `${rootPath()}${window.location.search}`
}

function navigate(event: MouseEvent, slug: StorySlug | null) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const url = slug ? storyHref(slug) : homeHref()
  window.history.pushState(null, '', url)
  activeSlug.value = slug
  copyState.value = 'idle'
  window.scrollTo({ top: 0, behavior: 'instant' })
}

async function copyPrompt() {
  if (!activeStory.value) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(activeStory.value.prompt)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = activeStory.value.prompt
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

function syncRoute() {
  activeSlug.value = storySlugFromPath()
  copyState.value = 'idle'
}

watch(activeStory, (story) => {
  document.title = story ? `${story.title} — Mystery Chat` : 'Mystery Chat'
}, { immediate: true })

onMounted(() => window.addEventListener('popstate', syncRoute))
onBeforeUnmount(() => {
  window.clearTimeout(resetTimer)
  window.removeEventListener('popstate', syncRoute)
})
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" :href="homeHref()" @click="navigate($event, null)">Mystery Chat</a>
      <a
        v-if="activeStory"
        class="quiet-link"
        :href="homeHref()"
        @click="navigate($event, null)"
      >All conversations</a>
    </header>

    <main v-if="!activeStory" class="entry-page">
      <section class="entry-intro">
        <p class="kicker">A conversation game</p>
        <h1>Mystery<br />Chat</h1>
        <p>Choose a conversation.</p>
      </section>

      <nav class="conversation-list" aria-label="Conversations">
        <a
          v-for="story in stories"
          :key="story.slug"
          class="conversation-link"
          :href="storyHref(story.slug)"
          @click="navigate($event, story.slug)"
        >
          <span class="conversation-number">{{ story.number }}</span>
          <span class="conversation-text">
            <small>{{ story.label }}</small>
            <strong>{{ story.title }}</strong>
            <span>{{ story.hook }}</span>
          </span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>
      </nav>
    </main>

    <main v-else class="story-page">
      <section class="story-lead">
        <div class="story-heading">
          <p class="kicker">Conversation {{ activeStory.number }}</p>
          <h1>{{ activeStory.title }}</h1>
          <p class="role">You are talking with {{ activeStory.roleLabel }}.</p>
        </div>
        <img
          class="portrait"
          :src="`${rootPath()}portraits/${activeStory.image}`"
          :alt="`Portrait of ${activeStory.roleLabel}`"
          width="900"
          height="900"
        />
      </section>

      <section class="briefing" aria-labelledby="briefing-title">
        <h2 id="briefing-title">Before you begin</h2>
        <div class="briefing-copy" v-html="briefingHtml" />
      </section>

      <section class="start-panel" aria-labelledby="start-title">
        <div>
          <p class="kicker">Start the conversation</p>
          <h2 id="start-title">Open a new chat.</h2>
          <ol class="chat-steps">
            <li>Copy the conversation prompt.</li>
            <li>Paste it into a new ChatGPT, Claude, or Gemini chat and send it.</li>
            <li>Reply naturally and keep the conversation going.</li>
          </ol>
        </div>
        <button type="button" class="copy-button" :class="copyState" @click="copyPrompt">
          {{ copyState === 'copied'
            ? 'Copied — go paste it'
            : copyState === 'error'
              ? 'Could not copy — try again'
              : 'Copy conversation prompt' }}
        </button>
      </section>

      <div v-if="debug" class="debug-panel">
        <strong>Debug</strong>
        <span>{{ activeStory.slug }}</span>
        <span>{{ activeStory.prompt.length.toLocaleString() }} characters</span>
      </div>
    </main>

    <footer>
      <span>Mystery Chat</span>
    </footer>
  </div>
</template>
