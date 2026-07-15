<script setup lang="ts">
import { APP_VERSION, getReleaseNoteItems } from '~/config/releases'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t, locale } = useI18n()

const releaseItems = computed(() => getReleaseNoteItems(locale.value))

const dialogLabel = computed(() =>
  t('whatsNew.title', { version: APP_VERSION }),
)

function acknowledge() {
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    acknowledge()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
    }
    else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    v-if="open"
    class="ui-modal-overlay z-[70]"
    role="presentation"
    @click.self="acknowledge"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="dialogLabel"
      class="ui-modal-panel max-w-lg sm:my-8"
    >
      <header class="ui-modal-header">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide text-violet-500 dark:text-violet-400">
            {{ t('whatsNew.badge', { version: APP_VERSION }) }}
          </p>
          <h2 class="mt-1 text-lg font-semibold">
            {{ dialogLabel }}
          </h2>
        </div>
        <button
          type="button"
          class="ui-modal-close"
          :aria-label="t('whatsNew.close')"
          @click="acknowledge"
        >
          ✕
        </button>
      </header>

      <div class="scrollbar-thin px-4 py-5 sm:max-h-[calc(100vh-12rem)] sm:overflow-y-auto sm:px-6">
        <ul class="space-y-3">
          <li
            v-for="(item, index) in releaseItems"
            :key="index"
            class="flex gap-3 text-sm ui-text-secondary"
          >
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-600 dark:text-violet-300"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>

      <footer class="ui-card-footer flex justify-end px-4 py-4 sm:px-6">
        <button
          type="button"
          class="ui-btn-primary min-w-[8rem]"
          @click="acknowledge"
        >
          {{ t('whatsNew.acknowledge') }}
        </button>
      </footer>
    </div>
  </div>
</template>
