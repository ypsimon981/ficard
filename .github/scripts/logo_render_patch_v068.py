from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p = Path('index.html')
text = p.read_text()

pattern = re.compile(r'''\.cardShelf \.cardItem\.walletDark\[data-brand=\\"conad\\"\] \.brandLogo,\n\.cardShelf \.cardItem\.walletDark\[data-brand=\\"esselunga\\"\] \.brandLogo,\n\.cardShelf \.cardItem\.walletDark\[data-brand=\\"carrefour\\"\] \.brandLogo,\n\.cardShelf \.cardItem\.walletDark\[data-brand=\\"decathlon\\"\] \.brandLogo,\n\.usageGrid \.cardItem\.walletDark\[data-brand=\\"conad\\"\] \.brandLogo,\n\.usageGrid \.cardItem\.walletDark\[data-brand=\\"esselunga\\"\] \.brandLogo,\n\.usageGrid \.cardItem\.walletDark\[data-brand=\\"carrefour\\"\] \.brandLogo,\n\.usageGrid \.cardItem\.walletDark\[data-brand=\\"decathlon\\"\] \.brandLogo\{\n  filter:brightness\(0\) invert\(1\) drop-shadow\(0 1px 2px rgba\(0,0,0,\.18\)\)!important;\n\}''')
replacement = '''.cardShelf .cardItem.walletDark[data-brand="esselunga"] .brandLogo,
.cardShelf .cardItem.walletDark[data-brand="carrefour"] .brandLogo,
.cardShelf .cardItem.walletDark[data-brand="decathlon"] .brandLogo,
.cardShelf .cardItem[data-brand="ovs"] .brandLogo,
.cardShelf .cardItem[data-brand="pittarosso"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="esselunga"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="carrefour"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="decathlon"] .brandLogo,
.usageGrid .cardItem[data-brand="ovs"] .brandLogo,
.usageGrid .cardItem[data-brand="pittarosso"] .brandLogo{
  filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.18))!important;
}
.cardShelf .cardItem[data-brand="conad"] .brandLogo,
.usageGrid .cardItem[data-brand="conad"] .brandLogo,
.cardShelf .cardItem[data-brand="lidl"] .brandLogo,
.usageGrid .cardItem[data-brand="lidl"] .brandLogo{
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10))!important;
}'''
text, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise SystemExit(f'Expected one wallet logo rule block, found {n}')

now = datetime.now(ZoneInfo('Europe/Rome'))
human = now.strftime('%d/%m/%Y · %H:%M · v0.9.68')
release_id = now.strftime('%Y.%m.%d-%H%M-v0.9.68')
text = re.sub(r'<div class="release">[^<]+</div>', '<div class="release">'+human+'</div>', text, count=1)
text = re.sub(r'const RELEASE="[^"]+";', 'const RELEASE="'+release_id+'";', text, count=1)
if '<span class="changeVersion">v0.9.68</span>' not in text:
    entry = '<details class="changeEntry" open><summary><span class="changeVersion">v0.9.68</span><span class="changeTitle">Resa loghi per marchio</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>OVS e PittaRosso usano una resa bianca sulle rispettive tessere scure/rosse.</li><li>Conad torna al logo originale a colori.</li><li>Lidl mantiene i colori originali con asset ripulito dal bordo bianco.</li></ul></details>'
    text = text.replace('<div class="changeList">', '<div class="changeList">'+entry, 1)

p.write_text(text)

sw = Path('sw.js')
sw_text = sw.read_text()
sw_text = re.sub(r'const CACHE="ficard-[^"]+";', 'const CACHE="ficard-'+release_id+'";', sw_text, count=1)
sw.write_text(sw_text)
