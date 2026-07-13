<script setup lang="ts">
const { primaryItems, drawerItems, isActive, isDrawerActive } = useAppNav()

const drawerOpen = ref(false)

const icons: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  finance: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  students: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  more: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
}

const moreActive = computed(() => isDrawerActive() || drawerOpen.value)

function openDrawer() {
  drawerOpen.value = true
}
</script>

<template>
  <nav
    class="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md md:hidden"
    :aria-label="$t('nav.ariaLabel')"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around px-1">
      <NuxtLink
        v-for="item in primaryItems"
        :key="item.key"
        :to="item.to"
        class="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50"
        :class="isActive(item.to, item.key)
          ? 'bg-violet-500/15 text-violet-300'
          : 'text-zinc-500 active:bg-zinc-800/40 active:text-zinc-300'"
        :aria-current="isActive(item.to, item.key) ? 'page' : undefined"
      >
        <span
          class="absolute inset-x-2 top-0 h-0.5 rounded-full transition-opacity duration-200"
          :class="isActive(item.to, item.key)
            ? 'bg-violet-400 opacity-100'
            : 'opacity-0'"
          aria-hidden="true"
        />
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
          class="w-full truncate text-center text-[11px] leading-tight"
          :class="isActive(item.to, item.key) ? 'font-semibold text-violet-200' : 'font-medium'"
        >
          {{ item.shortLabel }}
        </span>
      </NuxtLink>

      <button
        type="button"
        class="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50"
        :class="moreActive
          ? 'bg-violet-500/15 text-violet-300'
          : 'text-zinc-500 active:bg-zinc-800/40 active:text-zinc-300'"
        :aria-expanded="drawerOpen"
        :aria-controls="'app-more-drawer'"
        @click="openDrawer"
      >
        <span
          class="absolute inset-x-2 top-0 h-0.5 rounded-full transition-opacity duration-200"
          :class="moreActive
            ? 'bg-violet-400 opacity-100'
            : 'opacity-0'"
          aria-hidden="true"
        />
        <svg
          class="h-6 w-6 shrink-0"
          :class="moreActive ? 'stroke-[2.25]' : 'stroke-[1.75]'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" :d="icons.more" />
        </svg>
        <span
          class="w-full truncate text-center text-[11px] leading-tight"
          :class="moreActive ? 'font-semibold text-violet-200' : 'font-medium'"
        >
          {{ $t('nav.moreShort') }}
        </span>
      </button>
    </div>
  </nav>

  <AppMoreDrawer
    id="app-more-drawer"
    v-model:open="drawerOpen"
    :items="drawerItems"
  />
</template>
