# Guest Access ai Tornei — Design Spec

## Obiettivo

Permettere agli utenti non autenticati di visualizzare le pagine tornei (lista e dettaglio) in sola lettura, senza duplicare pagine. Gli ospiti non possono creare, modificare o eliminare nulla. L'approccio è basato su permessi centralizzati tramite composable.

## Vincoli

- Nessuna modifica allo schema DB o alle API server (le GET sono già aperte, le mutazioni già protette da `server/middleware/auth-guard.ts`)
- Nessun sistema ruoli — i permessi derivano esclusivamente dallo stato di login
- Nessuna pagina duplicata — stesse pagine, controlli nascosti via `v-if`

## Modifiche

### 1. Client Middleware — Rotte pubbliche

**File:** `middleware/auth.global.ts`

Il middleware attualmente redirige al login tutte le rotte tranne `/login`. Va modificato per:

- Definire una lista di rotte pubbliche: `/login`, `/tornei`, `/tornei/:id`
- Tentare comunque `fetchUser()` sulle rotte pubbliche (così un utente con cookie valido viene riconosciuto)
- Non fare redirect al login se la rotta è pubblica

Logica:
```
const isPublic = path === '/login' || path === '/tornei' || path.startsWith('/tornei/')
```

Se la rotta è pubblica e l'utente non è autenticato, si lascia passare. Se la rotta è protetta e l'utente non è autenticato, redirect a `/login`.

### 2. Composable `usePermissions`

**Nuovo file:** `composables/usePermissions.ts`

Espone computed reattive basate su `isLoggedIn` da `useAuth`:

- `canEdit` — l'utente può modificare dati (risultati partite, squadre partite)
- `canCreate` — l'utente può creare risorse (tornei, squadre, partite, calendario)
- `canDelete` — l'utente puo eliminare risorse (squadre, partite)

Tutti e tre restituiscono `isLoggedIn.value` per ora. Se in futuro servono ruoli, si modifica solo questo file.

### 3. Pagina lista tornei

**File:** `pages/tornei/index.vue`

- Importare `usePermissions`
- Wrappare l'intero `BaseSectionCard` "Nuovo Torneo" con `v-if="canCreate"`

Cosa resta visibile agli ospiti: la tabella dei tornei attivi con link "Gestisci".

### 4. Pagina dettaglio torneo

**File:** `pages/tornei/[id].vue`

- Importare `usePermissions`

Elementi da nascondere con permessi:

| Elemento | Condizione |
|----------|-----------|
| Form "Aggiungi squadra" | `v-if="!hasCalendar && canCreate"` (era solo `!hasCalendar`) |
| Bottone "Elimina squadra" | `v-if="!hasCalendar && canDelete"` (era solo `!hasCalendar`) |
| Blocco scelta modalità calendario (auto/manuale) | `v-if="canCreate"` (wrappa il div esistente) |
| Form aggiunta partita manuale | `v-if="canCreate"` |
| Input score (team1 e team2) + bottone salva | `v-if="canEdit"` |
| Bottone edit partita | `v-if="canEdit"` |
| Bottone delete partita | `v-if="canDelete"` |

Cosa resta visibile agli ospiti:
- Header con nome torneo e punti vittoria
- Classifica completa (con espansione mobile)
- Calendario con risultati in sola lettura (nomi squadre e punteggi come testo)
- Lista squadre con giocatori
- Badge "GIOCATA" sulle partite giocate

Nota: per le partite nel calendario, gli ospiti vedono i punteggi come testo statico. Serve un blocco alternativo read-only al posto degli input quando `!canEdit`. Struttura: `<template v-if="canEdit">` con input/bottoni, `<template v-else>` con testo statico dei punteggi.

### 5. Navbar

**File:** `layouts/default.vue`

- L'intero blocco `<nav>` (DASHBOARD, ATLETI, TORNEI) viene wrappato con `v-if="isLoggedIn"`
- Il blocco utente/logout resta invariato (`v-if="isLoggedIn"` gia presente)
- Aggiungere un bottone "ACCEDI" visibile quando `!isLoggedIn`, che naviga a `/login`

Risultato ospite: logo + theme switcher + bottone "ACCEDI". Nessun link di navigazione.

### 6. Pagina Login

**File:** `pages/login.vue`

Aggiungere sopra la card di login (tra il blocco logo e la card "Accesso") una card prominente con:

- Testo: indicazione che si possono consultare i tornei senza accesso
- Pulsante `NuxtLink` a `/tornei` con stile `btn-outline` o `btn-ghost` per differenziarlo dal login primario
- Stile coerente: card con bordo sottile, testo uppercase tracking-widest

## File coinvolti (riepilogo)

| File | Tipo modifica |
|------|--------------|
| `middleware/auth.global.ts` | Modifica — aggiunta rotte pubbliche |
| `composables/usePermissions.ts` | Nuovo file |
| `pages/tornei/index.vue` | Modifica — `v-if` su form creazione |
| `pages/tornei/[id].vue` | Modifica — `v-if` su tutti i controlli di modifica + blocco read-only score |
| `layouts/default.vue` | Modifica — nascondere nav, aggiungere bottone "ACCEDI" |
| `pages/login.vue` | Modifica — aggiungere card "Vai ai Tornei" |

## Cosa NON cambia

- Nessuna modifica al server (API, middleware server, schema DB)
- Nessuna nuova pagina
- Nessun sistema ruoli nel DB
- Il composable `useAuth` resta invariato
