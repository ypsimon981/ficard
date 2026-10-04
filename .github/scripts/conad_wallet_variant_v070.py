from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

# 1) Build a Conad variant for red/dark wallet surfaces:
# keep the flower orange/yellow, turn every other solid SVG fill white.
src = Path('logos-hq/conad.svg')
dst = Path('logos-hq/conad-light.svg')
svg = src.read_text()
keep = {'F06C00','FED404'}
def repl(m):
    color = m.group(1).upper()
    return 'fill="#'+(color if color in keep else 'FFFFFF')+'"'
light = re.sub(r'fill="#([0-9A-Fa-f]{6})"', repl, svg)
dst.write_text(light)

# 2) Use the light variant only in wallet contexts (quick, detail, fullscreen).
p = Path('index.html')
text = p.read_text()
old = "function brandLogoHtml(b){return b.logo?'<img class=\"brandLogo\" style=\"background:'+esc(b.logoBg||'transparent')+'\" src=\"'+esc(b.logo)+'\" alt=\"'+esc(b.name)+'\">':esc(b.mark)}"
new = "function brandLogoHtml(b,variant='default'){let logo=b.logo||'';if(variant==='wallet'&&/(^|\\/)conad\\.svg$/i.test(logo))logo=logo.replace(/conad\\.svg$/i,'conad-light.svg');return logo?'<img class=\"brandLogo\" style=\"background:'+esc(b.logoBg||'transparent')+'\" src=\"'+esc(logo)+'\" alt=\"'+esc(b.name)+'\">':esc(b.mark)}"
if old not in text:
    raise SystemExit('brandLogoHtml signature not found')
text = text.replace(old, new, 1)

# targeted wallet-context calls only
quick_old = "<span class=\"brandMark\" aria-hidden=\"true\">'+brandLogoHtml(b)+'</span><div class=\"name\">"
quick_new = "<span class=\"brandMark\" aria-hidden=\"true\">'+brandLogoHtml(b,'wallet')+'</span><div class=\"name\">"
if quick_old not in text:
    raise SystemExit('quick card logo call not found')
text = text.replace(quick_old, quick_new, 1)

detail_old = "<span class=\"detailLogo\">'+brandLogoHtml(b)+'</span><h2>"
detail_new = "<span class=\"detailLogo\">'+brandLogoHtml(b,'wallet')+'</span><h2>"
if detail_old not in text:
    raise SystemExit('detail logo call not found')
text = text.replace(detail_old, detail_new, 1)

full_old = "header.innerHTML='<span class=\"fullCardLogo\">'+brandLogoHtml(brandFor(c))+'</span><strong>'"
full_new = "header.innerHTML='<span class=\"fullCardLogo\">'+brandLogoHtml(brandFor(c),'wallet')+'</span><strong>'"
if full_old not in text:
    raise SystemExit('fullscreen logo call not found')
text = text.replace(full_old, full_new, 1)

now = datetime.now(ZoneInfo('Europe/Rome'))
human = now.strftime('%d/%m/%Y · %H:%M · v0.9.70')
release_id = now.strftime('%Y.%m.%d-%H%M-v0.9.70')
text = re.sub(r'<div class="release">[^<]+</div>', '<div class="release">'+human+'</div>', text, count=1)
text = re.sub(r'const RELEASE="[^"]+";', 'const RELEASE="'+release_id+'";', text, count=1)
if '<span class="changeVersion">v0.9.70</span>' not in text:
    entry = '<details class="changeEntry" open><summary><span class="changeVersion">v0.9.70</span><span class="changeTitle">Conad leggibile sul rosso</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>Creata una variante Conad per superfici wallet: fiore originale, scritta e payoff bianchi.</li><li>La variante viene usata automaticamente su Carte rapide, carta aperta e tutto schermo.</li><li>Nelle griglie dove il logo originale funziona resta invariato.</li></ul></details>'
    text = text.replace('<div class="changeList">', '<div class="changeList">'+entry, 1)
p.write_text(text)

# 3) PWA cache and offline asset list.
sw = Path('sw.js')
sw_text = sw.read_text()
sw_text = re.sub(r'const CACHE="ficard-[^"]+";', 'const CACHE="ficard-'+release_id+'";', sw_text, count=1)
if './logos-hq/conad-light.svg' not in sw_text:
    # add next to existing conad asset when possible; otherwise before closing asset list
    if './logos-hq/conad.svg' in sw_text:
        sw_text = sw_text.replace('./logos-hq/conad.svg', './logos-hq/conad.svg","./logos-hq/conad-light.svg', 1)
    else:
        sw_text = sw_text.replace('];', ',"./logos-hq/conad-light.svg"];', 1)
sw.write_text(sw_text)
