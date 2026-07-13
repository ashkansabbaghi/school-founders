<script setup lang="ts">
import type { School } from '#shared/types/financial'

const { t } = useI18n()

useHead({
  title: () => t('schools.pageTitle'),
})

const { schools, status, error, deleteSchool } = useSchools()

const showFormModal = ref(false)
const editingSchool = ref<School | null>(null)

function openAddModal() {
  editingSchool.value = null
  showFormModal.value = true
}

function openEditModal(school: School) {
  editingSchool.value = school
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingSchool.value = null
}

async function onDelete(id: string) {
  if (!confirm(t('schools.confirmDelete'))) {
    return
  }

  try {
    await deleteSchool(id)
  }
  catch {
    // Error message handled by composable
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
    <header class="ui-page-header">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="ui-page-title">
            {{ $t('schools.pageTitle') }}
          </h1>
          <p class="ui-page-subtitle">
            {{ $t('schools.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="ui-page-add-btn"
          :aria-label="$t('schools.addButtonLabel')"
          @click="openAddModal"
        >
          +
        </button>
      </div>
    </header>

    <div
      v-if="error"
      class="ui-alert-error"
      role="alert"
    >
      {{ error }}
    </div>

    <SchoolList
      :schools="schools ?? []"
      :pending="status === 'loading' && !schools?.length"
      @edit="openEditModal"
      @delete="onDelete"
    />

    <SchoolFormModal
      v-if="showFormModal"
      :school="editingSchool"
      @close="closeFormModal"
    />
  </main>
</template>
