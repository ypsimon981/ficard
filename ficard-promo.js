/* Rotate suggestions only while the home banner is visible and at rest. */
(function(){
 const banner=document.querySelector('.scanPromo'),message=document.getElementById('scanPromoMessage');if(!banner||!message||scannerBridge)return;
 const messages=[
  'Individua gli allergeni indicati prima di acquistare del cibo.',
  'Trova le recensioni della TV che vorresti comprare.',
  'Scopri gli ingredienti di ciò che stai per mettere nel carrello.',
  'Leggi le opinioni prima di scegliere un elettrodomestico.',
  'Scopri cosa contiene il cosmetico che ti interessa.',
  'Hai un prodotto davanti? Cercalo online senza digitarne il nome.'
 ];
 const colors=['#DCF5F0','#E9E3FA','#E2EEF9','#F8E5ED','#FFF0D8','#E8F2DD'];
 let order=[],last=-1,color=-1,hovered=false;
 function shuffle(values){for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]]}return values}
 function next(){
  if(!order.length){order=shuffle(messages.map((_,i)=>i));if(order[order.length-1]===last)[order[0],order[order.length-1]]=[order[order.length-1],order[0]]}
  last=order.pop();message.textContent=messages[last];
  const options=colors.map((_,i)=>i).filter(i=>i!==color);color=options[Math.floor(Math.random()*options.length)];banner.style.setProperty('--scan-promo-bg',colors[color]);
 }
 next();
 banner.addEventListener('mouseenter',()=>hovered=true);banner.addEventListener('mouseleave',()=>hovered=false);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 setInterval(()=>{
  if(document.hidden||hovered||reduced.matches||banner.contains(document.activeElement)||!banner.getClientRects().length||document.querySelector('.modal.show'))return;
  const rect=banner.getBoundingClientRect();if(rect.bottom<=0||rect.top>=window.innerHeight)return;
  next();
  if(message.animate)message.animate([{opacity:.25},{opacity:1}],{duration:300});
 },3000);
})();
