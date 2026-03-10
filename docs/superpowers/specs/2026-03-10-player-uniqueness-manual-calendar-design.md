# Design: Vincolo Giocatore Unico + Calendario Manuale

## Problema

1. Un giocatore può essere inserito in più squadre nella stessa competizione — serve vincolo di unicità
2. Non esiste la possibilità di creare calendari manualmente — serve modalità alternativa al round-robin automatico

## Decisioni

- **Approccio A scelto**: campo `calendarMode` esplicito sulla competizione (`auto` | `manual`)
- Le due modalità coesistono ma non si mescolano: o auto o manual per competizione
- Partite modificabili (squadre + punteggio) e cancellabili in entrambe le modalità
- Non si aggiungono partite extra dopo generazione automatica
- Giornate auto-incrementanti: ogni giornata ha N/2 partite, piena → nuova giornata
- Possibilità di modificare partite in giornate precedenti, con controlli di coerenza

## Schema

### `competitions` — nuovo campo

- `calendarMode`: `text('calendar_mode', { enum: ['auto', 'manual'] })` — nullable, `null` = non ancora scelto

### `teams` — nessuna modifica schema

Validazione giocatore unico lato API (non schema).

## API

### Modifiche esistenti

**`POST /api/competitions/[id]/teams`**
- Aggiunge controllo: query tutte le squadre della competizione, verifica che né `player1Id` né `player2Id` siano già presenti come player1 o player2 in un'altra squadra
- Errore 400: "Il giocatore [nome] è già in una squadra in questa arena"

**`POST /api/competitions/[id]/generate-calendar`**
- Setta `calendarMode = 'auto'` sulla competizione prima di generare

### Nuovi endpoint

**`POST /api/competitions/[id]/matches`** — aggiunta partita manuale
- Body: `{ team1Id, team2Id }`
- Verifica `calendarMode` sia `null` o `manual` (se `auto` → 400)
- Setta `calendarMode = 'manual'` se ancora null
- Verifica coppia team1Id/team2Id non esista già (in qualsiasi ordine)
- Calcola giornata: conta partite nella giornata corrente (ultima). Se N/2 → nuova giornata, altrimenti aggiunge alla corrente
- Verifica che nessuna delle due squadre giochi già nella stessa giornata
- Inserisce la partita

**`DELETE /api/competitions/[id]/matches/[matchId]`**
- Cancella la partita
- Rinumera giornate se una resta vuota (compatta)

**`PUT /api/competitions/[id]/matches/[matchId]`** — modifica squadre di una partita
- Body: `{ team1Id, team2Id }`
- Stessi controlli di coerenza: no coppia duplicata, no squadra che gioca due volte nella stessa giornata

## Frontend/UI

### Form squadre — filtro giocatori

Le `<select>` dei giocatori filtrano automaticamente chi è già assegnato a una squadra nella competizione. Computed `availablePlayers` esclude player1/player2 dei team esistenti.

### Scelta modalità calendario

Quando non ci sono partite e ci sono almeno 2 squadre pari, si mostrano due card affiancate:
- **Automatico** (`lucide:wand-2`): genera round-robin completo → bottone "GENERA"
- **Manuale** (`lucide:hand`): aggiungi partite una alla volta → bottone "INIZIA"

Stile: `bg-base-200 rounded-2xl p-6`, layout `grid grid-cols-1 sm:grid-cols-2 gap-4`.

### Form creazione partita manuale

- Badge giornata corrente: `badge-accent badge-lg` con "Giornata X — Y/Z partite"
- Form inline: due `<select>` squadre (filtrate per coerenza) + bottone "AGGIUNGI"
- Form scompare quando giornata piena (N/2), ricompare con giornata successiva

### Gestione partite (modifica/cancella)

Su ogni riga partita:
- **Cancella**: `btn btn-ghost btn-sm text-error` + `lucide:trash-2` → `window.confirm()` → DELETE → refresh
- **Modifica squadre**: `btn btn-ghost btn-sm` + `lucide:pencil` → riga editabile con `<select>` + controlli coerenza

Cancellazione con giornata vuota → server compatta numerazione.

### Messaggi di errore

`alert alert-error rounded-2xl` con auto-dismiss 4s:
- "Il giocatore X è già in una squadra in questa arena"
- "Questa coppia di squadre ha già una partita in calendario"
- "La squadra X gioca già nella giornata Y"
