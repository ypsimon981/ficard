from pathlib import Path
import re

p=Path('index.html')
s=p.read_text()
old='non cercare la tua card, è lei che trova te.'
new='Non cercare la tua card, è lei che trova te.'
if old not in s and new not in s:
    raise SystemExit('arrival copy not found')
s=s.replace(old,new,1)
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.137',s,count=1)
s=re.sub(r'<div class="release">([^<]*?)v0\.9\.\d+</div>',lambda m:'<div class="release">'+m.group(1)+'v0.9.137</div>',s,count=1)
if '<span class="changeVersion">v0.9.137</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.137</span><span class="changeTitle">Messaggio di prossimità su una riga</span><time>07/10/2026</time></summary><ul><li>Il messaggio quando sei nel negozio ora è “Non cercare la tua card, è lei che trova te.” e resta su una sola riga.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)

cssp=Path('ficard-polish.css')
css=cssp.read_text()
marker='/* Fi-Card v0.9.137: single-line arrival message */'
if marker not in css:
    css += '''\n\n/* Fi-Card v0.9.137: single-line arrival message */\n.smartCarousel .smartCard .smartMeta.arrivalMessage{\n  white-space:nowrap!important;\n  overflow:visible!important;\n  text-overflow:clip!important;\n  font-size:clamp(10.5px,3.05vw,13px)!important;\n  line-height:1.2!important;\n  letter-spacing:-.025em!important;\n}\n.smartCarousel .smartCard .smartMeta.arrivalMessage .smartDistance{white-space:nowrap!important}\n'''
cssp.write_text(css)
print('arrival message updated')
