from pathlib import Path
import re

css_path=Path('ficard-polish.css')
css=css_path.read_text()
marker='/* Fi-Card v0.9.136: compact bottom menu */'
if marker not in css:
    css += '''\n\n/* Fi-Card v0.9.136: compact bottom menu */\n/* Remove about 20 px of white from the lower part of the nav without shrinking icons/labels. */\n.bottom{\n  min-height:58px!important;\n  padding-bottom:max(0px,calc(12px + env(safe-area-inset-bottom) - 20px))!important;\n}\n'''
css_path.write_text(css)

p=Path('index.html')
s=p.read_text()
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.136',s,count=1)
s=re.sub(r'<div class="release">([^<]*?)v0\.9\.\d+</div>',lambda m:'<div class="release">'+m.group(1)+'v0.9.136</div>',s,count=1)
if '<span class="changeVersion">v0.9.136</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.136</span><span class="changeTitle">Menu inferiore più compatto</span><time>07/10/2026</time></summary><ul><li>Ridotti di circa 20 px il fondo bianco e l’altezza complessiva del menu inferiore, senza ridurre icone o testi.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)
print('bottom menu compact patch applied')
