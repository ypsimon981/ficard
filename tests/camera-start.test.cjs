const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function reader(){const root={};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../ficard-reader.js'),'utf8'),{window:root,setTimeout,clearTimeout});return root.FiCardReader;}
test('camera retries device startup failures with valid video constraints',async()=>{const calls=[];let stops=0;let clears=0;const onRead=()=>{};const decoder={start(camera,config,callback){calls.push({camera,config,callback});if(calls.length<3)return Promise.reject(new Error('NotReadableError: Could not start video source'));return Promise.resolve('running')},stop(){stops++;return Promise.resolve()},clear(){clears++}};assert.equal(await reader().startLive(decoder,onRead),'running');assert.equal(calls.length,3);assert.equal(stops,2);assert.equal(clears,2);assert.equal(calls[0].camera.facingMode,'environment');assert.equal(calls[1].config.videoConstraints.facingMode.ideal,'environment');assert.equal(calls[2].config.videoConstraints.width.ideal,1280);assert.ok(calls.every(c=>c.callback===onRead))});
test('camera never retries permission denial',async()=>{let calls=0;const decoder={start(){calls++;return Promise.reject(new Error('NotAllowedError: Permission denied'))}};await assert.rejects(reader().startLive(decoder,()=>{}),/NotAllowedError/);assert.equal(calls,1)});

test('card scan prefers a higher resolution rear camera and cancels further attempts on close',async()=>{
 let current=true;
 const calls=[];
 const decoder={
  start(camera,{videoConstraints}){
   calls.push({camera,videoConstraints});
   current=false;
   return Promise.reject(new Error('NotReadableError'));
  },
  stop(){return Promise.resolve()},
  clear(){}
 };
 await reader().startLive(decoder,()=>{},{card:true,isCurrent:()=>current});
 assert.equal(calls.length,1);
 assert.equal(calls[0].videoConstraints.facingMode.ideal,'environment');
 assert.equal(calls[0].videoConstraints.width.ideal,1280);
});

test('card camera enables continuous focus, toggles torch and disposes its controls',async()=>{
 const changes=[];
 const track={
  getCapabilities:()=>({focusMode:['continuous'],torch:true}),
  getConstraints:()=>({width:{ideal:1280}}),
  applyConstraints:async constraints=>changes.push(constraints)
 };
 const video={srcObject:{getVideoTracks:()=>[track]}};
 const button={hidden:true,setAttribute(name,value){this[name]=value}};
 const release=reader().cardCameraControls(video,button,()=>true);
 await new Promise(setImmediate);
 assert.equal(changes[0].advanced[0].focusMode,'continuous');
 assert.equal(changes[0].width.ideal,1280);
 assert.equal(button.hidden,false);
 await button.onclick();
 assert.equal(changes[1].advanced[0].torch,true);
 assert.equal(button['aria-pressed'],'true');
 release();
 assert.equal(button.onclick,null);
 assert.equal(button.hidden,true);
});
