from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import re

p=Path('index.html')
text=p.read_text()

marker='/* v0.9.71 · Expanded logo coverage */'
if marker in text:
    raise SystemExit('already applied')

# Domains for brands already present in FiCard. Local HQ assets keep priority.
domains={
'md':'mdspa.it','pam':'pampanorama.it','despar':'despar.it','cisalfa':'cisalfasport.it','intersport':'intersport.it','jdsports':'jdsports.it','footlocker':'footlocker.it','euronics':'euronics.it','ip':'gruppoapi.com','aldi':'aldi.it','ins':'insmercato.it','bennet':'bennet.com','iperal':'iperal.it','iper':'iper.it','naturasi':'naturasi.it','famila':'famila.it','tesco':'tesco.com','auchan':'auchan.fr','puma':'puma.com','salmoiraghi':'salmoiraghievigano.it','grandvision':'grandvision.it','primark':'primark.com','mango':'mango.com','benetton':'benetton.com','tezenis':'tezenis.com','kiabi':'kiabi.it','terranova':'terranovastyle.com','piazzaitalia':'piazzaitalia.it','upim':'upim.com','motivi':'motivi.com','kiko':'kikocosmetics.com','yvesrocher':'yves-rocher.it','dm':'dm-drogeriemarkt.it','bottegaverde':'bottegaverde.com','lillapois':'lillapois.it','benu':'benufarma.it','lloyds':'lloydsfarmacia.it','drmax':'drmax.it','starbucks':'starbucks.it','mcdonalds':'mcdonalds.it','burgerking':'burgerking.it','kfc':'kfc.it','oldwildwest':'oldwildwest.it','roadhouse':'roadhouse.it','feltrinelli':'lafeltrinelli.it','mondadori':'mondadoristore.it','arcaplanet':'arcaplanet.it','maxizoo':'maxizoo.it','shell':'shell.it','tamoil':'tamoil.it','total':'totalenergies.it','primigi':'primigi.it'
}

# Add more common loyalty-card brands in Italy.
new_brands={
'penny':('PENNY','#D71920','supermercati','penny.it'),
'sigma':('Sigma','#E30613','supermercati','supersigma.com'),
'crai':('Crai','#E30613','supermercati','crai-supermercati.it'),
'deco':('Decò','#E30613','supermercati','decosupermercati.it'),
'sole365':('Sole365','#F6C500','supermercati','sole365.it'),
'risparmiocasa':('Risparmio Casa','#E31E24','casa','risparmiocasa.com'),
'acquaesapone':('Acqua & Sapone','#1F71B8','beauty','acquaesapone.it'),
'maurys':("Maury's",'#E30613','casa','maurys.it'),
'action':('Action','#005EB8','casa','action.com'),
'pepco':('Pepco','#0057B8','casa','pepco.it'),
'leroymerlin':('Leroy Merlin','#78BE20','casa','leroymerlin.it'),
'bricocenter':('Bricocenter','#E30613','casa','bricocenter.it'),
'tecnomat':('Tecnomat','#F5A800','casa','tecnomat.it'),
'obi':('OBI','#F36F21','casa','obi-italia.it'),
'jysk':('JYSK','#143C7D','casa','jysk.it'),
'zara':('Zara','#111111','abbigliamento','zara.com'),
'calzedonia':('Calzedonia','#111111','abbigliamento','calzedonia.com'),
'intimissimi':('Intimissimi','#7A3E45','abbigliamento','intimissimi.com'),
'stradivarius':('Stradivarius','#111111','abbigliamento','stradivarius.com'),
'bershka':('Bershka','#111111','abbigliamento','bershka.com'),
'pullandbear':('Pull&Bear','#111111','abbigliamento','pullandbear.com'),
'coin':('Coin','#111111','abbigliamento','coin.it'),
'awlab':('AW LAB','#111111','abbigliamento','aw-lab.com'),
'geox':('Geox','#003E6B','abbigliamento','geox.com'),
'skechers':('Skechers','#0055A5','abbigliamento','skechers.it'),
'pinalli':('Pinalli','#E40046','beauty','pinalli.it'),
'notino':('Notino','#111111','beauty','notino.it'),
'trony':('Trony','#E30613','elettronica','trony.it'),
'expert':('Expert','#E30613','elettronica','expert.it'),
'comet':('Comet','#E30613','elettronica','comet.it'),
'gamestop':('GameStop','#111111','elettronica','gamestop.it'),
'isoladeitesori':("L'Isola dei Tesori",'#F58220','petstore','isoladeitesori.it'),
'zooplus':('zooplus','#F58220','petstore','zooplus.it'),
'libraccio':('Libraccio','#E30613','altro','libraccio.it'),
'autogrill':('Autogrill','#E30613','ristorazione','autogrill.it'),
'lapiadineria':('La Piadineria','#E30613','ristorazione','lapiadineria.com'),
'rossopomodoro':('Rossopomodoro','#D71920','ristorazione','rossopomodoro.it'),
'venchi':('Venchi','#4B2E20','ristorazione','venchi.com'),
'flyingtiger':('Flying Tiger Copenhagen','#111111','casa','flyingtiger.com')
}

existing_js='const REMOTE_LOGO_DOMAINS='+repr(domains).replace("'",'"')+';\nObject.entries(REMOTE_LOGO_DOMAINS).forEach(([k,domain])=>{if(BRANDS[k])BRANDS[k].domain=domain});\n'
items=[]
for k,(name,color,cat,domain) in new_brands.items():
    escname=name.replace('\\','\\\\').replace('"','\\"')
    items.append(f'"{k}":{{name:"{escname}",mark:"{escname.upper()}",color:"{color}",category:"{cat}",domain:"{domain}"}}')
