# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Calcetto Punti is a fullstack Nuxt 3 app for managing calciobalilla (table football) competition points among small groups of friends. It handles player registration, competition creation, team pairing, and round-robin match scheduling with scoring. Teams are always composed of exactly 2 players (calciobalilla standard).

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npx drizzle-kit push` — Push schema changes to SQLite database (use `--force` if adding non-nullable columns with existing data)
- `npx drizzle-kit generate` — Generate migration files

No test framework is configured.

## Architecture

**Stack:** Nuxt 3 + Vue 3 (Composition API) + Drizzle ORM + better-sqlite3 + Tailwind CSS + DaisyUI

**Frontend:**
- `pages/index.vue` — Main dashboard, orchestrates all data fetching and form submissions
- `pages/atleti.vue` — Player CRUD (add, edit, delete with team protection, disable/enable toggle)
- `pages/arene/index.vue` — Competition list with creation form
- `pages/arene/[id].vue` — Arena detail: teams, calendar (auto/manual modes), match CRUD, results, standings
- `components/feature/` — Feature components (forms, tables, stats hero)
- `layouts/default.vue` — App shell with navbar, theme switcher (cupcake/dracula/emerald via DaisyUI)
- DaisyUI theming via `@nuxtjs/color-mode` with `data-theme` attribute

**Backend (Nitro server):**
- `server/api/` — REST endpoints following Nuxt convention (`resource.method.ts`)
- `server/api/players/[id]/` — Player mutations (update, delete with team check, toggle-disabled)
- `server/api/competitions/[id]/` — Competition detail, team CRUD (with player uniqueness), calendar generation, match CRUD
- `server/api/matches/[id].put.ts` — Match score updates
- `server/api/competitions/[id]/matches/` — Manual match creation, team edit, delete with matchday compaction
- `server/database/schema.ts` — Drizzle schema: `players`, `competitions`, `teams`, `matches`
- `server/database/db.ts` — SQLite connection (WAL mode enabled)
- Database file: `./data/sqlite.db` (volume-mounted in Docker at `/app/data`)

**Types:**
- `types/index.ts` — Shared TypeScript interfaces (Player, Competition, Team, Match)

## Key Conventions

- Italian language for UI labels and user-facing text
- Components use `<script setup lang="ts">` with TypeScript
- All styling via Tailwind utility classes + DaisyUI components (no custom CSS files beyond `assets/css/main.css`)
- API validation uses `createError()` for 400 responses
- Database defaults: `winPoints` defaults to 3, `role` enum is `attaccante | portiere | indifferente`
- Competitions have `calendarMode` (`auto` | `manual` | null) — set on first calendar action
- A player can only be in one team per competition (enforced in API + frontend filter)
- Pages are self-contained (fetch data, handle mutations inline) rather than using sub-components
- DaisyUI `<dialog>` element for modals (showModal/close pattern)
- Design language: `glass-card rounded-[2rem]`, `font-black`, `tracking-widest`, `uppercase` for headings
- Error messages: DaisyUI `alert alert-error` with auto-dismiss via `setTimeout`
- Standings sorting: points > goal difference > goals scored

## Release Workflow

- When the user asks to commit and push, ALWAYS ask for explicit confirmation before bumping the version and creating a GitHub release — never do it automatically
- Version lives in `package.json` (`version` field) and is displayed in the app footer via `runtimeConfig`
- Use semver: patch for fixes, minor for features, major for breaking changes
- Steps: bump `package.json` version → commit → push → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create`
- The Dokploy deploy is triggered by tag, so the tag must match the version in `package.json`
