import { describe, expect, it, beforeEach } from 'vitest'
import { META_KEYS } from '#shared/types/meta'
import {
  completeOnboarding,
  ensureInitialized,
  isOnboardingComplete,
  loadProfileSettings,
  shouldShowFirstPaymentCta,
} from '~/db/bootstrap'
import { db } from '~/db/database'
import { getMetaValue } from '~/db/repositories/meta'
import { resetTestDatabase } from '../helpers/db'

describe('bootstrap onboarding', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('creates install profile without seeding demo data on first run', async () => {
    await ensureInitialized()

    expect(await isOnboardingComplete()).toBe(false)

    const founders = await db.founders.toArray()
    const schools = await db.schools.toArray()

    expect(founders).toHaveLength(0)
    expect(schools).toHaveLength(0)

    const installId = await getMetaValue(META_KEYS.installId)
    expect(installId).toBeTruthy()
  })

  it('completes onboarding with demo data', async () => {
    await ensureInitialized()

    const profile = await completeOnboarding({
      userName: 'Test Operator',
      termYear: '1404-1405',
      startWithDemo: true,
    })

    expect(profile.userName).toBe('Test Operator')
    expect(await isOnboardingComplete()).toBe(true)
    expect(await shouldShowFirstPaymentCta()).toBe(false)

    const founders = await db.founders.toArray()
    expect(founders.length).toBeGreaterThan(0)
  })

  it('completes onboarding with empty data and shows first payment CTA', async () => {
    await ensureInitialized()

    await completeOnboarding({
      userName: 'Empty Operator',
      termYear: '1403-1404',
      startWithDemo: false,
    })

    expect(await isOnboardingComplete()).toBe(true)
    expect(await shouldShowFirstPaymentCta()).toBe(true)

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
      startWithDemo: false,
    })

    expect(profile.userName).toBe('Legacy Operator')
  })
})
