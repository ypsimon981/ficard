from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p = Path("index.html")
text = p.read_text()

marker = "/* v0.9.67 · Wallet-style loyalty cards */"
css = r'''
/* v0.9.67 · Wallet-style loyalty cards */
.cardShelf .cardItem,.usageGrid .cardItem{
  position:relative!important;width:100%!important;min-width:0!important;min-height:0!important;height:auto!important;
  aspect-ratio:85.6/53.98!important;padding:0!important;border-radius:18px!important;overflow:hidden!important;
  background:var(--card-color)!important;color:var(--card-ink,#fff)!important;
  border:1px solid rgba(255,255,255,.10)!important;box-shadow:0 4px 12px rgba(31,41,55,.10)!important;
}
.cardShelf .cardItem .cardOpen,.usageGrid .cardItem .cardOpen{
  position:relative!important;width:100%!important;height:100%!important;padding:0!important;
  display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;
}
.cardShelf .cardItem .brandMark,.usageGrid .cardItem .brandMark{
  position:absolute!important;inset:0!important;width:auto!important;height:auto!important;min-width:0!important;
  flex:none!important;margin:0!important;padding:18px 20px!important;border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;color:var(--card-ink,#fff)!important;
  display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;
  font-size:clamp(20px,5vw,30px)!important;font-weight:900!important;letter-spacing:-.5px!important;
}
.cardShelf .cardItem .brandMark .brandLogo,.usageGrid .cardItem .brandMark .brandLogo{
  width:74%!important;height:52%!important;max-width:74%!important;max-height:52%!important;
  object-fit:contain!important;background:transparent!important;border-radius:0!important;
  filter:drop-shadow(0 1px 1px rgba(0,0,0,.10));
}
.cardShelf .cardItem .cardOpen .name,.cardShelf .cardItem .cardOpen .type,
.usageGrid .cardItem .cardOpen .name,.usageGrid .cardItem .cardOpen .type{display:none!important}
.cardShelf .cardItem.walletDark[data-brand="conad"] .brandLogo,
.cardShelf .cardItem.walletDark[data-brand="esselunga"] .brandLogo,
.cardShelf .cardItem.walletDark[data-brand="carrefour"] .brandLogo,
.cardShelf .cardItem.walletDark[data-brand="decathlon"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="conad"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="esselunga"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="carrefour"] .brandLogo,
.usageGrid .cardItem.walletDark[data-brand="decathlon"] .brandLogo{
  filter:brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,.18))!important;
}
.cardShelf .cardItem .cardFavorite,.usageGrid .cardItem .cardFavorite{z-index:6!important}
@media(max-width:350px){
  .cardShelf .cardItem .brandMark,.usageGrid .cardItem .brandMark{padding:14px 16px!important}
  .cardShelf .cardItem .brandMark .brandLogo,.usageGrid .cardItem .brandMark .brandLogo{width:72%!important;max-width:72%!important}
}
'''

if marker not in text:
    text = text.replace("</style>", css + "\n</style>", 1)

old = '''return '<div class="card cardItem" style="--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'"><button class="cardOpen"'''
new = '''return '<div class="card cardItem '+(cardInk(c.color)==='#FFFFFF'?'walletDark':'walletLight')+'" data-brand="'+esc(c.brandKey||'')+'" style="--card-color:'+esc(c.color)+';--card-ink:'+cardInk(c.color)+'"><button class="cardOpen"'''
if old in text:
    text = text.replace(old, new, 1)
elif '''data-brand="'+esc(c.brandKey||'')+'"''' not in text:
    raise SystemExit("cardHtml signature not found")

now = datetime.now(ZoneInfo("Europe/Rome"))
human = now.strftime("%d/%m/%Y · %H:%M · v0.9.67")
release_id = now.strftime("%Y.%m.%d-%H%M-v0.9.67")
text = re.sub(r'<div class="release">[^<]+</div>', '<div class="release">' + human + '</div>', text, count=1)
text = re.sub(r'const RELEASE="[^"]+";', 'const RELEASE="' + release_id + '";', text, count=1)

if '<span class="changeVersion">v0.9.67</span>' not in text:
    entry = '<details class="changeEntry" open><summary><span class="changeVersion">v0.9.67</span><span class="changeTitle">Carte in stile wallet</span><time>' + now.strftime("%d/%m/%Y · %H:%M") + '</time></summary><ul><li>Le mie carte e Più usate mostrano ora tessere a pieno colore, senza riquadro bianco interno.</li><li>Logo centrato e ingrandito, nome e categoria rimossi dalle miniature.</li><li>Resa chiara automatica per alcuni loghi poco leggibili su sfondi scuri; Carte rapide lasciate invariate.</li></ul></details>'
    text = text.replace('<div class="changeList">', '<div class="changeList">' + entry, 1)

p.write_text(text)

sw = Path("sw.js")
sw_text = sw.read_text()
sw_text = re.sub(r'const CACHE="ficard-[^"]+";', 'const CACHE="ficard-' + release_id + '";', sw_text, count=1)
sw.write_text(sw_text)
