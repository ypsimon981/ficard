const fs=require('node:fs'),path=require('node:path');
module.exports=['it','en','fr','es','pt','nl','de'].map(lang=>fs.readFileSync(path.join(__dirname,'../locales',lang+'.js'),'utf8')).join('\n');
