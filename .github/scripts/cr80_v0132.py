from pathlib import Path
import re

css=Path('ficard-polish.css')
text=css.read_text()
marker='/* Fi-Card v0.9.132: CR80 card proportions */'
if marker not in text:
    text += '''\n\n/* Fi-Card v0.9.132: CR80 card proportions */\n/* ISO/IEC 7810 ID-1 / CR80: 85.60 x 53.98 mm = 1.5858:1 */\n.cardShelf .cardItem,.usageGrid .cardItem,.smartCarousel .smartCard{\n  aspect-ratio:85.60/53.98!important;\n  height:auto!important;\n  min-height:0!important;\n}\n.smartCarousel.largeQuickCards .smartCard{\n  aspect-ratio:85.60/53.98!important;\n  height:auto!important;\n  min-height:0!important;\n}\n.smartCarousel.denseNearby .smartCard,.smartCarousel.proximityFocus .smartCard{\n  aspect-ratio:85.60/53.98!important;\n  height:auto!important;\n  min-height:0!important;\n}\n'''
css.write_text(text)

p=Path('index.html')
s=p.read_text()
s=re.sub(r'ficard-polish\.css\?v=0\.9\.\d+','ficard-polish.css?v=0.9.132',s,count=1)
s=re.sub(r'<div class="release">[^<]*v0\.9\.\d+</div>','<div class="release">07/10/2026 · v0.9.132</div>',s,count=1)
if '<span class="changeVersion">v0.9.132</span>' not in s:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.132</span><span class="changeTitle">Tessere in formato CR80</span><time>07/10/2026</time></summary><ul><li>Tutte le anteprime delle tessere usano ora il rapporto CR80/ID-1 reale: 85,60 × 53,98 mm (1,586:1).</li><li>Uniformate anche Carte rapide, modalità vicinanza e layout densi, che prima risultavano più alti.</li><li>La zona barcode della carta aperta resta invariata per non ridurre la leggibilità in cassa.</li></ul></details>'
    s=s.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(s)
print('CR80 patch applied')
