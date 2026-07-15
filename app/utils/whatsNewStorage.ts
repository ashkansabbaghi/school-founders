export const SEEN_RELEASE_VERSION_KEY = 'school-fanders:seen-release-version'

export function getSeenReleaseVersion(): string | null {
  if (!import.meta.client) {
    return null
  }

  return localStorage.getItem(SEEN_RELEASE_VERSION_KEY)
}

export function setSeenReleaseVersion(version: string): void {
  if (!import.meta.client) {
    return
  }

  localStorage.setItem(SEEN_RELEASE_VERSION_KEY, version)
}

export type WhatsNewGateInput = {
  currentVersion: string
  seenVersion: string | null
  onboardingComplete: boolean | null
}

export type WhatsNewGateResult = {
  shouldShow: boolean
  shouldPersistSilently: boolean
}

export function evaluateWhatsNewGate(input: WhatsNewGateInput): WhatsNewGateResult {
  const { currentVersion, seenVersion, onboardingComplete } = input

  if (onboardingComplete === null) {
    return { shouldShow: false, shouldPersistSilently: false }
  }

  if (onboardingComplete === false) {
    if (seenVersion !== currentVersion) {
      return { shouldShow: false, shouldPersistSilently: true }
    }

    return { shouldShow: false, shouldPersistSilently: false }
  }

  if (seenVersion === currentVersion) {
    return { shouldShow: false, shouldPersistSilently: false }
  }

  return { shouldShow: true, shouldPersistSilently: false }
}
