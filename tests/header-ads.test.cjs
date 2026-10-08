const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('header keeps only theme/refresh and software version lives in settings',()=>{
 const html=read('index.html'),header=html.match(/<header class="top">([\s\S]*?)<\/header>/)[1];
 assert.match(header,/id="themeBtn"/);assert.match(header,/id="refreshBtn"/);
 assert.doesNotMatch(header,/gridBtn|installBtn|class="release"/);
 assert.doesNotMatch(html,/getElementById\(['"](?:gridBtn|installBtn)['"]\)/);
 assert.match(html,/softwareVersion[\s\S]*?class="release">v0\.9\.177/);
});
function bridge({enabled=true,native=true,eligible=true,providerFail=false}={}){
 const callbacks=[],classes=new Set(),events={};
 const el={dataset:{adSlot:'banner',adFormat:'banner'},isConnected:true,getClientRects:()=>[1],getBoundingClientRect:()=>({x:0,y:20,width:300,height:60,top:20,bottom:80,left:0,right:300}),classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
 const root={FiCardAdsConfig:{enabled,testMode:true,units:{android:{banner:'test-unit'}}},Capacitor:{getPlatform:()=> 'android',isNativePlatform:()=>native},FiCardContent:{slotAllowsAd:()=>eligible},innerHeight:800,innerWidth:400,
 document:{readyState:'complete',body:{},hidden:false,querySelectorAll:()=>[el],addEventListener:(n,fn)=>events[n]=fn},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>callbacks.push(fn),addEventListener:(n,fn)=>events[n]=fn};
 let mounts=0,destroys=0,updates=0;
 vm.runInNewContext(read('ficard-ads.js'),{window:root});
 root.FiCardAds.registerProvider({async mount(ctx){mounts++;assert.equal(ctx.unitId,'test-unit');assert.equal(ctx.testMode,true);if(providerFail)throw Error('no fill');return {destroy(){destroys++;},update(){updates++;}};}});
 return {root,classes,el,events,get mounts(){return mounts},get destroys(){return destroys},async flush(){while(callbacks.length){callbacks.shift()();await new Promise(resolve=>setImmediate(resolve));}}};
}
test('native bridge stays disabled without native platform, config or eligibility',async()=>{
 for(const options of [{enabled:false},{native:false},{eligible:false}]){const b=bridge(options);await b.flush();assert.equal(b.mounts,0);}
});
test('native bridge mounts once, destroys on hide, handles late loads and retains fallback on error',async()=>{
 const b=bridge();await b.flush();assert.equal(b.mounts,1);assert.ok(b.classes.has('nativeAdLoaded'));
 b.root.FiCardAds.refresh();await b.flush();assert.equal(b.mounts,1);
 b.root.document.hidden=true;b.events.visibilitychange();await b.flush();assert.equal(b.destroys,1);assert.equal(b.classes.has('nativeAdLoaded'),false);
 const failed=bridge({providerFail:true});await failed.flush();failed.root.FiCardAds.refresh();await failed.flush();assert.equal(failed.mounts,1);assert.equal(failed.classes.size,0);
 const late=bridge();late.el.isConnected=false;await late.flush();assert.equal(late.mounts,0);
});
