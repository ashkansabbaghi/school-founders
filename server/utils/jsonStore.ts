export async function readCollection<T>(filename: string): Promise<T[]> {
  const data = await useDb().getItem<T[]>(filename)

  if (data === null) {
    return []
  }

  if (!Array.isArray(data)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'errors.internal.invalidJsonArray',
      data: { filename },
    })
  }

  return data
}

export async function writeCollection<T>(filename: string, rows: T[]): Promise<void> {
  await useDb().setItem(filename, rows)
}

export async function upsertById<T extends { id: string }>(
  filename: string,
  item: T,
): Promise<T> {
  const rows = await readCollection<T>(filename)
  const index = rows.findIndex(row => row.id === item.id)

  if (index === -1) {
    rows.push(item)
  }
  else {
    rows[index] = item
  }

  await writeCollection(filename, rows)
  return item
}

export async function removeById<T extends { id: string }>(
  filename: string,
  id: string,
): Promise<boolean> {
  const rows = await readCollection<T>(filename)
  const nextRows = rows.filter(row => row.id !== id)

  if (nextRows.length === rows.length) {
    return false
  }

  await writeCollection(filename, nextRows)
  return true
}

export async function getById<T extends { id: string }>(
  filename: string,
  id: string,
): Promise<T | null> {
  const rows = await readCollection<T>(filename)
  return rows.find(row => row.id === id) ?? null
}
