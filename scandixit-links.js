/* User-initiated app opening; shared URLs remain ordinary HTTPS links. */
(function(root){
'use strict';
function appLink(code,android=false){
 if(!/^\d{8,14}$/.test(code))return '';
 const fallback='https://fi-card.app/scandixit/?code='+code;
 return android?'intent://scandixit?code='+code+'#Intent;scheme=ficard;package=fi.card.app;S.browser_fallback_url='+encodeURIComponent(fallback)+';end':'ficard://scandixit?code='+code;
}
if(typeof module==='object')module.exports={appLink};
root.ScanDixitLinks={appLink};
})(typeof window==='undefined'?globalThis:window);
