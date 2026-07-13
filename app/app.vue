<script setup lang="ts">
const { locale, localeProperties } = useI18n()
const localePath = useLocalePath()
const financeStore = useFinanceStore()

const showOnboarding = computed(() => financeStore.onboardingComplete === false)

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => localeProperties.value.dir ?? 'ltr',
    class: 'dark',
  },
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <NuxtPwaManifest />
    <header class="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4">
        <div class="flex items-center justify-between gap-3 md:justify-start">
          <div class="flex min-w-0 items-center gap-4 md:gap-6">
            <NuxtLink
              :to="localePath('/')"
              class="shrink-0 text-lg font-semibold tracking-tight text-zinc-100 transition-colors duration-200 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
            >
              School Fanders
            </NuxtLink>
            <AppNav />
          </div>
          <div class="flex shrink-0 items-center gap-2 md:hidden">
            <OfflineIndicator />
            <LocaleSwitcher />
          </div>
        </div>
        <div class="flex items-center gap-2 md:shrink-0 md:gap-3">
          <ContextBar class="min-w-0 flex-1 md:flex-none" />
          <div class="hidden items-center gap-2 md:flex md:gap-3">
            <OfflineIndicator />
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </header>
    <NuxtRouteAnnouncer />
    <div class="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <NuxtPage />
    </div>
    <AppBottomNav />
    <PwaUpdatePrompt />
    <LazyOnboardingWizard v-if="showOnboarding" />
  </div>
</template>
