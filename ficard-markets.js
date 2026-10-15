/* Fi-Card country capabilities v0.9.223. Offline-only country inference, no coordinates persisted or transmitted. */
(function(root){
'use strict';
const KEY='ficard.market.preferences.v1';
const MARKETS=Object.freeze({
 IT:Object.freeze({name:'Italia',features:Object.freeze({receiptLottery:true,healthCard:false})}),
 FR:Object.freeze({name:'Francia',features:Object.freeze({receiptLottery:false,healthCard:false})}),
 XX:Object.freeze({name:'Altri Paesi',features:Object.freeze({receiptLottery:false,healthCard:false})})
});
const ZONES=Object.freeze({
 IT:[[40.8,43.9,11.3,14.1],[44.7,45.6,8.7,12.6],[38.6,41.1,14.8,17.2],[37.25,38.05,12.7,15.0],[39.4,40.5,8.6,9.45]],
 FR:[[44.3,48.8,-2.1,5.0],[48.0,49.2,1.2,3.5],[43.3,44.3,0.7,4.8]]
});
function cleanCountry(c){return Object.hasOwn(MARKETS,c)?c:'XX'}
function read(){
 try{
  const v=JSON.parse(root.localStorage.getItem(KEY)||'null');
  return {residence:cleanCountry(v?.residence||'IT'),override:['auto','IT','FR','XX'].includes(v?.override)?v.override:'auto'};
 }catch{return {residence:'IT',override:'auto'}}
}
let prefs=read(),position=null,listener=null;
function detect(p){
 if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||!Number.isFinite(p.accuracy)||p.accuracy>1000||Date.now()-Number(p.timestamp||0)>600000)return null;
 for(const [code,zones] of Object.entries(ZONES)){
  if(zones.some(([minLat,maxLat,minLng,maxLng])=>p.lat>=minLat&&p.lat<=maxLat&&p.lng>=minLng&&p.lng<=maxLng))return code;
 }
 // Outside the Italian geographic envelope: avoid showing Italy-only checkout reminders abroad.
 if(p.lat<35||p.lat>48||p.lng<6||p.lng>19)return 'XX';
 return null; // Near borders or unclassified: do not guess.
}
function current(){
 if(prefs.override!=='auto')return {country:prefs.override,source:'manual'};
 const detected=detect(position);
 return detected?{country:detected,source:'gps'}:{country:prefs.residence,source:'residence'};
}
function enabled(feature){return !!MARKETS[current().country]?.features[feature]}
function notify(){render();listener?.()}
function store(next){
 prefs={residence:cleanCountry(next.residence),override:['auto','IT','FR','XX'].includes(next.override)?next.override:'auto'};
 try{root.localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}
 notify();
}
function setPosition(p){position=p||null;notify()}
function render(){
 const residence=root.document.getElementById('marketResidence');
 const override=root.document.getElementById('marketOverride');
 const status=root.document.getElementById('marketStatus');
 if(residence)residence.value=prefs.residence;
 if(override)override.value=prefs.override;
 const {country,source}=current();
 if(root.document.body)root.document.body.dataset.market=country;
 if(status){
  const label=MARKETS[country].name;
  const detail=source==='gps'?'posizione rilevata sul dispositivo':source==='manual'?'scelta manuale':'Paese di residenza (posizione non determinata con certezza)';
  status.textContent='Mercato attivo: '+label+' · '+detail;
 }
 const codes=root.document.getElementById('usefulCodesBox');
 if(codes)codes.hidden=!enabled('receiptLottery')&&!enabled('healthCard');
 const quickAdd=root.document.getElementById('lotteryAddFromCard');
 if(quickAdd)quickAdd.hidden=!enabled('receiptLottery');
}
function init(){
 const d=root.document;
 d.getElementById('marketResidence')?.addEventListener('change',e=>store({...prefs,residence:e.target.value}));
 d.getElementById('marketOverride')?.addEventListener('change',e=>store({...prefs,override:e.target.value}));
 render();
}
root.FiCardMarkets={MARKETS,current,enabled,setPosition,onChange:fn=>{listener=fn},render,detect,read:()=>({...prefs})};
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();
})(window);
