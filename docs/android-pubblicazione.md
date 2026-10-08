# Fi-Card: Android e Google Play

## Cosa è pronto
Progetto Capacitor 8, file web inclusi nel pacchetto (`www`, generato), icona Fi-Card, avvio offline, GPS in primo piano, feedback aptico, backup/condivisione tramite pannello Android e tasto Indietro. La webapp GitHub Pages non viene trasformata: le integrazioni native sono applicate al bundle durante `npm run build`.

Identificativo provvisorio: `app.ficard.mobile`. Confermarlo PRIMA del primo caricamento su Google Play: dopo la pubblicazione non è modificabile per la stessa app. Versione iniziale 0.9.179, versionCode 1; aumentare versionCode per ogni nuovo caricamento Play. Non impostare `server.url`: l’app deve usare i file locali anche senza connessione.

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
- Backup salvato effettivamente in File/Drive e ripristinato; il pannello di condivisione NON garantisce che l’utente abbia conservato il file. Prima di un ripristino sostitutivo tenere una copia verificata del backup.
- Condivisione tessera, apertura navigatore, email supporto, link privacy e Indietro Android.
- Statistiche disattivate: nessuna nuova richiesta; annunci sempre disattivati in questa build.

Le tessere già presenti nella webapp non passano automaticamente nell’app Android: prima esportare dalla webapp, poi importare nell’app.

## AAB firmato per Google Play
In Android Studio: Build → Generate Signed App Bundle / APK → **Android App Bundle**. Creare una upload key e conservarne file/password in un posto sicuro, fuori da GitHub. La firma release non è configurata nella build automatica e nessuna chiave è stata generata per conto del titolare.

Caricare l’AAB in un test interno/chiuso, completare scheda store, icona, screenshot, classificazione, pubblico, sicurezza dei dati, dichiarazione pubblicità e URL privacy. Contatto pubblico: info@fi-card.app. Non dichiarare “nessun dato raccolto” se sono attivi i conteggi remoti: verificare categorie e modalità reali prima di compilare Sicurezza dei dati. Prima del lancio controllare anche che la privacy pubblicata sia quella aggiornata.

Per account personali creati dopo il 13 novembre 2023 Google richiede un test chiuso con almeno 12 tester iscritti continuativamente per 14 giorni prima di richiedere accesso alla produzione. Questo requisito è distinto dai test interni e dall’installazione diretta dell’APK.

Fonti: https://capacitorjs.com/docs/getting-started/environment-setup · https://capacitorjs.com/docs/android/deploying-to-google-play · https://support.google.com/googleplay/android-developer/answer/14151465
