# Calcetto Punti - Progetto Finalizzato

## 🎯 Riepilogo dell'Applicazione
L'applicazione è un gestore di competizioni di calcetto a girone unico per squadre da due giocatori.
- **Scopo**: Tracciamento punti, statistiche e calendari per un gruppo di amici.
- **Utenti**: Admin (gestione) e Pubblici (sola lettura).
- **Funzionalità Core**:
    - Anagrafica giocatori con ruoli (Attaccante, Portiere, Indifferente).
    - Creazione squadre bilanciate con suggeritore intelligente.
    - Generazione calendario Round Robin (giornate).
    - Classifiche e storico risultati.

## 🏗️ Architettura & Stack Tecnico
- **Frontend/Backend**: [Nuxt 3](https://nuxt.com/) (Approccio Monolitico Moderno).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI v4](https://daisyui.com/).
- **Database**: **SQLite** via [Drizzle ORM](https://orm.drizzle.team/).
- **Theming**: Supporto nativo per temi multipli (Cupcake, Dracula, Emerald).

## 📝 Registro delle Decisioni (Decision Log)

| Decisione | Alternativa | Motivazione |
| :--- | :--- | :--- |
| **Nuxt 3** | React + Vite | Offre un framework fullstack pronto all'uso con server Nitro integrato, ideale per la generalizzazione richiesta. |
| **DaisyUI** | Tailwind puro | Velocizza lo sviluppo di una UI premium con componenti pre-stiliti e un sistema di temi robusto. |
| **Drizzle ORM** | Prisma | Più leggero, "SQL-like" e permette una transizione facile tra SQLite e altri database SQL. |
| **Monolith (Opt 1)** | Microservices | Più veloce da implementare e testare per un progetto con requisiti ben definiti. |

## 🚀 Stato Attuale
1.  **Infrastruttura**: Configurazione Nuxt/Tailwind/DaisyUI funzionante.
2.  **UI**: Layout base con cambio tema implementato e verificato.
3.  **Database**: Schema Drizzle definito e sincronizzato con SQLite (`sqlite.db`).
4.  **Feature**: Gestione anagrafica giocatori completata.
5.  **Feature**: Gestione competizioni (creazione e elenco) completata.

## 🛠️ Prossimi Passi (Implementazione Handoff)
- [ ] Implementazione logica creazione Competizioni.
- [ ] Sviluppatore suggeritore squadre (Smart Pairing).
- [ ] Algoritmo per generazione Calendario Round Robin.
- [ ] Vista Classifiche dinamica.
