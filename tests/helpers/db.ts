import { db } from '~/db/database'

export async function resetTestDatabase(): Promise<void> {
  await db.close()
  await db.delete()
  await db.open()
}
