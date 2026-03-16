# Strategie di Caching e Ottimizzazione Performance

## Contesto

L'app attualmente ha **zero caching** a qualsiasi livello:
- Ogni `useFetch()` + `refresh()` fa un round-trip completo al server
- Nessun header HTTP di cache sulle API
- Il middleware auth chiama `/api/auth/me` ad ogni navigazione
- La computed `standings` è O(n²) e ricalcola ad ogni cambio
- 22 endpoint API, di cui 4 GET pubblici candidati ideali per il caching

---

## Layer 1: Client-side — TanStack Query (vue-query)

### Cos'è
Libreria che wrappa le chiamate API con una cache client-side intelligente. Sostituisce `useFetch()` con `useQuery()` e `useMutation()`.

### Come funziona nel progetto
```ts
// Prima (attuale)
const { data: competition, refresh } = await useFetch(`/api/competitions/${id}`)
// Dopo ogni mutazione: await refresh()

// Dopo (con vue-query)
const { data: competition } = useQuery({
  queryKey: ['competition', id],
  queryFn: () => $fetch(`/api/competitions/${id}`)
})
// Dopo una mutazione:
useMutation({
  mutationFn: (score) => $fetch(`/api/matches/${matchId}`, { method: 'PUT', body: score }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competition', id] })
})
```

### Cosa risolve
- **Stale-While-Revalidate**: mostra dati dalla cache subito, aggiorna in background
- **Deduplicazione**: se 3 componenti chiedono gli stessi dati, parte 1 sola richiesta
- **Optimistic updates**: aggiorna la UI prima della risposta del server (es. punteggio match)
- **Retry automatico**: riprova le richieste fallite
- **Cache invalidation granulare**: invalidi solo le query che servono dopo una mutazione
- **Risolve il problema auth**: la query `/api/auth/me` viene cachata e non rifatta ad ogni route

### Trade-off

| Pro | Contro |
|-----|--------|
| UX nettamente migliore (dati istantanei) | Aggiunge una dipendenza (~12KB gzip) |
| Elimina il pattern refresh() manuale | Richiede refactor di tutte le pagine |
| Gestione errori/retry centralizzata | Curva di apprendimento (queryKey, invalidation) |
| DevTools eccellenti per debug | Complessità di cache invalidation su dati correlati |
| SSR-compatible con Nuxt | Overkill se l'app resta piccola |

### Complessità di implementazione: **Media**
Richiede refactor di ogni pagina che usa `useFetch`, ma il pattern è ripetitivo.

---

## Layer 2: Server-side — Nitro Built-in Cache

### Cos'è
Nitro (il server engine di Nuxt) ha un sistema di caching integrato che non richiede dipendenze esterne.

### Opzione 2A: `routeRules` in nuxt.config.ts
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/api/players': { cache: { maxAge: 60 } },           // cache 1 minuto
    '/api/competitions': { cache: { maxAge: 30 } },       // cache 30 secondi
    '/api/competitions/**': { cache: { swr: 10 } },       // SWR: serve stale, revalida in 10s
  }
})
```

### Opzione 2B: `defineCachedEventHandler` per endpoint specifici
```ts
// server/api/competitions/[id].get.ts
export default defineCachedEventHandler(async (event) => {
  // ... query database ...
  return result
}, {
  maxAge: 15,        // cache per 15 secondi
  swr: true,         // serve stale mentre aggiorna
  getKey: (event) => `competition-${event.context.params?.id}`
})
```

### Opzione 2C: Cache storage con `useStorage()` (Nitro)
```ts
// Cache manuale per calcoli pesanti (es. standings)
const storage = useStorage('cache')
const cacheKey = `standings-${competitionId}`
const cached = await storage.getItem(cacheKey)
if (cached) return cached

