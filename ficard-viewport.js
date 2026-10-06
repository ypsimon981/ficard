/* Keep the bottom menu on the visible screen when iOS WebKit shifts fixed layers. */
(function(){
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const nav=document.querySelector('.bottom'),viewport=window.visualViewport;
 if(!ios||!nav||!viewport||scannerBridge)return;
 let frame=0;
 function sync(){frame=0;const top=(Number.isFinite(viewport.pageTop)?viewport.pageTop:window.scrollY+viewport.offsetTop)+viewport.height-nav.offsetHeight;
  nav.style.setProperty('--nav-page-top',Math.max(0,top)+'px');nav.classList.add('viewportAnchored');
 }
 function queue(){if(!frame)frame=requestAnimationFrame(sync)}
 for(const event of ['resize','scroll']){viewport.addEventListener(event,queue,{passive:true});window.addEventListener(event,queue,{passive:true})}
 window.addEventListener('pageshow',queue);window.addEventListener('orientationchange',queue);
 if(window.ResizeObserver)new ResizeObserver(queue).observe(nav);
 sync();
})();
