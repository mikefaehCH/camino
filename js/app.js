/* Camino 2027 – Funktionen. Daten kommen aus data/trip.js. Siehe CLAUDE.md. */
/* NAV */
const secs=document.querySelectorAll('[id]'),links=document.querySelectorAll('#nav a');
const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(l=>l.classList.remove('on'));const a=document.querySelector(`#nav a[href="#${e.target.id}"]`);if(a)a.classList.add('on');}})},{threshold:.15,rootMargin:'-55px 0px 0px 0px'});
secs.forEach(s=>{if(s.id)obs.observe(s);});

/* COUNTDOWN */
function updateCountdown(){
  const target=new Date('2027-06-11T15:35:00+02:00');
  const now=new Date();
  const diff=target-now;
  if(diff<=0){document.getElementById('countdown').style.display='none';return;}
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  document.getElementById('cd-d').textContent=d;
  document.getElementById('cd-h').textContent=h;
  document.getElementById('cd-m').textContent=m;
}
updateCountdown();
setInterval(updateCountdown,60000);



/* STEMPEL TRACKER */
function initStempel() {
  const items = document.querySelectorAll('.stempel-item');
  let saved=[];try{saved = JSON.parse(localStorage.getItem('camino_stempel_v2') || '[]');}catch(e){}
  items.forEach((item, i) => {
    item.setAttribute('role','button');item.setAttribute('tabindex','0');
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click();}});
    const check = item.querySelector('.stempel-check');
    if (saved.includes(i)) { item.classList.add('checked'); if(check) check.textContent='✓'; }
    item.setAttribute('aria-pressed', item.classList.contains('checked'));
    item.addEventListener('click', () => {
      item.classList.toggle('checked');item.setAttribute('aria-pressed', item.classList.contains('checked'));
      const isChecked = item.classList.contains('checked');
      if(check) check.textContent = isChecked ? '✓' : '';
      const state = [...document.querySelectorAll('.stempel-item')].map((el,j) => el.classList.contains('checked') ? j : null).filter(x => x !== null);
      try{localStorage.setItem('camino_stempel_v2', JSON.stringify(state));}catch(e){}
    });
  });
}
initStempel();

/* ===== v3: DATEN ===== */
/* Bilder: pro Tag img:{src:'img/…webp',credit:'Foto: …'} ergänzen */
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'];
const MON=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const dt=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const fmt=s=>{const x=dt(s);return WD[x.getDay()]+', '+x.getDate()+'. '+MON[x.getMonth()];};
const TODAY=new Date().toLocaleDateString('sv-SE');
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const WXI_OLD={0:'',1:'',2:'',3:'',45:'',48:'',51:'',53:'',55:'',61:'',63:'',65:'',80:'',81:'',82:'',95:'',96:'',99:''};

const ICON=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const WXI={0:'sun',1:'cloud-sun',2:'cloud-sun',3:'cloud',45:'cloud-fog',48:'cloud-fog',51:'cloud-drizzle',53:'cloud-drizzle',55:'cloud-rain',61:'cloud-rain',63:'cloud-rain',65:'cloud-rain',80:'cloud-drizzle',81:'cloud-rain',82:'cloud-lightning',95:'cloud-lightning',96:'cloud-lightning',99:'cloud-lightning'};
/* ===== THEME ===== */
(function(){
  const btn=document.getElementById('theme-btn');
  const apply=t=>{if(t){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.removeAttribute('data-theme');}
    const dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;btn.innerHTML=dark?ICON('sun'):ICON('moon');};
  apply(store.get('camino_theme'));
  btn.addEventListener('click',()=>{const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    const nx=cur==='dark'?'light':'dark';store.set('camino_theme',nx);apply(nx);});
})();

/* ===== WETTER (alle Orte, ein Abruf) ===== */
let WX=null;
let WXP=null;
function loadWX(){return WXP||(WXP=_loadWX());}
async function _loadWX(){
  if(WX)return WX;
  const pts=DAYS.filter((x,i,a)=>a.findIndex(y=>y.place===x.place)===i);
  const url='https://api.open-meteo.com/v1/forecast?latitude='+pts.map(p=>p.lat).join(',')+'&longitude='+pts.map(p=>p.lon).join(',')+
    '&current=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&forecast_days=16&timezone=Europe/Madrid';
  try{const r=await fetch(url);if(!r.ok)throw new Error('wx '+r.status);const j=await r.json();if(!j||j.error)throw new Error('wx');const arr=Array.isArray(j)?j:[j];WX={_at:Date.now()};pts.forEach((p,i)=>WX[p.place]=arr[i]);store.set('camino_wx',JSON.stringify(WX));}
  catch(e){try{WX=JSON.parse(store.get('camino_wx')||'null');}catch(_){WX=null;}}
  return WX;
}
function wxFor(place,date){
  const w=WX&&WX[place];if(!w)return null;
  const i=w.daily?w.daily.time.indexOf(date):-1;
  if(i>=0)return {fc:true,ic:WXI[w.daily.weathercode[i]]||'thermometer',max:Math.round(w.daily.temperature_2m_max[i]),min:Math.round(w.daily.temperature_2m_min[i]),rain:w.daily.precipitation_probability_max[i],mm:w.daily.precipitation_sum?w.daily.precipitation_sum[i]:null,wind:w.daily.wind_speed_10m_max?Math.round(w.daily.wind_speed_10m_max[i]):null};
  if(w.current)return {fc:false,ic:WXI[w.current.weathercode]||'thermometer',now:Math.round(w.current.temperature_2m)};
  return null;
}
function wxText(x){
  if(!x)return 'Wetter nicht verfügbar';
  return x.fc?`${x.max}° / ${x.min}° · ${x.rain??'–'}% Regen${x.mm>=0.5?` (${String(Math.round(x.mm*10)/10).replace('.',',')} mm)`:''}${x.wind!=null?` · Wind bis ${x.wind} km/h`:''}`:`jetzt ${x.now}° · Prognose ab ca. 16 Tage vorher`;
}
function wxHTML(x){if(!(x&&x.fc))return '';const at=WX&&WX._at?new Date(WX._at):null;return `${ICON(x.ic)} ${wxText(x)}${at?`<span class="wx-at"> · Prognose Open-Meteo, Stand ${at.getDate()}.${at.getMonth()+1}. ${String(at.getHours()).padStart(2,'0')}:${String(at.getMinutes()).padStart(2,'0')}</span>`:''}`;
}

/* ===== HEUTE ===== */
function realIdx(){return DAYS.findIndex(x=>x.d===TODAY);}
function renderToday(i){
  const x=DAYS[i],real=realIdx()===i;
  document.querySelectorAll('.tp').forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-selected',j===i);});
  document.getElementById('heute-chip').textContent=real?'Heute':'Vorschau';
  const stats=[];
  if(x.km)stats.push(`<span><b>${String(x.km).replace('.',',')}</b>km</span>`);
  if(x.up)stats.push(`<span><b>↑${x.up}</b>m</span>`);if(x.dn)stats.push(`<span><b>↓${x.dn}</b>m</span>`);
  if(x.boat)stats.push('<span><b>Boot</b></span>');
  if(x.kind==='travel')stats.push('<span><b>Reisetag</b></span>');
  const tel=x.tel?`<a class="btn" href="tel:${x.tel}">${ICON('phone')} Anrufen</a>`:'';
  const maps=x.q?`<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">${ICON('map-pin')} Hotel auf Karte</a>`:'';
  const stageBtn=x.stage?`<button class="btn pri" type="button" data-go="${x.stage}">Zur Etappe ↓</button>`:'';
  document.getElementById('today-card').innerHTML=`
   ${x.img?`<img class="tc-img" src="${x.img.src}" alt="${x.title}" loading="lazy">`:''}
   <div class="tc-head"><div class="tc-date">${fmt(x.d)}${real?'':'<span class="preview-badge">Vorschau</span>'}</div>
     <div class="tc-title">${x.title}</div><div class="tc-stats">${stats.join('')}</div></div>
   <div class="tc-body"><div class="tc-info">${x.info}</div>
     
     ${x.cafe?`<div class="tc-info">Erste Pause: <b style="color:var(--ink);font-weight:500">${x.cafe}</b></div>`:''}
     <div class="tc-row">
       ${x.hotel?`<div class="tc-box"><div class="tc-lbl">Unterkunft</div><div class="tc-val">${x.hotel}${x.bf?'<span class="badge">Frühstück</span>':''}</div><div class="tc-sub">Check-in ${x.ci} · Check-out ${x.co}</div></div>`:`<div class="tc-box"><div class="tc-lbl">Heimreise</div><div class="tc-val">Buen Camino! </div></div>`}
       <div class="tc-box"><div class="tc-lbl">Wetter ${x.place}</div><div class="tc-val" id="tc-wx">lädt…</div></div>
     </div>
     <div class="tc-btns">${stageBtn}${tel}${maps}</div></div>`;
  loadWX().then(()=>{const el=document.getElementById('tc-wx');if(el){const h=wxHTML(wxFor(x.place,x.d));if(h)el.innerHTML=h;else{const b=el.closest('.tc-box');if(b)b.remove();}}});
  const g=document.querySelector('[data-go]');if(g)g.addEventListener('click',()=>openStage(+g.dataset.go,true));
}
(function(){
  const p=document.getElementById('today-picker');const ri=realIdx();
  p.innerHTML=DAYS.map((x,i)=>{const y=dt(x.d);return `<button class="tp${i===ri?' real':''}" type="button" role="tab">${WD[y.getDay()]}<b>${y.getDate()}.</b></button>`;}).join('');
  p.querySelectorAll('.tp').forEach((b,i)=>b.addEventListener('click',()=>renderToday(i)));
  let start=ri;
  if(start<0){start=TODAY<DAYS[0].d?1:DAYS.length-1;}
  renderToday(start);
  if(ri>=0){document.getElementById('heute-h2').innerHTML='Euer <em>heutiger Tag</em>';}
  else if(TODAY<DAYS[0].d){document.getElementById('heute-h2').innerHTML='So sieht <em>jeder Tag</em> aus';}
})();

/* ===== ETAPPEN: aufklappen, Wetter, Fortschritt ===== */
const STAGES=[...document.querySelectorAll('#etappen .stage')];
const SDAYS=DAYS.filter(x=>x.stage);
STAGES.forEach((s,i)=>{
  const head=s.querySelector('.stage-head');const body=document.createElement('div');body.className='stage-body';
  [...s.children].filter(c=>c!==head).forEach(c=>body.appendChild(c));s.appendChild(body);
  const grid=head.querySelector('.sh-grid');const ch=document.createElement('div');ch.className='chev';ch.textContent='▾';grid.appendChild(ch);
  head.setAttribute('role','button');head.setAttribute('tabindex','0');head.setAttribute('aria-expanded','false');
  const tog=()=>{s.classList.toggle('open');head.setAttribute('aria-expanded',s.classList.contains('open'));};
  head.addEventListener('click',tog);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});
  const sd=SDAYS[i];if(sd&&sd.img){const im=document.createElement('img');im.className='stage-img';im.src=sd.img.src;im.alt=sd.title;im.loading='lazy';body.insertBefore(im,body.firstChild);if(sd.img.credit){const c=document.createElement('div');c.className='img-credit';c.textContent=sd.img.credit;im.after(c);}}
  if(sd){s.dataset.date=sd.d;const w=document.createElement('div');w.className='stage-wx';w.textContent='Wetter lädt…';body.insertBefore(w,body.firstChild);
    if(sd.d===TODAY)s.classList.add('today-stage');}
});
function openStage(n,scroll){const s=STAGES[n-1];if(!s)return;s.classList.add('open');s.querySelector('.stage-head').setAttribute('aria-expanded','true');if(scroll)s.scrollIntoView({behavior:'smooth',block:'start'});}
// Deep links to editorial chapters must open the matching collapsed stage.
function revealStageHash(){
  const match=location.hash.match(/^#etappe-([1-7])$/);
  if(!match)return;
  const n=Number(match[1]);
  openStage(n,false);
  const target=document.getElementById('etappe-'+n);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));
}
window.addEventListener('hashchange',revealStageHash);
revealStageHash();
const ti=SDAYS.findIndex(x=>x.d===TODAY);if(ti>=0)openStage(ti+1,false);
document.getElementById('open-all').addEventListener('click',e=>{const allOpen=STAGES.every(s=>s.classList.contains('open'));
  STAGES.forEach(s=>{s.classList.toggle('open',!allOpen);s.querySelector('.stage-head').setAttribute('aria-expanded',!allOpen);});
  e.target.textContent=allOpen?'Alle aufklappen':'Alle zuklappen';});
