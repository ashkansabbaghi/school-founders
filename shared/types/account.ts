export interface Account {
  id: string
  /** Display name; unique within the registry. */
  name: string
  /**
   * Stable backup subdirectory name under the backup root.
   * Generated once at account creation and never changed on rename.
   */
  folderName: string
  /** ISO-8601 timestamp. */
  createdAt: string
}

export interface AccountJsonMeta {
  id: string
  name: string
  schemaVersion: number
}

export const ACCOUNT_JSON_SCHEMA_VERSION = 1

const INVALID_FOLDER_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g
const MAX_FOLDER_NAME_LENGTH = 80

/**
 * Derive a filesystem-safe folder name from a display name.
 * Persian and other Unicode letters are preserved; only path-invalid characters are stripped.
 */
export function toAccountFolderName(name: string): string {
  const collapsed = name.trim().replace(/\s+/g, '-')
  const sanitized = collapsed
    .replace(INVALID_FOLDER_CHARS, '')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_FOLDER_NAME_LENGTH)
    .replace(/-+$/g, '')

  return sanitized || 'account'
}

/**
 * Pick a folder name that does not collide with existing account folders.
 * Uses `name-2`, `name-3`, … when the base name is taken.
 */
export function allocateUniqueFolderName(
  name: string,
  existingFolderNames: Iterable<string>,
): string {
  const base = toAccountFolderName(name)
  const used = new Set(existingFolderNames)

  if (!used.has(base)) {
    return base
  }

  let suffix = 2
  while (used.has(`${base}-${suffix}`)) {
    suffix += 1
  }

  return `${base}-${suffix}`
}
