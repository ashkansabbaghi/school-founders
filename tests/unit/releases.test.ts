import { describe, expect, it } from 'vitest'
import {
  APP_VERSION,
  CURRENT_RELEASE,
  getReleaseNoteItems,
  resolveReleaseLocale,
} from '~/config/releases'

describe('releases config', () => {
  it('keeps version in sync between APP_VERSION and CURRENT_RELEASE', () => {
    expect(CURRENT_RELEASE.version).toBe(APP_VERSION)
  })

  it('returns Persian release notes by default', () => {
    const items = getReleaseNoteItems('fa')
    expect(items).toHaveLength(CURRENT_RELEASE.items.length)
    expect(items[0]).toContain('حالت تاریک')
  })

  it('returns English release notes for en locale', () => {
    const items = getReleaseNoteItems('en')
    expect(items[0]).toContain('Dark mode')
  })

  it('resolves locale prefixes', () => {
    expect(resolveReleaseLocale('en-US')).toBe('en')
    expect(resolveReleaseLocale('fa-IR')).toBe('fa')
  })
})