loadWX().then(()=>{STAGES.forEach((s,i)=>{const sd=SDAYS[i];const w=s.querySelector('.stage-wx');if(sd&&w){const h=wxHTML(wxFor(sd.place,sd.d));if(h)w.innerHTML=h;else w.remove();}});});
(function(){
  const walk=SDAYS.filter(x=>x.km);const tot=walk.reduce((a,x)=>a+x.km,0);
  const done=x=>x.d<TODAY;
  const segs=walk.map(x=>`<div class="rb-seg${x.boat?' boat':''}${x.fin?' fin':''}${done(x)?' done':''}${x.d===TODAY?' now':''}" style="flex:${Math.max(x.km,6)}" title="${x.title} · ${x.km} km"></div>`).join('');
  const labels=walk.map(x=>`<span style="flex:${Math.max(x.km,6)}">${x.boat?'Boot':x.place}</span>`).join('');
  const kmDone=walk.filter(done).reduce((a,x)=>a+x.km,0);
  const leg=TODAY<DAYS[0].d?`143 km · Start am ${fmt(DAYS[1].d)}`:`${Math.round(kmDone)} km geschafft`;
  document.getElementById('route-bar').innerHTML=`<div class="rb-track">${segs}</div><div class="rb-labels">${labels}</div><div class="rb-legend">${leg}</div>`;
})();

/* ===== BUCHUNGEN ===== */
(function(){
  const fl=(d,name,meta)=>{const y=dt(d);return `<div class="bk flight"><div class="bk-date"><b>${y.getDate()}.</b><span>${WD[y.getDay()]} · Jun</span></div><div><div class="bk-name">${name}</div><div class="bk-meta">${meta}</div></div></div>`;};
  let html=fl('2027-06-11','Chair Airlines CS176','Zürich 15:35 → Porto 17:15 · Koffer 23 kg + Handgepäck 8 kg · Sitzplätze reserviert');
  DAYS.filter(x=>x.hotel).forEach((x,i,a)=>{const y=dt(x.d);const out=a[i+1]?a[i+1].d:'2027-06-20';const o=dt(out);
    html+=`<div class="bk"><div class="bk-date"><b>${y.getDate()}.</b><span>${WD[y.getDay()]} → ${WD[o.getDay()]}</span></div><div>
      <div class="bk-name">${x.hotel}${x.bf?'<span class="badge">Frühstück</span>':''}</div>
      <div class="bk-meta">${x.place} · Check-in ${x.ci} · Check-out ${x.co}</div>
      <div class="bk-btns">${x.tel?`<a class="btn" href="tel:${x.tel}">${ICON('phone')} ${x.tel.replace(/^\+(351|34)/,'+$1 ')}</a>`:''}<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">${ICON('map-pin')} Karte</a></div></div></div>`;});
  html+=fl('2027-06-20','Air Europa UX7234 + UX1671','A Coruña 12:35 → Madrid 13:45 · Madrid 15:10 → Zürich 17:30 · Koffer 23 kg durchgecheckt');
  document.getElementById('bk-list').innerHTML=html;
})();

/* ===== KARTE ===== */
(function(){
  const el=document.getElementById('map');
  if(typeof L==='undefined'){el.innerHTML='<p class="map-note" style="padding:2rem 1rem;">Karte offline nicht verfügbar.</p>';return;}
  const map=L.map(el,{scrollWheelZoom:false});window.CMAP=map;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  const P={porto:[41.1496,-8.6110],valenca:[42.0270,-8.6440],tui:[42.0470,-8.6440],porrino:[42.1610,-8.6190],redondela:[42.2830,-8.6090],pontevedra:[42.43402,-8.64590],
    combarro:[42.4310,-8.7060],armenteira:[42.4651,-8.74066],vilanova:[42.57525,-8.82636],cesures:[42.7210,-8.6550],arreten:[42.74410,-8.64742],santiago:[42.880569,-8.541572],coruna:[43.37555,-8.40269]};
  const style={walk:{color:'#216c53',weight:4},boat:{color:'#377e67',weight:3,dashArray:'8 8'},tr:{color:'#7f978c',weight:3,dashArray:'2 7'}};
  /* Wanderwege kommen ausschliesslich aus GPX (loadGPX). Hier nur Transfers, Boot und noch nicht vermessene Stücke. */
  style.todo={color:'#8a8f86',weight:3,dashArray:'1 7',lineCap:'round'};
  window.ROUTE_LINES=[];
  L.polyline([P.porto,P.valenca],style.tr).addTo(map).bindTooltip('Transfer Porto → Valença');
  const BOAT=[[42.5623,-8.8314],[42.585,-8.812],[42.615,-8.790],[42.642,-8.760],[42.6676,-8.7297],[42.688,-8.700],[42.705,-8.672],[42.7229,-8.6541]];
  L.polyline(BOAT,style.boat).addTo(map).bindTooltip('Boot Translatio, Vilanova → Pontecesures (Verlauf schematisch)');
  const LEAL=[DAYS[5].lat,DAYS[5].lon],ARR=[DAYS[6].lat,DAYS[6].lon];
  window.ROUTE_TODO=[];
  L.polyline([P.santiago,P.coruna],style.tr).addTo(map).bindTooltip('Zug Santiago → A Coruña');
  DAYS.filter(x=>x.hotel).forEach((x,i)=>{
    const cls=x.fin?' fin':(x.kind==='travel'||x.kind==='rest'?' tr':'');
    const ic=L.divIcon({className:'',html:`<div class="pin-hit"><div class="map-pin${cls}">${i+1}</div></div>`,iconSize:[44,44],iconAnchor:[22,22]});
    L.marker([x.lat,x.lon],{icon:ic}).addTo(map).bindPopup(`<b>${fmt(x.d)}</b><br>${x.title}<br>${x.hotel}${x.approx?' <i>(Position ungefähr)</i>':''}<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">In Google Maps öffnen</a>`);
  });
  map.fitBounds(L.latLngBounds([P.valenca,P.porrino,P.redondela,P.pontevedra,P.armenteira,P.vilanova,P.cesures,P.santiago]),{padding:[16,16]});
})();



