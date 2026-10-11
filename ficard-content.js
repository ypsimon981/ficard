/* Fi-Card v0.9.198 · Local daily cap, stable session content, offline tips. */
(function(root){
'use strict';
const DAILY='ficard.content.day.v1',SESSION='ficard.content.session.v1',IDLE=30*60*1000;
let count=3,last=0,choices={};
const COPY={
 it:["Consiglio","Pubblicità","Apri","Associa il negozio","Aggiungi il punto vendita alla tessera: sarà più facile trovarla quando sei vicino.","Salva un backup","Conserva una copia delle tue tessere dalle Impostazioni.","Prova ScanDixit","Scansiona un prodotto per cercare informazioni prima di acquistarlo.","Condividi tutte le tue carte","Scambiatevi i backup in famiglia: vengono aggiunte solo le carte mancanti."],
 en:["Tip","Advertisement","Open","Link your store","Add a store location to your card to find it more easily nearby.","Save a backup","Keep a copy of your cards from Settings.","Try ScanDixit","Scan a product to look up information before buying.","Share all your cards","Exchange family backups: only missing cards are added."],
 fr:["Conseil","Publicité","Ouvrir","Associez le magasin","Ajoutez le magasin à votre carte pour la retrouver à proximité.","Sauvegardez vos cartes","Conservez une copie de vos cartes dans les paramètres.","Essayez ScanDixit","Scannez un produit pour chercher des informations avant de l’acheter.","Partagez toutes vos cartes","Échangez vos sauvegardes en famille : seules les cartes manquantes sont ajoutées."],
 es:["Consejo","Publicidad","Abrir","Asocia la tienda","Añade la ubicación a tu tarjeta para encontrarla cuando estés cerca.","Guarda una copia","Conserva una copia de tus tarjetas desde Ajustes.","Prueba ScanDixit","Escanea un producto para buscar información antes de comprarlo.","Comparte todas tus tarjetas","Intercambiad copias en familia: solo se añaden las tarjetas que faltan."],
 pt:["Dica","Publicidade","Abrir","Associe a loja","Adicione a localização ao cartão para o encontrar quando estiver perto.","Guarde uma cópia","Guarde uma cópia dos cartões nas Definições.","Experimente ScanDixit","Leia um produto para procurar informações antes de comprar.","Partilha todos os teus cartões","Troquem cópias em família: só são adicionados os cartões em falta."],
 nl:["Tip","Advertentie","Openen","Koppel je winkel","Voeg een winkellocatie toe om je kaart dichtbij makkelijk te vinden.","Bewaar een back-up","Bewaar een kopie van je kaarten via Instellingen.","Probeer ScanDixit","Scan een product voor informatie voordat je het koopt.","Deel al je kaarten","Wissel back-ups uit met je familie: alleen ontbrekende kaarten worden toegevoegd."],
 de:["Tipp","Werbung","Öffnen","Geschäft verknüpfen","Füge den Standort hinzu, um deine Karte in der Nähe leichter zu finden.","Backup speichern","Speichere eine Kopie deiner Karten in den Einstellungen.","ScanDixit testen","Scanne ein Produkt für Informationen vor dem Kauf.","Teile alle deine Karten","Tauscht Backups in der Familie aus: Nur fehlende Karten werden hinzugefügt."]
};
const SHARING={
 it:{intro:'Condividi il tuo set in pochi tocchi',disclaimer:'Condividi e utilizza le carte solo dove consentito dal programma fedeltà. Sconti e accumulo punti dipendono dalle condizioni del negozio.',items:[
  ['Tu condividi, i vantaggi si sommano','Invita un’amica su Fi-Card e condividi le tue carte: dove consentito, lei accede agli sconti e i suoi acquisti possono far crescere i punti sulla tua carta.'],
  ['Uno per tutti, tutti per uno','Condividi il tuo set di carte fedeltà con tutta la famiglia. Ognuno le ritrova sul proprio telefono, pronte quando servono. Niente più «Chi ha la carta?» alla cassa.'],
  ['Ti manca una carta? Magari ce l’ha un amico','Invita un amico su Fi-Card e scambiatevi le carte che vi mancano. Tu continui a usare le tue, lui le sue. Dove consentito, puoi usare la sua nei negozi di cui non hai la carta, e viceversa. Più carte a disposizione, senza doverle richiedere tutte.']
 ]},
 en:{intro:'Share your card set in a few taps',disclaimer:'Share and use cards only where the loyalty programme permits it. Discounts and points depend on the store’s terms.',items:[['You share, the benefits add up','Invite a friend to Fi-Card and share your cards: where permitted, they can access discounts and their purchases may earn points on your card.'],['All for one, one for all','Share your loyalty card set with the whole family. Everyone has the cards on their own phone, ready when needed. No more “Who has the card?” at checkout.'],['Missing a card? A friend may have it','Invite a friend to Fi-Card and exchange the cards you are missing. You each keep using your own cards. Where permitted, use theirs at stores where you have no card, and vice versa. More cards without applying for every one.']]},
 fr:{intro:'Partagez vos cartes en quelques gestes',disclaimer:'Partagez et utilisez les cartes uniquement si le programme de fidélité le permet. Les réductions et les points dépendent des conditions du magasin.',items:[['Vous partagez, les avantages s’ajoutent','Invitez un ami sur Fi-Card et partagez vos cartes : lorsque cela est autorisé, il profite des réductions et ses achats peuvent rapporter des points sur votre carte.'],['Un pour tous, tous pour un','Partagez vos cartes de fidélité avec toute la famille. Chacun les retrouve sur son téléphone, prêtes à servir. Fini le « Qui a la carte ? » à la caisse.'],['Une carte vous manque ? Un ami l’a peut-être','Invitez un ami sur Fi-Card et échangez les cartes qui vous manquent. Chacun continue à utiliser les siennes. Lorsque cela est autorisé, utilisez les siennes dans les magasins où vous n’avez pas de carte, et inversement.']]},
 es:{intro:'Comparte tu conjunto de tarjetas en pocos toques',disclaimer:'Comparte y utiliza tarjetas solo cuando lo permita el programa de fidelización. Los descuentos y puntos dependen de las condiciones de la tienda.',items:[['Tú compartes, las ventajas se suman','Invita a un amigo a Fi-Card y comparte tus tarjetas: donde esté permitido, podrá acceder a descuentos y sus compras podrán sumar puntos en tu tarjeta.'],['Uno para todos, todos para uno','Comparte tus tarjetas de fidelización con toda la familia. Cada persona las tendrá en su teléfono, listas cuando hagan falta. Se acabó preguntar «¿Quién tiene la tarjeta?» en caja.'],['¿Te falta una tarjeta? Quizás un amigo la tenga','Invita a un amigo a Fi-Card e intercambiad las tarjetas que os faltan. Cada uno sigue usando las suyas. Donde esté permitido, usa la suya en las tiendas donde no tengas tarjeta, y viceversa.']]},
 pt:{intro:'Partilha o teu conjunto de cartões em poucos toques',disclaimer:'Partilha e utiliza cartões apenas quando o programa de fidelização o permitir. Descontos e pontos dependem das condições da loja.',items:[['Tu partilhas, as vantagens somam-se','Convida um amigo para o Fi-Card e partilha os teus cartões: quando permitido, ele pode aproveitar descontos e as suas compras podem acumular pontos no teu cartão.'],['Um por todos, todos por um','Partilha os teus cartões de fidelização com toda a família. Cada pessoa fica com os cartões no seu telefone, prontos a usar. Acabou o «Quem tem o cartão?» na caixa.'],['Falta-te um cartão? Um amigo pode tê-lo','Convida um amigo para o Fi-Card e troquem os cartões que vos faltam. Cada um continua a usar os seus. Quando permitido, usa o dele nas lojas onde não tens cartão, e vice-versa.']]},
 nl:{intro:'Deel je kaartenset met een paar tikken',disclaimer:'Deel en gebruik kaarten alleen wanneer het loyaliteitsprogramma dit toestaat. Kortingen en punten hangen af van de winkelvoorwaarden.',items:[['Jij deelt, de voordelen tellen op','Nodig een vriend uit voor Fi-Card en deel je kaarten: waar toegestaan kan die korting krijgen en kunnen aankopen punten opleveren op jouw kaart.'],['Eén voor allen, allen voor één','Deel je klantenkaarten met het hele gezin. Iedereen heeft ze op de eigen telefoon, klaar voor gebruik. Geen “Wie heeft de kaart?” meer bij de kassa.'],['Mis je een kaart? Misschien heeft een vriend die','Nodig een vriend uit voor Fi-Card en wissel ontbrekende kaarten uit. Jullie blijven je eigen kaarten gebruiken. Waar toegestaan gebruik je de kaart van je vriend bij winkels waar jij geen kaart hebt, en andersom.']]},
 de:{intro:'Teile dein Kartenset mit wenigen Fingertipps',disclaimer:'Teile und nutze Karten nur, wenn das Treueprogramm dies erlaubt. Rabatte und Punkte hängen von den Bedingungen des Geschäfts ab.',items:[['Du teilst, die Vorteile summieren sich','Lade einen Freund zu Fi-Card ein und teile deine Karten: Wo erlaubt, erhält er Rabatte und seine Einkäufe können Punkte auf deiner Karte sammeln.'],['Einer für alle, alle für einen','Teile deine Kundenkarten mit der ganzen Familie. Alle haben sie auf dem eigenen Handy griffbereit. Kein „Wer hat die Karte?“ mehr an der Kasse.'],['Dir fehlt eine Karte? Vielleicht hat ein Freund sie','Lade einen Freund zu Fi-Card ein und tauscht fehlende Karten aus. Jeder nutzt weiterhin seine eigenen. Wo erlaubt, nutzt du seine Karte in Geschäften, für die du keine hast – und umgekehrt.']]}
};
function sharingCopy(){return SHARING[Object.keys(COPY).find(lang=>COPY[lang]===copy())]||SHARING.en;}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function day(now){const d=new Date(now);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function session(now=Date.now()){
 try{
  const previous=JSON.parse(root.sessionStorage.getItem(SESSION)||'null');
  const today=day(now),same=previous&&previous.day===today&&now-previous.last<IDLE&&now>=previous.last;
  let daily=JSON.parse(root.localStorage.getItem(DAILY)||'null');
  if(!daily||daily.day!==today)daily={day:today,count:0};
  if(!same){daily.count=Math.min(999,(Number(daily.count)||0)+1);choices={};root.localStorage.setItem(DAILY,JSON.stringify(daily));}
  count=same?Math.max(Number(previous.count)||3,Number(daily.count)||0):daily.count;
  root.sessionStorage.setItem(SESSION,JSON.stringify({day:today,count,last:now}));
 }catch{count=3;}
 last=now;
}
function copy(){let lang=root.FiCardI18n?.language?.();if(!lang){try{lang=root.localStorage.getItem('ficard.language.v2')||root.localStorage.getItem('ficard.language.v1');}catch{}if(!lang){lang=(root.navigator?.languages||[root.navigator?.language]).map(x=>String(x||'').toLowerCase().split('-')[0]).find(x=>COPY[x]);}}return COPY[String(lang||'en').toLowerCase().split('-')[0]]||COPY.en;}
function adAvailable(){return root.navigator?.onLine!==false&&count<=2;}
function slotAllowsAd(slot){model(slot);return adAvailable()&&choices[slot].ad;}
function model(slot){
 const c=copy();let chosen=choices[slot];
 if(!chosen){chosen=choices[slot]={tip:slot==='scandixit'?3+Math.floor(Math.random()*3):Math.floor(Math.random()*6),ad:slot==='banner'||Math.random()<.5};}
 const candidates=Array.isArray(root.FiCardAdContent)?root.FiCardAdContent:[];
 const ad=adAvailable()&&chosen.ad?candidates.find(a=>a&&typeof a.title==='string'&&typeof a.url==='string'&&/^https:\/\//i.test(a.url)):null;
 if(ad)return {label:c[1],title:ad.title,text:ad.text||'',url:ad.url,advert:true};
 const i=chosen.tip;
 if(i>=3){const s=sharingCopy(),item=s.items[i-3];return {label:c[0],title:item[0],text:s.intro,view:'profile',sharing:true,advert:false};}
 return {label:c[0],title:c[3+i*2],text:c[4+i*2],view:['map','profile','scandixit'][i],advert:false};
}
function html(slot,banner=false){
 const m=model(slot),action=m.advert?'href="'+esc(m.url)+'" target="_blank" rel="noopener noreferrer"':'href="#'+m.view+'" data-content-view="'+m.view+'"'+(m.sharing?' data-content-sharing="true"':'');
 return '<a data-ad-slot="'+esc(slot)+'" data-promo-campaign="tip'+choices[slot].tip+'" data-ad-format="'+(banner&&slot!=='scandixit'?'banner':'native')+'" class="'+(banner?'contentBanner':'card advertisingCard contentTile')+'" '+action+' style="--card-color:#E4F8F3;--card-ink:#4324BC"><div class="advertisingContent"><span class="advertisingLabel">'+esc(m.label)+'</span><strong>'+esc(m.title)+'</strong><small>'+esc(m.text)+'</small></div>'+(banner?'<span class="badge">'+esc(copy()[2])+'</span>':'')+'</a>';
}
function renderSharing(){
 const panel=root.document?.getElementById('cardSharingMessages');if(!panel)return;
 const s=sharingCopy();
 panel.innerHTML='<h3>'+esc(s.intro)+'</h3>'+s.items.map(item=>'<details><summary>'+esc(item[0])+'</summary><p>'+esc(item[1])+'</p></details>').join('')+'<p class="sharingDisclaimer">'+esc(s.disclaimer)+'</p>';
}
function render(){const banner=root.document?.getElementById('homeContentBanner');if(banner)banner.innerHTML=html('banner',true);renderSharing();root.renderCards?.();}
root.FiCardContent={html,model,session,adAvailable,slotAllowsAd};session();
root.document?.addEventListener('click',e=>{const link=e.target?.closest?.('[data-content-view]');if(!link)return;e.preventDefault();if(link.classList.contains('nativeAdLoaded'))return;root.go?.(link.dataset.contentView);if(link.dataset.contentSharing){const panel=root.document?.getElementById('cardSharingMessages');panel?.scrollIntoView?.({block:'center',behavior:'auto'});panel?.focus?.({preventScroll:true});}});
root.document?.addEventListener('visibilitychange',()=>{if(root.document.hidden){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}}else{session();render();}});
root.document?.addEventListener('pointerdown',()=>{if(Date.now()-last>60000){try{root.sessionStorage.setItem(SESSION,JSON.stringify({day:day(Date.now()),count,last:Date.now()}));}catch{}last=Date.now();}},{passive:true});
root.addEventListener?.('offline',render);root.addEventListener?.('online',render);root.addEventListener?.('ficard:languagechange',render);
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})(typeof window==='undefined'?globalThis:window);