const standings = computeStandings(teams, matches) // calcolo O(n²)
await storage.setItem(cacheKey, standings, { ttl: 30 })
return standings
```

### Cosa risolve
- **Riduce query al database**: le GET identiche non toccano SQLite
- **SWR server-side**: risposte istantanee con aggiornamento in background
- **Zero dipendenze**: è tutto built-in in Nitro
- **Ideale per dati che cambiano poco**: lista giocatori, lista tornei

### Trade-off

| Pro | Contro |
|-----|--------|
| Zero dipendenze aggiuntive | Cache invalidation manuale (devi pulire la cache dopo PUT/POST/DELETE) |
| Configurazione centralizzata (routeRules) | Rischio di dati stale se non invalidi correttamente |
| Riduce carico su SQLite | Non migliora la UX client-side (nessun optimistic update) |
| SWR built-in | Debugging più difficile (cache invisibile lato client) |
| Funziona anche senza JS client | TTL-based: devi scegliere tempi di scadenza appropriati |

### Complessità di implementazione: **Bassa**
`routeRules` = poche righe in config. `defineCachedEventHandler` = refactor minimo per endpoint.

### Cache Invalidation (il problema principale)
```ts
// Dopo una mutazione, devi invalidare la cache server:
import { useStorage } from '#imports'
const storage = useStorage('cache')
await storage.removeItem(`nitro:handlers:competition-${id}`)
```
Questo è il punto debole: devi ricordarti di invalidare in ogni endpoint di mutazione.

---

## Layer 3: HTTP Caching Headers

### Cos'è
Headers HTTP standard che istruiscono browser e proxy su come cachare le risposte.

### Come implementarlo
```ts
// server/api/players.get.ts
export default defineEventHandler(async (event) => {
  // Cache-Control: il browser cacha per 60s, poi richiede
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=120')

  // ETag: il browser manda If-None-Match, il server risponde 304 se invariato
  const data = await db.select().from(players)
  const etag = createHash('md5').update(JSON.stringify(data)).digest('hex')
  setHeader(event, 'ETag', `"${etag}"`)

  if (getHeader(event, 'if-none-match') === `"${etag}"`) {
    setResponseStatus(event, 304)
    return null
  }

  return data
})
```

### Cosa risolve
- **304 Not Modified**: il server risponde senza body se i dati non sono cambiati (risparmio bandwidth)
- **Browser cache**: il browser non fa nemmeno la richiesta se è nel max-age
- **CDN/Proxy cache**: se metti Cloudflare/nginx davanti, cachano automaticamente
- **Standard HTTP**: funziona con qualsiasi client, nessuna libreria necessaria

### Trade-off

| Pro | Contro |
|-----|--------|
| Standard universale | Il calcolo dell'ETag ha un costo (devi comunque fare la query) |
| Funziona con CDN/reverse proxy | Cache-Control aggressivo può mostrare dati stale |
| Riduce bandwidth (304) | Complesso da configurare correttamente per dati dinamici |
| Nessuna dipendenza | Il browser cache può essere frustrante in sviluppo |
| Complementare agli altri layer | Non risolve il problema delle computed pesanti |

### Complessità di implementazione: **Bassa-Media**
Headers semplici = bassa. ETag con invalidation corretta = media.

---

## Layer 4: Ottimizzazioni Vue/Nuxt (senza cache)

### Cos'è
Miglioramenti di performance che non sono "caching" ma riducono il lavoro del client.

### 4A: Lazy loading dei componenti
```ts
// Nuxt fa già code-splitting per pagina di default.
// Ma puoi rendere lazy anche i componenti pesanti:
const StandingsTable = defineAsyncComponent(() => import('~/components/StandingsTable.vue'))
```

### 4B: Ottimizzazione computed `standings`
```ts
// Attuale: ricalcola tutto ad ogni cambio di competition.data
// Ottimizzazione: usare shallowRef per evitare deep reactivity su grandi array
const competition = shallowRef(null)
```

### 4C: Middleware auth ottimizzato
```ts
// Attuale: chiama /api/auth/me su OGNI navigazione
// Fix: controlla solo se non hai già l'utente
export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth()
  if (!user.value) await fetchUser() // solo se non già caricato
})
```

### 4D: `payloadExtraction` per SSR
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    payloadExtraction: true  // estrae i payload JSON dal HTML → navigazione più veloce
  }
})
```

### Trade-off

| Pro | Contro |
|-----|--------|
| Zero dipendenze | Impatto limitato su piccole app |
| Miglioramenti chirurgici | Richiede profilazione per identificare i bottleneck reali |
| Best practice comunque | Alcuni (shallowRef) richiedono attenzione nella reattività |
| Quick wins (auth middleware) | Non scala come una vera cache |

### Complessità: **Bassa**

---

## Layer 5: Cache Esterna (Redis / LRU in-memory)

### Cos'è
Un layer di cache dedicato tra il server e il database.

### Opzione 5A: LRU in-memory (per SQLite è spesso sufficiente)
```ts
// server/utils/cache.ts
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({ max: 500, ttl: 1000 * 60 })

export function getCached<T>(key: string, fn: () => T, ttl?: number): T {
  const cached = cache.get(key)
  if (cached) return cached as T
  const result = fn()
  cache.set(key, result, { ttl })
  return result
}
```

### Opzione 5B: Redis (per deployment distribuiti)
```ts
// Se un giorno passi a più istanze del server
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      cache: {
        driver: 'redis',
        host: 'localhost',
        port: 6379
      }
    }
  }
})
```

### Trade-off

| Pro | Contro |
|-----|--------|
| LRU: zero infra, ~3KB | Redis: infra da gestire (Docker container extra) |
| Invalidation programmatica facile | Complessità aggiunta per un'app SQLite |
| Redis: condiviso tra istanze | LRU: persa al restart del server |
| Pattern standard nell'industria | Probabilmente overkill per il caso d'uso attuale |

### Complessità: **LRU = Bassa, Redis = Media-Alta**

---

## Confronto Finale

| Strategia | Impatto UX | Impatto Server | Complessità | Dipendenze | Consigliato |
|-----------|-----------|---------------|-------------|------------|-------------|
| **TanStack Query** | ⭐⭐⭐⭐⭐ | ⭐⭐ | Media | +1 libreria | Se vuoi UX top |
| **Nitro routeRules** | ⭐⭐ | ⭐⭐⭐⭐ | Bassa | Nessuna | Quick win immediato |
| **HTTP Headers** | ⭐⭐ | ⭐⭐⭐ | Bassa-Media | Nessuna | Se usi CDN/proxy |
| **Vue optimizations** | ⭐⭐⭐ | ⭐ | Bassa | Nessuna | Sempre consigliato |
| **LRU in-memory** | ⭐ | ⭐⭐⭐ | Bassa | +1 libreria | Solo se SQLite è bottleneck |
| **Redis** | ⭐ | ⭐⭐⭐⭐⭐ | Alta | Redis server | Overkill per ora |

---

## Raccomandazione: Approccio Incrementale

**Fase 1 — Quick wins:**
- Fix middleware auth (non richiamare `/api/auth/me` se utente già caricato)
- `payloadExtraction: true` in nuxt.config
- `shallowRef` per dati grandi

**Fase 2 — Nitro cache:**
- `routeRules` con SWR per le GET API
- Cache invalidation nei mutation handler

**Fase 3 — TanStack Query:**
- Sostituire `useFetch` con `useQuery`/`useMutation`
- Optimistic updates per i punteggi
- Cache invalidation granulare

**Fase 4 — HTTP headers (opzionale):**
- Solo se si mette un reverse proxy o CDN davanti all'app
