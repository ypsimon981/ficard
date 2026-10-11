# Banner e tessere: pubblicità o consigli

Il conteggio locale riguarda nuove sessioni, non i cambi di sezione. Una sessione riprende dopo meno di 30 minuti di inattività; dal terzo ingresso nel giorno del dispositivo sono mostrati solo consigli. Non vengono trasmessi conteggi né identificatori. Se lo storage è indisponibile, la scelta prudente è solo consigli.

Offline e in assenza di annunci disponibili vengono sempre mostrati consigli. Nei primi due ingressi online il banner privilegia un annuncio disponibile; le tessere scelgono casualmente fra annuncio e consiglio. La scelta del consiglio rimane stabile nella sessione. Un annuncio già visibile viene sostituito da un consiglio passando offline.

Non è ancora collegato un fornitore pubblicitario: l’inventario iniziale è vuoto. Il punto d’integrazione è `window.FiCardAdContent`, un elenco di oggetti `{title,text,url}`; sono accettati soltanto URL HTTPS e il testo viene sempre escapato. Il collegamento di SDK, consenso o tracciamenti pubblicitari richiede una valutazione separata prima del rilascio.

I consigli riguardano associazione negozi, backup, ScanDixit e tre inviti alla condivisione: vantaggi e punti, famiglia, scambio fra amici. Sono disponibili nelle sette lingue dell’app e rimangono stabili nella sessione. Gli inviti aprono la sezione condivisione nelle Impostazioni, senza inviare file automaticamente.

La sezione condivisione presenta i tre messaggi espandibili e un disclaimer sempre visibile sulle condizioni dei programmi fedeltà. La promessa di rapidità è «in pochi tocchi», senza tempi garantiti. Rimane visibile l’avviso che il backup contiene anche alias, note, foto e punti vendita. Non sono stati aggiunti tracciamenti, inviti automatici o modifiche al contenuto dei backup.
