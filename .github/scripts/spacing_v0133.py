from pathlib import Path
import re

css_path=Path('ficard-polish.css')
css=css_path.read_text()
marker='/* Fi-Card v0.9.133: compact home spacing */'
if marker not in css:
    css += '''\n\n/* Fi-Card v0.9.133: compact home spacing */\n/* 10 px less between the software version/header and the violet-teal divider. */\n.top{padding-bottom:5px!important}\n\n/* 20 px less total whitespace below quick-card distance/meta. */\n.smartBlock{padding-bottom:8px!important}\n.smartBlock .smartCarousel.largeQuickCards{padding-bottom:24px!important}\n.smartBlock .smartCarousel.largeQuickCards.hasShopAddress{padding-bottom:44px!important}\n.smartBlock .smartCarousel.largeQuickCards.hasArrivalMessage{padding-bottom:56px!important}\n.smartBlock .smartCarousel.largeQuickCards.hasShopAddress.hasArrivalMessage{padding-bottom:76px!important}\n\n/* 5 px less between Quick Cards and the ScanDixit banner. */\n#homeView .smartBlock + .promo[data-go="scandixit"]{margin-top:5px!important}\n\n/* Empty category filter row was reserving about 14-15 px before “Le mie carte”. */\n#homeView #categoryChips:empty{display:none!important}\n'''
css_path.write_text(css)

p=Path('index.html')
s=p.read_text()
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.133',s,count=1)
s=re.sub(r'<div class="release">[^<]*v0\.9\.\d+</div>','<div class="release">07/10/2026 · v0.9.133</div>',s,count=1)
if '<span class="changeVersion">v0.9.133</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.133</span><span class="changeTitle">Home più compatta</span><time>07/10/2026</time></summary><ul><li>Ridotti di 10 px lo spazio sotto la versione software e di 20 px il fondo delle Carte rapide.</li><li>Ridotti di 5 px lo spazio prima del banner ScanDixit e di circa 15 px quello prima di “Le mie carte”.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)
print('spacing patch applied')
