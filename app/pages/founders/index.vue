<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('founders.pageTitle'),
})

const { founders, status, createFounder, deleteFounder } = useFounders()

const name = ref('')
const school = ref('')

async function onSubmit() {
  if (!name.value.trim()) {
    return
  }

  await createFounder({
    name: name.value,
    school: school.value || undefined,
  })

  name.value = ''
  school.value = ''
}

async function onDelete(id: string) {
  await deleteFounder(id)
}
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-8 p-6">
    <header class="ui-page-header">
      <h1 class="ui-page-title">
        {{ $t('founders.pageTitle') }}
      </h1>
      <p class="ui-page-subtitle">
        {{ $t('founders.subtitle') }}
      </p>
    </header>

    <section class="ui-card p-6">
      <form
        class="grid gap-4 sm:grid-cols-2"
        @submit.prevent="onSubmit"
      >
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('home.name') }}</span>
          <input
            v-model="name"
            type="text"
            required
            class="ui-input"
          >
        </label>
        <label class="block space-y-1">
          <span class="ui-label">{{ $t('home.school') }}</span>
          <input
            v-model="school"
            type="text"
            class="ui-input"
          >
        </label>
        <div class="sm:col-span-2">
          <button
            type="submit"
            class="ui-btn-primary"
          >
            {{ $t('home.addFounder') }}
          </button>
        </div>
      </form>
    </section>

    <FounderList
      :founders="founders ?? []"
      :pending="status === 'pending' && !founders?.length"
      @delete="onDelete"
    />
  </main>
</template>