/* ===== v6: Bilder aus IMAGE_MAP ===== */
const IMAGE_MAP=JSON.parse(JSON.stringify(IMAGE_DATA));
/* Bilder mit ungeklärter Lizenz nicht anzeigen, bis Urheber und Lizenz eingetragen sind */
Object.values(IMAGE_MAP.chapters||{}).forEach(c=>{const ok=g=>g&&g.src&&g.status!=='WIKIMEDIA_ATTRIBUTION_PENDING';if(ok(c.heroNext))c.hero=c.heroNext;(c.gallery||[]).filter(g=>ok(g)&&g.replaces).forEach(g=>{c.gallery=c.gallery.filter(x=>x.id!==g.replaces);});});
Object.values(IMAGE_MAP.chapters||{}).forEach(c=>[c.hero,...(c.gallery||[])].forEach(g=>{if(g&&g.status==='WIKIMEDIA_ATTRIBUTION_PENDING'&&g.src){g._src=g.src;g._srcset=g.srcset;delete g.src;delete g.srcset;}}));
const escH=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function imgHTML(slot,cls,ctxTitle,eager){
  if(slot&&slot.src){
    return `<img class="${cls}" src="${escH(slot.src)}" ${slot.srcset?`srcset="${escH(slot.srcset)}" sizes="(min-width:760px) 720px, 100vw"`:''} alt="${escH(slot.alt||slot.motif||ctxTitle)}" width="1600" height="900"${slot.pos?` style="object-position:${escH(slot.pos)}"`:''} ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
  }
  const label=slot&&slot.motif?slot.motif:'Motiv folgt';
  return ctxTitle?`<div class="img-ph" role="img" aria-label="Platzhalter: ${escH(label)}"><span>${escH(ctxTitle)}<small>${escH(label)} · Bild folgt</small></span></div>`:`<div class="img-ph" role="img" aria-label="Platzhalter: ${escH(label)}"><span>${escH(label)}<small>Bild folgt</small></span></div>`;
}
const creditHTML=s=>(s.creditUrl?`<a href="${escH(s.creditUrl)}" target="_blank" rel="noopener">${escH(s.credit)}</a>`:escH(s.credit))+(s.license?`, <a href="${escH(s.licenseUrl||'')}" target="_blank" rel="noopener">${escH(s.license)}</a>${s.edited?', bearbeitet':''}`:'');
function heroBlock(ch,eager){
  const c=IMAGE_MAP.chapters[ch];if(!c)return '';
  const s=c.hero;
  return `<figure class="ph-fig">${imgHTML(s,'img-hero',c.title,eager)}${s&&s.src&&s.credit?`<figcaption class="img-credit">${creditHTML(s)}</figcaption>`:''}</figure>`;
}
function galleryBlock(ch,title){
  const c=IMAGE_MAP.chapters[ch];if(!c||!c.gallery.length)return '';
  const real=c.gallery.filter(g=>g.src);if(!real.length)return '';const list=real;
  return (title?`<div class="gal-title">${escH(title)}</div>`:'')+`<div class="gallery">${list.map(g=>`<figure>${imgHTML(g,'img-g','',false)}${g.src?`<figcaption>${escH(g.motif||'')}${g.credit?`<span class="cr">${creditHTML(g)}</span>`:''}</figcaption>`:''}</figure>`).join('')}</div>`;
}
/* Etappen: Hero + Galerie */
STAGES.forEach((s,i)=>{
  const sd=SDAYS[i];if(!sd)return;const chs=(IMAGE_MAP.dayChapters||{})[sd.d]||[];if(!chs.length)return;
  const body=s.querySelector('.stage-body');const box=document.createElement('div');
  box.innerHTML=heroBlock(chs[0],false)+chs.map((ch,k)=>galleryBlock(ch,chs.length>1?IMAGE_MAP.chapters[ch].title:'')).join('');
  body.insertBefore(box,body.firstChild);
});
/* Porto (Anreise) */
(function(){const el=document.getElementById('porto-images');if(el)el.innerHTML=heroBlock('00-porto',false)+galleryBlock('00-porto','Porto');})();
/* Heute-Karte: Titelbild des Tages */
const _renderToday=renderToday;
/* Tage ohne eigenes Kapitel: Bild aus einer Galerie (Kapitel, Bild-ID) */
const TODAY_OVR={'2027-06-20':['09-a-coruna','C03']};
renderToday=function(i){_renderToday(i);const x=DAYS[i];const chs=(IMAGE_MAP.dayChapters||{})[x.d]||[];
  const card=document.getElementById('today-card');if(!card)return;
  const ov=TODAY_OVR[x.d];let html='';
  if(ov){const c=IMAGE_MAP.chapters[ov[0]];const g=c&&(c.gallery||[]).find(g=>g.id===ov[1]&&g.src);
    if(g)html=`<figure class="ph-fig">${imgHTML(g,'img-hero',g.motif||x.title,true)}${g.credit?`<figcaption class="img-credit">${creditHTML(g)}</figcaption>`:''}</figure>`;}
  else if(chs.length)html=heroBlock(chs[0],true);
  if(!html)return;
  const w=document.createElement('div');w.className='tc-img-wrap';w.innerHTML=html;card.insertBefore(w,card.firstChild);};
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();

/* ===== v4: aufklappbare Info-Abschnitte ===== */
document.querySelectorAll('.sec.fold').forEach(sec=>{
  const kids=[...sec.children];const h2=sec.querySelector('h2');
  const head=document.createElement('div');head.className='fold-head';head.setAttribute('role','button');head.setAttribute('tabindex','0');head.setAttribute('aria-expanded','false');
  const body=document.createElement('div');body.className='fold-body';
  kids.forEach(c=>{if(c.classList.contains('chip')||c.classList.contains('sec-rule'))c.remove();else if(c!==h2)body.appendChild(c);});
  head.appendChild(h2);const ch=document.createElement('div');ch.className='chev';ch.textContent='▾';head.appendChild(ch);
  sec.appendChild(head);sec.appendChild(body);
  const tog=()=>{sec.classList.toggle('open');head.setAttribute('aria-expanded',sec.classList.contains('open'));};
  head.addEventListener('click',tog);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});
});

/* ===== v7: Konfiguration ===== */
const SITE_URL='https://mikefaehch.github.io/camino/';
let CUR=0; /* aktuell gewählter Tag im Heute-Modus */

/* ===== Sonnenauf-/-untergang (NOAA, offline berechnet) ===== */
function sunUT(dstr,lat,lon,rise){
  const [y,m,d]=dstr.split('-').map(Number);
  const N=Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/86400000);
  const R=Math.PI/180,lh=lon/15,t=N+((rise?6:18)-lh)/24;
  const M=0.9856*t-3.289;
  let L=(M+1.916*Math.sin(M*R)+0.020*Math.sin(2*M*R)+282.634+360)%360;
  let RA=(Math.atan(0.91764*Math.tan(L*R))/R+360)%360;
  RA=(RA+Math.floor(L/90)*90-Math.floor(RA/90)*90)/15;
  const sinD=0.39782*Math.sin(L*R),cosD=Math.cos(Math.asin(sinD));
  const cosH=(Math.cos(90.833*R)-sinD*Math.sin(lat*R))/(cosD*Math.cos(lat*R));
  let H=Math.acos(cosH)/R;if(rise)H=360-H;H/=15;
  const T=H+RA-0.06571*t-6.622;
  return ((T-lh)%24+24)%24;
}
const tzOf=place=>/Porto|Valença/.test(place)?1:2; /* Portugal UTC+1, Spanien UTC+2 (Sommerzeit) */
const hm=h=>{h=((h%24)+24)%24;let H=Math.floor(h),M=Math.round((h-H)*60);if(M===60){H++;M=0;}return H+':'+String(M).padStart(2,'0');};
const q15=h=>Math.round(h*4)/4;
function dayPlan(i){
  const x=DAYS[i],prev=DAYS[i-1]||x,fix=PLAN_FIX[x.d]||{};
  const from=x.stage?prev:x;const tz=fix.tz||tzOf(from.place);
  const sr=sunUT(x.d,from.lat,from.lon,true)+tz,ss=sunUT(x.d,x.lat,x.lon,false)+tzOf(x.place);
  const out={sr,ss,tz,srTag:tz!==tzOf(x.place)?' (PT)':'',note:fix.note||''};
  if(!x.stage||!x.km||fix.boat)return out;
  const w=wxFor(x.place,x.d);
  const tmax=w&&w.fc?w.max:23;out.tmax=tmax;out.tmaxFc=!!(w&&w.fc);
  out.walk=x.kt?x.kt/60:x.km/4.3+x.up*1.8/1000;out.src=x.kt?'Komoot':'geschätzt';out.pause=out.walk/6+(x.km>=15?.5:.25);out.total=out.walk+out.pause;
  out.target=tmax>=30?13.5:tmax>=26?14:15;
  if(fix.start!=null){out.start=fix.start;out.arrive=fix.start+(tzOf(x.place)-tz)+out.total;}
  else{out.start=8;out.arrive=out.start+out.total;out.early=tmax>=28;}
  return out;
}
const fH=h=>String(Math.round(h*2)/2).replace('.',',');
function planHTML(i){
  const p=dayPlan(i),parts=[];
  if(p.walk)parts.push(`<div class="plan-main">Gehzeit ca. ${fH(p.walk)} h, mit Pausen ca. ${fH(p.total)} h</div><div class="plan-sub">${p.src==='Komoot'?'Gehzeit laut Komoot-Tour':'Gehzeit geschätzt: 4,3 km/h plus 18 Min. je 100 Hm'} · Pausen geschätzt: 10 Min. pro Stunde plus Mittag</div>`);
  if(p.early)parts.push(`<div class="plan-sub">Heiss angesagt (${p.tmax}°): früher losgehen.</div>`);
  if(p.note)parts.push(`<div class="plan-sub">${p.note}</div>`);
  return parts.length?`<div class="plan-box">${parts.join('')}</div>`:'';
}

/* ===== Restaurants pro Tag (aus dem Abschnitt «Wo ihr esst») ===== */
const RESTS={};
document.querySelectorAll('#restaurants .rest-city').forEach(c=>{
  const lbl=(c.querySelector('.rest-city-day')||{}).textContent||'';const m=lbl.match(/(?:Tag|Etappe) (\d)/);
  const key=m?'s'+m[1]:(/19\.06/.test(lbl)?'2027-06-19':null);if(!key)return;
  RESTS[key]=[...c.querySelectorAll('.ri a')].map(a=>a.textContent.replace(/^\s*/,'').trim());
});
const restFor=x=>RESTS[x.d]||(x.stage?RESTS['s'+x.stage]:null)||[];

/* ===== Etappe teilen ===== */
function shareText(i){
  const x=DAYS[i],p=dayPlan(i),L=[];
  L.push('Camino · '+fmt(x.d)+(x.stage&&x.stage<8?' · Etappe '+x.stage:''));
  L.push('*'+x.title.trim()+'*'+(x.km?' · '+String(x.km).replace('.',',')+' km':'')+(x.up?' · ↑'+x.up+' m':'')+(x.dn?' · ↓'+x.dn+' m':''));
  if(p.start!=null)L.push('Abmarsch: '+String(Math.floor(p.start)).padStart(2,'0')+':'+String(Math.round((p.start%1)*60)).padStart(2,'0')+' Uhr'+(p.srTag||''));
  if(x.hl&&x.hl.length)L.push('Highlights: '+x.hl.join(', '));
  if(x.cafe)L.push('Erste Pause: '+x.cafe);
  if(x.hotel)L.push('Hotel: '+x.hotel+(x.ci?' · Check-in '+x.ci:'')+(x.tel?' · '+x.tel:'')+(x.q?'\nKarte: https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(x.q):''));
  const r=restFor(x);if(r.length)L.push('Abendessen: '+r.join(' / '));
  const w=wxFor(x.place,x.d);if(w&&w.fc)L.push('Wetter: '+w.max+'° / '+w.min+'° · '+(w.rain??'–')+'% Regen');
  L.push(SITE_URL+'#heute');
  return L.join('\n');
}
async function shareDay(i){
  const text=shareText(i);
  if(navigator.share){
    try{await navigator.share({text});return;}
    catch(e){if(e&&e.name==='AbortError')return;}
  }
  const url='https://wa.me/?text='+encodeURIComponent(text);
  const win=window.open(url,'_blank','noopener');
  if(!win){
    try{
      await navigator.clipboard.writeText(text);
      alert('Tagesprogramm kopiert. Du kannst es in WhatsApp einfügen.');
    }catch{
      window.location.href=url;
    }
  }
}

/* ===== Wo bin ich? ===== */
function distKm(a,b,c,d){const R=Math.PI/180,x=Math.sin((c-a)*R/2)**2+Math.cos(a*R)*Math.cos(c*R)*Math.sin((d-b)*R/2)**2;return 12742*Math.asin(Math.sqrt(x));}
let YOU=null;
function locate(){
  const out=document.getElementById('loc-out');
  const x=DAYS[CUR].hotel?DAYS[CUR]:DAYS[CUR-1]||DAYS[0];
  if(!navigator.geolocation){out.textContent='Standort wird von diesem Browser nicht unterstützt.';return;}
  out.textContent='Standort wird gesucht…';
  navigator.geolocation.getCurrentPosition(pos=>loadGPX().catch(()=>{}).then(()=>{
    const {latitude:la,longitude:lo,accuracy:acc}=pos.coords;if(window.tryStamp)window.tryStamp(la,lo);
    const km=distKm(la,lo,x.lat,x.lon);const weak=acc>150;
    const dest=x.approx?encodeURIComponent(x.q):x.lat+','+x.lon;
    const nav=`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
    const kmT=km<10?km.toFixed(1).replace('.',','):Math.round(km).toLocaleString('de-CH');
    const ar=(x.stage&&typeof alongRoute==='function')?alongRoute(x.stage,la,lo):null;
    out.innerHTML=ar&&ar.off<1
      ?`Noch <b>${ar.left.toFixed(1).replace('.',',')} km auf dem Weg</b> bis <b>${escH(x.hotel)}</b> · ${ar.done.toFixed(1).replace('.',',')} km geschafft${ar.off>0.15?` (${Math.round(ar.off*1000)} m neben der Route)`:''}.<br><a href="${nav}" target="_blank" rel="noopener">${ICON('navigation')} Zu Fuss dorthin navigieren</a>`
      :km>250
      ?`Du bist noch <b>${kmT} km</b> von ${escH(x.place)} entfernt.${TODAY<DAYS[1].d?' Buen Camino ab dem 12. Juni! ':''}`
      :`Noch <b>${kmT} km Luftlinie</b> bis <b>${escH(x.hotel)}</b> (${fmt(x.d)}).<br><a href="${nav}" target="_blank" rel="noopener">${ICON('navigation')} Zu Fuss dorthin navigieren</a>${x.approx?' <span style="color:var(--muted)">(Hotelposition ungefähr)</span>':''}`;
    if(window.CMAP&&typeof L!=='undefined'){
      if(YOU){YOU.forEach(l=>window.CMAP.removeLayer(l));}
      YOU=[L.circle([la,lo],{radius:Math.min(acc,2000),color:'#2a7de1',weight:1,fillOpacity:.12}),
           L.circleMarker([la,lo],{radius:8,color:'#fff',weight:3,fillColor:'#2a7de1',fillOpacity:1}).bindPopup('Du bist hier')];
      YOU.forEach(l=>l.addTo(window.CMAP));
      if(km<=250)window.CMAP.fitBounds(L.latLngBounds([[la,lo],[x.lat,x.lon]]),{padding:[40,40],maxZoom:15});
    }
    if(weak)out.insertAdjacentHTML('beforeend',`<br><span style="color:var(--muted)">Standort ungenau (±${Math.round(acc)} m) – Angaben nur grob. Unter freiem Himmel nochmals versuchen.</span>`);
  }),err=>{
    out.textContent=err.code===1?'Standortzugriff abgelehnt – in den Browser-Einstellungen für diese Seite erlauben.':'Standort nicht gefunden – draussen nochmals versuchen.';
  },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
}
document.getElementById('locate-btn').addEventListener('click',locate);

/* ===== Heute-Karte erweitern ===== */
const _renderToday2=renderToday;
renderToday=function(i){
  _renderToday2(i);CUR=i;
  const card=document.getElementById('today-card');const body=card&&card.querySelector('.tc-body');if(!body)return;
  const btns=body.querySelector('.tc-btns');
  const pb=document.createElement('div');pb.className='tc-plan';pb.innerHTML=planHTML(i);body.insertBefore(pb,btns);
  loadWX().then(()=>{if(CUR===i)pb.innerHTML=planHTML(i);});
  const sh=document.createElement('button');sh.type='button';sh.className='btn';sh.innerHTML=ICON('share-2')+' Teilen';sh.addEventListener('click',()=>shareDay(i));
  const lo=document.createElement('button');lo.type='button';lo.className='btn';lo.innerHTML=ICON('locate-fixed')+' Wo bin ich?';
  lo.addEventListener('click',()=>{document.getElementById('karte').scrollIntoView({behavior:'smooth',block:'start'});locate();});
  btns.appendChild(sh);btns.appendChild(lo);
};
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();

/* ===== Etappen: Startplan + Teilen ===== */
STAGES.forEach((s,k)=>{
  const sd=SDAYS[k];if(!sd)return;const i=DAYS.indexOf(sd);
  const w=s.querySelector('.stage-wx');if(!w)return;
  const pb=document.createElement('div');pb.className='stage-plan';pb.innerHTML=planHTML(i);w.after(pb);
  const row=document.createElement('div');row.className='stage-share';
  const b=document.createElement('button');b.type='button';b.className='btn';b.innerHTML=ICON('share-2')+' Etappe teilen';b.addEventListener('click',()=>shareDay(i));
  row.appendChild(b);pb.after(row);
  loadWX().then(()=>{pb.innerHTML=planHTML(i);});
});


