<script setup lang="ts">
const { drawerItems, isActive, isDrawerActive } = useAppNav()
const route = useRoute()

const menuId = 'app-nav-more-menu'
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const moreActive = computed(() => isDrawerActive() || open.value)

function close() {
  open.value = false
}

function openMenu() {
  open.value = true
}

function toggle() {
  if (open.value) {
    close()
  } else {
    openMenu()
  }
}

function menuItems() {
  return menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
}

function focusMenuItem(index: number) {
  const items = menuItems()
  if (!items.length) return
  const clamped = ((index % items.length) + items.length) % items.length
  items[clamped]?.focus()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
    if (open.value) {
      nextTick(() => focusMenuItem(0))
    }
    return
  }

  if (event.key === 'ArrowDown' && !open.value) {
    event.preventDefault()
    openMenu()
    nextTick(() => focusMenuItem(0))
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  const items = menuItems()
  if (!items.length) return

  const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      close()
      triggerRef.value?.focus()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusMenuItem(currentIndex + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusMenuItem(currentIndex - 1)
      break
    case 'Home':
      event.preventDefault()
      focusMenuItem(0)
      break
    case 'End':
      event.preventDefault()
      focusMenuItem(items.length - 1)
      break
    case 'Tab':
      close()
      break
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return
  const target = event.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    close()
  }
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (open.value && event.key === 'Escape') {
    event.preventDefault()
    close()
    triggerRef.value?.focus()
  }
}

function onItemClick() {
  close()
}

watch(() => route.path, close)

watch(open, (isOpen) => {
  if (!import.meta.client) return

  if (isOpen) {
    nextTick(() => focusMenuItem(0))
    document.addEventListener('pointerdown', onDocumentPointerDown)
    document.addEventListener('keydown', onDocumentKeydown)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    document.removeEventListener('keydown', onDocumentKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    document.removeEventListener('keydown', onDocumentKeydown)
  }
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
      :class="moreActive
        ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30'
        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-controls="menuId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      {{ $t('nav.more') }}
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="open"
        :id="menuId"
        ref="menuRef"
        role="menu"
        :aria-label="$t('nav.drawerAriaLabel')"
        class="absolute top-full z-50 mt-1 min-w-48 rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-lg end-0"
        @keydown="onMenuKeydown"
      >
        <NuxtLink
          v-for="item in drawerItems"
          :key="item.key"
          :to="item.to"
          role="menuitem"
          tabindex="-1"
          class="block rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-inset"
          :class="isActive(item.to, item.key)
            ? 'bg-violet-500/15 text-violet-300'
            : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'"
          :aria-current="isActive(item.to, item.key) ? 'page' : undefined"
          @click="onItemClick"
        >
          {{ item.label }}
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
