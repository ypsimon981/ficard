const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function(ctx,html){
 if(!ctx.window)ctx.window={};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../ficard-health.js'),'utf8'),ctx);
 vm.runInContext(html.slice(html.indexOf('function isHealthCard('),html.indexOf('function configureHealthDraft(')),ctx);
};
