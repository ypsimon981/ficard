from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p = Path('index.html')
text = p.read_text()

marker = '/* v0.9.68 · Per-brand wallet logo rendering */'
css = r'''
/* v0.9.68 · Per-brand wallet logo rendering */
.cardShelf .cardItem[data-brand="ovs"] .brandLogo,
.cardShelf .cardItem[data-brand="pittarosso"] .brandLogo,
.usageGrid .cardItem[data-brand="ovs"] .brandLogo,
.usageGrid .cardItem[data-brand="pittarosso"] .brandLogo{
  filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.18))!important;
}
.cardShelf .cardItem[data-brand="conad"] .brandLogo,
.usageGrid .cardItem[data-brand="conad"] .brandLogo,
.cardShelf .cardItem[data-brand="lidl"] .brandLogo,
.usageGrid .cardItem[data-brand="lidl"] .brandLogo{
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10))!important;
}
'''
if marker not in text:
    text = text.replace('</style>', css + '\n</style>', 1)

now = datetime.now(ZoneInfo('Europe/Rome'))
human = now.strftime('%d/%m/%Y · %H:%M · v0.9.68')
release_id = now.strftime('%Y.%m.%d-%H%M-v0.9.68')
text = re.sub(r'<div class="release">[^<]+</div>', '<div class="release">'+human+'</div>', text, count=1)
text = re.sub(r'const RELEASE="[^"]+";', 'const RELEASE="'+release_id+'";', text, count=1)
if '<span class="changeVersion">v0.9.68</span>' not in text:
    entry = '<details class="changeEntry" open><summary><span class="changeVersion">v0.9.68</span><span class="changeTitle">Resa loghi per marchio</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>OVS e PittaRosso vengono resi in bianco sulle tessere per garantire contrasto.</li><li>Conad torna al logo originale a colori.</li><li>Lidl mantiene i colori originali con asset ripulito dal bordo bianco.</li></ul></details>'
    text = text.replace('<div class="changeList">', '<div class="changeList">'+entry, 1)

p.write_text(text)

sw = Path('sw.js')
sw_text = sw.read_text()
sw_text = re.sub(r'const CACHE="ficard-[^"]+";', 'const CACHE="ficard-'+release_id+'";', sw_text, count=1)
sw.write_text(sw_text)
