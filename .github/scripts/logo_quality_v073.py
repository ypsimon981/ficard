from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p=Path('index.html')
text=p.read_text()

# Remove the early overrides from v0.9.72; they were placed before the expanded catalog assignment.
for line in [
"Object.assign(BRANDS.acquaesapone,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ACQUA_%26_SAPONE_Logo.svg'});\n",
"Object.assign(BRANDS.footlocker,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Foot_Locker_2020_Wordmark_Logo.svg',color:'#111111'});\n",
"Object.assign(BRANDS.penny,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Penny-Logo.svg',color:'#D71920'});\n",
]:
    text=text.replace(line,'')

# HQ overrides must run after the expanded Object.assign(BRANDS,{...}) catalog.
anchor='Object.entries({"md":'
if anchor not in text:
    raise SystemExit('color overrides anchor not found')
quality="""// HQ overrides: always win over favicon/domain fallback.
Object.assign(BRANDS.acquaesapone,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ACQUA_%26_SAPONE_Logo.svg',logoBg:'#FFFFFF'});
Object.assign(BRANDS.footlocker,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Foot_Locker_2020_Wordmark_Logo.svg',color:'#111111'});
Object.assign(BRANDS.penny,{logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Penny-Logo.svg',color:'#D71920'});
"""
if '// HQ overrides: always win over favicon/domain fallback.' not in text:
    text=text.replace(anchor,quality+anchor,1)

now=datetime.now(ZoneInfo('Europe/Rome'))
text=re.sub(r'<div class="release">[^<]+</div>','<div class="release">'+now.strftime('%d/%m/%Y · %H:%M · v0.9.73')+'</div>',text,count=1)
text=re.sub(r'const RELEASE="[^"]+";','const RELEASE="'+now.strftime('%Y.%m.%d-%H%M-v0.9.73')+'";',text,count=1)
if '<span class="changeVersion">v0.9.73</span>' not in text:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.73</span><span class="changeTitle">Priorità ai loghi HQ</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>Gli asset HQ di Acqua & Sapone, Foot Locker e PENNY vengono ora applicati dopo il catalogo automatico e non possono essere sovrascritti dal fallback.</li><li>Acqua & Sapone mantiene un supporto bianco dietro al logo completo per conservare leggibilità del lettering sul blu.</li></ul></details>'
    text=text.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(text)
