<script setup lang="ts">
import type { AppNavItem } from '~/composables/useAppNav'

const props = defineProps<{
  open: boolean
  items: AppNavItem[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { isActive } = useAppNav()
const route = useRoute()

const icons: Record<string, string> = {
  employees: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  schools: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  founders: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
}

function close() {
  emit('update:open', false)
}

watch(() => route.path, close)

watch(() => props.open, (isOpen) => {
  if (import.meta.client) {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[55] md:hidden"
        @keydown.escape="close"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
          :aria-label="$t('nav.closeDrawer')"
          @click="close"
        />

        <Transition
          enter-active-class="transition-transform duration-200 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition-transform duration-150 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="open"
            id="app-more-drawer"
            role="dialog"
            aria-modal="true"
            :aria-label="$t('nav.drawerTitle')"
            class="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            style="padding-bottom: env(safe-area-inset-bottom)"
          >
            <div class="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800/80">
              <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {{ $t('nav.drawerTitle') }}
              </h2>
              <button
                type="button"
                class="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                :aria-label="$t('nav.closeDrawer')"
                @click="close"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav class="p-2" :aria-label="$t('nav.drawerAriaLabel')">
              <NuxtLink
                v-for="item in items"
                :key="item.key"
                :to="item.to"
                class="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                :class="isActive(item.to, item.key)
                  ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                  : 'text-zinc-700 active:bg-zinc-100 dark:text-zinc-300 dark:active:bg-zinc-800/60'"
                :aria-current="isActive(item.to, item.key) ? 'page' : undefined"
                @click="close"
              >
                <svg
                  class="h-6 w-6 shrink-0"
                  :class="isActive(item.to, item.key) ? 'stroke-[2.25]' : 'stroke-[1.75]'"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" :d="icons[item.key]" />
                </svg>
                <span
                  class="text-sm font-medium"
                  :class="isActive(item.to, item.key) ? 'text-violet-700 dark:text-violet-200' : 'text-zinc-900 dark:text-zinc-200'"
                >
                  {{ item.label }}
                </span>
              </NuxtLink>
            </nav>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