existing_js+='Object.assign(BRANDS,{'+','.join(items)+'});\n'

# Improve default brand colours for existing text-only brands.
colors={'md':'#FFD200','pam':'#E30613','despar':'#009640','cisalfa':'#E30613','intersport':'#E30613','jdsports':'#111111','footlocker':'#E31837','euronics':'#0057A8','ip':'#F58220','aldi':'#001E50','bennet':'#E30613','iperal':'#E30613','iper':'#E30613','naturasi':'#6BA539','famila':'#F28C00','puma':'#111111','primark':'#00A4D6','mango':'#111111','benetton':'#008450','tezenis':'#111111','kiabi':'#009FE3','terranova':'#111111','piazzaitalia':'#111111','upim':'#E60028','motivi':'#B21E3B','kiko':'#111111','yvesrocher':'#006A4E','dm':'#0075BF','bottegaverde':'#2E7D32','lillapois':'#A34CA5','benu':'#00A878','lloyds':'#7A1F78','drmax':'#4EA73B','starbucks':'#00754A','mcdonalds':'#DA291C','burgerking':'#D62300','kfc':'#E4002B','oldwildwest':'#8A4B24','roadhouse':'#B31B1B','feltrinelli':'#E30613','mondadori':'#E30613','arcaplanet':'#FFCC00','maxizoo':'#66B32E','shell':'#FFD500','tamoil':'#003B7A','total':'#E31B23','primigi':'#FFF8DE'}
existing_js+='Object.entries('+repr(colors).replace("'",'"')+').forEach(([k,color])=>{if(BRANDS[k]&&(!BRANDS[k].logo||BRANDS[k].color==="#5B3DF5"))BRANDS[k].color=color});\n'

anchor='function demoCards(){return ['
if anchor not in text:
    raise SystemExit('demoCards anchor not found')
text=text.replace(anchor,marker+'\n'+existing_js+'\n'+anchor,1)

# Local HQ assets remain first choice. If none exists, use a high-resolution favicon by official domain.
pattern=r"function brandLogoHtml\(b,variant='default'\)\{[^\n]+\}"
replacement="function brandLogoHtml(b,variant='default'){let logo=b.logo||'';if(variant==='wallet'&&/(^|\\/)conad\\.svg$/i.test(logo))logo=logo.replace(/conad\\.svg$/i,'conad-light.svg');const remote=!logo&&b.domain?'https://www.google.com/s2/favicons?domain='+encodeURIComponent(b.domain)+'&sz=256':'';const src=logo||remote;if(!src)return esc(b.mark);const klass='brandLogo'+(remote?' brandLogoRemote':'');return '<img class=\"'+klass+'\" style=\"background:'+esc(b.logoBg||'transparent')+'\" src=\"'+esc(src)+'\" alt=\"'+esc(b.name)+'\" data-fallback=\"'+esc(b.mark)+'\" onerror=\"this.style.display=\\\'none\\\';this.nextElementSibling.style.display=\\\'inline\\\'\"><span class=\"brandLogoFallback\" style=\"display:none\">'+esc(b.mark)+'</span>'}"
text,n=re.subn(pattern,replacement,text,count=1)
if n!=1:
    raise SystemExit('brandLogoHtml not replaced')

css='''\n/* v0.9.71 · Expanded logo coverage */\n.brandLogoRemote{object-fit:contain!important;image-rendering:auto!important}\n.cardItem .brandLogoRemote,.smartCard .brandLogoRemote,.detailBrandHeader .brandLogoRemote{max-width:68%!important;max-height:72%!important}\n.brandLogoFallback{font-weight:900;letter-spacing:-.02em;text-align:center;line-height:1.05}\n'''
text=text.replace('</style>',css+'\n</style>',1)

now=datetime.now(ZoneInfo('Europe/Rome'))
# Do not touch unrelated scanner/service-worker versioning; only bump FiCard UI release label.
text=re.sub(r'<div class="release">[^<]+</div>','<div class="release">'+now.strftime('%d/%m/%Y · %H:%M · v0.9.71')+'</div>',text,count=1)
text=re.sub(r'const RELEASE="[^"]+";','const RELEASE="'+now.strftime('%Y.%m.%d-%H%M-v0.9.71')+'";',text,count=1)
if '<span class="changeVersion">v0.9.71</span>' not in text:
    entry='<details class="changeEntry" open><summary><span class="changeVersion">v0.9.71</span><span class="changeTitle">Catalogo loghi molto più ampio</span><time>'+now.strftime('%d/%m/%Y · %H:%M')+'</time></summary><ul><li>I loghi locali HQ restano prioritari; per i marchi senza asset locale FiCard usa automaticamente il logo legato al dominio ufficiale.</li><li>Aggiunti molti marchi diffusi in Italia tra supermercati, moda, casa, beauty, elettronica, pet e ristorazione.</li><li>Se un logo remoto non è disponibile, FiCard torna automaticamente al nome del marchio senza mostrare immagini rotte.</li></ul></details>'
    text=text.replace('<div class="changeList">','<div class="changeList">'+entry,1)

p.write_text(text)
print('existing domains',len(domains),'new brands',len(new_brands),'total new logo coverage',len(domains)+len(new_brands))
