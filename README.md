# Calcetto Punti

App web per gestire classifiche e punteggi di calciobalilla tra amici. Permette di organizzare competizioni round-robin con squadre da 2 giocatori, generare calendari automatici o manuali, registrare risultati e visualizzare classifiche in tempo reale.

## Funzionalità

- **Gestione giocatori** — Aggiungi, modifica, disabilita o elimina giocatori con protezione se già assegnati a squadre
- **Competizioni** — Crea arene di gioco con punteggio configurabile (vittoria, pareggio, sconfitta)
- **Squadre** — Composizione automatica o manuale di coppie, con vincolo di unicità per giocatore
- **Calendario** — Generazione automatica round-robin o inserimento manuale delle partite
- **Risultati e classifica** — Inserimento punteggi, classifica ordinata per punti, differenza reti e gol fatti
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
