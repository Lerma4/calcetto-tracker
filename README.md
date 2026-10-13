# Calcetto Punti

App web per gestire classifiche e punteggi di calciobalilla tra amici. Permette di organizzare competizioni round-robin con squadre da 2 giocatori, generare calendari automatici o manuali, registrare risultati e visualizzare classifiche in tempo reale.

## Funzionalità

- **Gestione giocatori** — Aggiungi, modifica, disabilita o elimina giocatori con protezione se già assegnati a squadre
- **Competizioni** — Crea arene di gioco con punteggio vittoria configurabile
- **Squadre** — Composizione automatica o manuale di coppie, con vincolo di unicità per giocatore
- **Calendario** — Generazione automatica round-robin o inserimento manuale delle partite
- **Risultati e classifica** — Inserimento punteggi, classifica ordinata per punti, differenza reti e gol fatti
- **Partite libere** — Archivio pubblico di partite 2vs2 senza torneo, con storico filtrabile e statistiche per giocatore
- **Temi** — Scelta tra temi chiari e scuri (cupcake, emerald, dracula)

## Stack tecnologico

- **Frontend:** Nuxt 4, Vue 3 (Composition API), Tailwind CSS, DaisyUI
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

## K3s e GitOps

La pipeline `.github/workflows/publish.yml`, ispirata a FantaBro, pubblica
`ghcr.io/lerma4/calcetto-tracker:sha-<commit>` per ogni push su `main` e aggiorna
`apps/calcetto/overlays/calcetto/kustomization.yaml` in `Lerma4/k3s-argocd-gitops`.
Configurare il secret Actions `GITOPS_REPO_TOKEN` con scrittura sui contenuti di
quella repository. Una dispatch da un branch pubblica senza aggiornare GitOps.
Configurare visibilita GHCR o imagePullSecret prima del primo avvio.

Integrare prima l'overlay GitOps: inizialmente ha zero repliche e autosync
disattivato. Seguire `docs/CALCETTO-MIGRATION.md` nella repository GitOps per
backup coerente, import, certificato HTTPS e passaggio con un solo writer.
Disabilitare il deployment Dokploy tramite tag durante il passaggio.

K3s imposta `REQUIRE_EXISTING_DB=true`: il container rifiuta di partire se
`/app/data/sqlite.db` manca o e vuoto. Il default resta false per gli ambienti
precedenti. SQLite e i peer WebSocket richiedono una replica e `Recreate`;
nessun hook automatico di schema/seed.

Backup coerente, dalla directory dell'applicazione:

```bash
node scripts/backup-db.mjs /percorso/protetto/calcetto-backup.db
node --test scripts/backup-db.test.mjs
```

Il comando integra i dati WAL, verifica integrita e tabelle, rifiuta DB senza
utenti e non sovrascrive file esistenti. Il backup ha permessi 600 ma contiene
hash password e sessioni: conservarlo fuori dal nodo con accesso protetto.
Per lo snapshot finale bloccare e drenare tutte le richieste, incluse
login/logout, e fermare Swarm prima di accendere la copia K3s.
