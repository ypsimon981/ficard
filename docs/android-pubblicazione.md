# Fi-Card: Android e Google Play

## Cosa è pronto
Progetto Capacitor 8, file web inclusi nel pacchetto (`www`, generato), icona Fi-Card, avvio offline, GPS in primo piano, feedback aptico, backup con selettore di destinazione Android, condivisione tessera tramite pannello Android e tasto Indietro. La webapp GitHub Pages non viene trasformata: le integrazioni native sono applicate al bundle durante `npm run build`.

Identificativo provvisorio: `app.ficard.mobile`. Confermarlo PRIMA del primo caricamento su Google Play: dopo la pubblicazione non è modificabile per la stessa app. Versione iniziale 0.9.181, versionCode 1; aumentare versionCode per ogni nuovo caricamento Play. Non impostare `server.url`: l’app deve usare i file locali anche senza connessione.

Statistiche aggregate attive dal primo avvio con toggle per disattivarle, senza identificativo dell’installazione; scelta esplicita del titolare. Verificare minimizzazione, trattamento/log del fornitore e informativa prima dell’invio. Il consenso pubblicitario è separato. Pubblicità attualmente disattivata: nessun SDK AdMob incluso. Nella Console dichiarare quanto fa questa build, non funzioni future.

## APK di prova senza Android Studio
In GitHub → Actions → **Build Android test APK**, aprire la build completata e scaricare l’artifact **Fi-Card-Android-test**. Estrarre lo ZIP: contiene `app-debug.apk`. Trasferirlo su Android e installarlo autorizzando quella specifica sorgente quando Android lo richiede. Non caricare l’APK debug su Play: serve solo al collaudo. Richiede Android 7 o successivo.

## Sul PC Windows
Installare Node.js 22 o successivo e Android Studio 2025.2.1 o successivo, con Android SDK 36. Android Studio fornisce il JDK adatto (il progetto usa Java 21). Scaricare il repository da GitHub, estrarlo e aprire un terminale nella cartella:

```powershell
npm ci
npm test
npm run android:prepare
npm run android:open
```

Attendere la sincronizzazione Gradle. Collegare il telefono Android con debug USB, selezionarlo e premere Run. Dopo modifiche ai file web ripetere `npm run android:prepare`. Android Studio non aggiorna da solo il codice copiato.

## Collaudo obbligatorio prima dello store
- Primo avvio, lingua automatica, cambio lingua, modalità scura, rotazione e barre di sistema.
- Aggiunta manuale, barcode live e importazione foto/screenshot; permessi fotocamera accettati e negati.
- GPS preciso, app senza permesso posizione, riapertura dopo standby, distanze e mappa, centro commerciale.
- Carte in modalità aereo dopo riavvio; inserimento/modifica senza rete.
- Backup esportato scegliendo cartella/nome nel selettore Android e poi ripristinato; annullamento e scrittura fallita non devono aggiornare la data del backup. Il ripristino sostitutivo deve fermarsi se il salvataggio della copia di sicurezza viene annullato o fallisce.
- Condivisione tessera, apertura navigatore, email supporto, link privacy e Indietro Android.
- Statistiche disattivate: nessuna nuova richiesta; annunci sempre disattivati in questa build.

Le tessere già presenti nella webapp non passano automaticamente nell’app Android: prima esportare dalla webapp, poi importare nell’app.

## AAB firmato per Google Play
L'AAB release **0.9.181, versionCode 4**, con identificativo **app.ficard.mobile**, è stato compilato dal workflow `Build Android release bundle` e firmato separatamente con una upload key. Il pacchetto firmato e il backup privato della chiave sono stati consegnati al titolare: conservarli fuori da GitHub. Il controllo con `jarsigner -verify -strict` è passato. Questo non equivale al caricamento o all'approvazione di Google Play.

Per aggiornamenti: GitHub Actions → **Build Android release bundle** → **Run workflow**. L'artifact **Fi-Card-Android-release-unsigned** contiene un AAB non firmato. Firmarlo con la stessa upload key prima del caricamento; le istruzioni sono nel backup privato. Prima di ogni nuova release aumentare `versionCode` in `android/app/build.gradle`. Non generare una nuova chiave a ogni build.

Per la prima distribuzione: Play Console → crea/seleziona **Fi-Card** → **Test e release → Test → Test interno** → crea una release → scegli una chiave di firma gestita da Google (Play App Signing) → carica soltanto l'AAB firmato. Aggiungi i tester, controlla la release e avvia il test interno. Non caricare chiave privata/password tra i materiali dello store. Il caricamento automatico della Console non è stato possibile in questa sessione; questi passaggi vanno completati dal titolare.

Caricare l’AAB in un test interno/chiuso, completare scheda store, icona, screenshot, classificazione, pubblico, sicurezza dei dati, dichiarazione pubblicità e URL privacy. Contatto pubblico: info@fi-card.app. Non dichiarare “nessun dato raccolto” se sono attivi i conteggi remoti: verificare categorie e modalità reali prima di compilare Sicurezza dei dati. Prima del lancio controllare anche che la privacy pubblicata sia quella aggiornata.

Per account personali creati dopo il 13 novembre 2023 Google richiede un test chiuso con almeno 12 tester iscritti continuativamente per 14 giorni prima di richiedere accesso alla produzione. Questo requisito è distinto dai test interni e dall’installazione diretta dell’APK.

Fonti: https://capacitorjs.com/docs/getting-started/environment-setup · https://capacitorjs.com/docs/android/deploying-to-google-play · https://support.google.com/googleplay/android-developer/answer/14151465
