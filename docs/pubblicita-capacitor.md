# Pubblicità in Capacitor

## Stato attuale
La webapp ha tre punti di collegamento: `banner` (sopra i filtri), `fourth` (quarta tessera), `last` (eventuale ultima tessera pari dal posto 16). Gli ultimi due hanno formato `native`, non banner fisso. Le regole di visualizzazione restano in `ficard-content.js`: primi due ingressi giornalieri, rete presente, alternanza casuale nelle tessere. Negli altri casi si mostrano consigli. Il conteggio è locale.

`ficard-ads-config.js` contiene tutti gli identificativi, separati per Android e iOS. Per sicurezza è disattivato e in modalità test. Nessun SDK viene inizializzato, nessuna richiesta pubblicitaria viene inviata.

## Passi quando prepariamo l’app nativa
1. Creare il progetto Capacitor Android/iOS: non è ancora presente in questo repository.
2. Scegliere il fornitore e creare app e unità pubblicitarie nel suo pannello. AdMob è un’opzione, non è collegato automaticamente da Capacitor.
3. Installare un plugin compatibile con la versione Capacitor scelta e i formati richiesti. La guida Capacitor cita `@capacitor-community/admob`; verificare le API disponibili: un banner nativo fisso non equivale a una tessera pubblicitaria scorrevole. Per le tessere occorre supporto native ads e relativo rendering/lifecycle nativo, eventualmente un plugin locale.
4. Implementare l’adattatore descritto sotto; integrare il flusso consenso del fornitore prima di registrarlo. Non riutilizzare il toggle delle statistiche come consenso pubblicitario. Aggiornare privacy e dichiarazioni store prima di abilitare gli SDK.
5. Inserire gli ID per piattaforma in `ficard-ads-config.js`, abilitare `enabled` e provare esclusivamente annunci test. Passare agli ID reali/modalità produzione solo dopo verifiche sul dispositivo.

## Contratto per il plugin
Il bootstrap nativo registra un unico provider:

```js
window.FiCardAds.registerProvider({
 async mount({element,slot,format,unitId,testMode,getBounds,isAllowed}) {
  // Collegare qui le API REALI del plugin scelto, dopo il consenso.
  // Attendere che un annuncio sia caricato. Nessun inventario: throw Error.
  // Non avviare richieste se !isAllowed(). Gestire cancellazioni durante il load.
  // getBounds() restituisce coordinate CSS nella viewport e visible.
  // Il plugin deve convertire correttamente coordinate/inset/DPR per ogni OS.
  return {
   update(rect) { /* Spostare/nascondere la view nativa durante scroll/resize. */ },
   destroy() { /* Annullare load, distruggere view/ad e rimuovere listener. */ }
  };
 }
});
```

Questo è un contratto di integrazione, NON un plugin AdMob già implementato. `mount` deve risolvere solo dopo il caricamento; il consiglio resta visibile in caso di errore. Il bridge segue i nodi ricreati dall’elenco, chiusura pagina, cambio schermata, rete, limite giornaliero e posizione nello schermo. Il plugin deve gestire creatività, clic, etichetta pubblicità, AdChoices, misurazione e consenso secondo le regole del fornitore; non ricostruire un annuncio SDK come semplice link HTML.

Il fallback non deve mai diventare un rettangolo bianco. Gli annunci fuori viewport vanno nascosti tramite `update`; al cambio vista o rimozione del nodo viene chiamato `destroy`. Verificare che non coprano menu, carte, modali o scanner.

Fonti: https://capacitorjs.com/docs/guides/ads · https://capacitorjs.com/docs/plugins · https://github.com/capacitor-community/admob
