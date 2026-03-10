# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Calcetto Punti is a fullstack Nuxt 3 app for managing calciobalilla (table football) competition points among small groups of friends. It handles player registration, competition creation, team pairing, and round-robin match scheduling with scoring. Teams are always composed of exactly 2 players (calciobalilla standard).

## Commands

- `npm run dev` — Start dev server (localhost:3000)
- `npm run build` — Production build
- `npx drizzle-kit push` — Push schema changes to SQLite database
- `npx drizzle-kit generate` — Generate migration files

No test framework is configured.

## Architecture

**Stack:** Nuxt 3 + Vue 3 (Composition API) + Drizzle ORM + better-sqlite3 + Tailwind CSS + DaisyUI

**Frontend:**
- `pages/index.vue` — Main dashboard, orchestrates all data fetching and form submissions
- `components/feature/` — Feature components (forms, tables, stats hero)
- `layouts/default.vue` — App shell with navbar, theme switcher (cupcake/dracula/emerald via DaisyUI)
- DaisyUI theming via `@nuxtjs/color-mode` with `data-theme` attribute

**Backend (Nitro server):**
- `server/api/` — REST endpoints following Nuxt convention (`resource.method.ts`)
- `server/database/schema.ts` — Drizzle schema: `players`, `competitions`, `teams`, `matches`
- `server/database/db.ts` — SQLite connection (WAL mode enabled)
- Database file: `sqlite.db` at project root

**Types:**
- `types/index.ts` — Shared TypeScript interfaces (Player, Competition, Team, Match)

## Key Conventions

- Italian language for UI labels and user-facing text
- Components use `<script setup lang="ts">` with TypeScript
- All styling via Tailwind utility classes + DaisyUI components (no custom CSS files beyond `assets/css/main.css`)
- API validation uses `createError()` for 400 responses
- Database defaults: `winPoints` defaults to 3, `role` enum is `attaccante | portiere | indifferente`
