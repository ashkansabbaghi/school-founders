<script setup lang="ts">
import { storeToRefs } from 'pinia'

type FinanceTab = 'report' | 'fixedCosts' | 'studentPayments' | 'employeeExpenses'

const VALID_TABS: FinanceTab[] = ['report', 'fixedCosts', 'studentPayments', 'employeeExpenses']

const route = useRoute()
const financeStore = useFinanceStore()
const { error, submitMessage } = storeToRefs(financeStore)

const activeTab = ref<FinanceTab>('report')

const tabActiveClass = 'bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/30 dark:text-violet-300'
const tabInactiveClass = 'text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200'

const isFormTab = computed(() =>
  activeTab.value === 'studentPayments' || activeTab.value === 'employeeExpenses',
)

function parseTabFromQuery(tab: unknown): FinanceTab | null {
  if (typeof tab === 'string' && VALID_TABS.includes(tab as FinanceTab)) {
    return tab as FinanceTab
  }
  return null
}

function syncTabFromRoute() {
  const fromQuery = parseTabFromQuery(route.query.tab)
  if (fromQuery) {
    activeTab.value = fromQuery
  }
}

function selectTab(tab: FinanceTab) {
  activeTab.value = tab
  financeStore.clearSubmitFeedback()
}

onMounted(syncTabFromRoute)

watch(() => route.query.tab, syncTabFromRoute)
</script>

<template>
  <section class="ui-card overflow-hidden">
    <div class="ui-card-header">
      <div
        role="tablist"
        :aria-label="$t('finance.tabListAriaLabel')"
        class="ui-tab-list"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'report'"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4"
          :class="activeTab === 'report' ? tabActiveClass : tabInactiveClass"
          @click="selectTab('report')"
        >
          {{ $t('finance.tabs.report') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'fixedCosts'"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4"
          :class="activeTab === 'fixedCosts' ? tabActiveClass : tabInactiveClass"
          @click="selectTab('fixedCosts')"
        >
          {{ $t('finance.tabs.fixedCosts') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'studentPayments'"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4"
          :class="activeTab === 'studentPayments' ? tabActiveClass : tabInactiveClass"
          @click="selectTab('studentPayments')"
        >
          {{ $t('finance.tabs.studentPayments') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'employeeExpenses'"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 sm:px-4"
          :class="activeTab === 'employeeExpenses' ? tabActiveClass : tabInactiveClass"
          @click="selectTab('employeeExpenses')"
        >
          {{ $t('finance.tabs.employeeExpenses') }}
        </button>
      </div>
    </div>

    <div
      v-show="activeTab === 'report'"
      role="tabpanel"
    >
      <FoundersReportTable embedded />
    </div>

    <div
      v-show="activeTab === 'fixedCosts'"
      role="tabpanel"
    >
      <FixedCostsPanel embedded />
    </div>

    <div
      v-show="activeTab === 'studentPayments'"
      role="tabpanel"
      class="p-4 sm:p-6"
    >
      <div
        v-if="isFormTab && submitMessage"
        class="ui-alert-success mb-4"
        role="status"
      >
        {{ submitMessage }}
      </div>
      <div
        v-if="isFormTab && error"
        class="ui-alert-error mb-4"
        role="alert"
      >
        {{ error }}
      </div>

      <StudentPaymentForm />
    </div>

    <div
      v-show="activeTab === 'employeeExpenses'"
      role="tabpanel"
      class="p-4 sm:p-6"
    >
      <div
        v-if="isFormTab && submitMessage"
        class="ui-alert-success mb-4"
        role="status"
      >
        {{ submitMessage }}
      </div>
      <div
        v-if="isFormTab && error"
        class="ui-alert-error mb-4"
        role="alert"
      >
        {{ error }}
      </div>

      <EmployeeExpenseForm />
    </div>
  </section>
</template>