/* ===== Reisebuch (Druck / PDF) ===== */
function buildBook(){
  const el=document.getElementById('printbook');
  const pages=[];
  pages.push(`<section class="pb-page pb-cover"><div class="pb-kicker">Reisebuch</div><h1>Camino Portugués 2027</h1>
    <div class="pb-sub">Porto · Valença · Variante Espiritual · Santiago · A Coruña<br>Fr 11. – So 20. Juni 2027 · 143 km</div>
    <div class="pb-box" style="text-align:left;margin-top:12mm"><div class="l">Notfall</div>
      <p><b>112</b> Notruf Spanien &amp; Portugal</p><p><b>+41 800 24 7 365</b> EDA Helpline · <b>+41 58 465 33 33</b> EDA aus dem Ausland</p>
      <p style="font-size:9pt">EHIC-Karte und Reiseversicherung mitnehmen.</p></div>
    <div class="pb-box" style="text-align:left"><div class="l">Compostela</div><p>Vorab online registrieren (oficinadelperegrino.com) · 2 Stempel pro Tag · Pilgerbüro Rúa das Carretas 33 · Pilgermesse 12:00, keine Rucksäcke.</p></div>
    <div class="pb-foot">Stand ${new Date().toLocaleDateString('de-CH')} · ${SITE_URL}</div></section>`);
  DAYS.forEach((x,i)=>{
    const p=dayPlan(i),r=restFor(x);
    const kick=x.stage&&x.stage<8?`Etappe ${x.stage} · ${fmt(x.d)}`:fmt(x.d);
    const stats=[x.km?`${String(x.km).replace('.',',')} km`:'',x.up?`↑ ${x.up} m`:'',p.walk?`~${fH(p.total)} h mit Pausen`:''].filter(Boolean).join(' · ');
    pages.push(`<section class="pb-page"><div class="pb-kicker">${kick}</div><div class="pb-h">${escH(x.title)}</div>${stats?`<div class="pb-stats">${stats}</div>`:''}
      <p>${escH(x.info)}</p>
      ${x.hl?`<p><b>Highlights:</b> ${x.hl.map(escH).join(' · ')}</p>`:''}
      ${x.cafe?`<p><b>Pause:</b> ${escH(x.cafe)}</p>`:''}
      <div class="pb-box"><div class="l">Zeiten</div><p>${p.walk?`Gehzeit ca. ${fH(p.walk)} h, mit Pausen ca. ${fH(p.total)} h`:''}${p.walk?' · ':''}Sonnenuntergang ${hm(p.ss)}</p>${p.note?`<p style="font-size:9pt">${escH(p.note)}</p>`:''}</div>
      ${x.hotel?`<div class="pb-box"><div class="l">Unterkunft</div><p><b>${escH(x.hotel)}</b>${x.bf?' · mit Frühstück':''}<br>${escH(x.place)} · Check-in ${escH(x.ci)} · Check-out ${escH(x.co)}<br><span class="pb-tel">Tel. ${x.tel?x.tel.replace(/^\+(351|34)/,'+$1 '):'–'}</span></p></div>`:''}
      ${morningItems(i).length?`<div class="pb-box"><div class="l">Am Morgen</div><ul>${morningItems(i).map(([ic,t])=>`<li>${t}</li>`).join('')}</ul></div>`:''}
      ${DETOURS[x.d]?`<div class="pb-box"><div class="l">Abstecher</div><ul>${DETOURS[x.d].map(o=>`<li><b>${escH(o.n)}</b> (${escH(o.w)})</li>`).join('')}</ul></div>`:''}
      ${r.length?`<div class="pb-box"><div class="l">Abendessen</div><ul>${r.map(n=>`<li>${escH(n)}</li>`).join('')}</ul></div>`:''}
      <div class="pb-box"><div class="l">Notizen</div><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p></div></section>`);
  });
  el.innerHTML=pages.join('');
}
window.addEventListener('beforeprint',buildBook);
document.getElementById('print-btn').addEventListener('click',()=>{buildBook();window.print();});

/* ===== v8: Abstecher pro Tag ===== */
/* w = Aufwand: «am Weg», «im Ort», «+x km», «Taxi» */
function detourHTML(d,compact){
  const L=DETOURS[d];if(!L)return '';
  return `<div class="det"><div class="det-h">Abstecher &amp; Sehenswertes</div><ul>${L.map(x=>`<li><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">${escH(x.n)}</a><span class="det-w">${escH(x.w)}</span>${compact?'':`<div class="det-t">${escH(x.t)}</div>`}</li>`).join('')}</ul></div>`;
}
STAGES.forEach((s,k)=>{const sd=SDAYS[k];if(!sd)return;const sh=s.querySelector('.stage-share');if(!sh)return;
  const box=document.createElement('div');box.innerHTML=detourHTML(sd.d,false);if(box.firstChild)sh.after(box.firstChild);});
const _renderToday3=renderToday;
renderToday=function(i){_renderToday3(i);const body=document.querySelector('#today-card .tc-body');const btns=body&&body.querySelector('.tc-btns');
  if(!btns)return;const box=document.createElement('div');const L=DETOURS[DAYS[i].d];if(!L)return;box.innerHTML=`<details class="det-fold"><summary>${L.length} Abstecher &amp; Sehenswertes</summary>${detourHTML(DAYS[i].d,false)}</details>`;body.insertBefore(box.firstChild,btns);};
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();

/* ===== v9: Abends schon den nächsten Tag zeigen ===== */
(function(){
  const h=new Date().getHours(),ri=realIdx();
  let next=-1;
  if(h>=18){
    if(ri>=0&&ri<DAYS.length-1)next=ri+1;
    else{const t=new Date();t.setDate(t.getDate()+1);if(t.toLocaleDateString('sv-SE')===DAYS[0].d)next=0;}
  }
  if(next<0)return;
  window.EVENING_NEXT=next;
  renderToday(next);
  document.getElementById('heute-h2').innerHTML='Euer <em>morgiger Tag</em>';
})();
const _renderToday4=renderToday;
renderToday=function(i){_renderToday4(i);
  if(window.EVENING_NEXT===i){document.getElementById('heute-chip').textContent='Morgen';
    const b=document.querySelector('#today-card .preview-badge');if(b)b.textContent='Morgen';}
  const body=document.querySelector('#today-card .tc-body');const btns=body&&body.querySelector('.tc-btns');
  const m=morningHTML(i);if(btns&&m){const d=document.createElement('div');d.innerHTML=m;body.insertBefore(d.firstChild,btns);}
};

/* ===== v9: Morgen-Hinweise ===== */
const LUGGAGE_DAYS=['2027-06-12','2027-06-13','2027-06-14','2027-06-15','2027-06-16','2027-06-17','2027-06-18'];
function morningItems(i){
  const x=DAYS[i],prev=DAYS[i-1],p=dayPlan(i),L=[];
  if(prev&&prev.hotel){
    L.push(prev.bf?['',`Frühstück inklusive: ${escH(prev.hotel)}, ${escH(prev.place)}.`]:['',`Kein Frühstück gebucht (${escH(prev.hotel)}, ${escH(prev.place)})${x.cafe?` – erste Pause: ${escH(x.cafe)}`:''}.`]);
  }
  if(x.d==='2027-06-19')L.push(['','Eigenes Gepäck im Zug nach A Coruña mitnehmen (~35 Min.).']);
  if(p.arrive!=null&&x.ci){const mm=x.ci.match(/(\d{1,2}):(\d{2})/);const ci=mm?+mm[1]+mm[2]/60:null;
    if(ci!=null&&p.arrive<ci)L.push(['',`Check-in erst ab ${hm(ci)} – bei früher Ankunft Gepäck abgeben und einkehren.`]);}
  if(x.boat)L.push(['','Abfahrtszeit am Vortag beim Bootsbetreiber bestätigen (siehe Etappe).']);
  return L;
}
function morningHTML(i){const L=morningItems(i);if(!L.length)return '';
  return `<div class="morning"><div class="det-h">Am Morgen</div><ul>${L.map(([ic,t])=>`<li>${t}</li>`).join('')}</ul></div>`;}
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();

/* ===== v9: Bootstag – Betreiber & Gezeiten ===== */
(function(){
  const k=SDAYS.findIndex(x=>x.boat);if(k<0)return;const s=STAGES[k];const anchor=s&&s.querySelector('.stage-share');if(!anchor)return;
  const d=document.createElement('div');d.className='det boat-box';
  d.innerHTML=`<div class="det-h">Boot &amp; Gezeiten</div>
  <p>Die Abfahrt richtet sich nach der Flut (der Ulla ist nur bei genug Wasser befahrbar). Fahrzeit und Abfahrt bestimmt der Betreiber – <b>am Vortag nochmals bestätigen</b>, Fahrten werden manchmal kurzfristig verschoben.</p>
  <ul>
    <li><a href="tel:+34650410322">AMare Turismo Náutico</a><span class="det-w">+34 650 410 322</span><div class="det-t">Geführte Fahrt, ca. 30 € p. P.</div></li>
    <li><a href="https://labarcadelperegrino.com" target="_blank" rel="noopener">La Barca del Peregrino</a><span class="det-w">ca. 25 €</span><div class="det-t">Grösseres Boot, 28 Plätze.</div></li>
    <li><a href="https://rutasjuanallo.es" target="_blank" rel="noopener">Rutas Juan Allo</a><span class="det-w">ca. 25 €</span><div class="det-t">Kleingruppe, 7–13 Personen.</div></li>
  </ul>
  <div class="tc-btns" style="margin-top:.6rem"><a class="btn" href="https://tablademareas.com/es/pontevedra/villagarcia-de-arousa" target="_blank" rel="noopener">Gezeitentabelle Vilagarcía ↗</a></div>
  <p class="det-t" style="margin-top:.5rem">Plan B ohne Boot: knapp 8 km zu Fuss nach Vilagarcía de Arousa, dann Zug nach Pontecesures (ca. 2–3 €). Preise laut Pilgerforum, vor Buchung prüfen.</p>`;
  anchor.after(d);
})();

/* ===== v9: GPX-Routen (optional) ===== */
/* Dateien in routes/ ablegen und hier eintragen, z. B. {1:'routes/etappe-1.gpx'} */
const GPX={};
function parseGPX(txt){
  const doc=new DOMParser().parseFromString(txt,'application/xml');
  const pts=[...doc.querySelectorAll('trkpt,rtept')].map(n=>[+n.getAttribute('lat'),+n.getAttribute('lon'),n.querySelector('ele')?+n.querySelector('ele').textContent:null]);
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+distKm(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1]));
  return {pts,cum,km:cum[cum.length-1]};
}
function profileSVG(g,id){
  const W=400,H=130,x0=40,x1=392,y0=18,y1=108;const els=g.pts.map(p=>p[2]).filter(e=>e!=null);if(els.length<2)return null;
  const mn=Math.min(...els),mx=Math.max(...els),rg=Math.max(mx-mn,50);
  let up=0,dn=0;for(let i=1;i<els.length;i++){const d=els[i]-els[i-1];if(d>0)up+=d;else dn-=d;}
  const step=Math.max(1,Math.floor(g.pts.length/220));const xy=[];
  for(let i=0;i<g.pts.length;i+=step){const e=g.pts[i][2];if(e==null)continue;xy.push([x0+(x1-x0)*g.cum[i]/g.km,y1-(y1-y0)*(e-mn)/rg]);}
  const line=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return {up:Math.round(up),dn:Math.round(dn),svg:`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#216c53" stop-opacity=".45"/><stop offset="100%" stop-color="#216c53" stop-opacity=".04"/></linearGradient></defs>
   <text x="2" y="${y0+4}" font-size="10" fill="#50665d">${Math.round(mx)} m</text><text x="2" y="${y1}" font-size="10" fill="#50665d">${Math.round(mn)} m</text><text x="${x1}" y="${H-4}" font-size="10" fill="#50665d" text-anchor="end">${g.km.toFixed(1).replace('.',',')} km</text>
   <path d="${line} L ${x1} ${y1+6} L ${x0} ${y1+6} Z" fill="url(#${id})"/><path d="${line}" fill="none" stroke="#216c53" stroke-width="2.5" stroke-linejoin="round"/>
   `};
}
let GPXP=null;
function loadGPX(){return GPXP||(GPXP=_loadGPX());}
async function _loadGPX(){
  const keys=Object.keys(GPX_FILES);if(!keys.length)return;
  const texts=await Promise.all(keys.map(n=>fetch(GPX_FILES[n]).then(r=>r.ok?r.text():null).catch(()=>null)));
  for(const [k,n] of keys.entries()){
    try{if(!texts[k])continue;const g=parseGPX(texts[k]);if(g.pts.length<2)continue;GPX[n]=g;
      if(window.CMAP&&typeof L!=='undefined')L.polyline(g.pts.map(p=>[p[0],p[1]]),{color:'#216c53',weight:4,opacity:.95}).addTo(window.CMAP).bindPopup(`Etappe ${n} · ${g.km.toFixed(1).replace('.',',')} km (GPX)`);
      const s=STAGES[n-1];const svg=s&&s.querySelector('.elev-svg');const pr=profileSVG(g,'gpx'+n);
      if(svg&&pr){svg.setAttribute('viewBox','0 0 400 130');svg.classList.add('gpx');svg.innerHTML=pr.svg;const lb=s.querySelector('.elev-lbl');if(lb)lb.textContent='Höhenprofil (GPX)';}
    }catch(e){}
  }
  for(const f of (typeof GPX_EXTRA!=='undefined'?GPX_EXTRA:[])){try{const r=await fetch(f);if(!r.ok)continue;const g=parseGPX(await r.text());window.GPX6A=g;if(window.CMAP&&typeof L!=='undefined')L.polyline(g.pts.map(p=>[p[0],p[1]]),{color:'#216c53',weight:4,opacity:.95}).addTo(window.CMAP).bindPopup(`Etappe 6a · ${g.km.toFixed(1).replace('.',',')} km (GPX)`);}catch(e){}}
  if(Object.keys(GPX).length&&window.ROUTE_LINES)window.ROUTE_LINES.forEach(l=>l.setStyle({opacity:.3}));
  try{(window.AFTER_GPX||[]).forEach(f=>f());}catch(e){}
}
/* GPX erst nach dem Laden der Seite holen (schnellerer Start) */
(function(){const go=()=>('requestIdleCallback' in window?requestIdleCallback(()=>loadGPX(),{timeout:1500}):setTimeout(loadGPX,300));
  if(document.readyState==='complete')go();else addEventListener('load',go,{once:true});})();
