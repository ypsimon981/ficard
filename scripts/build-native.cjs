const fs=require('node:fs/promises'),path=require('node:path'),{build}=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'www');
const {nativeHtml}=require('./native-html.cjs');
async function main(){
 const marker=path.join(out,'.ficard-generated');
 try{await fs.access(out);await fs.access(marker);}catch(error){
  if(await fs.stat(out).catch(()=>null))throw Error('Existing www is not a Fi-Card generated directory; preserving it.');
 }
 await fs.mkdir(out,{recursive:true});await fs.writeFile(marker,'Fi-Card generated web bundle\n');
 // Explicit allowlist: no backend, private build files, docs or node_modules.
 for(const entry of await fs.readdir(root,{withFileTypes:true})){
  if(entry.isFile()&&/\.(html|js|css|png|svg|webmanifest)$/.test(entry.name))await fs.copyFile(path.join(root,entry.name),path.join(out,entry.name));
 }
 for(const dir of ['vendor','logos','logos-hq'])await fs.cp(path.join(root,dir),path.join(out,dir),{recursive:true});
 await build({entryPoints:[path.join(root,'native/bootstrap.js')],outfile:path.join(out,'native/ficard-native.js'),bundle:true,format:'iife',target:'es2022',minify:true});
 for(const name of ['index.html','scandixit.html']){
  const file=path.join(out,name),html=await fs.readFile(file,'utf8');
  await fs.writeFile(file,nativeHtml(html,name));
 }
 console.log('Offline Android assets prepared in www.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
