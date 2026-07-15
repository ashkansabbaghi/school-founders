import { describe, expect, it } from 'vitest'
import en from '../../i18n/locales/en.json'
import fa from '../../i18n/locales/fa.json'
import { evaluateWhatsNewGate } from '~/utils/whatsNewStorage'

const CURRENT_VERSION = '1.0.0'
const NEXT_VERSION = '1.1.0'

describe('whatsNew translations', () => {
  const keys = ['badge', 'title', 'acknowledge', 'close'] as const

  it('defines Persian dialog strings in fa.json', () => {
    for (const key of keys) {
      expect(fa.whatsNew[key]).toBeTruthy()
    }

    expect(fa.whatsNew.acknowledge).toBe('متوجه شدم')
    expect(fa.whatsNew.close).toBe('بستن')
    expect(fa.whatsNew.badge).toContain('{version}')
    expect(fa.whatsNew.title).toContain('{version}')
  })

  it('defines matching English dialog strings in en.json', () => {
    for (const key of keys) {
      expect(en.whatsNew[key]).toBeTruthy()
    }

    expect(Object.keys(en.whatsNew).sort()).toEqual(keys.slice().sort())
    expect(Object.keys(fa.whatsNew).sort()).toEqual(keys.slice().sort())
  })
})

describe('evaluateWhatsNewGate', () => {
  it('waits while onboarding status is still loading', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: CURRENT_VERSION,
      seenVersion: null,
      onboardingComplete: null,
    })).toEqual({
      shouldShow: false,
      shouldPersistSilently: false,
    })
  })

  it('silently records the current version on fresh install without showing the modal', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: CURRENT_VERSION,
      seenVersion: null,
      onboardingComplete: false,
    })).toEqual({
      shouldShow: false,
      shouldPersistSilently: true,
    })
  })

  it('keeps the modal hidden while onboarding is incomplete after silent persist', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: CURRENT_VERSION,
      seenVersion: CURRENT_VERSION,
      onboardingComplete: false,
    })).toEqual({
      shouldShow: false,
      shouldPersistSilently: false,
    })
  })

  it('shows the modal once when a returning user loads a newer version', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: NEXT_VERSION,
      seenVersion: CURRENT_VERSION,
      onboardingComplete: true,
    })).toEqual({
      shouldShow: true,
      shouldPersistSilently: false,
    })
  })

  it('does not reopen the modal after the user has acknowledged the update', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: NEXT_VERSION,
      seenVersion: NEXT_VERSION,
      onboardingComplete: true,
    })).toEqual({
      shouldShow: false,
      shouldPersistSilently: false,
    })
  })

  it('does not reopen the modal on reload when the seen version already matches', () => {
    expect(evaluateWhatsNewGate({
      currentVersion: CURRENT_VERSION,
      seenVersion: CURRENT_VERSION,
      onboardingComplete: true,
    })).toEqual({
      shouldShow: false,
      shouldPersistSilently: false,
    })
  })
})
