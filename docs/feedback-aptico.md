# Feedback aptico

La webapp emette un impulso breve (10 ms) nei browser che supportano navigator.vibrate. Le azioni automatiche e lo scroll non emettono impulsi.

Per la build nativa, installare @capacitor/haptics della stessa versione principale di Capacitor e poi eseguire npx cap sync. Il runtime registra il plugin Haptics e usa impact con stile LIGHT quando disponibile. Il progetto web non contiene ancora il contenitore nativo: questa installazione va fatta durante la preparazione di Android/iOS.

Azioni: apri carta, preferiti, navigazione, aggiungi/salva carta, ricerca, filtri e chiusura finestre. Le selezioni già attive e i controlli disabilitati sono esclusi.
