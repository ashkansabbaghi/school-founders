import type { MetaKey } from '#shared/types/meta'
import { db } from '../database'

export async function getMetaValue(key: MetaKey | string): Promise<string | null> {
  const record = await db.meta.get(key)
  return record?.value ?? null
}

export async function setMetaValue(key: MetaKey | string, value: string): Promise<void> {
  await db.meta.put({ key, value })
}

export async function removeMetaValue(key: MetaKey | string): Promise<void> {
  await db.meta.delete(key)
}

export async function listMeta(): Promise<Record<string, string>> {
  const records = await db.meta.toArray()
  return Object.fromEntries(records.map(record => [record.key, record.value]))
}

export async function setMetaValues(entries: Record<string, string>): Promise<void> {
  await db.transaction('rw', db.meta, async () => {
    await Promise.all(
      Object.entries(entries).map(([key, value]) => db.meta.put({ key, value })),
    )
  })
}

export async function clearMeta(): Promise<void> {
  await db.meta.clear()
}
