# Fi-Card — sito vetrina

Sito statico autonomo per fi-card.app. Nessuna dipendenza, nessun servizio backend, nessun sistema di analytics. Le immagini sono screenshot della webapp con le carte dimostrative incluse nell’app. Le card dimostrative non sono tessere valide.

## Pubblicazione su OVH

Caricare il contenuto del pacchetto (index.html, styles.css, site.js, cartella assets, robots.txt, sitemap.xml e .htaccess) nella cartella www dell’hosting associato a fi-card.app. index.html deve essere direttamente in www, non in una sottocartella. README.md non è necessario per la pubblicazione.

La configurazione DNS e il certificato HTTPS restano quelli del dominio/hosting OVH. Il sito non modifica la webapp, che continua a essere ospitata separatamente.

## Collegamenti agli store

Le versioni native non sono ancora pubblicate: le due piattaforme riportano Prossimamente. Dopo il lancio, sostituire i badge di index.html con i collegamenti reali ad App Store e Google Play. Nessuna URL di store è stata inventata.

## Screenshot e contenuti

Le schermate mostrano la versione web v0.9.131. Home e Carte rapide illustrano un negozio associato con posizione simulata, senza usare la posizione dell’utente. Immagini locali, font di sistema e icone SVG: il sito non carica script, font o immagini da terze parti. Mappe e ScanDixit nelle immagini sono fotografie dell’interfaccia, non sessioni live.

## Anteprima locale

Aprire index.html nel browser oppure servire questa cartella con un server HTTP statico. Tutti i percorsi sono relativi e funzionano dalla radice del dominio o da una sottocartella.

## Testi e pagine informative

La home introduce le carte fedeltà offline e la vicinanza ai negozi. Le pagine carte-fedelta-offline.html e carta-negozio-gps.html rispondono a domande differenti: disponibilità offline e backup; associazione del negozio e limiti del GPS. Il sito dichiara che le versioni native sono in preparazione. Contatto pubblico: info@fi-card.app.

La guida importare-carte-fedelta.html descrive l’importazione di una tessera alla volta da foto o screenshot, senza promettere il trasferimento di account, punti o buoni. La sitemap comprende le quattro pagine. Dopo il caricamento su OVH, verificare il dominio in Google Search Console con un record DNS e inviare sitemap.xml. Non sono richiesti analytics o cookie di tracciamento per questa verifica. L’indicizzazione, il posizionamento, Discover e la presenza nelle risposte AI non sono garantiti.
