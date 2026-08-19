<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import rough from 'roughjs'

const props = defineProps<{
  active: 'briefing' | 'prompt' | 'runs'
}>()

const emit = defineEmits<{
  navigate: [view: 'briefing' | 'prompt' | 'runs']
}>()

const container = ref<HTMLElement | null>(null)
const drawing = ref<SVGSVGElement | null>(null)
let observer: ResizeObserver | null = null

const steps = [
  { id: 'briefing' as const, number: '1', label: 'Player briefing', detail: 'Start unspoiled' },
  { id: 'prompt' as const, number: '2', label: 'Hidden prompt', detail: 'Reveal the machinery' },
  { id: 'runs' as const, number: '3', label: 'Playtest evidence', detail: 'Inspect what happened' },
]

function redraw() {
  const host = container.value
  const svg = drawing.value
  if (!host || !svg) return

  const hostRect = host.getBoundingClientRect()
  const nodes = Array.from(host.querySelectorAll<HTMLElement>('[data-path-node]'))
  svg.replaceChildren()
  svg.setAttribute('viewBox', `0 0 ${hostRect.width} ${hostRect.height}`)

  const rc = rough.svg(svg)
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const from = nodes[index].getBoundingClientRect()
    const to = nodes[index + 1].getBoundingClientRect()
    const x = from.left - hostRect.left + 17
    const y1 = from.top - hostRect.top + from.height - 2
    const y2 = to.top - hostRect.top + 2
    svg.appendChild(
      rc.line(x, y1, x, y2, {
        seed: 41 + index,
        stroke: '#c8755b',
        strokeWidth: 1.7,
        roughness: 1.25,
      }),
    )
  }

  const activeIndex = steps.findIndex((step) => step.id === props.active)
  const activeNode = nodes[activeIndex]
  if (activeNode) {
    const rect = activeNode.getBoundingClientRect()
    svg.appendChild(
      rc.rectangle(
        rect.left - hostRect.left - 5,
        rect.top - hostRect.top - 4,
        rect.width + 10,
        rect.height + 8,
        {
          seed: 73 + activeIndex,
          stroke: '#1e6f66',
          strokeWidth: 1.8,
          roughness: 1.45,
          bowing: 0.8,
        },
      ),
    )
  }
}

watch(
  () => props.active,
  () => nextTick(redraw),
)

onMounted(() => {
  observer = new ResizeObserver(redraw)
  if (container.value) observer.observe(container.value)
  nextTick(redraw)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav ref="container" class="review-path" aria-label="Review path">
    <svg ref="drawing" class="path-drawing" aria-hidden="true" />
    <button
      v-for="step in steps"
      :key="step.id"
      data-path-node
      class="path-step"
      :class="{ active: active === step.id }"
      type="button"
      @click="emit('navigate', step.id)"
    >
      <span class="step-number">{{ step.number }}</span>
      <span>
        <strong>{{ step.label }}</strong>
        <small>{{ step.detail }}</small>
      </span>
      <span v-if="step.id !== 'briefing' && active === 'briefing'" class="lock" aria-label="Hidden">×</span>
    </button>
  </nav>
</template>
