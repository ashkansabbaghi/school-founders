import { describe, expect, it, beforeEach } from 'vitest'
import { META_KEYS } from '#shared/types/meta'
import {
  completeOnboarding,
  dismissGettingStartedChecklist,
  ensureInitialized,
  getGettingStartedProgress,
  isOnboardingComplete,
  loadProfileSettings,
  shouldShowGettingStartedChecklist,
} from '~/db/bootstrap'
import { db } from '~/db/database'
import { getMetaValue, setMetaValue } from '~/db/repositories/meta'
import { resetTestDatabase } from '../helpers/db'

describe('bootstrap onboarding', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates install profile without seeding data on first run', async () => {
    await ensureInitialized()

    expect(await isOnboardingComplete()).toBe(false)

    const founders = await db.founders.toArray()
    const schools = await db.schools.toArray()

    expect(founders).toHaveLength(0)
    expect(schools).toHaveLength(0)

    const installId = await getMetaValue(META_KEYS.installId)
    expect(installId).toBeTruthy()
  })

  it('completes onboarding with empty data and shows getting started checklist', async () => {
    await ensureInitialized()

    await completeOnboarding({
      userName: 'Empty Operator',
      termYear: '1403-1404',
    })

    expect(await isOnboardingComplete()).toBe(true)
    expect(await shouldShowGettingStartedChecklist()).toBe(true)

    const founders = await db.founders.toArray()
    expect(founders).toHaveLength(0)

    const profile = await loadProfileSettings()
    expect(profile.userName).toBe('Empty Operator')
    expect(profile.termYear).toBe('1403-1404')
  })

  it('accepts legacy operatorName option for backward compatibility', async () => {
    await ensureInitialized()

    const profile = await completeOnboarding({
      operatorName: 'Legacy Operator',
      termYear: '1404-1405',
    })

    expect(profile.userName).toBe('Legacy Operator')
  })

  it('dismisses getting started checklist via meta flag', async () => {
    await ensureInitialized()
    await completeOnboarding({
      userName: 'Empty Operator',
      termYear: '1403-1404',
    })

    expect(await shouldShowGettingStartedChecklist()).toBe(true)
    await dismissGettingStartedChecklist()
    expect(await shouldShowGettingStartedChecklist()).toBe(false)
  })
})

describe('getGettingStartedProgress', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('reports zero progress on empty start', async () => {
    await ensureInitialized()
    await completeOnboarding({
      userName: 'Empty Operator',
      termYear: '1403-1404',
    })

    await expect(getGettingStartedProgress()).resolves.toEqual({
      school: false,
      student: false,
      payment: false,
      backup: false,
      completedCount: 0,
      totalCount: 4,
      allComplete: false,
    })
  })

  it('ticks school, student, payment, and backup as data is added', async () => {
    await ensureInitialized()
    await completeOnboarding({
      userName: 'Empty Operator',
      termYear: '1403-1404',
    })

    await db.schools.put({
      id: 'school-1',
      name: 'School One',
      branch: 'Main',
    })
    expect((await getGettingStartedProgress()).completedCount).toBe(1)
    expect((await getGettingStartedProgress()).school).toBe(true)

    await db.students.put({
      id: 'student-1',
      schoolId: 'school-1',
      fullName: 'Student One',
      nationalCode: '001',
      studentId: 'ST-1',
      grade: '1',
      fullPrice: 1_000_000,
      dynamicDiscountRate: 0,
      parentName: 'Parent',
      parentPhone: '09000000000',
    })
    expect((await getGettingStartedProgress()).completedCount).toBe(2)
    expect((await getGettingStartedProgress()).student).toBe(true)

    await db.studentTransactions.put({
      id: 'tx-1',
      studentId: 'student-1',
      schoolId: 'school-1',
      amountPaid: 1000,
      paymentMethod: 'cash',
      date: '2025-01-01',
      termYear: '1403-1404',
      operator: 'Empty Operator',
    })
    expect((await getGettingStartedProgress()).completedCount).toBe(3)
    expect((await getGettingStartedProgress()).payment).toBe(true)

    await setMetaValue(META_KEYS.lastBackupAt, new Date().toISOString())
    const done = await getGettingStartedProgress()
    expect(done).toEqual({
      school: true,
      student: true,
      payment: true,
      backup: true,
      completedCount: 4,
      totalCount: 4,
      allComplete: true,
    })
  })
})
