from pathlib import Path
import re

index=Path('index.html')
s=index.read_text()

# Header: version + GPS freshness side by side in two compact columns.
release_match=re.search(r'<div class="release">([^<]*v0\.9\.\d+)</div>',s)
if not release_match:
    raise SystemExit('release marker not found')
release_text=release_match.group(1)
meta=f'<div class="headerMeta"><div class="release">{release_text}</div><div id="positionAge" class="positionAge">Posizione · —</div></div>'
s=s[:release_match.start()]+meta+s[release_match.end():]

# Preserve the timestamp supplied by the Geolocation API so we can show how old the reading is.
s=s.replace('const success=p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy});',
            'const success=p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,timestamp:p.timestamp||Date.now()});',1)

# Insert freshness formatter/updater before refreshPosition.
anchor='async function refreshPosition(){'
if anchor not in s:
    raise SystemExit('refreshPosition anchor not found')
js='''function formatPositionAge(ts){
 const age=Math.max(0,Date.now()-Number(ts||0));
 if(age<10000)return "ora";
 if(age<60000)return Math.floor(age/1000)+" s fa";
 if(age<3600000)return Math.floor(age/60000)+" min fa";
 if(age<86400000)return Math.floor(age/3600000)+" h fa";
 return Math.floor(age/86400000)+" gg fa";
}
function updatePositionAge(){
 const el=document.getElementById("positionAge");if(!el)return;
 if(!currentPos||!currentPos.timestamp){el.textContent="Posizione · —";el.dataset.age="none";return}
 const age=Date.now()-Number(currentPos.timestamp||0);
 const accuracy=Number(currentPos.accuracy);
 el.textContent="Posizione · "+formatPositionAge(currentPos.timestamp)+(Number.isFinite(accuracy)?" · ±"+Math.round(accuracy)+" m":"");
 el.dataset.age=age>300000?"old":age>60000?"warm":"fresh";
}
setInterval(updatePositionAge,10000);
'''
s=s.replace(anchor,js+anchor,1)

# Update immediately wherever the app acquires a fresh currentPos.
s=s.replace('currentPos=await getPosition();\n  renderAll();renderOverviewMap();',
            'currentPos=await getPosition();\n  updatePositionAge();renderAll();renderOverviewMap();',1)
s=s.replace('currentPos=p;if(!appendUniqueLocation',
            'currentPos=p;updatePositionAge();if(!appendUniqueLocation',1)
s=s.replace('currentPos=p;setPickerPoint',
            'currentPos=p;updatePositionAge();setPickerPoint',1)

# Bump visible release and CSS cache key.
s=re.sub(r'<div class="release">[^<]*v0\.9\.\d+</div>',lambda m:m.group(0).replace(re.search(r'v0\.9\.\d+',m.group(0)).group(0),'v0.9.134'),s,count=1)
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.134',s,count=1)

# Changelog entry.
if '<span class="changeVersion">v0.9.134</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.134</span><span class="changeTitle">Età della posizione GPS</span><time>07/10/2026</time></summary><ul><li>Versione software e anzianità della posizione sono affiancate nello stesso livello dell’header.</li><li>La posizione mostra età della lettura e accuratezza, aggiornandosi automaticamente ogni 10 secondi.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
index.write_text(s)

css_path=Path('ficard-polish.css')
css=css_path.read_text()
marker='/* Fi-Card v0.9.134: GPS age beside version */'
if marker not in css:
    css += '''\n\n/* Fi-Card v0.9.134: GPS age beside version */\n.headerMeta{display:grid;grid-template-columns:auto auto;align-items:center;column-gap:10px;min-width:0;white-space:nowrap}\n.headerMeta .release,.headerMeta .positionAge{margin:0;font-size:10px;line-height:1.2;color:var(--muted);font-variant-numeric:tabular-nums}\n.headerMeta .positionAge[data-age="fresh"]{color:var(--success)}\n.headerMeta .positionAge[data-age="warm"]{color:var(--warning)}\n.headerMeta .positionAge[data-age="old"]{color:var(--danger)}\n@media(max-width:390px){.headerMeta{column-gap:7px}.headerMeta .release,.headerMeta .positionAge{font-size:9px}}\n'''
css_path.write_text(css)
print('position age patch applied')
