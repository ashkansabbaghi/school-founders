import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), '.output/public')
const indexPath = join(outDir, 'index.html')
const fallbackPath = join(outDir, '404.html')

if (!existsSync(indexPath)) {
  console.error('Missing index.html in .output/public. Run nuxt generate first.')
  process.exit(1)
}

copyFileSync(indexPath, fallbackPath)
console.log('Created 404.html SPA fallback for GitHub Pages')
