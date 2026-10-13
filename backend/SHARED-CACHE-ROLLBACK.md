# Archivio condiviso — versione 0.9.206

Versione web precedente: commit `2f02e520d32372769117646b89ea8d2a10b1b781` (0.9.205). Il ramo `backup/pre-shared-cache-2026-10-13` conserva il codice funzionante e una fotografia dell'archivio del pilota. Il file `backend/backups/pre-shared-cache-2026-10-13.json` contiene i quattro marchi, le quattro celle e i 20 punti OSM del pilota, senza segreti.

Le nuove tabelle sono nello schema privato e non sostituiscono quelle del pilota. Non viene migrata o caricata nessuna carta dal dispositivo. Il recupero è per settori da 0,05 gradi, entro il rettangolo 35–48 N / 6–19 E, e scarica negozi OSM pubblici. I marchi delle tessere vengono abbinati solo sul dispositivo. Sono ammesse al massimo 16 celle per richiesta, 64 nuove celle al giorno e 120 richieste alle fonti al giorno. Una coda limitata e un solo lavoro attivo evitano richieste illimitate. Dati validi per 30 giorni; errore con pausa di un'ora e conservazione della copia precedente.

## Arresto immediato, senza cancellare dati

Sul singolo dispositivo: disattivare **Usa l'archivio negozi condiviso** in Impostazioni. Nessuna carta, cache o posizione salvata viene cancellata.

Sul server, con ruolo amministrativo:

```sql
update ficard_private.shared_config set enabled=false where id;
```

La funzione risponde `disabled` e l'app usa il percorso precedente nelle ricerche successive. Il worker non avvia ulteriori richieste e non elabora nuovi risultati. Per riattivare impostare `enabled=true`.

## Ripristino completo del codice

Creare un commit di ripristino su main con gli asset della versione precedente e un nuovo numero di versione (per non riutilizzare il vecchio service worker). Verificare e ridistribuire con il normale workflow Pages. Non usare force push e non cancellare i dati sul telefono.

In alternativa, conservare la nuova interfaccia e disattivare soltanto l'archivio condiviso. Le nuove tabelle possono restare inattive: non serve eliminarle per tornare al codice precedente. Non è previsto cancellare carte, preferiti, negozi di Roma o dati del pilota.

I backup dei dati personali sul telefono non sono accessibili da questo ambiente: l'utente può esportarli dal normale pulsante Backup nell'app. Il salvataggio del codice non è un backup di quei dati.

## Verifica

`npm test` comprende griglia, richieste senza dati delle carte, risposte parziali, conservazione su errore, switch locale/remoto e integrazione della cache. `backend/shared-store-cache-verify.sql` verifica il database con dati sintetici annullati con rollback.

## Scansione notturna

L'automazione **Scansione notturna Fi-Card** avvia `public.ficard_shared_night_scan()` ogni notte intorno alle 02:00 Europe/Rome, con primo avvio il 14 ottobre 2026. La preparazione è consentita soltanto fra le 01:00 e le 06:00 locali e una sola volta per data locale. Si accodano al massimo 20 nuovi settori adiacenti a quelli già esplorati e con almeno tre punti OSM, entro i limiti globali di ammissione. Non si avvia uno scarico dell'intera Italia.

I settori notturni hanno origine `prefetch`, non vengono avviati di giorno e sono subordinati alle richieste degli utenti. Quando un utente richiede un settore prefetched, viene promosso a `user`. Il lavoro già in corso si completa normalmente; i nuovi lavori vengono scelti dando precedenza alle richieste degli utenti. Il prefetch si ferma a 80 chiamate di fonte giornaliere complessive, lasciando le ultime 40 del limite globale di 120 alle richieste degli utenti. La coda notturna lascia almeno 16 posti di ammissione disponibili.

La pianificazione avvia la preparazione; il job del database svolge l'importazione anche con app chiusa. Il primo ciclo notturno reale resta da verificare; i test transazionali di finestra oraria, idempotenza, promozione e permessi sono passati. Per ripeterli usare `backend/shared-night-verify.sql`. Lo stesso interruttore server `shared_config.enabled=false` arresta anche la scansione notturna.

## Riempimento h24 temporaneo e correzione 0.9.207

Per il pre-lancio, `shared_config.warmup_until` permette l'importazione di settori di prefetch a tutte le ore fino al **20 ottobre 2026 alle 09:16:52 Europe/Rome**, poi il worker ripristina automaticamente la finestra notturna. La preparazione temporanea accoda due settori ogni ora e fino a 40 settori di prefetch al giorno, con quota di ammissione e chiamate riservata alle ricerche degli utenti. Può fermarsi prima quando raggiunge i limiti: h24 indica la finestra di attività, non uno scarico senza limiti. L'automazione notturna resta sospesa logicamente durante questo periodo e riprende dopo la scadenza; l'automazione temporanea ha una ricorrenza con data finale e controlla anche la scadenza sul database. Un primo lotto reale di due settori è stato accodato, e i controlli transazionali di scadenza, idempotenza oraria, massimo due settori e permessi sono passati.

La 0.9.207 corregge le viste ampie della mappa: fino a 48 settori vengono suddivisi in richieste da massimo 16, mantenendo i limiti del server. Prima, una vista oltre 16 settori poteva essere mostrata come errore del server pur non avendo inviato alcuna richiesta. Le viste oltre il limite ricevono un invito ad avvicinare la mappa; code piene o quote esaurite hanno un messaggio distinto. I dati già salvati non vengono cancellati.

Per interrompere solo l'attività h24: `update ficard_private.shared_config set warmup_until=now() where id;`. Per fermare tutto usare l'interruttore `enabled=false` indicato sopra.