/* «Wo bin ich?» entlang der Route */
function alongRoute(stage,la,lo){
  const g=GPX[stage];if(!g)return null;let bi=0,bd=1e9;
  g.pts.forEach((p,i)=>{const d=distKm(la,lo,p[0],p[1]);if(d<bd){bd=d;bi=i;}});
  return {off:bd,left:g.km-g.cum[bi],done:g.cum[bi]};
}

/* ===== v12: Camino Journal ===== */
/* Reise-Bildkarten */
(function(){
  const box=document.getElementById('journey');if(!box)return;
  box.innerHTML=DAYS.map((x,i)=>{
    const ch=((IMAGE_MAP.dayChapters||{})[x.d]||[])[0];const c=ch&&IMAGE_MAP.chapters[ch];
    const JOVR={'2027-06-20':['09-a-coruna','C03']};const ov=JOVR[x.d];
    const hero=ov?(IMAGE_MAP.chapters[ov[0]].gallery.find(g=>g.id===ov[1]&&g.src)||null):(c&&c.hero&&c.hero.src?c.hero:null);
    const img=hero?`<img src="${escH(hero.src)}" ${hero.srcset?`srcset="${escH(hero.srcset)}" sizes="(min-width:900px) 560px, 100vw"`:''} alt="${escH(hero.alt||x.title)}" loading="lazy" decoding="async" width="1600" height="1067"${hero.pos?` style="object-position:${escH(hero.pos)}"`:''}>`:`<div class="img-ph" aria-hidden="true"></div>`;
    const walk=x.stage&&x.stage<8;
    const meta=walk?`Etappe ${x.stage} · ${fmt(x.d)}`:fmt(x.d);
    const facts=x.boat?`Boot · ${String(x.km).replace('.',',')} km zu Fuss · ↑ ${x.up} m · ↓ ${x.dn} m`:(x.km?`${String(x.km).replace('.',',')} km · ↑ ${x.up} m${x.dn!=null?` · ↓ ${x.dn} m`:''}`:'');
    const target=x.stage?`stage:${x.stage}`:'anreise';
    return `<a class="j-card${walk?'':' j-small'}" href="#${x.stage?'etappen':'anreise'}" data-go2="${target}">
      <div class="j-img">${img}</div>
      <div class="j-text"><div class="j-meta">${meta}</div><div class="j-title">${escH(x.title)}</div>
      ${JLINES[x.d]?`<p class="j-line">${escH(JLINES[x.d])}</p>`:''}
      ${facts?`<div class="j-facts">${facts}</div>`:''}${walk?'':''}</div></a>`;
  }).join('');
  box.querySelectorAll('[data-go2]').forEach(a=>a.addEventListener('click',e=>{
    const t=a.dataset.go2;if(t.startsWith('stage:')){e.preventDefault();openStage(+t.slice(6),true);}
  }));
})();

/* Etappen-Detail: klare Reihenfolge */
const REST_LINKS={};
document.querySelectorAll('#restaurants .rest-city').forEach(c=>{
  const lbl=(c.querySelector('.rest-city-day')||{}).textContent||'';const m=lbl.match(/(?:Tag|Etappe) (\d)/);
  const key=m?'s'+m[1]:(/19\.06/.test(lbl)?'s8':null);if(!key)return;
  REST_LINKS[key]=[...c.querySelectorAll('.ri a')].map(a=>({href:a.href,name:a.textContent.replace(/^\s*/,'').trim()}));
});
STAGES.forEach((s,k)=>{
  const body=s.querySelector('.stage-body');if(!body)return;
  const kids=[...body.children];
  const imgBox=kids.find(c=>c.querySelector&&c.querySelector(':scope > .ph-fig, :scope > .gallery'));
  const pick=sel=>kids.filter(c=>c.matches&&c.matches(sel));
  const hero=imgBox?imgBox.querySelector(':scope > .ph-fig'):null;
  const galParts=imgBox?[...imgBox.children].filter(c=>c!==hero):[];
  const h=t=>{const d=document.createElement('div');d.className='st-h';d.textContent=t;return d;};
  const order=[];
  if(hero)order.push(hero);
  order.push(...pick('.s-lead'),...pick('.s-prose'));
  order.push(...pick('.pills'),...pick('.stage-wx'),...pick('.stage-plan'));
  const maps=pick('.map-row'),elev=pick('.elev-wrap');
  if(maps.length||elev.length)order.push(h('Route & Höhenprofil'),...maps,...elev);
  const hl=[...pick('.det:not(.boat-box)'),...pick('.tags')];
  if(hl.length)order.push(h('Unterwegs sehenswert'),...hl);
  if(galParts.length)order.push(...galParts);
  const R=REST_LINKS['s'+(k+1)];
  if(R&&R.length){const rb=document.createElement('div');rb.className='rest-box';rb.innerHTML=R.map(r=>`<a href="${escH(r.href)}" target="_blank" rel="noopener">${escH(r.name)} ↗</a>`).join('');order.push(h('Essen am Abend'),rb);}
  const hotel=pick('.day-cards');if(hotel.length)order.push(h('Unterkunft'),...hotel);
  const prac=[...pick('.ibox, .wbox'),...pick('.boat-box'),...pick('.stage-share')];
  if(prac.length)order.push(h('Praktisch'),...prac);
  const used=new Set(order);
  kids.forEach(c=>{if(c.tagName==='HR')c.remove();else if(!used.has(c)&&c!==imgBox)order.push(c);});
  if(imgBox&&!galParts.length)imgBox.remove();
  order.forEach(c=>body.appendChild(c));
  if(imgBox&&imgBox.parentNode&&!imgBox.children.length)imgBox.remove();
});

/* Deko-Emojis vor Listeneinträgen und Titeln entfernen */
document.querySelectorAll('.ri a, .stitle, .kday-right h4').forEach(e=>{const t=e.firstChild;if(t&&t.nodeType===3)t.textContent=t.textContent.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'').replace(/\s*[\p{Extended_Pictographic}\uFE0F]+\s*$/u,'');});
/* Unterwegs: «Heute» nach oben holen */
(function(){
  const inTrip=TODAY>=DAYS[0].d&&TODAY<=DAYS[DAYS.length-1].d;
  if(!(inTrip||window.EVENING_NEXT!=null))return;
  const h=document.getElementById('heute'),nav=document.getElementById('nav');
  if(h&&nav){nav.after(h);}
})();


/* v14: lange Beschreibung in «Mehr zur Etappe», Höhenmeter nur im Kopf */
STAGES.forEach(s=>{const body=s.querySelector('.stage-body');if(!body)return;
  const pr=body.querySelector(':scope > .s-prose');if(pr){const d=document.createElement('details');d.className='more';d.innerHTML='<summary>Mehr zur Etappe</summary>';pr.before(d);d.appendChild(pr);}
  body.querySelectorAll('.st-h').forEach(h=>{if(h.textContent==='Unterwegs sehenswert')h.textContent='Highlights';});
});
/* Reservationsstatus: <div class="ri" data-status="geplant|bestätigt"> setzen, sonst gilt «Empfehlung» (siehe Einleitung) */
document.querySelectorAll('#restaurants .ri[data-status]').forEach(r=>r.insertAdjacentHTML('beforeend',`<span class="st${r.dataset.status==='bestätigt'?' ok':''}">Reservation ${r.dataset.status}</span>`));

/* ===== v18: eine Etappenansicht, Faden, Übergang, Stempel, Kurzbefehle ===== */
(function(){
  const journey=document.getElementById('journey');if(!journey)return;
  const reise=document.getElementById('reise'),etappen=document.getElementById('etappen');
  /* Routenbalken in «Reise» übernehmen, alten Abschnitt auflösen */
  const rb=document.getElementById('route-bar');if(rb)journey.before(rb);
  /* Karten in Einträge mit darunterliegender Etappe umbauen */
  [...journey.querySelectorAll('.j-card')].forEach(card=>{
    const fresh=card.cloneNode(true);card.replaceWith(fresh);
    const item=document.createElement('div');item.className='j-item';fresh.before(item);item.appendChild(fresh);
    const t=fresh.dataset.go2||'';
    if(t.startsWith('stage:')){const n=+t.slice(6),st=STAGES[n-1];
      if(st){st.classList.add('merged');item.appendChild(st);item.dataset.stage=n;
        if(st.classList.contains('today-stage'))item.classList.add('today');
        fresh.setAttribute('aria-expanded',st.classList.contains('open'));
        if(st.classList.contains('open'))item.classList.add('open');}}
    else{fresh.addEventListener('click',()=>{});}
  });
  if(etappen){etappen.style.display='none';const hr=etappen.nextElementSibling;if(hr&&hr.tagName==='HR')hr.style.display='none';}
  /* Öffnen / Schliessen mit Bild-Übergang */
  const itemOf=n=>journey.querySelector(`.j-item[data-stage="${n}"]`);
  function setOpen(n,open){
    const it=itemOf(n),st=STAGES[n-1];if(!it||!st)return;
    st.classList.toggle('open',open);it.classList.toggle('open',open);
    const c=it.querySelector('.j-card');if(c)c.setAttribute('aria-expanded',open);
    st.querySelector('.stage-head').setAttribute('aria-expanded',open);
  }
  function transition(n,open,scroll){
    const it=itemOf(n);if(!it)return;
    const cardImg=it.querySelector('.j-card .j-img img, .j-card .j-img .img-ph');
    const doIt=()=>{setOpen(n,open);};
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(document.startViewTransition&&!reduce&&cardImg){
      const heroOf=()=>it.querySelector('.stage-body .ph-fig .img-hero, .stage-body .ph-fig .img-ph');
      if(open){cardImg.style.viewTransitionName='st-img';}
      else{const h=heroOf();if(h)h.style.viewTransitionName='st-img';}
      const vt=document.startViewTransition(()=>{
        if(open)cardImg.style.viewTransitionName='';else{const h=heroOf();if(h)h.style.viewTransitionName='';}
        doIt();
        if(open){const h=heroOf();if(h)h.style.viewTransitionName='st-img';}else cardImg.style.viewTransitionName='st-img';
      });
      vt.finished.finally(()=>{cardImg.style.viewTransitionName='';const h=heroOf();if(h)h.style.viewTransitionName='';});
    }else doIt();
    if(scroll&&open)setTimeout(()=>it.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}),reduce?0:260);
  }
  journey.addEventListener('click',e=>{
    const card=e.target.closest('.j-card');if(!card)return;const it=card.parentElement;
    if(it.dataset.stage){e.preventDefault();const n=+it.dataset.stage;transition(n,!it.classList.contains('open'),true);}
  });
  /* bestehende Aufrufe (Heute → «Zur Etappe») auf die neue Ansicht umlenken */
  openStage=function(n,scroll){transition(n,true,scroll);};

  /* ===== Der Weg als Faden ===== */
  const thread=document.createElement('div');thread.className='thread';thread.setAttribute('aria-hidden','true');
  thread.innerHTML='<div class="thread-track"></div><div class="thread-fill"></div>';journey.prepend(thread);
  const fill=thread.querySelector('.thread-fill');let ticking=false;
  function upd(){ticking=false;
    const r=journey.getBoundingClientRect(),mid=innerHeight*0.55;
    const p=Math.max(0,Math.min(1,(mid-r.top)/Math.max(1,r.height)));
    fill.style.transform=`scaleY(${p})`;
    journey.querySelectorAll(':scope > .j-item').forEach(it=>{const top=it.getBoundingClientRect().top+40;it.classList.toggle('passed',top<mid);});
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
  addEventListener('resize',upd);upd();
  /* Reisestand: erledigte Tage markieren */
  journey.querySelectorAll(':scope > .j-item').forEach((it,i)=>{const d=DAYS[i]&&DAYS[i].d;if(!d)return;it.dataset.date=d;if(d<TODAY)it.classList.add('done');if(d===TODAY)it.classList.add('today');});
})();

