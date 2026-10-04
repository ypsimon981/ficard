from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p=Path('index.html')
text=p.read_text()

marker='/* v0.9.69 · Wallet style extended to quick cards and detail */'
css=r'''
/* v0.9.69 · Wallet style extended to quick cards and detail */
.smartCard .smartCardOpen{padding:10px!important}
.smartCard .brandMark{
  position:static!important;width:100%!important;height:56px!important;min-width:0!important;
  margin:0!important;padding:8px 12px!important;border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;color:var(--card-ink,#fff)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;
}
.smartCard .brandMark .brandLogo{
  width:74%!important;height:100%!important;max-width:74%!important;max-height:100%!important;
  object-fit:contain!important;background:transparent!important;border-radius:0!important;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10));
}
.smartCard .name,.smartCard .smartMeta{color:var(--card-ink,#fff)!important}
.smartCard .smartMeta{opacity:.86!important}
.denseNearby .smartCardOpen{padding:6px!important}
.denseNearby .smartCard .brandMark{height:42px!important;padding:3px 5px!important}
.proximityFocus .smartCardOpen{padding:16px!important}
.proximityFocus .smartCard .brandMark{height:112px!important;padding:14px 20px!important}

.detailBrandHeader{padding:22px 20px 18px!important}
.detailBrandHeader .detailLogo{
  width:100%!important;height:108px!important;padding:12px 18px!important;border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;color:var(--card-ink,#fff)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;
}
.detailBrandHeader .detailLogo .brandLogo{
  width:74%!important;height:100%!important;max-width:74%!important;max-height:100%!important;
  object-fit:contain!important;background:transparent!important;border-radius:0!important;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10));
}
.detailBrandHeader h2,.detailBrandHeader p{color:var(--card-ink,#fff)!important}

.fullCardLogo{background:transparent!important;box-shadow:none!important;border-radius:0!important;padding:5px!important}
.fullCardLogo .brandLogo{background:transparent!important;border-radius:0!important}

/* White variants where the original mark loses contrast */
.smartCard[data-brand="ovs"] .brandLogo,
.smartCard[data-brand="pittarosso"] .brandLogo,
.detailBrandHeader[data-brand="ovs"] .brandLogo,
.detailBrandHeader[data-brand="pittarosso"] .brandLogo,
.fullCardLogo .brandLogo[src$="/ovs.svg"],
.fullCardLogo .brandLogo[src$="/pittarosso.svg"]{
  filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.18))!important;
}

/* Existing dark-background variants extended to quick/detail cards */
.smartCard.walletDark[data-brand="esselunga"] .brandLogo,
.smartCard.walletDark[data-brand="carrefour"] .brandLogo,
.smartCard.walletDark[data-brand="decathlon"] .brandLogo,
.detailBrandHeader.walletDark[data-brand="esselunga"] .brandLogo,
.detailBrandHeader.walletDark[data-brand="carrefour"] .brandLogo,
.detailBrandHeader.walletDark[data-brand="decathlon"] .brandLogo{
  filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.18))!important;
}

/* Multicolour marks always remain original */
.smartCard[data-brand="conad"] .brandLogo,
.smartCard[data-brand="lidl"] .brandLogo,
.detailBrandHeader[data-brand="conad"] .brandLogo,
.detailBrandHeader[data-brand="lidl"] .brandLogo,
.fullCardLogo .brandLogo[src$="/conad.svg"],
.fullCardLogo .brandLogo[src$="/lidl.svg"]{
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10))!important;
}
'''
if marker not in text:
    text=text.replace('</style>',css+'\n</style>',1)

old="return '<div class=\"smartCard\" style=\"--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'\"><button class=\"smartCardOpen cardOpen\""
new="return '<div class=\"smartCard '+(cardInk(c.color)==='#FFFFFF'?'walletDark':'walletLight')+'\" data-brand=\"'+esc(inferredBrandKey(c)||c.brandKey||'')+'\" style=\"--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'\"><button class=\"smartCardOpen cardOpen\""
if old in text:
    text=text.replace(old,new,1)
elif 'class=\"smartCard '+"'+(cardInk(c.color)==='#FFFFFF'?'walletDark':'walletLight')+'"+'\" data-brand=' not in text:
    raise SystemExit('smartCard signature not found')

old_detail="'<div class=\"detailHero\"><div class=\"detailBrandHeader\" style=\"--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'\"><span class=\"detailLogo\">'"
new_detail="'<div class=\"detailHero\"><div class=\"detailBrandHeader '+(cardInk(c.color)==='#FFFFFF'?'walletDark':'walletLight')+'\" data-brand=\"'+esc(inferredBrandKey(c)||c.brandKey||'')+'\" style=\"--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'\"><span class=\"detailLogo\">'"
if old_detail in text:
    text=text.replace(old_detail,new_detail,1)
elif 'detailBrandHeader '+"'+(cardInk(c.color)==='#FFFFFF'?'walletDark':'walletLight')+'" not in text:
    raise SystemExit('detail header signature not found')

now=datetime.now(ZoneInfo('Europe/Rome'))
human=now.strftime('%d/%m/%Y · %H:%M · v0.9.69')
release_id=now.strftime('%Y.%m.%d-%H%M-v0.9.69')
text=re.sub(r'<div class="release">[^<]+</div>','<div class="release">'+human+'</div>',text,count=1)
text=re.sub(r'const RELEASE="[^"]+";','const RELEASE="'+release_id+'";',text,count=1)
if '<span class="changeVersion">v0.9.69</span>' not in text:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.69</span><span class="changeTitle">Wallet coerente ovunque</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>Carte rapide aggiornate allo stile a pieno colore senza riquadro bianco del logo, mantenendo nome e distanza.</li><li>La carta aperta usa lo stesso trattamento del logo direttamente sul colore della tessera.</li><li>Estese anche qui le regole per-brand: OVS e PittaRosso bianchi; Conad e Lidl originali; varianti chiare per alcuni marchi su fondo scuro.</li></ul></details>'
    text=text.replace('<div class="changeList">','<div class="changeList">'+entry,1)
p.write_text(text)

sw=Path('sw.js')
sw_text=sw.read_text()
sw_text=re.sub(r'const CACHE="ficard-[^"]+";','const CACHE="ficard-'+release_id+'";',sw_text,count=1)
sw.write_text(sw_text)
