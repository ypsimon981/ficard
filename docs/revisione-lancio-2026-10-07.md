# Fi-Card — revisione prima del lancio, v0.9.155

## Modifiche
- Statistiche opzionali su Supabase, disattivate per default. Eventi: app_open, page_view, card_added; identificativo casuale locale, sezione, marchio del catalogo, versione e data server. Non vengono trasmessi contenuto delle carte, barcode, nomi personalizzati, foto, coordinate o ricerche. I backup non vengono conteggiati come nuove carte. Nessun recupero degli eventi offline: l'uso delle carte resta indipendente dal server.
- Consenso revocabile dalle impostazioni; revoca e cancellazione dati locali rimuovono l'ID e interrompono i nuovi invii. Eventi già ricevuti: cancellazione giornaliera oltre 90 giorni. Il conteggio riguarda solo installazioni consenzienti e non rappresenta tutti i download dello store.
- Backend: tabella dedicata ficard_usage_events nel progetto Supabase CoDriver, regione eu-central-1. RLS attiva, sola scrittura dei campi previsti per il client anonimo, lettura/modifica/cancellazione pubbliche negate. Marchi limitati al catalogo. Nessuna chiave privata nel client. Endpoint pubblico di ingestione: dati statistici indicativi, non adatti a fatturazione o conteggi antifrode; non è una fonte verificata di installazioni Play.
- Contatto generale mailto:info@fi-card.app e informativa inclusa nell'app, disponibile offline. Aggiornata anche la copia site/privacy.html destinata a OVH.
- Recensioni: usa URL ufficiali FICARD_STORE_LINKS quando configurati; fino alla pubblicazione rimanda al feedback email. Il vecchio collegamento market:// con identificativo ipotizzato è stato rimosso.
- Lingua automatica: il gestore del controllo intercetta il cambio e impedisce che il vecchio gestore riscriva una scelta manuale in inglese.
- Primo avvio vuoto, senza creare tessere demo. Carte già salvate conservate.
- Leaflet 1.9.4 distribuito localmente e precached con le immagini necessarie. Le nuove porzioni della mappa e le ricerche online continuano a richiedere rete.
- Cache offline: riconoscimento delle query di versione; fallback distinti per ScanDixit, privacy e home. Salvataggi IndexedDB serializzati; in caso di errore si preferisce la copia locale più recente alla vecchia copia IndexedDB.

## Verifica
59 test Node superati: scanner e consenso letture, navigazione ScanDixit, schede prodotti, condivisione, wake lock, catalogo, GPS/negozi, cache, backup/merge, salvataggi, privacy dei payload e pagine offline. Test preesistenti allineati agli helper correnti e alla regola già implementata di 50 m, con negozio unico entro 200 m.

Prova REST effettiva: evento valido HTTP 201; lettura anonima HTTP 401; marchio arbitrario rifiutato HTTP 400; campo barcode inesistente rifiutato HTTP 400. Eventi di test eliminati. Verificati RLS, privilegi e job di conservazione. Nessuna segnalazione degli advisor relativa alla nuova tabella; esistono avvisi preesistenti di altri moduli del progetto condiviso, fuori da questa revisione.

## Prima della distribuzione sugli store
1. Portare la webapp in Capacitor, generare APK e provare su Android reale: camera, geolocalizzazione precisa/negata, avvio offline dopo prima installazione, pausa/ripresa, tasto Indietro, backup su File e condivisione. Queste prove fisiche non sono sostituite dai test automatici. Questa repository non contiene ancora una build nativa.
2. Pubblicare su OVH la nuova site/privacy.html: la policy pubblica letta prima di questa revisione non descriveva ancora le statistiche. La copia dentro l'app sarà pubblicata su GitHub Pages; OVH non viene aggiornato automaticamente dal repository.
3. Nella Play Console aggiornare Data Safety: raccolta facoltativa per analisi di identificativi di installazione e attività nell'app (interazioni e marchi delle carte aggiunte), trasferimento HTTPS e conservazione. Non dichiarare semplicemente «nessun dato raccolto». Valutare anche servizi mappe/cataloghi e SDK effettivamente presenti nella build finale. Fonti: https://support.google.com/googleplay/android-developer/answer/10787469 e https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876 .
4. La policy corrente indica Fi-Card e il contatto email, ma la denominazione e i recapiti legali del titolare devono essere completati con dati effettivi prima del lancio.
5. In questa webapp non c'è SDK pubblicitario. Se la build integra AdMob, completare consenso pubblicitario, informativa provider, dichiarazione Advertising ID e Data Safety sul pacchetto finale; non considerare l'opzione delle statistiche come consenso agli annunci.
6. Dopo la pubblicazione delle schede store, configurare gli URL ufficiali in FICARD_STORE_LINKS. Verificare ricezione di info@fi-card.app e icona, screenshot e testi delle schede.

Freeze funzionalità: correggere solo difetti emersi dalle prove del pacchetto nativo.