/* ===== Digitaler Stempel ===== */
const STAMP_KEY='camino_stamps_v1';
const getStamps=()=>{try{return JSON.parse(localStorage.getItem(STAMP_KEY)||'{}');}catch(e){return {};}};
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function stampSVG(x){
  const d=dt(x.d),date=`${d.getDate()} · ${ROM[d.getMonth()]} · ${d.getFullYear()}`;
  const place=escH(x.place.toUpperCase());
  return `<svg class="stamp" viewBox="0 0 120 120" role="img" aria-label="Gestempelt: ${escH(x.place)}, ${fmt(x.d)}">
    <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1"/>
    <path id="sa-${x.d}" d="M60 60 m-38 0 a38 38 0 1 1 76 0" fill="none"/>
    <text font-size="10.5" letter-spacing="2.2" fill="currentColor" font-family="Fraunces,Georgia,serif"><textPath href="#sa-${x.d}" startOffset="50%" text-anchor="middle">CAMINO 2027</textPath></text>
    <g transform="translate(60 62)" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M-12 6 Q0 -16 12 6 M-6 6 Q0 -8 6 6 M0 6 L0 -10"/></g>
    <text x="60" y="84" text-anchor="middle" font-size="${place.length>12?7.5:9}" letter-spacing="1" fill="currentColor" font-family="DM Sans,system-ui,sans-serif" font-weight="600">${place}</text>
    <text x="60" y="96" text-anchor="middle" font-size="7.5" letter-spacing="1" fill="currentColor" font-family="DM Sans,system-ui,sans-serif">${date}</text>
  </svg>`;
}
function renderStamps(){
  const S=getStamps();
  document.querySelectorAll('#journey .j-item').forEach(it=>{
    const x=DAYS.find(y=>y.d===it.dataset.date);const has=x&&S[x.d];
    let el=it.querySelector(':scope > .j-card .stamp-wrap');
    const rot=x?(x.d.slice(-1)%2?-1:1)*(8+ +x.d.slice(-1)):0;
    if(has&&!el){const img=it.querySelector('.j-card .j-img');if(img){img.insertAdjacentHTML('beforeend',`<div class="stamp-wrap" style="--rot:${rot}deg">${stampSVG(x)}</div>`);}}
    const fig=it.querySelector('.stage-body .ph-fig');
    if(has&&fig&&!fig.querySelector('.stamp-wrap'))fig.insertAdjacentHTML('beforeend',`<div class="stamp-wrap" style="--rot:${rot}deg">${stampSVG(Object.assign({},x,{d:x.d}))}</div>`.replace(/sa-/g,'sb-'));
    if(!has){if(el)el.remove();const f2=fig&&fig.querySelector('.stamp-wrap');if(f2)f2.remove();}
  });
}
function tryStamp(la,lo){
  const x=DAYS.find(y=>y.d===TODAY&&y.hotel);if(!x)return false;
  const km=distKm(la,lo,x.lat,x.lon);if(km>(x.approx?1.5:0.6))return false;
  const S=getStamps();if(S[x.d])return false;
  S[x.d]=new Date().toISOString();try{localStorage.setItem(STAMP_KEY,JSON.stringify(S));}catch(e){}
  renderStamps();
  const it=document.querySelector(`#journey .j-item[data-date="${x.d}"]`);if(it)it.classList.add('just-stamped');
  return true;
}
window.tryStamp=tryStamp;
renderStamps();
/* Stempel still setzen, wenn der Standort bereits freigegeben ist (keine Nachfrage) */
(function(){
  if(!(TODAY>=DAYS[0].d&&TODAY<=DAYS[DAYS.length-1].d)||!navigator.permissions||!navigator.geolocation)return;
  navigator.permissions.query({name:'geolocation'}).then(r=>{if(r.state==='granted')navigator.geolocation.getCurrentPosition(p=>tryStamp(p.coords.latitude,p.coords.longitude),()=>{},{maximumAge:300000,timeout:15000});}).catch(()=>{});
})();

/* ===== Restaurants zusammenklappen ===== */
document.querySelectorAll('#restaurants .rest-city').forEach(c=>{
  const hd=c.querySelector('.rest-city-hd');const items=[...c.querySelectorAll('.ri')];if(!hd||!items.length)return;
  const body=document.createElement('div');body.className='rc-body';items.forEach(i=>body.appendChild(i));c.appendChild(body);
  const n=document.createElement('span');n.className='rc-count';n.textContent=items.length===1?'1 Empfehlung':items.length+' Empfehlungen';hd.appendChild(n);
  hd.setAttribute('role','button');hd.setAttribute('tabindex','0');hd.setAttribute('aria-expanded','false');
  const tog=()=>{const o=!c.classList.contains('open');c.classList.toggle('open',o);hd.setAttribute('aria-expanded',o);};
  hd.addEventListener('click',tog);hd.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});
});

/* ===== App-Kurzbefehle (Startbildschirm-Symbol, Android) ===== */
(function(){
  const a=new URLSearchParams(location.search).get('aktion');if(!a)return;
  history.replaceState(null,'',location.pathname+location.hash);
  if(a==='standort'){document.getElementById('karte').scrollIntoView();locate();}
  if(a==='anrufen'){const x=DAYS.find(y=>y.d===TODAY&&y.tel)||DAYS[CUR];if(x&&x.tel){document.getElementById('heute').scrollIntoView();
    const b=document.querySelector('#today-card a[href^="tel:"]');if(b){b.classList.add('pulse');b.focus();}}}
})();


/* ===== v23: Bilder gross ansehen ===== */
(function(){
  const lb=document.getElementById('lb');if(!lb||!lb.showModal)return;
  const im=document.getElementById('lb-img'),cap=document.getElementById('lb-cap');
  const SEL='.gallery img, .stage-body .ph-fig img, #porto-images img, .tc-img-wrap img';
  let list=[],idx=0;
  const big=img=>{const ss=img.getAttribute('srcset');if(!ss)return img.currentSrc||img.src;
    return ss.split(',').map(x=>x.trim().split(/\s+/)).sort((a,b)=>parseInt(b[1])-parseInt(a[1]))[0][0];};
  const info=img=>{const fig=img.closest('figure');const fc=fig&&fig.querySelector('figcaption');
    const credit=fc?(fc.querySelector('.cr')||fc).innerHTML:'';const motif=fc&&fc.querySelector('.cr')?fc.firstChild&&fc.firstChild.nodeType===3?fc.firstChild.textContent:'':'';
    return {src:big(img),alt:img.alt||'',motif:motif||img.alt||'',credit};};
  function show(i){idx=(i+list.length)%list.length;const x=list[idx];im.src=x.src;im.alt=x.alt;
    cap.innerHTML=`${escH(x.motif)}${x.credit?`<span class="cr">${x.credit}</span>`:''}`;}
  function open(img){
    const scope=img.closest('.stage-body')||img.closest('#porto-images')||img.closest('.gallery')||img.parentElement;
    const imgs=[...scope.querySelectorAll(SEL)].filter(x=>x.closest('figure'));
    list=(imgs.length?imgs:[img]).map(info);idx=Math.max(0,imgs.indexOf(img));
    lb.classList.toggle('single',list.length<2);show(idx);
    document.documentElement.style.overflow='hidden';lb.showModal();
  }
  document.addEventListener('click',e=>{const img=e.target.closest(SEL);if(!img||img.closest('.j-card'))return;e.preventDefault();open(img);});
  const close=()=>lb.close();
  lb.addEventListener('close',()=>{document.documentElement.style.overflow='';im.removeAttribute('src');});
  lb.querySelector('.lb-close').addEventListener('click',close);
  lb.querySelector('.lb-prev').addEventListener('click',()=>show(idx-1));
  lb.querySelector('.lb-next').addEventListener('click',()=>show(idx+1));
  lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lb-fig'))close();});
  lb.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(idx-1);if(e.key==='ArrowRight')show(idx+1);});
  let x0=null;im.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  im.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;
    if(Math.abs(dx)>50&&list.length>1)show(idx+(dx<0?1:-1));},{passive:true});
})();

/* ===== OFFLINE ===== */
if('serviceWorker' in navigator && location.protocol==='https:'){
  // Keep installed iPhone web apps up to date without deleting offline data.
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing || !navigator.serviceWorker.controller)return;
    refreshing=true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
    // Check for a new worker each time Camino is opened.
    reg.update().catch(()=>{});
  }).catch(()=>{});
}

/* ===== v24: Datenkonsistenz, GPX-Download, Tagesbegleiter ===== */
const TOTAL_KM=DAYS.reduce((a,x)=>a+(x.km||0),0);
const kmTxt=k=>String(Math.round(k*10)/10).replace('.',',');
/* Etappenköpfe aus den zentralen Daten */
STAGES.forEach((s,k)=>{const x=SDAYS[k];if(!x||x.stage>7)return;const a=s.querySelector('.skm'),b=s.querySelector('.sele');if(!a||!b)return;
  if(x.boat){a.textContent=`${kmTxt(x.km)} km`;b.textContent=`+ Boot · ↑${x.up}m · ↓${x.dn}m`;}
  else{a.textContent=`${kmTxt(x.km)} km`;b.textContent=`↑${x.up}m · ↓${x.dn}m`;}});
/* GPX-Download und Navigation in jeder Etappe */
STAGES.forEach((s,k)=>{const n=k+1,row=s.querySelector('.map-row');if(!row||!GPX_FILES[n]||row.querySelector('.gpx'))return;
  const mk=(href,lbl,fn)=>{const a=document.createElement('a');a.className='mbtn gpx';a.href=href;a.setAttribute('download',fn);a.innerHTML=ICON('download')+' '+lbl;row.appendChild(a);};
  if(n===6){mk('routes/etappe-6a.gpx','GPX 6a','camino-etappe-6a.gpx');mk(GPX_FILES[6],'GPX 6b','camino-etappe-6b.gpx');}else mk(GPX_FILES[n],'GPX',`camino-etappe-${n}.gpx`);});

/* Heute: Adresse, Navigation, GPX, Komoot */
const _renderToday24=renderToday;
renderToday=function(i){_renderToday24(i);const x=DAYS[i];const card=document.getElementById('today-card');if(!card)return;
  const box=card.querySelector('.tc-box .tc-sub');if(box&&x.addr&&!card.querySelector('.tc-addr')){const d=document.createElement('div');d.className='tc-addr';d.textContent=x.addr;box.after(d);}
  const btns=card.querySelector('.tc-btns');if(!btns)return;
  const old=[...btns.querySelectorAll('a')].find(a=>/Hotel auf Karte/.test(a.textContent));
  if(x.addr){const nav=document.createElement('a');nav.className='btn';nav.target='_blank';nav.rel='noopener';
    nav.href='https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+encodeURIComponent((x.hotel||'')+', '+x.addr);
    nav.innerHTML=ICON('navigation')+' Navigation zum Hotel';if(old)old.replaceWith(nav);else btns.appendChild(nav);}
  if(x.stage&&GPX_FILES[x.stage]){const g=document.createElement('a');g.className='btn';g.href=GPX_FILES[x.stage];g.setAttribute('download',`camino-etappe-${x.stage}.gpx`);g.innerHTML=ICON('download')+' GPX';btns.appendChild(g);}
  const st=x.stage&&STAGES[x.stage-1];const k=st&&st.querySelector('.mbtn.k');
  if(k){const a=document.createElement('a');a.className='btn';a.href=k.href;a.target='_blank';a.rel='noopener';a.innerHTML=ICON('route')+' Komoot';btns.appendChild(a);}
  if(TODAY>DAYS[DAYS.length-1].d){const c=document.getElementById('heute-chip');if(c)c.textContent='Rückblick';}
};
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();
(function(){if(TODAY>DAYS[DAYS.length-1].d){const h=document.getElementById('heute-h2');if(h)h.innerHTML='Euer <em>Camino</em> im Rückblick';}})();

