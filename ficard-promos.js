/* Aggregate counters only: no identity, card or product contents. */
(function(root){
'use strict';
const seen=new Set();let observer;
function analytics(){try{return root.parent!==root?root.parent.FiCardAnalytics:root.FiCardAnalytics}catch{return null}}
function page(){return root.document.body.classList.contains('scanDixitPage')?'scandixit':undefined}
function count(event,el){if(el?.classList.contains('nativeAdLoaded'))return;return analytics()?.track(event,page(),el?el.dataset.adSlot+':'+el.dataset.promoCampaign:'')}
function scan(){
 if(!observer)return;
 for(const el of root.document.querySelectorAll('[data-promo-campaign]'))observer.observe(el);
}
function init(){
 const slot=root.document.getElementById('scanContentBanner');
 if(slot&&root.FiCardContent){slot.innerHTML=root.FiCardContent.html('scandixit',true)}
 if(root.IntersectionObserver){observer=new root.IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target,key=el.dataset.adSlot+':'+el.dataset.promoCampaign;if(entry.intersectionRatio>=.5&&!root.document.hidden&&!seen.has(key)&&analytics()?.enabled()){seen.add(key);count('promo_impression',el)}}},{threshold:.5});scan();new root.MutationObserver(scan).observe(root.document.body,{childList:true,subtree:true});}
 root.document.addEventListener('visibilitychange',scan);
 root.document.addEventListener('click',e=>{const el=e.target.closest?.('[data-promo-campaign]');if(!el)return;count('promo_click',el);
  if(page()==='scandixit'&&el.dataset.contentView){e.preventDefault();try{if(root.parent!==root&&root.parent.go){root.parent.go(el.dataset.contentView);root.parent.document.getElementById('cardSharingMessages')?.scrollIntoView({block:'center'});return}}catch{}root.location.href=root.ScanDixitStandalone?'/#download':'./#profile';}
 },true);
}
root.FiCardPromoCount=count;
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
