from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p=Path('index.html')
text=p.read_text()

# Create a white MediaWorld variant from the local vector logo.
src=Path('logos-hq/mediaworld.svg')
if not src.exists():
    raise SystemExit('mediaworld.svg missing')
light=src.read_text().replace('#DF0000','#FFFFFF').replace('#df0000','#FFFFFF')
Path('logos-hq/mediaworld-light.svg').write_text(light)

# Force HQ/vector sources for brands where favicon fallback is visibly poor.
anchor='Object.entries(REMOTE_LOGO_DOMAINS).forEach(([k,domain])=>{if(BRANDS[k])BRANDS[k].domain=domain});'
if anchor not in text:
    raise SystemExit('remote logo anchor not found')
quality="""
Object.assign(BRANDS.acquaesapone,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ACQUA_%26_SAPONE_Logo.svg'});
Object.assign(BRANDS.footlocker,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Foot_Locker_2020_Wordmark_Logo.svg',color:'#111111'});
Object.assign(BRANDS.penny,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Penny-Logo.svg',color:'#D71920'});
""".strip()
if 'Special:Redirect/file/ACQUA_%26_SAPONE_Logo.svg' not in text:
    text=text.replace(anchor,anchor+'\n'+quality,1)

# Wallet contexts: MediaWorld needs white artwork on its red surface.
old="function brandLogoHtml(b,variant='default'){let logo=b.logo||'';if(variant==='wallet'&&/(^|\\/)conad\\.svg$/i.test(logo))logo=logo.replace(/conad\\.svg$/i,'conad-light.svg');"
new="function brandLogoHtml(b,variant='default'){let logo=b.logo||'';if(variant==='wallet'&&/(^|\\/)conad\\.svg$/i.test(logo))logo=logo.replace(/conad\\.svg$/i,'conad-light.svg');if(variant==='wallet'&&/(^|\\/)mediaworld\\.svg$/i.test(logo))logo=logo.replace(/mediaworld\\.svg$/i,'mediaworld-light.svg');"
if old not in text:
    raise SystemExit('brandLogoHtml wallet anchor not found')
text=text.replace(old,new,1)

# Fine tune large horizontal marks.
css='''
/* v0.9.72 · HQ logos for key brands */
.cardItem[data-brand="acquaesapone"] .brandLogo,.smartCard[data-brand="acquaesapone"] .brandLogo,.detailBrandHeader[data-brand="acquaesapone"] .brandLogo{max-width:82%!important;max-height:70%!important}
.cardItem[data-brand="footlocker"] .brandLogo,.smartCard[data-brand="footlocker"] .brandLogo,.detailBrandHeader[data-brand="footlocker"] .brandLogo{max-width:80%!important;max-height:58%!important}
.cardItem[data-brand="penny"] .brandLogo,.smartCard[data-brand="penny"] .brandLogo,.detailBrandHeader[data-brand="penny"] .brandLogo{max-width:62%!important;max-height:72%!important}
'''
if '/* v0.9.72 · HQ logos for key brands */' not in text:
    text=text.replace('</style>',css+'\n</style>',1)

now=datetime.now(ZoneInfo('Europe/Rome'))
text=re.sub(r'<div class="release">[^<]+</div>','<div class="release">'+now.strftime('%d/%m/%Y · %H:%M · v0.9.72')+'</div>',text,count=1)
text=re.sub(r'const RELEASE="[^"]+";','const RELEASE="'+now.strftime('%Y.%m.%d-%H%M-v0.9.72')+'";',text,count=1)
if '<span class="changeVersion">v0.9.72</span>' not in text:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.72</span><span class="changeTitle">Loghi HQ per i casi critici</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>Acqua & Sapone usa il logo completo con lettering al posto della sola icona.</li><li>Foot Locker e PENNY passano a sorgenti SVG vettoriali ad alta qualità.</li><li>MediaWorld usa una variante bianca sulle superfici wallet rosse per garantire contrasto.</li></ul></details>'
    text=text.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(text)

sw=Path('sw.js')
s=sw.read_text()
if './logos-hq/mediaworld-light.svg' not in s:
    s=s.replace('"./logos-hq/mediaworld.svg"','"./logos-hq/mediaworld.svg", "./logos-hq/mediaworld-light.svg"',1)
sw.write_text(s)
