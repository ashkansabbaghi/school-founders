<script setup lang="ts">
const { items, isActive } = useAppNav()

const icons: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  founders: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  finance: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  students: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  employees: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
}
</script>

<template>
  <nav
    class="app-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md md:hidden"
    :aria-label="$t('nav.ariaLabel')"
  >
    <div class="mx-auto flex max-w-lg items-stretch justify-around px-1">
      <NuxtLink
        v-for="item in items"
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
          class="w-full truncate text-center text-[10px] leading-tight"
          :class="isActive(item.to, item.key) ? 'font-semibold text-violet-200' : 'font-medium'"
        >
          {{ item.shortLabel }}
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>
