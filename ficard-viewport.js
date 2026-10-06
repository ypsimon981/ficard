/* The app scrolls inside a full-height shell; navigation is its bottom row. */
(function(){
 if(scannerBridge)return;
 document.documentElement.classList.add('appShellRoot');
 document.body.classList.add('appShell');
})();
