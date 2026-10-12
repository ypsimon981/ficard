# Collaudo Livorno — 13 ottobre 2026

Il percorso di importazione e cache del pilota funziona con tutti e quattro i marchi. Il test riguarda esclusivamente il rettangolo 43.45,10.22–43.65,10.43 e le corrispondenze esatte `brand`/`name` configurate: non certifica la copertura completa dei negozi reali, di tutti i marchi o dell'Italia.

| Marchio | Punti OSM in archivio | Stato |
|---|---:|---|
| Conad | 7 | ready |
| Lidl | 3 | ready |
| Decathlon | 1 | ready |
| IP | 9 | ready |
| Totale | 20 | |

## Percorso operativo

`ficard-livorno-read` esegue una sola RPC per leggere un'istantanea dell'archivio. Non avvia importazioni né contatta Overpass. Risponde con dati, stato, completezza e attribuzione ODbL. La pagina `tests/livorno.html` interroga questa funzione con un limite di 15 secondi e conserva solo risultati completi in una cache locale separata da quella dell'app.

Il job Supabase Cron `ficard-livorno-import` chiama `ficard_livorno_tick()` ogni 30 secondi. Un lock transazionale permette un solo ciclo di importazione. `pg_net` recupera i dati in modo asincrono dal database: le chiamate dirette dalle Edge Function ricevevano HTTP 406, anche con User-Agent identificativo. Il percorso dal database è stato collaudato realmente. Usa Overpass API e, in caso di errore, l'istanza globale VK Maps. Le query hanno timeout di 10 secondi, budget di 16 MiB e timeout HTTP di 30 secondi.

Ogni lavoro ha una lease; i risultati di una lease superata non possono sostituire dati più recenti. La risposta viene respinta se incompleta, malformata o fuori dal rettangolo. Sostituzione dei punti e stato `ready` avvengono nella stessa transazione, con deduplicazione per tipo e ID OSM. In caso di errore si conservano i dati precedenti, si registra l'errore e si attende un'ora. I risultati completi valgono 30 giorni. Il job non fa richieste HTTP quando tutte le celle sono fresche.

La vecchia funzione sincrona `ficard-livorno-pilot` è ritirata (410). `ficard-livorno-worker` è un ingresso manuale protetto che chiama il ciclo asincrono: usa un token casuale custodito in Vault. RPC di importazione e verifica token sono accessibili solo a `service_role`; il client non riceve segreti. Le tabelle sono protette da RLS senza policy pubbliche. Lo schema privato non è esposto.

## Verifiche completate

- Importazione reale dei 20 punti e risposta pubblica `source=cache`, `complete=true` per tutti i marchi.
- Tempi osservati sulle letture calde: 0,70–0,80 secondi. Prime chiamate dopo inattività/deploy: circa 4,6–6,9 secondi. Non sono una garanzia di latenza.
- 3 test della pagina: lettura dal solo server, cache offline, mancata sovrascrittura da risultati incompleti/errori, cache scaduta.
- 7 test esistenti della cache dell'app: tutti passati.
- `verify.sql`: sostituzione atomica, duplicati, lease superata, dati fuori area, conservazione su errore, risultato vuoto completo e permessi RPC; dati sintetici annullati con rollback.
- Controllo live della pagina tramite runtime JavaScript: dati Lidl dal server, poi dalla cache locale con rete disabilitata. Il controllo in Chromium non era disponibile in questo ambiente.
- Worker senza token: HTTP 401. Marchio non previsto: HTTP 400.
- Advisor di sicurezza: nessun warning; gli INFO RLS senza policy sono intenzionali per tabelle riservate al server.
- Scheduler attivo, coda vuota e ciclo `idle` con archivio fresco.

Overpass ha effettivamente restituito 406, 504 e timeout durante il collaudo. La cache protegge la lettura da questi problemi; il recupero iniziale dipende comunque dalla disponibilità della fonte. Non è stato eseguito un test di carico né un test prolungato del rinnovo a 30 giorni.

## Ambito delle modifiche

Solo ramo `test/livorno-store-cache`, pagina di prova, codice backend e migrazioni del pilota. Nessuna modifica a bundle principale, APK, carte locali, dati Roma o collegamento della funzione al normale flusso dell'app.

Le migrazioni partono dalle quattro tabelle del pilota e dalla funzione `ficard_claim_pilot_cell` già presenti nel progetto Fi-card; non sono un bootstrap da database vuoto. Le Edge Function corrispondono a `read.ts`, `worker.ts` e `retired-pilot.ts`.

Per ripetere i controlli locali: `node --test tests/livorno-pilot.test.cjs tests/shop-cache.test.cjs`. Per ripetere i controlli transazionali del database: eseguire `backend/livorno/verify.sql` nel progetto Fi-card. Per controllare il ciclo senza forzare refresh: `select public.ficard_livorno_tick();` con ruolo amministrativo.
