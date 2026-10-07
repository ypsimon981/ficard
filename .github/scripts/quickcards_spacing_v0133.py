from pathlib import Path
import re

css=Path('ficard-polish.css')
text=css.read_text()
marker='/* Fi-Card v0.9.133: compact quick-card footer spacing */'
if marker not in text:
    text += '''\n\n/* Fi-Card v0.9.133: compact quick-card footer spacing */\n/* Keep just enough room for distance below the CR80 card, then close the block quickly. */\n.smartBlock{padding:14px 14px 4px!important}\n.smartBlock .smartCarousel.largeQuickCards{padding-top:12px!important;padding-bottom:31px!important}\n.smartCarousel.largeQuickCards.hasShopAddress{padding-bottom:48px!important}\n.smartCarousel.largeQuickCards.hasArrivalMessage{padding-bottom:52px!important}\n.smartCarousel.largeQuickCards.hasShopAddress.hasArrivalMessage{padding-bottom:68px!important}\n'''
css.write_text(text)

p=Path('index.html')
s=p.read_text()
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.133',s,count=1)
s=re.sub(r'<div class="release">[^<]*v0\.9\.\d+</div>','<div class="release">07/10/2026 · v0.9.133</div>',s,count=1)
if '<span class="changeVersion">v0.9.133</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.133</span><span class="changeTitle">Carte rapide più compatte</span><time>07/10/2026</time></summary><ul><li>Ridotto nettamente lo spazio bianco sotto la distanza nelle Carte rapide.</li><li>Il contenitore ora si chiude quasi subito dopo il dato di distanza.</li><li>Quando è presente anche un indirizzo o un messaggio, FiCard conserva automaticamente lo spazio necessario.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)
print('quick-card spacing patch applied')
