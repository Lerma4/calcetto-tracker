# AGENTS.md

This repository hosts `Calcetto Punti`, a Nuxt full-stack web app for managing foosball competitions, teams, matches, and rankings.

## Scope

These instructions apply to the entire repository.

## Project Structure

- `pages/`: Nuxt route pages such as home, players, tournaments, and auth views.
- `components/`: Shared UI components, organized into reusable base pieces and feature-specific components.
- `layouts/`: App shell layouts.
- `composables/`: Shared Composition API logic such as auth and permission helpers.
- `middleware/`: Nuxt route middleware.
- `server/api/`: Nitro API endpoints.
- `server/database/`: SQLite connection and Drizzle schema.
- `server/middleware/`: Server-side request guards, especially for protected API mutations.
- `server/plugins/`: Server startup hooks and initialization logic.
- `assets/css/`: Global styling with Tailwind CSS and DaisyUI.
- `types/`: Shared TypeScript types.
- `data/`: SQLite database file storage.

## Architecture

- Frontend: Nuxt + Vue 3 with Composition API and `<script setup lang="ts">`.
- Backend: Nitro server routes under `server/api`.
- Database: SQLite via `better-sqlite3`, modeled with Drizzle ORM.
- Styling: Tailwind CSS with DaisyUI themes and shared global CSS.
- Auth: Cookie-based session auth with route protection on both client and server.

## Data Model

Core tables currently include:

- `players`
- `competitions`
- `teams`
- `matches`
- `users`
- `sessions`

When changing schema or persistence behavior, keep Drizzle schema, API handlers, and UI flows in sync.

## Coding Conventions

- Use TypeScript-first patterns across pages, components, composables, and server code.
- Prefer Vue Composition API and Nuxt conventions over custom patterns.
- Keep route handlers aligned with Nuxt/Nitro file naming, such as `[id].get.ts` or `players.post.ts`.
- Keep code identifiers mostly in English.
- Keep user-facing copy consistent with the existing Italian product language unless the task explicitly requires otherwise.
- Preserve existing domain vocabulary such as player roles and competition terms.
- Match existing styling patterns instead of introducing a new design system.

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

## Tests

- There is currently no `test` script in `package.json`.
- No automated unit or integration test setup is currently documented in this repository.
- Until a test suite exists, use targeted manual verification and a production build check with `npm run build` after meaningful changes.