/* ===== Klima Juni 2010–2025 (Santiago-Lavacolla, tutiempo.net) ===== */
(function(){
  const D=[[2010,22.2,10.8,85.3],[2011,22.1,10.7,5.6],[2012,21.1,11.6,78.0],[2013,22.1,9.7,80.8],[2014,24.5,11.3,74.4],[2015,26.9,11.7,4.8],[2016,23.2,11.5,44.5],[2017,24.0,12.8,29.7],[2018,21.1,12.3,60.7],[2019,19.1,10.0,57.9],[2020,21.0,11.2,42.2],[2021,21.7,10.9,79.8],[2022,20.9,12.0,117.9],[2023,24.2,13.6,110.2],[2024,21.4,12.1,47.0],[2025,25.4,13.9,24.1]];
  const t=document.getElementById('wxh-temp'),r=document.getElementById('wxh-rain'),b=document.getElementById('wxh-body');if(!t||!r)return;
  const n1=v=>String(v).replace('.',',');
  const W=360,L=26,R=4,n=D.length,cw=(W-L-R)/n,cx=i=>L+cw*(i+.5);
  const xl=(H)=>D.map((d,i)=>(i%3===0||i===n-1)?`<text class="ax" x="${cx(i)}" y="${H}" text-anchor="middle">${d[0]}</text>`:'').join('');
  /* Temperatur: Spanne Min–Max */
  {const H=120,y0=8,y1=96,lo=8,hi=28,y=v=>y1-(y1-y0)*(v-lo)/(hi-lo);
   let g='';[10,15,20,25].forEach(v=>g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-6}" y="${y(v)+3}" text-anchor="end">${v}°</text>`);
   g+=D.map((d,i)=>`<g class="y"><title>Juni ${d[0]}: Ø ${n1(d[2])}° bis ${n1(d[1])}°</title><rect class="hit" x="${cx(i)-cw/2}" y="${y0}" width="${cw}" height="${y1-y0}"/><line class="rg" x1="${cx(i)}" x2="${cx(i)}" y1="${y(d[2])}" y2="${y(d[1])}"/><circle class="mk" cx="${cx(i)}" cy="${y(d[1])}" r="4"/><circle class="mk" cx="${cx(i)}" cy="${y(d[2])}" r="4"/></g>`).join('');
   t.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Juni-Temperaturen Santiago 2010 bis 2025">${g}${xl(H-6)}</svg>`;}
  /* Regen */
  {const H=110,y0=6,y1=86,hi=120,y=v=>y1-(y1-y0)*v/hi,bw=Math.min(14,cw-4);
   let g='';[0,40,80,120].forEach(v=>g+=`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-6}" y="${y(v)+3}" text-anchor="end">${v}</text>`);
   g+=D.map((d,i)=>{const h=Math.max(2,y1-y(d[3])),x=cx(i)-bw/2,top=y1-h,rr=Math.min(4,h/2);
     return `<g class="y"><title>Juni ${d[0]}: ${n1(d[3])} mm Regen</title><rect class="hit" x="${cx(i)-cw/2}" y="${y0}" width="${cw}" height="${y1-y0}"/><path class="mk" d="M${x} ${y1}V${top+rr}Q${x} ${top} ${x+rr} ${top}H${x+bw-rr}Q${x+bw} ${top} ${x+bw} ${top+rr}V${y1}Z"/></g>`;}).join('');
   r.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Juni-Regen Santiago 2010 bis 2025 in Millimetern">${g}${xl(H-6)}</svg>`;}
  if(b)b.innerHTML=D.slice().reverse().map(d=>`<tr><td>${d[0]}</td><td>${n1(d[1])}°</td><td>${n1(d[2])}°</td><td>${n1(d[3])} mm</td></tr>`).join('');
})();

/* ===== v25: Anreise und Heimreise als Tage in der Reise ===== */
(function(){
  const box=document.getElementById('anreise'),journey=document.getElementById('journey');if(!box||!journey)return;
  const ps=[...box.querySelectorAll(':scope > p.prose')],imgs=document.getElementById('porto-images'),tz=box.querySelector(':scope > .wbox');
  const items=[...journey.querySelectorAll(':scope > .j-item')],by=d=>items.find(i=>i.dataset.date===d);
  function panel(item,nodes){if(!item)return;
    const st=document.createElement('div');st.className='stage merged extra';const b=document.createElement('div');b.className='stage-body';
    nodes.forEach(n=>{if(n)b.appendChild(n);});st.appendChild(b);item.appendChild(st);item.dataset.extra='1';
    const card=item.querySelector('.j-card');card.removeAttribute('href');card.setAttribute('role','button');card.setAttribute('tabindex','0');card.setAttribute('aria-expanded','false');
    const tog=e=>{e.preventDefault();const o=!item.classList.contains('open');item.classList.toggle('open',o);st.classList.toggle('open',o);card.setAttribute('aria-expanded',o);};
    card.addEventListener('click',tog);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')tog(e);});}
  const strip=p=>{if(p){const s=p.querySelector('strong');if(s&&/Juni:/.test(s.textContent))s.remove();p.innerHTML=p.innerHTML.replace(/^\s+/,'');}return p;};
  panel(by('2027-06-11'),[strip(ps[0]),imgs,tz]);
  panel(by('2027-06-20'),[strip(ps[2])]);
  /* Transfer nach Valença gehört an den Anfang von Tag 1 */
  const s1=STAGES[0]&&STAGES[0].querySelector('.stage-body');
  if(s1&&ps[1]){const ib=document.createElement('div');ib.className='ibox';const p=strip(ps[1]);ib.innerHTML='<b>Am Morgen von Porto nach Valença:</b> ';ib.appendChild(p);p.style.display='inline';p.style.margin='0';
    const hero=s1.querySelector(':scope > .ph-fig');if(hero)hero.after(ib);else s1.prepend(ib);}
  const hr=box.nextElementSibling;if(hr&&hr.tagName==='HR')hr.remove();box.remove();
})();

/* ===== v26: Höhenprofil interaktiv, Track-Anschluss, max. 3 Highlights ===== */
window.AFTER_GPX=window.AFTER_GPX||[];
/* Höhenprofil: Finger/Maus zeigt km und Höhe, Punkt auf der Karte */
(function(){
  let mk=null;
  function bind(n){const s=STAGES[n-1];const svg=s&&s.querySelector('.elev-svg.gpx');const g=GPX[n];if(!svg||!g||svg.dataset.ia)return;svg.dataset.ia='1';
    const els=g.pts.map(p=>p[2]).filter(e=>e!=null);const mn=Math.min(...els),mx=Math.max(...els),rg=Math.max(mx-mn,50);
    const x0=40,x1=392,y0=18,y1=108,NS='http://www.w3.org/2000/svg';
    const grp=document.createElementNS(NS,'g');grp.style.display='none';
    grp.innerHTML='<line class="cur-l" y1="12" y2="112"/><circle class="cur-d" r="5"/><text class="cur-t" y="11"></text>';svg.appendChild(grp);
    const [ln,dot,tx]=grp.children;
    function at(ev){const r=svg.getBoundingClientRect();const vx=(ev.clientX-r.left)/r.width*400;const f=Math.max(0,Math.min(1,(vx-x0)/(x1-x0)));
      const km=f*g.km;let i=g.cum.findIndex(c=>c>=km);if(i<0)i=g.cum.length-1;const p=g.pts[i];if(p[2]==null)return;
      const x=x0+(x1-x0)*f,y=y1-(y1-y0)*(p[2]-mn)/rg;grp.style.display='';
      ln.setAttribute('x1',x);ln.setAttribute('x2',x);dot.setAttribute('cx',x);dot.setAttribute('cy',y);
      tx.textContent=`${km.toFixed(1).replace('.',',')} km · ${Math.round(p[2])} m`;tx.setAttribute('x',Math.min(Math.max(x,60),345));tx.setAttribute('text-anchor','middle');
      if(window.CMAP&&typeof L!=='undefined'){if(!mk)mk=L.circleMarker([p[0],p[1]],{radius:7,color:'#fff',weight:2,fillColor:'#216c53',fillOpacity:1});mk.setLatLng([p[0],p[1]]);if(!window.CMAP.hasLayer(mk))mk.addTo(window.CMAP);}}
    svg.addEventListener('pointermove',at);svg.addEventListener('pointerdown',at);
    svg.addEventListener('pointerleave',()=>{grp.style.display='none';});
    svg.setAttribute('aria-label',`Höhenprofil Etappe ${n}: ${Math.round(mn)} bis ${Math.round(mx)} m, ${g.km.toFixed(1).replace('.',',')} km. Antippen zeigt Distanz und Höhe.`);
  }
  window.AFTER_GPX.push(()=>Object.keys(GPX).forEach(n=>bind(+n)));
  Object.keys(GPX).forEach(n=>bind(+n));
})();
/* Schliesst der Track ans Hotel an? Abweichungen offen ausweisen */
(function(){
  function check(){STAGES.forEach((s,k)=>{const n=k+1,x=SDAYS[k],g=GPX[n];if(!x||!g||s.querySelector('.trk-note'))return;
    const prev=DAYS[DAYS.indexOf(x)-1];const notes=[];
    const first=(n===6&&window.GPX6A)?window.GPX6A.pts[0]:g.pts[0],last=g.pts[g.pts.length-1];
    if(n>1&&prev&&prev.lat){const d=distKm(first[0],first[1],prev.lat,prev.lon);if(d>0.3)notes.push(`Der Track startet ca. ${Math.round(d*10)*100} m vom ${escH(prev.hotel)}`);}
    if(x.lat){const d=distKm(last[0],last[1],x.lat,x.lon);if(d>0.3)notes.push(`endet ca. ${Math.round(d*10)*100} m vor dem ${escH(x.hotel)}`);}
    if(!notes.length)return;const row=s.querySelector('.map-row');if(!row)return;
    const p=document.createElement('p');p.className='trk-note';p.innerHTML=notes.join(' und ').replace(/^endet/,'Der Track endet')+'. Dieses Stück ist nicht im Track – dafür «Navigation zum Hotel» nutzen.';row.after(p);});}
  window.AFTER_GPX.push(check);check();
})();
/* Unterwegs sehenswert: drei prominent, der Rest auf Wunsch */
document.querySelectorAll('.stage-body .det ul').forEach(ul=>{const li=[...ul.children];if(li.length<=3)return;
  li.slice(3).forEach(l=>l.hidden=true);const b=document.createElement('button');b.type='button';b.className='det-more';b.textContent=`${li.length-3} weitere anzeigen`;
  b.addEventListener('click',()=>{li.forEach(l=>l.hidden=false);b.remove();});ul.after(b);});

/* ===== v27: Tipp des Tages direkt unter die Beschreibung ===== */
STAGES.forEach(s=>{const b=s.querySelector('.stage-body');if(!b)return;const anchor=b.querySelector(':scope > details.more')||b.querySelector(':scope > .s-lead');
  [...b.querySelectorAll(':scope > .ibox')].reverse().forEach(ib=>{if(anchor)anchor.after(ib);});});

/* ===== v28: Unterwegs-Modus, klare Knöpfe, Karte auf heute, Offline-Fotos ===== */
const IN_TRIP=TODAY>=DAYS[0].d&&TODAY<=DAYS[DAYS.length-1].d;
if(IN_TRIP)document.body.classList.add('in-trip');
/* Hell/Dunkel-Knopf ins Startbild, damit er keine Inhalte überdeckt */
(function(){const b=document.getElementById('theme-btn'),h=document.getElementById('hero');if(b&&h)h.appendChild(b);})();
/* Tageskarte: vier Hauptknöpfe, der Rest unter «Mehr» */
const _renderToday28=renderToday;
renderToday=function(i){_renderToday28(i);
  const btns=document.querySelector('#today-card .tc-btns');if(!btns||btns.dataset.v28)return;btns.dataset.v28='1';
  const all=[...btns.children],find=re=>all.find(b=>re.test(b.textContent));
  const main=[find(/Zur Etappe/),find(/Wo bin ich/),find(/Navigation zum Hotel|Hotel auf Karte/),find(/Anrufen/)].filter(Boolean);
  const rest=all.filter(b=>!main.includes(b));main.forEach(b=>btns.appendChild(b));
  if(rest.length){const d=document.createElement('details');d.className='tc-more';d.innerHTML='<summary>Mehr: Teilen, GPX, Komoot</summary>';
    const w=document.createElement('div');w.className='tc-more-btns';rest.forEach(b=>w.appendChild(b));d.appendChild(w);btns.after(d);}
};
(function(){const on=[...document.querySelectorAll('.tp')].findIndex(b=>b.classList.contains('on'));if(on>=0)renderToday(on);})();
/* Karte: am Reisetag auf die heutige Etappe zoomen, Knopf für die ganze Route */
window.AFTER_GPX.push(()=>{if(!IN_TRIP||!window.CMAP||typeof L==='undefined')return;const x=DAYS[realIdx()];const g=x&&x.stage&&GPX[x.stage];if(!g)return;
  const pts=g.pts.map(p=>[p[0],p[1]]);if(x.stage===6&&window.GPX6A)pts.push(...window.GPX6A.pts.map(p=>[p[0],p[1]]));
  const all=window.CMAP.getBounds(),tb=L.latLngBounds(pts);const fit=()=>{window.CMAP.invalidateSize();window.CMAP.fitBounds(tb,{padding:[24,24]});};fit();
  const el=document.getElementById('map');if('IntersectionObserver' in window&&el){const io=new IntersectionObserver(e=>{if(e[0].isIntersecting){fit();io.disconnect();}});io.observe(el);}
  const tools=document.querySelector('.map-tools');if(tools&&!document.getElementById('map-all')){const b=document.createElement('button');b.type='button';b.className='btn';b.id='map-all';
    b.innerHTML=ICON('route')+' Ganze Route';b.addEventListener('click',()=>window.CMAP.fitBounds(all));tools.insertBefore(b,tools.children[1]||null);}});
/* Hotel-Adressen in den Etappen aus den zentralen Daten */
STAGES.forEach((s,k)=>{const x=SDAYS[k],a=s.querySelector('.dc-addr');if(x&&a&&x.addr)a.textContent=x.addr;});
/* Fotos auf Wunsch offline speichern (eigener Cache, bleibt über Updates erhalten) */
(function(){const tip=document.getElementById('offline-tip');if(!tip||!('caches' in window))return;
  const list=[...new Set(Object.values(IMAGE_MAP.chapters||{}).flatMap(c=>[c.hero,...(c.gallery||[])]).filter(g=>g&&g.src).map(g=>g.src))];
  if(!list.length)return;const b=document.createElement('button');b.type='button';b.className='btn';
  const idle=()=>{b.disabled=false;b.innerHTML=ICON('download')+` Alle ${list.length} Fotos offline speichern (ca. 3 MB)`;};
  const done=()=>{b.disabled=true;b.innerHTML=ICON('check')+' Fotos offline gespeichert';};
  idle();tip.appendChild(document.createElement('br'));tip.appendChild(b);
  caches.open('camino-fotos').then(c=>c.keys()).then(k=>{if(k.length>=list.length)done();}).catch(()=>{});
  b.addEventListener('click',async()=>{b.disabled=true;let n=0;
    try{const c=await caches.open('camino-fotos');
      for(const src of list){const u=new URL(src,location.href).href;if(!(await c.match(u))){const r=await fetch(u);if(r.ok)await c.put(u,r);}n++;b.textContent=`Fotos werden gespeichert … ${n}/${list.length}`;}
      done();}
    catch(e){idle();b.insertAdjacentHTML('afterend','<span class="map-off"> Nicht alle Fotos gespeichert – mit Netz nochmals versuchen.</span>');}});
})();

/* Camino 2.0: truthful connectivity indicator; navigator.onLine is not a server reachability test. */
(function initConnectionStatus(){
  const status=document.getElementById('connection-status');
  if(!status)return;
  const update=()=>{
    const online=navigator.onLine!==false;
    status.dataset.connection=online?'online':'offline';
    status.textContent=online
      ? 'Netzwerk verfügbar · Karte und Wetter benötigen eine funktionierende Internetverbindung.'
      : 'Offline · Gespeicherte Etappen, Hotels und GPX bleiben verfügbar. Karte und Wetter sind eingeschränkt.';
  };
  window.addEventListener('online',update);
  window.addEventListener('offline',update);
  update();
})();

/* Independent travel expenses: local-only storage, no external financial service. */
window.initTravelExpenses=function initTravelExpenses(){
  const form=document.getElementById('expense-form');
  if(!form)return;
  const KEY='camino-expenses-v1', people=['Mike','Ante','Kevin','Luis'];
  const feedback=document.getElementById('expense-feedback');
  const money=(c,cur)=>(c/100).toFixed(2)+' '+cur;
  let entries=[];
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))entries=saved.filter(valid).slice(0,1000);}catch{}
  function valid(e){if(!e||typeof e.id!=='string'||!Number.isSafeInteger(e.cents)||e.cents<=0||e.cents>99999900||!['EUR','CHF'].includes(e.currency))return false;if(e.kind==='settlement')return people.includes(e.from)&&people.includes(e.to)&&e.from!==e.to;return (e.kind===undefined||e.kind==='expense')&&typeof e.description==='string'&&e.description.length<=120&&people.includes(e.payer)&&Array.isArray(e.members)&&e.members.length>0&&e.members.every(m=>people.includes(m))&&new Set(e.members).size===e.members.length;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(entries));return true;}catch{feedback.textContent='Speichern fehlgeschlagen. Bitte Backup exportieren und freien Speicher prüfen.';return false;}}
  // One-time initial booking for new local ledgers; existing data stays untouched.
  if(localStorage.getItem(KEY)===null&&entries.length===0){
    const initial={id:'initial-pazo-2027',description:'Pazo Santa Teresa (13.–14. Juni 2027)',cents:50900,currency:'CHF',payer:'Mike',members:[...people]};
    if(valid(initial)){entries.push(initial);if(!save())entries.pop();}
  }
  function render(){
    const list=document.getElementById('expense-list'),balances=document.getElementById('expense-balances');
    list.replaceChildren();balances.replaceChildren();
    if(!entries.length){list.textContent='Noch keine Ausgaben erfasst.';balances.textContent='Noch keine Salden.';return;}
    const ordered=[...entries].reverse();
    for(const e of ordered){
      const row=document.createElement('div');row.className='expense-entry';
      const info=document.createElement('span');
      info.textContent=e.kind==='settlement'?'Rückzahlung: '+e.from+' an '+e.to+' · '+money(e.cents,e.currency):e.description+' · '+money(e.cents,e.currency)+' · bezahlt von '+e.payer+' · '+e.members.join(', ');
      const edit=document.createElement('button');edit.type='button';edit.textContent='Bearbeiten';edit.className='ghost-btn';
      edit.setAttribute('aria-label','Eintrag bearbeiten: '+(e.description||'Rückzahlung'));
      edit.addEventListener('click',()=>{
        const newAmount=prompt('Neuer Betrag in '+e.currency+' (bisher '+money(e.cents,e.currency)+')',(e.cents/100).toFixed(2));
        if(newAmount===null)return;
        const amount=Number(newAmount.replace(',','.'));
        if(!Number.isFinite(amount)||amount<=0||amount>999999){feedback.textContent='Ungültiger Betrag.';return;}
        const revised={...e,cents:Math.round(amount*100)};
        if(e.kind!=='settlement'){
          const description=prompt('Beschreibung',e.description);
          if(description===null)return;
          revised.description=description.trim();
        }
        if(!valid(revised)||!revised.description&&e.kind!=='settlement'){feedback.textContent='Ungültiger Eintrag.';return;}
        const previous=entries;entries=entries.map(x=>x.id===e.id?revised:x);
        if(save()){render();feedback.textContent='Eintrag aktualisiert.';}else entries=previous;
      });
      const remove=document.createElement('button');remove.type='button';remove.textContent='Löschen';remove.className='ghost-btn';
      remove.setAttribute('aria-label','Eintrag löschen: '+(e.description||'Rückzahlung'));
      remove.addEventListener('click',()=>{if(!confirm('Diese Ausgabe wirklich löschen?'))return;entries=entries.filter(x=>x.id!==e.id);if(save())render();});
      row.append(info,edit,remove);list.appendChild(row);
    }
    for(const currency of ['EUR','CHF']){
      const relevant=entries.filter(e=>e.currency===currency);if(!relevant.length)continue;
      const net=Object.fromEntries(people.map(p=>[p,0]));
      for(const e of relevant){
        if(e.kind==='settlement'){net[e.from]+=e.cents;net[e.to]-=e.cents;continue;}
        net[e.payer]+=e.cents;
        const base=Math.floor(e.cents/e.members.length),rem=e.cents%e.members.length;
        e.members.forEach((p,i)=>net[p]-=base+(i<rem?1:0));
      }
      const heading=document.createElement('h5');heading.textContent=currency;balances.appendChild(heading);
      for(const p of people){const row=document.createElement('p');row.textContent=p+': '+(net[p]>=0?'erhält ':'schuldet ')+money(Math.abs(net[p]),currency);balances.appendChild(row);}
      const debtors=people.filter(p=>net[p]<0).map(p=>({p,c:-net[p]})),creditors=people.filter(p=>net[p]>0).map(p=>({p,c:net[p]}));
      let i=0,j=0;
      while(i<debtors.length&&j<creditors.length){
        const c=Math.min(debtors[i].c,creditors[j].c);
        const row=document.createElement('p');row.className='expense-settlement';row.textContent=debtors[i].p+' zahlt '+creditors[j].p+' '+money(c,currency);balances.appendChild(row);
        debtors[i].c-=c;creditors[j].c-=c;if(!debtors[i].c)i++;if(!creditors[j].c)j++;
      }
    }
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const description=document.getElementById('expense-description').value.trim();
    const amount=Number(document.getElementById('expense-amount').value);
    const currency=document.getElementById('expense-currency').value;
    const payer=document.getElementById('expense-payer').value;
    const members=Array.from(form.querySelectorAll('input[name="expense-member"]:checked'),el=>el.value);
    const e={id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+String(Math.random()).slice(2),description,cents:Math.round(amount*100),currency,payer,members};
    if(!description||!Number.isFinite(amount)||amount<=0||!valid(e)){feedback.textContent='Bitte gültigen Betrag, Beschreibung und Beteiligte angeben.';return;}
    entries.push(e);if(save()){form.reset();render();feedback.textContent='Ausgabe auf diesem Gerät gespeichert.';}else entries.pop();
  });
  document.getElementById('settlement-form').addEventListener('submit',event=>{
    event.preventDefault();
    const from=document.getElementById('settlement-from').value,to=document.getElementById('settlement-to').value;
    const amount=Number(document.getElementById('settlement-amount').value);
    const e={kind:'settlement',id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+String(Math.random()).slice(2),from,to,cents:Math.round(amount*100),currency:document.getElementById('settlement-currency').value};
    if(!Number.isFinite(amount)||!valid(e)){feedback.textContent='Bitte unterschiedliche Personen und einen gültigen Betrag angeben.';return;}
    entries.push(e);if(save()){event.target.reset();render();feedback.textContent='Rückzahlung gespeichert.';}else entries.pop();
  });
  document.getElementById('expense-export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({format:'camino-expenses-v1',entries},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='camino-reisekasse-backup.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  document.getElementById('expense-import').addEventListener('change',async event=>{
    const file=event.target.files&&event.target.files[0];if(!file)return;
    try{
      if(file.size>1000000)throw Error('Datei zu gross');
      const data=JSON.parse(await file.text());
      if(data.format!=='camino-expenses-v1'||!Array.isArray(data.entries)||data.entries.length>1000||!data.entries.every(valid))throw Error('Ungültiges Backup');
      if(!confirm('Aktuelle Ausgaben durch dieses Backup ersetzen?'))return;
      const previous=entries;entries=data.entries;if(save()){render();feedback.textContent='Backup importiert.';}else entries=previous;
    }catch{feedback.textContent='Backup konnte nicht importiert werden.';}
    finally{event.target.value='';}
  });
  render();
};
/* Calendar handoff: local ICS download, no notification permission or push service. */
(function initCalendarReminder(){
  const button=document.getElementById('reminder-download');
  if(!button)return;
  const esc=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const pad=n=>String(n).padStart(2,'0');
  button.addEventListener('click',()=>{
    const day=DAYS[CUR];
    const time=document.getElementById('reminder-time').value;
    const out=document.getElementById('reminder-feedback');
    if(!day||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)){
      out.textContent='Bitte eine gültige Abmarschzeit auswählen.';return;
    }
    const date=day.d.replace(/-/g,'');
    const [hour,minute]=time.split(':').map(Number);
    const start=date+'T'+pad(hour)+pad(minute)+'00';
    const end=date+'T'+pad(hour===23?23:hour+1)+pad(hour===23?59:minute)+'00';
    const title=esc('Camino: '+day.title+' – Abmarsch');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Camino 2027//DE',
      'BEGIN:VEVENT','UID:camino-'+date+'-'+pad(hour)+pad(minute)+'@camino.local',
      'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
      'DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+title,
      'DESCRIPTION:'+esc('Reisetag: '+day.title+'; Details: '+SITE_URL+'#heute'),
      'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY',
      'DESCRIPTION:Camino – Abmarsch in 30 Minuten','END:VALARM',
      'END:VEVENT','END:VCALENDAR',''].join('\r\n');
    const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download='camino-abmarsch-'+date+'.ics';
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    out.textContent='Kalendereintrag erstellt. Importiere ihn in deinen Kalender und aktiviere dort Erinnerungen.';
  });
})();

