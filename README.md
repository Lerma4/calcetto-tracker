# Calcetto Punti

App web per gestire classifiche e punteggi di calciobalilla tra amici. Permette di organizzare competizioni round-robin con squadre da 2 giocatori, generare calendari automatici o manuali, registrare risultati e visualizzare classifiche in tempo reale.

## Funzionalità

- **Gestione giocatori** — Aggiungi, modifica, disabilita o elimina giocatori con protezione se già assegnati a squadre
- **Competizioni** — Crea arene di gioco con punteggio configurabile (vittoria, pareggio, sconfitta)
- **Squadre** — Composizione automatica o manuale di coppie, con vincolo di unicità per giocatore
- **Calendario** — Generazione automatica round-robin o inserimento manuale delle partite
- **Risultati e classifica** — Inserimento punteggi, classifica ordinata per punti, differenza reti e gol fatti
- **Partite libere** — Archivio pubblico di partite 2vs2 senza torneo, con storico filtrabile e statistiche per giocatore
- **Temi** — Scelta tra temi chiari e scuri (cupcake, emerald, dracula)

## Stack tecnologico

- **Frontend:** Nuxt 3, Vue 3 (Composition API), Tailwind CSS, DaisyUI
- **Backend:** Nitro (server engine di Nuxt), API REST
- **Database:** SQLite (better-sqlite3) con Drizzle ORM

## Setup

```bash
npm install
```

Inizializza il database:

```bash
npx drizzle-kit push
```

Se aggiungi nuove tabelle o campi, riesegui `npx drizzle-kit push` prima di usare le nuove feature.

## Avvio in sviluppo

```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

## Build di produzione

```bash
npm run build
npm run preview
```

## Docker in produzione

L'immagine non applica piu automaticamente `drizzle-kit push --force` all'avvio.

- Avvio standard: il container parte senza toccare lo schema del database
- Sync schema esplicito all'avvio: imposta `AUTO_DB_PUSH_ON_START=true`
- Sync manuale: esegui `npx drizzle-kit push` nel container solo quando vuoi applicare modifiche allo schema

Questo riduce il rischio di cambi schema distruttivi in produzione.
