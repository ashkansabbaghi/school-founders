# پردیسان (Pardisan)

پردیسان یک PWA محلی برای مدیریت مالی مدارس است. تمام داده‌ها روی دستگاه شما در IndexedDB ذخیره می‌شوند — چیزی به سرور ارسال نمی‌شود.

Live demo: [https://ashkansabbaghi.github.io/school-founders/](https://ashkansabbaghi.github.io/school-founders/)

## Setup

Install dependencies:

```bash
npm install
```

## Development

Start the dev server at `http://localhost:3000`:

```bash
npm run dev
```

## Tests

Unit tests (validation, financial calculations, repositories, backup round-trip):

```bash
npm run test
```

Browser tests (first-run bootstrap, offline CRUD, reload persistence, export/import):

```bash
npx playwright install chromium
npm run test:e2e
```

## Production build

Generate a static site:

```bash
npm run generate
```

For GitHub Pages (project site under `/school-founders/`):

```bash
NUXT_APP_BASE_URL=/school-founders/ npm run generate:pages
```

The `generate:pages` script also copies `index.html` to `404.html` so direct navigation to routes like `/en/students` works on GitHub Pages.

Preview the production build locally:

```bash
npm run preview
```

## Install on your phone

### Android

1. Open the app in Chrome.
2. Tap **Install app** when prompted, or open the browser menu and choose **Install app** / **Add to Home screen**.

### iOS (Safari)

1. Open the app in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**, confirm the name, and tap **Add**.

You can also find step-by-step instructions in **Settings → Install app** inside the app.

## Local storage and backups

- Each installation keeps its own profile and data in the browser’s IndexedDB.
- Clearing site data, uninstalling the PWA, or using private browsing may delete your records.
- Use **Settings → Backup & restore → Export JSON** regularly and store the file somewhere safe.
- To move data to another device, export on the old device and import on the new one.
- In **Settings → Storage**, you can request persistent storage so the browser is less likely to evict your data.

## Deployment

Pushes to `main` run unit and browser tests, then deploy `.output/public` to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

Ensure GitHub Pages is enabled for this repository (Settings → Pages → Source: GitHub Actions).

## Project structure

- `app/db/` — IndexedDB schema, repositories, bootstrap, demo data
- `app/services/` — client-side business logic (finance, backup, founders)
- `shared/` — shared types, validation, and pure utilities
- `tests/unit/` — Vitest unit tests
- `tests/e2e/` — Playwright browser tests