/* Notification capability test; does not claim remote push delivery. */
(function initNotificationTest(){
  const button=document.getElementById('notification-test');
  if(!button)return;
  const output=document.getElementById('notification-test-feedback');
  button.addEventListener('click',async()=>{
    if(!('Notification' in window)||!('serviceWorker' in navigator)){
      output.textContent='Mitteilungen werden in diesem Browser nicht unterstützt.';return;
    }
    try{
      const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
      if(permission!=='granted'){output.textContent='Mitteilungen sind nicht erlaubt. Bitte die Mitteilungsberechtigung für die installierte App prüfen.';return;}
      const registration=await navigator.serviceWorker.ready;
      await registration.showNotification('Camino 2027 – Testmitteilung',{
        body:'Deine Camino-Web-App kann auf diesem Gerät Mitteilungen anzeigen.',
        icon:'./icon-192.png',badge:'./icon-192.png',tag:'camino-device-test',
        data:{url:new URL('./#heute',location.href).href}
      });
      output.textContent='Testmitteilung angefordert. Dies testet nur dieses Gerät, nicht den späteren Server-Push.';
    }catch{
      output.textContent='Mitteilung konnte nicht angezeigt werden. Auf dem iPhone die Web-App zum Home-Bildschirm hinzufügen und Mitteilungen erlauben.';
    }
  });
})();
