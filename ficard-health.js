/* Italian health card: local syntax checks, never an issuance/identity check.
 * Barcode: MEF, Caratteristiche tecniche e parametri della Tessera sanitaria, §5.
 */
(function(root){
 'use strict';
 const odd=[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];
 const substitutions='LMNPQRSTUV';
 function normalize(value){return String(value??'').trim().toUpperCase()}
 function valid(value){
  const code=normalize(value);
  if(!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(code))return false;
  const digit=ch=>/\d/.test(ch)?Number(ch):substitutions.indexOf(ch);
  const dayCode=digit(code[9])*10+digit(code[10]);
  if(!((dayCode>=1&&dayCode<=31)||(dayCode>=41&&dayCode<=71)))return false;
  const day=dayCode>40?dayCode-40:dayCode,month='ABCDEHLMPRST'.indexOf(code[8]);
  const year=digit(code[6])*10+digit(code[7]);
  // YY=00 can represent a leap year (2000), so do not infer the century.
  if(day>[31,year%4===0?29:28,31,30,31,30,31,31,30,31,30,31][month])return false;
  let sum=0;
  for(let i=0;i<15;i++){
   const n=/\d/.test(code[i])?Number(code[i]):code.charCodeAt(i)-65;
   sum+=i%2===0?odd[n]:n;
  }
  return code[15]===String.fromCharCode(65+sum%26);
 }
 root.FiCardHealth=Object.freeze({normalize,valid,error:'Codice fiscale non valido: controlla i 16 caratteri, la data e la lettera finale.'});
})(typeof window==='object'?window:globalThis);
