export interface Founder {
  id: string
  name: string
  school?: string
}

const COLLECTION = 'founders'

function founderKey(id: string) {
  return `${COLLECTION}:${id}`
}

export async function listFounders(): Promise<Founder[]> {
  const db = useDb()
  const keys = await db.getKeys(COLLECTION)
  const founders = await Promise.all(
    keys.map(key => db.getItem<Founder>(key)),
  )
  return founders.filter((founder): founder is Founder => founder !== null)
}

export async function getFounder(id: string): Promise<Founder | null> {
  return useDb().getItem<Founder>(founderKey(id))
}

export async function saveFounder(founder: Founder): Promise<Founder> {
  await useDb().setItem(founderKey(founder.id), founder)
  return founder
}

export async function removeFounder(id: string): Promise<void> {
  await useDb().removeItem(founderKey(id))
}
