<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { FixedCost } from '#shared/types/financial'

const { t } = useI18n()
const financeStore = useFinanceStore()
const { schools } = storeToRefs(financeStore)
const { fixedCosts, status, error, deleteFixedCost } = useFixedCosts()

const showFormModal = ref(false)
const editingCost = ref<FixedCost | null>(null)

function openAddModal() {
  editingCost.value = null
  showFormModal.value = true
}

function openEditModal(cost: FixedCost) {
  editingCost.value = cost
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingCost.value = null
}

async function onDelete(id: string) {
  if (!confirm(t('fixedCosts.confirmDelete'))) {
    return
  }

  try {
    await deleteFixedCost(id)
  }
  catch {
    // Error message handled by composable
  }
}
</script>

<template>
  <section class="ui-card overflow-hidden">
    <header class="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
      <div>
        <h2 class="text-lg font-semibold text-zinc-100">
          {{ $t('fixedCosts.title') }}
        </h2>
        <p class="mt-1 text-sm text-zinc-400">
          {{ $t('fixedCosts.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="ui-page-add-btn"
        :aria-label="$t('fixedCosts.addButtonLabel')"
        @click="openAddModal"
      >
        +
      </button>
    </header>

    <div class="p-4 sm:p-6">
      <div
        v-if="error"
        class="ui-alert-error mb-4"
        role="alert"
      >
        {{ error }}
      </div>

      <FixedCostList
        :fixed-costs="fixedCosts ?? []"
        :schools="schools"
        :pending="status === 'loading' && !fixedCosts?.length"
        @edit="openEditModal"
        @delete="onDelete"
      />
    </div>

    <FixedCostFormModal
      v-if="showFormModal"
      :fixed-cost="editingCost"
      @close="closeFormModal"
    />
  </section>
</template>
