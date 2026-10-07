from pathlib import Path
import re

css_path=Path('ficard-polish.css')
css=css_path.read_text()
marker='/* Fi-Card v0.9.135: tighter top spacing */'
if marker not in css:
    css += '''\n\n/* Fi-Card v0.9.135: tighter top spacing */\n/* Keep iPhone safe-area from .app, but remove 15 px of extra header air above the logo. */\n.top{padding-top:3px!important;align-items:flex-start!important}\n/* The action buttons align with the visual centre of the Fi-Card logo, not with logo + metadata block. */\n.topActions{padding-top:17px!important;margin-top:0!important;align-self:flex-start!important}\n'''
css_path.write_text(css)

p=Path('index.html')
s=p.read_text()
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.135',s,count=1)
s=re.sub(r'<div class="release">([^<]*?)v0\.9\.\d+</div>',lambda m:'<div class="release">'+m.group(1)+'v0.9.135</div>',s,count=1)
if '<span class="changeVersion">v0.9.135</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.135</span><span class="changeTitle">Header più compatto e allineato</span><time>07/10/2026</time></summary><ul><li>Ridotti di 15 px gli spazi sopra il logo mantenendo intatta la safe area dell’iPhone.</li><li>I pulsanti tema, griglia, aggiorna e installa sono ora allineati verticalmente al logo Fi-Card, indipendentemente dalla riga versione/posizione.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)
print('top spacing and header alignment patch applied')
