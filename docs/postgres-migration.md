# Migrazione a PostgreSQL

Questa branch sostituisce il runtime SQLite con PostgreSQL e aggiunge una procedura di import dei dati esistenti.

## 1. Avvio locale del database

1. Copia `.env.example` in `.env`.
2. Avvia PostgreSQL locale:

```bash
npm run docker:postgres:up
```

Su PowerShell, per creare `.env`:

```powershell
Copy-Item .env.example .env
```

Il container espone PostgreSQL su `localhost:5432` con queste credenziali di default:

- database: `calcetto_punti`
- user: `calcetto`
- password: `calcetto`

## 2. Inizializzare lo schema

Con il container attivo:

```bash
npm run db:push
```

Questo applica lo schema Drizzle al database indicato da `DATABASE_URL`.

## 3. Importare i dati da SQLite

Se hai un vecchio file SQLite in `./data/sqlite.db`:

```bash
npm run db:migrate:sqlite-to-postgres
```

Se il database PostgreSQL contiene gia dati e vuoi sovrascriverli:

```bash
npm run db:migrate:sqlite-to-postgres -- --truncate
```

Puoi anche puntare a un file SQLite diverso:

```bash
SQLITE_PATH=./backup/sqlite.db npm run db:migrate:sqlite-to-postgres
```

Su PowerShell:

```powershell
$env:SQLITE_PATH = './backup/sqlite.db'
npm run db:migrate:sqlite-to-postgres
```

## 4. Avvio applicazione

In sviluppo:

```bash
npm run dev
```

In produzione/container:

- imposta `DATABASE_URL`
- opzionalmente imposta `AUTO_DB_PUSH_ON_START=true` per applicare `drizzle-kit push` all'avvio

## 5. Procedura di cutover consigliata

1. Esegui backup del file SQLite corrente.
2. Avvia un PostgreSQL staging o produzione.
3. Esegui `npm run db:push`.
4. Esegui l'import dal file SQLite.
5. Verifica:
   - login admin
   - elenco atleti
   - apertura di un torneo esistente
   - storico partite libere
6. Ferma temporaneamente le scritture sull'app.
7. Riesegui import finale dal dump/file piu recente.
8. Punta la produzione al nuovo `DATABASE_URL`.
9. Esegui smoke test e riapri il traffico.

## 6. Rollback

Il rollback previsto e semplice:

1. conserva il file SQLite originale
2. conserva l'ultima immagine/deploy funzionante su SQLite
3. se il cutover fallisce, riporta l'app alla versione precedente e al database SQLite
