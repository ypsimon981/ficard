const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),android=path.join(root,'android');
function cap(...args){const result=spawnSync(process.execPath,[path.join(root,'node_modules/@capacitor/cli/bin/capacitor'),...args],{cwd:root,stdio:'inherit'});if(result.status!==0)throw Error('Capacitor command failed');}
async function main(){
 if(!fs.existsSync(android))cap('add','android');else cap('sync','android');
 const manifest=path.join(android,'app/src/main/AndroidManifest.xml');let xml=fs.readFileSync(manifest,'utf8');
 for(const permission of ['ACCESS_COARSE_LOCATION','ACCESS_FINE_LOCATION','CAMERA']){
  if(!xml.includes('android.permission.'+permission))xml=xml.replace('</manifest>','    <uses-permission android:name="android.permission.'+permission+'" />\n</manifest>');
 }
 xml=xml.replace(/android:allowBackup="true"/,'android:allowBackup="false"');fs.writeFileSync(manifest,xml);
 const gradle=path.join(android,'app/build.gradle');let source=fs.readFileSync(gradle,'utf8');
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 source=source.replace(/versionName\s*(?:=\s*)?"[^"]+"/,'versionName = "'+version+'"');fs.writeFileSync(gradle,source);
 const res=path.join(android,'app/src/main/res');
 for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
  const dir=path.join(res,'mipmap-'+density);fs.mkdirSync(dir,{recursive:true});
  for(const name of ['ic_launcher.png','ic_launcher_round.png'])await sharp(path.join(root,'icon-512.png')).resize(size,size).png().toFile(path.join(dir,name));
  await sharp(path.join(root,'icon-512.png')).resize(Math.round(size*1.5),Math.round(size*1.5)).extend({top:Math.round(size*.375),bottom:Math.round(size*.375),left:Math.round(size*.375),right:Math.round(size*.375),background:'#FFFFFF'}).png().toFile(path.join(dir,'ic_launcher_foreground.png'));
 }
 for(const entry of fs.readdirSync(res,{withFileTypes:true})){
  if(!entry.isDirectory()||!entry.name.startsWith('drawable'))continue;
  const splash=path.join(res,entry.name,'splash.png');if(!fs.existsSync(splash))continue;
  const {width,height}=await sharp(splash).metadata(),size=Math.round(Math.min(width,height)*.25);
  const icon=await sharp(path.join(root,'icon-512.png')).resize(size,size).png().toBuffer();
  await sharp({create:{width,height,channels:4,background:'#FFFFFF'}}).composite([{input:icon,gravity:'centre'}]).png().toFile(splash+'.tmp.png');
  fs.renameSync(splash+'.tmp.png',splash);
 }
 console.log('Android project ready. Open Android Studio with npm run android:open.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
