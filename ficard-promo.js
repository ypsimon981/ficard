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
 let index=0,hovered=false;
 banner.addEventListener('mouseenter',()=>hovered=true);banner.addEventListener('mouseleave',()=>hovered=false);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 setInterval(()=>{
  if(document.hidden||hovered||reduced.matches||banner.contains(document.activeElement)||!banner.getClientRects().length||document.querySelector('.modal.show'))return;
  const rect=banner.getBoundingClientRect();if(rect.bottom<=0||rect.top>=window.innerHeight)return;
  index=(index+1)%messages.length;message.textContent=messages[index];
  if(message.animate)message.animate([{opacity:.25},{opacity:1}],{duration:300});
 },6500);
})();
