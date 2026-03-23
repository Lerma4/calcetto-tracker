# AGENTS.md

This repository hosts `Calcetto Punti`, a Nuxt full-stack web app for managing foosball competitions, teams, matches, and rankings.

## Scope

These instructions apply to the entire repository.

## Project Structure

- `pages/`: Nuxt route pages such as dashboard, players (`atleti`), tournaments (`tornei`), free matches (`partite`), and auth views.
- `components/`: Shared UI components, organized into reusable `base/` pieces and feature-specific components.
- `layouts/`: App shell layouts.
- `composables/`: Shared Composition API logic such as `useAuth` and `usePermissions`.
- `middleware/`: Nuxt route middleware, including global auth handling and public-route exceptions.
- `server/api/`: Nitro API endpoints for auth, players, competitions, matches, and `free-matches`.
- `server/database/`: SQLite connection and Drizzle schema.
- `server/middleware/`: Server-side request guards, especially for protected API mutations.
- `server/plugins/`: Server startup hooks and initialization logic, including default admin seeding.
- `server/routes/`: Nitro custom routes, including websocket handlers.
- `server/utils/`: Shared server helpers for auth, params, websocket lifecycle, and free-match statistics.
- `assets/css/`: Global styling with Tailwind CSS and DaisyUI.
- `types/`: Shared TypeScript types.
- `utils/`: Shared app utilities.
- `docs/`: Project notes, plans, and design/spec documents.
- `data/`: SQLite database file storage.

## Architecture

- Frontend: Nuxt 4 + Vue 3 with Composition API and `<script setup lang="ts">`.
- Backend: Nitro server routes under `server/api`, plus websocket handling under `server/routes/ws.ts`.
- Database: SQLite via `better-sqlite3`, modeled with Drizzle ORM.
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`, DaisyUI, and shared global CSS.
- Auth: Cookie-based session auth with client route middleware and a server-side mutation guard.
- Runtime versioning: the app version is sourced from `package.json` and exposed through `runtimeConfig.public.appVersion`.

## Data Model

Core tables currently include:

- `players`
- `competitions`
- `teams`
- `matches`
- `free_matches`
- `users`
- `sessions`

When changing schema or persistence behavior, keep Drizzle schema, API handlers, and UI flows in sync.

## Functional Notes

- `tornei` and `partite` are public read flows; other app areas require authentication unless explicitly opened.
- API `POST`, `PUT`, `PATCH`, and `DELETE` requests are protected by `server/middleware/auth-guard.ts`, except under `/api/auth/`.
- On first startup with an empty `users` table, `server/plugins/seed-admin.ts` creates a default `admin` user and forces a password change.
- The app supports both competition matches and standalone `free_matches` history/statistics.
- Nitro websocket support is enabled and handled by `server/routes/ws.ts`.

## Coding Conventions

- Use TypeScript-first patterns across pages, components, composables, and server code.
- Prefer Vue Composition API and Nuxt conventions over custom patterns.
- Keep route handlers aligned with Nuxt/Nitro file naming, such as `[id].get.ts` or `players.post.ts`.
- Keep code identifiers mostly in English.
- Keep user-facing copy consistent with the existing Italian product language unless the task explicitly requires otherwise.
- Preserve existing domain vocabulary such as player roles and competition terms.
- Match existing styling patterns instead of introducing a new design system.
- If frontend graphic/UI elements are needed, use `https://daisyui.com/llms.txt` as a reference source.
- Keep repository-wide agent instructions here; tool-specific entrypoint files should only point back to this file and add strictly tool-specific notes when necessary.

## Working Rules

- Make focused changes that fit the current Nuxt full-stack architecture.
- Prefer extending existing composables, components, and API routes before creating parallel abstractions.
- If you change authentication, permissions, or database structure, review both server and client impact.
- Do not assume automated tests exist.
- If you add a new command, workflow, or convention, update `README.md` and this file when relevant.

## Run And Verification

Install dependencies:

```bash
npm install
```

Initialize or sync the database schema:

```bash
npx drizzle-kit push
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Release Workflow

- When asked to commit and push, ask for explicit confirmation before bumping the version or creating a GitHub release.
- Version lives in `package.json` (`version`) and is exposed in the app via `runtimeConfig.public.appVersion`.
- Use semver: patch for fixes, minor for features, major for breaking changes.
- Release order: bump `package.json` version, commit, push, create `git tag vX.Y.Z`, push the tag, then create the GitHub release.
- Dokploy deployment is triggered by tag, so the pushed tag must match the version in `package.json`.

## Production Docker Notes

- The production container does not force database schema changes on startup.
- Set `AUTO_DB_PUSH_ON_START=true` only when you explicitly want the container to run `npx drizzle-kit push` before booting the app.
- Prefer manual backups before applying schema changes in production.

## Tests

- There is currently no `test` script in `package.json`.
- No automated unit or integration test setup is currently documented in this repository.
- Until a test suite exists, use targeted manual verification and a production build check with `npm run build` after meaningful changes.
