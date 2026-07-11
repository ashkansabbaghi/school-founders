<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('founders.pageTitle'),
})

const { founders, status, deleteFounder } = useFounders()

const showAddModal = ref(false)

async function onDelete(id: string) {
  await deleteFounder(id)
}
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="ui-page-title">
            {{ $t('founders.pageTitle') }}
          </h1>
          <p class="ui-page-subtitle">
            {{ $t('founders.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="ui-page-add-btn"
          :aria-label="$t('founders.addButtonLabel')"
          @click="showAddModal = true"
        >
          +
        </button>
      </div>
    </header>

    <FounderList
      :founders="founders ?? []"
      :pending="status === 'loading' && !founders?.length"
      @delete="onDelete"
    />

    <FounderAddModal
      v-if="showAddModal"
      @close="showAddModal = false"
    />
  </main>
</template>
