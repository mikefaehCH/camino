/* Camino 2027 – zentrale Reisedaten. Einzige Quelle für Etappen, Hotels, Umwege, Bilder.
   Wird vor js/app.js geladen. Werte nicht in index.html oder app.js duplizieren.
   DAYS:      ein Eintrag pro Reisetag (d=Datum, stage=Etappe 1–7, 8=Santiago/A Coruña; km/up/dn/kt=Komoot-Werte; addr/tel/lat/lon=Hotel)
   JLINES:    Kurzsatz pro Tag für die Reise-Karten
   PLAN_FIX:  Sonderfälle für Gehzeit/Start (z. B. Boot)
   STAY_COST: nur Zahlungsstatus (keine Preise!)
   DETOURS:   Umwege/Sehenswertes pro Tag (w = am Weg / +km / Taxi …)
   GPX_FILES: Etappe → GPX in routes/ ; GPX_EXTRA: zusätzliche Tracks (6a)
   IMAGE_DATA: Bilder pro Kapitel; status WIKIMEDIA_ATTRIBUTION_PENDING = ausgeblendet */
const DAYS=[
 {d:'2027-06-11',hl:['Ribeira','Ponte Luís I','Avenida dos Aliados'],cafe:'Abendessen in der Ribeira',kind:'travel',title:'Zürich → Porto',info:'Chair Airlines CS176 · ZRH 15:35 → OPO 17:15 · Flughafen-Check-in ab 13:05. Abend in der Ribeira.',hotel:'Axis Porto Club Aliados',q:'Axis Porto Club Aliados Porto',tel:'+351927514680',ci:'15:00–24:00',co:'bis 12:00',bf:false,place:'Porto',lat:41.14993,lon:-8.61147,addr:'Av. dos Aliados 325, 4000-067 Porto'},
 {d:'2027-06-12',hl:['Festung Valença','Grenzbrücke','Kathedrale Tui'],cafe:'Tui, Altstadt bei der Kathedrale',stage:1,title:'Valença → O Porriño',km:20.8,up:210,info:'Transfer oder Zug nach Valença, Festung, Brücke nach Tui (Uhr +1 h), Kathedrale, Flussweg am Louro.',hotel:'Apartamentos Tarela',q:'Apartamentos Tarela O Porriño',tel:'+34722731461',ci:'15:00–22:00',co:'bis 11:00',bf:false,place:'O Porriño',lat:42.16161,lon:-8.61725,addr:'Rúa Pérez Leirós 1, 36400 O Porriño',dn:240,kt:332},
 {d:'2027-06-13',hl:['Dorfkern Mos','Capela de Santiaguiño','Blick auf die Ría de Vigo'],cafe:'Mos (Rúa)',stage:2,title:'O Porriño → Redondela',km:16.1,up:250,info:'Mos, Capela de Santiaguiño, erster Blick auf die Ría de Vigo. Steiler Abstieg – Stöcke!',hotel:'Pazo Santa Teresa',q:'Pazo Santa Teresa Redondela',tel:'+34623052507',ci:'13:00–24:00',co:'bis 11:00',bf:true,place:'Redondela',lat:42.28109,lon:-8.60934,addr:'Rúa Pai Crespo 23, 36800 Redondela',dn:290,kt:266},
 {d:'2027-06-14',hl:['Austern in Arcade','Ponte Sampaio','Flussweg am Gafos'],cafe:'Cesantes · Mittag in Arcade',stage:3,title:'Redondela → Pontevedra',km:24.0,up:450,info:'Arcade (Austern!), Ponte Sampaio, Pflasterweg Canicouva, Flussweg am Gafos.',hotel:'Parador de Pontevedra',q:'Parador de Pontevedra',tel:'+34986855800',ci:'ab 15:00',co:'bis 12:00',bf:false,place:'Pontevedra',lat:42.43402,lon:-8.64590,addr:'Rúa do Barón 19, 36002 Pontevedra',dn:450,kt:402},
 {d:'2027-06-15',hl:['Kloster Poio','Combarro','Mühlen von Samieira','Kloster Armenteira'],cafe:'Combarro (Proviant kaufen!)',stage:4,title:'Pontevedra → Armenteira',km:22.5,up:680,info:'Variante Espiritual: Kloster Poio, Combarro, Mühlen von Samieira, steiler Aufstieg zum Kloster Armenteira. Proviant ab Combarro.',hotel:'Pousada Armenteira',q:'Pousada Armenteira',tel:'+34986716372',ci:'15:00–23:00',co:'bis 12:00',bf:true,place:'Armenteira',lat:42.46491,lon:-8.73958,addr:'Armenteira, 36192 Caroi (Meis)',dn:380,kt:389},
 {d:'2027-06-16',hl:['Ruta da Pedra e da Auga','Wassermühlen','Albariño-Weinberge'],cafe:'Bar Comercio Armenteira (ab 08:00)',stage:5,title:'Armenteira → Vilanova de Arousa',km:24.8,up:150,info:'Ruta da Pedra e da Auga: Wasserfälle und Mühlen, dann Weinberge bis an die Ría de Arousa.',hotel:'Hotel Leal – La Sirena',q:'Hotel Leal La Sirena Vilanova de Arousa',tel:'+34986554112',ci:'15:00–21:00',co:'bis 12:00',bf:false,place:'Vilanova de Arousa',lat:42.57525,lon:-8.82636,addr:'Av. as Sinas 64, 36620 Vilanova de Arousa',dn:450,kt:396},
 {d:'2027-06-17',hl:['Translatio-Boot','17 Steinkreuze','Santiaguiño do Monte'],cafe:'Hafen Vilanova vor der Abfahrt',stage:6,boat:true,title:'Translatio nach Padrón',km:10.0,up:130,dn:90,kt:160,info:'Kurzer Weg zum Anleger, mit dem Boot den Ulla hinauf nach Pontecesures (Zeit nach Gezeiten), dann über Herbón nach Padrón.',hotel:'Pazo Arretén',q:'Pazo Arretén Padrón',tel:'+34647726395',ci:'15:00–23:00',co:'bis 12:00',bf:true,place:'Padrón',lat:42.74410,lon:-8.64742,addr:'Lugar Arretén, 15917 Iria Flavia (Padrón)'},
 {d:'2027-06-18',hl:['Iria Flavia','A Escravitude','Praza do Obradoiro'],cafe:'A Escravitude',stage:7,fin:true,title:'Padrón → Santiago',km:25.2,up:450,info:'Iria Flavia, A Escravitude, Wälder von Teo, Ponte Vella – Ankunft auf der Praza do Obradoiro.',hotel:'Hotel Pazo de Altamira',q:'Hotel Pazo de Altamira Santiago de Compostela',tel:'+34981558542',ci:'16:00–23:30',co:'bis 12:00',bf:false,place:'Santiago',lat:42.880569,lon:-8.541572,addr:'Rúa de Altamira 18, 15704 Santiago de Compostela',dn:180,kt:411},
 {d:'2027-06-19',hl:['Compostela abholen','Pilgermesse 12 Uhr','Mercado de Abastos'],cafe:'Mercado de Abastos',stage:8,kind:'rest',title:'Santiago → A Coruña',info:'Compostela abholen, Pilgermesse 12 Uhr, Mercado de Abastos. Nachmittags Zug nach A Coruña (~35 Min.).',hotel:'Meliá Maria Pita',q:'Meliá Maria Pita A Coruña',tel:'+34981205000',ci:'15:00–23:30',co:'bis 12:00',bf:true,place:'A Coruña',lat:43.37555,lon:-8.40269,addr:'Av. de Pedro Barrié de la Maza 3, 15003 A Coruña'},
 {d:'2027-06-20',hl:['Frühstück im Meliá','Abflug 12:35'],cafe:'Frühstück im Hotel',kind:'travel',title:'A Coruña → Zürich',info:'Air Europa UX7234 LCG 12:35 → MAD 13:45 · UX1671 MAD 15:10 → ZRH 17:30. Koffer durchgecheckt.',place:'A Coruña',lat:43.3712,lon:-8.3960}
];

const JLINES={
 '2027-06-12':'Über die Grenzbrücke nach Galicien.',
 '2027-06-13':'Römerstrasse, Mos und der erste Blick auf die Ría de Vigo.',
 '2027-06-14':'Austern in Arcade, die Steinbrücke von Ponte Sampaio.',
 '2027-06-15':'Hórreos in Combarro, Mühlen von Samieira, Aufstieg zum Kloster.',
 '2027-06-16':'Mühlen, Wasserfälle und die Ría de Arousa.',
 '2027-06-17':'Mit dem Boot den Ulla hinauf – wie Jakobus selbst.',
 '2027-06-18':'Durch die Wälder von Teo bis zum Obradoiro.',
 '2027-06-19':'Compostela, dann weiter nach A Coruña.'
};

const PLAN_FIX={
  '2027-06-12':{start:10,tz:1,note:'Start in Valença nach Transfer oder Zug. Ab der Brücke nach Tui gilt spanische Zeit (+1 h).'},
  '2027-06-17':{boat:true,note:'Abfahrt nach Gezeiten. Zu Fuss: 6a 1,3 km zum Anleger (ca. 20 Min.), nach dem Boot 6b 8,7 km über Herbón nach Padrón (ca. 2:20 h, Komoot).'}
};

const STAY_COST={
 '2027-06-11':{pay:'Überweisung vor Anreise'},
 '2027-06-12':{pay:'wird belastet'},
 '2027-06-13':{pay:'bezahlt'},
 '2027-06-14':{pay:'Zahlung vor Ort'},
 '2027-06-15':{pay:'Zahlung vor Ort'},
 '2027-06-16':{pay:'Buchungsbestätigung fehlt noch'},
 '2027-06-17':{pay:'Zahlung vor Ort'},
 '2027-06-18':{pay:'teilweise bezahlt, Rest + Kurtaxe vor Ort'},
 '2027-06-19':{pay:'Zahlung vor Ort'}
};

const DETOURS={
 '2027-06-12':[
  {n:'Festung Valença',w:'Start · im Ort',t:'Vor dem Losgehen eine Runde auf den Mauern – Blick über den Minho nach Tui.',q:'Fortaleza de Valença'},
  {n:'Kathedrale Tui mit Kreuzgang',w:'am Weg · ~45 Min.',t:'Wehrkathedrale aus dem 12. Jh.; Kreuzgang und Turm gegen Eintritt.',q:'Catedral de Tui'},
  {n:'Klarissenkloster «As Encerradas»',w:'am Weg',t:'Mandelgebäck der Nonnen kaufen – die «Delicias» gibt es durch die Drehtür.',q:'Convento de las Clarisas Tui'},
  {n:'Flussweg durch die Gándaras',w:'+0,5 km',t:'Ab Orbenlle die ausgeschilderte Variante am Louro statt 3 km durchs Industriegebiet.',q:'Gándaras de Budiño'}],
 '2027-06-13':[
  {n:'Pazo de Mos',w:'am Weg',t:'Herrenhaus aus dem 17. Jh. direkt an der alten Römerstrasse.',q:'Pazo de los Marqueses de Mos'},
  {n:'Römischer Meilenstein',w:'am Weg',t:'Rund 100 m nach der Kapelle Santiaguiño de Antas: Meilenstein der Via XIX.',q:'Capela de Santiaguiño de Antas Mos'},
  {n:'Castro de Torroso',w:'kurzer Abstecher',t:'Eisenzeitliche Siedlung, 1983 entdeckt.',q:'Castro de Torroso Mos'},
  {n:'Ensenada de San Simón',w:'Abendspaziergang oder Taxi',t:'Bucht mit der Klosterinsel San Simón – schön zum Sonnenuntergang an der Praia de Cesantes (ca. 2,6 km vom Hotel). Bootsausflüge auf die Insel fahren regulär nur samstags.',q:'Ensenada de San Simón Redondela'}],
 '2027-06-14':[
  {n:'Aussicht auf die Ría de Vigo',w:'+0,6 km',t:'Bei ca. km 4, nahe einer alten Poststation, 300 m vom Weg.',q:'Cesantes Redondela'},
  {n:'Kirche Santiago de Arcade',w:'kurzer Abstecher',t:'Romanische Kirche aus dem 12. Jh. – passt zur Austernpause.',q:'Igrexa de Santiago de Arcade'},
  {n:'Burg Soutomaior',w:'Taxi',t:'Burg mit Park, Mai–Sept. täglich 10–21 Uhr, ca. 2 €. Zu Fuss zu weit.',q:'Castelo de Soutomaior'},
  {n:'Altstadt Pontevedra',w:'im Ort · abends',t:'Praza da Leña, Basílica Santa María, Ruinen von Santo Domingo, Santuario da Peregrina.',q:'Praza da Leña Pontevedra'},
  {n:'Illa das Esculturas',w:'im Ort',t:'Skulpturenpark auf einer Flussinsel im Lérez – ruhiger Abendspaziergang.',q:'Illa das Esculturas Pontevedra'}],
 '2027-06-15':[
  {n:'Kloster Poio',w:'am Weg · ~30 Min.',t:'Benediktinerkloster mit Kreuzgang und einem der längsten Hórreos Galiciens.',q:'Mosteiro de Poio'},
  {n:'Mühlen von Samieira',w:'am Weg · km 16',t:'Alte Wassermühlen am Bach in Samieira – letzte ruhige Pause vor dem langen Aufstieg nach Armenteira.',q:'Muíños de Samieira Poio'},
  {n:'Combarro am Wasser',w:'kleiner Umweg',t:'Nicht gleich bergauf, sondern geradeaus durch die Gassen: Hórreos und Wegkreuze direkt am Meer.',q:'Combarro'},
  {n:'Vesper im Kloster Armenteira',w:'im Ort · abends',t:'Die Zisterzienserinnen singen das Abendgebet – Zeit vor Ort erfragen.',q:'Mosteiro de Armenteira'}],
 '2027-06-16':[
  {n:'Mühlen am rechten Ufer',w:'am Weg',t:'Auf der Ruta da Pedra e da Auga die rechte Bachseite nehmen – näher an den Mühlen.',q:'Ruta da Pedra e da Auga Armenteira'},
  {n:'Strände vor Vilanova',w:'am Weg · letzte 3 km',t:'Sandwege mit Stränden und Strandbars – Füsse ins Wasser.',q:'Praia O Terrón Vilanova de Arousa'},
  {n:'Casa-Museo Valle-Inclán',w:'im Ort',t:'Geburtshaus des Schriftstellers. Für Pilger gratis; Mi 10–14 und 17–21 Uhr.',q:'Casa Museo Valle-Inclán Vilanova de Arousa'},
  {n:'Monte Lobeira',w:'Taxi',t:'Aussichtsberg (290 m) über die Ría de Arousa bis zu den Ons-Inseln.',q:'Miradoiro Monte Lobeira Vilanova de Arousa'}],
 '2027-06-17':[
  {n:'Steinkreuze am Ulla',w:'vom Boot aus',t:'17 Wegkreuze säumen die Ruta Marítima Xacobea – vorne sitzen.',q:'Pontecesures'},
  {n:'Santiaguiño do Monte',w:'im Ort · ~1 h',t:'Steintreppe ab der Fonte do Carme hinauf zur Einsiedelei, wo Jakobus gepredigt haben soll.',q:'Santiaguiño do Monte Padrón'},
  {n:'Kirche Santiago mit «O Pedrón»',w:'im Ort',t:'Unter dem Altar der Stein, an dem das Boot mit Jakobus festgemacht haben soll.',q:'Igrexa de Santiago de Padrón'},
  {n:'Kloster Herbón',w:'am Weg 6b',t:'Franziskanerkloster über dem Ulla – hier sollen die Mönche die ersten Pimientos de Padrón angebaut haben.',q:'Convento de Herbón'},
  {n:'Casa de Rosalía de Castro',w:'am Weg 6b · kurz vor dem Hotel',t:'Haus der Dichterin in A Matanza, Di–Sa 10–13:30 und 16–20 Uhr, Eintritt ca. 3 €. Garten frei.',q:'Casa Museo Rosalía de Castro Padrón'},
  {n:'Pimientos de Padrón',w:'abends',t:'Saison Mai–Oktober – die echten kommen aus Herbón.',q:'Padrón'}],
 '2027-06-18':[
  {n:'Santuario A Escravitude',w:'am Weg',t:'Barockkirche aus dem 16. Jh. über einer heiligen Quelle.',q:'Santuario da Escravitude'},
  {n:'Castro Lupario',w:'+2,5 km',t:'Keltische Wallanlage der Königin Lupa, Abzweig in Rúa de Francos – mit Kapelle San Martiño und einem der ältesten Wegkreuze Galiciens.',q:'Castro Lupario'},
  {n:'Aussicht Agro dos Mosteiros',w:'am Weg',t:'Erster Blick auf die Türme der Kathedrale.',q:'Agro dos Mosteiros Santiago'}],
 '2027-06-19':[
  {n:'Dächer der Kathedrale',w:'Santiago · vorab buchen',t:'Führung über die Granitdächer – Tickets früh reservieren.',q:'Cubiertas Catedral de Santiago'},
  {n:'Torre de Hércules',w:'A Coruña · ~30 Min. zu Fuss',t:'Ältester noch betriebener römischer Leuchtturm, UNESCO-Welterbe. Am Meer entlang hin.',q:'Torre de Hércules'}]
};

const GPX_FILES={1:'routes/etappe-1.gpx',2:'routes/etappe-2.gpx',3:'routes/etappe-3.gpx',4:'routes/etappe-4.gpx',5:'routes/etappe-5.gpx',6:'routes/etappe-6b.gpx',7:'routes/etappe-7.gpx'};

const GPX_EXTRA=['routes/etappe-6a.gpx'];

const IMAGE_DATA={
 "_info": "Zentrale Bildkonfiguration. Pro Kapitel: hero + gallery. Bild einsetzen: src (800 px) und srcset (800w/1600w) unter images/<kapitel>/ ablegen, alt und credit ergänzen. Leere src = eleganter Platzhalter.",
 "dayChapters": {
  "2027-06-11": [
   "00-porto"
  ],
  "2027-06-12": [
   "01-valenca-porrino"
  ],
  "2027-06-13": [
   "02-porrino-redondela"
  ],
  "2027-06-14": [
   "03-redondela-pontevedra"
  ],
  "2027-06-15": [
   "04-pontevedra-armenteira"
  ],
  "2027-06-16": [
   "05-armenteira-vilanova"
  ],
  "2027-06-17": [
   "06-translatio-padron"
  ],
  "2027-06-18": [
   "07-padron-santiago"
  ],
  "2027-06-19": [
   "09-a-coruna",
   "08-santiago-stadt"
  ]
 },
 "chapters": {
  "00-porto": {
   "title": "Porto",
   "hero": {
    "id": "02",
    "motif": "Douro bei Sonnenuntergang",
    "status": "EXAMPLE_ONLY_PORTO",
    "src": "images/porto/porto-douro-sonnenuntergang-800.webp",
    "srcset": "images/porto/porto-douro-sonnenuntergang-800.webp 800w, images/porto/porto-douro-sonnenuntergang-1600.webp 1600w",
    "alt": "Sonnenuntergang über dem Douro mit der Ponte Luís I in Porto",
    "credit": "Foto: Everaldo Coelho / Unsplash"
   },
   "gallery": [
    {
     "id": "03",
     "motif": "Ponte Luís I zur blauen Stunde",
     "status": "EXAMPLE_ONLY_PORTO",
     "src": "images/porto/porto-ponte-luis-blaue-stunde-800.webp",
     "srcset": "images/porto/porto-ponte-luis-blaue-stunde-800.webp 800w, images/porto/porto-ponte-luis-blaue-stunde-1600.webp 1600w",
     "alt": "Ponte Luís I zur blauen Stunde",
     "credit": "Foto: Daniel Sessler / Unsplash"
    },
    {
     "id": "04",
     "motif": "Ribeira am Douro",
     "status": "EXAMPLE_ONLY_PORTO",
     "src": "images/porto/porto-ribeira-800.webp",
     "srcset": "images/porto/porto-ribeira-800.webp 800w, images/porto/porto-ribeira-1600.webp 1600w",
     "alt": "Ribeira-Viertel am Douro",
     "credit": "Foto: David Magalhães / Unsplash"
    },
    {
     "id": "05",
     "motif": "Bahnhof São Bento",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/00-porto/porto-sao-bento-800.webp",
     "srcset": "images/00-porto/porto-sao-bento-800.webp 800w, images/00-porto/porto-sao-bento-1600.webp 1600w",
     "alt": "Azulejo-Halle des Bahnhofs São Bento in Porto",
     "credit": "Foto: Jesus Esteban / Unsplash",
     "creditUrl": "https://unsplash.com/photos/UConhbOmzAE"
    },
    {
     "id": "06",
     "motif": "Pastéis de Nata",
     "status": "EXAMPLE_ONLY_PORTO",
     "src": "images/porto/porto-pasteis-de-nata-800.webp",
     "srcset": "images/porto/porto-pasteis-de-nata-800.webp 800w, images/porto/porto-pasteis-de-nata-1600.webp 1334w",
     "alt": "Pastéis de Nata",
     "credit": "Foto: Hector John Periquin / Unsplash"
    },
    {
     "id": "08",
     "motif": "Ponte Luís I im Morgenlicht",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/00-porto/porto-ponte-luis-morgenlicht-800.webp",
     "srcset": "images/00-porto/porto-ponte-luis-morgenlicht-800.webp 800w, images/00-porto/porto-ponte-luis-morgenlicht-1600.webp 1600w",
     "alt": "Ponte Luís I und die Ribeira von Porto im Morgenlicht",
     "credit": "Foto: Daniel Sessler / Unsplash",
     "creditUrl": "https://unsplash.com/photos/UGXk8XfIAxM"
    }
   ]
  },
  "01-valenca-porrino": {
   "title": "Valença → O Porriño",
   "hero": {
    "id": "02",
    "motif": "Festung Valença mit Blick nach Galicien",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/01-valenca-porrino/valenca-festung-blick-800.webp",
    "srcset": "images/01-valenca-porrino/valenca-festung-blick-800.webp 800w, images/01-valenca-porrino/valenca-festung-blick-1600.webp 1600w",
    "alt": "Bastionen der Festung Valença mit Blick über das Minho-Tal",
    "credit": "Foto: Nicolas Armoa / Unsplash",
    "creditUrl": "https://unsplash.com/photos/XyMsgufVNsA",
    "pos": "center 60%"
   },
   "gallery": [
    {
     "id": "01",
     "motif": "Festungsmauern von Valença",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/01-valenca-porrino/valenca-festungsmauern-800.webp",
     "srcset": "images/01-valenca-porrino/valenca-festungsmauern-800.webp 800w, images/01-valenca-porrino/valenca-festungsmauern-1600.webp 1600w",
     "alt": "Mauern und Häuser in der Festung Valença",
     "credit": "Foto: Natalia Gusakova / Unsplash",
     "creditUrl": "https://unsplash.com/photos/TDyaRmE_v1Q"
    },
    {
     "id": "03",
     "motif": "Bastionen von Valença",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/01-valenca-porrino/valenca-bastionen-800.webp",
     "srcset": "images/01-valenca-porrino/valenca-bastionen-800.webp 800w, images/01-valenca-porrino/valenca-bastionen-1600.webp 1600w",
     "alt": "Grasbewachsene Bastionen der Festung Valença",
     "credit": "Foto: Natalia Gusakova / Unsplash",
     "creditUrl": "https://unsplash.com/photos/RBtMIy77KRE"
    },
    {
     "id": "04",
     "motif": "Kreuzgang Kathedrale Tui",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "05",
     "motif": "Ponte das Febres",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "06",
     "motif": "Flussweg am Río Louro",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "T1",
     "motif": "Internationale Brücke Valença–Tui",
     "status": "WIKIMEDIA_VERIFIED",
     "src": "images/01-valenca-porrino/tui-valenca-bruecke-800.webp",
     "srcset": "images/01-valenca-porrino/tui-valenca-bruecke-800.webp 800w, images/01-valenca-porrino/tui-valenca-bruecke-1600.webp 1600w",
     "alt": "Eiserne Fachwerkbrücke über den Minho zwischen Valença und Tui",
     "credit": "Foto: Lucas Martínez Farrapeira",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Puente_Internacional_Tuy-Valença.jpg",
     "license": "CC BY-SA 2.0",
     "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
     "edited": true
    },
    {
     "id": "T2",
     "motif": "Tui mit Kathedrale",
     "status": "WIKIMEDIA_VERIFIED",
     "src": "images/01-valenca-porrino/tui-panorama-800.webp",
     "srcset": "images/01-valenca-porrino/tui-panorama-800.webp 800w, images/01-valenca-porrino/tui-panorama-1600.webp 960w",
     "alt": "Altstadt von Tui mit der Kathedrale auf dem Hügel",
     "credit": "Foto: Luis Miguel Bugallo Sánchez",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Tui_Miño_060415.jpg",
     "license": "CC BY-SA 2.5 ES",
     "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5/es/",
     "edited": true
    }
   ]
  },
  "02-porrino-redondela": {
   "title": "O Porriño → Redondela",
   "hero": {
    "id": "07",
    "motif": "Wegstein mit Jakobsmuschel",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/02-porrino-redondela/galicien-wegstein-800.webp",
    "srcset": "images/02-porrino-redondela/galicien-wegstein-800.webp 800w, images/02-porrino-redondela/galicien-wegstein-1600.webp 1280w",
    "alt": "Galicischer Camino-Wegstein mit Jakobsmuschel und gelbem Pfeil",
    "credit": "Foto: Gianmarco Avigni / Unsplash",
    "creditUrl": "https://unsplash.com/photos/81QZ6fCjVNM",
    "pos": "center 18%"
   },
   "gallery": [
    {
     "id": "06",
     "motif": "Ländlicher Pilgerweg bei Mos",
     "status": "RIGHTS_UNCLEAR",
     "src": null
    },
    {
     "id": "08",
     "motif": "Kapelle Santiaguiño de Antas",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "09",
     "motif": "Kirche Santa Eulalia und Pazo de Mos",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/02-porrino-redondela/mos-kirche-pazo-800.webp",
     "srcset": "images/02-porrino-redondela/mos-kirche-pazo-800.webp 800w, images/02-porrino-redondela/mos-kirche-pazo-1600.webp 1600w",
     "alt": "Kirche Santa Eulalia und Pazo de Mos vom Camino aus",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Igrexa_parroquial_de_Santa_Eulalia_de_Mos_e_Pazo_de_Mos_dende_a_vía.JPG"
    },
    {
     "id": "R1",
     "motif": "Eisenbahnviadukt Redondela",
     "status": "WIKIMEDIA_LINKED",
     "src": "images/02-porrino-redondela/redondela-viadukt-800.webp",
     "srcset": "images/02-porrino-redondela/redondela-viadukt-800.webp 800w, images/02-porrino-redondela/redondela-viadukt-1600.webp 900w",
     "alt": "Eisenbahnviadukt über den Strassen von Redondela",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Redondela,_Viaducto_de_Pontevedra_08-1.jpg",
     "license": "Autor und Lizenz",
     "licenseUrl": "https://commons.wikimedia.org/wiki/File:Redondela,_Viaducto_de_Pontevedra_08-1.jpg",
     "edited": true
    }
   ],
   "heroNext": {
    "id": "H2",
    "motif": "Ría de Vigo mit Rande-Brücke",
    "status": "WIKIMEDIA_LINKED",
    "src": "images/02-porrino-redondela/ria-vigo-rande-800.webp",
    "srcset": "images/02-porrino-redondela/ria-vigo-rande-800.webp 800w, images/02-porrino-redondela/ria-vigo-rande-1600.webp 1600w",
    "alt": "Blick über die Ría de Vigo mit der Rande-Brücke und den Muschelflössen",
    "credit": "Foto: Wikimedia Commons",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Puente_de_Rande_en_la_Ria_de_Vigo.jpeg",
    "pos": "center 55%",
    "license": "Autor und Lizenz",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Puente_de_Rande_en_la_Ria_de_Vigo.jpeg",
    "edited": true
   }
  },
  "03-redondela-pontevedra": {
   "title": "Redondela → Pontevedra",
   "hero": {
    "id": "14",
    "motif": "Ponte Sampaio",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/03-redondela-pontevedra/ponte-sampaio-800.webp",
    "srcset": "images/03-redondela-pontevedra/ponte-sampaio-800.webp 800w, images/03-redondela-pontevedra/ponte-sampaio-1600.webp 1600w",
    "alt": "Mittelalterliche Steinbrücke von Ponte Sampaio über den Verdugo",
    "credit": "Foto: Simon Wiedensohler / Unsplash",
    "creditUrl": "https://unsplash.com/photos/a-stone-bridge-over-a-body-of-water-YZa4eopXQzE",
    "pos": "center 62%"
   },
   "gallery": [
    {
     "id": "17",
     "motif": "Pontevedra am Lérez",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/03-redondela-pontevedra/pontevedra-lerez-800.webp",
     "srcset": "images/03-redondela-pontevedra/pontevedra-lerez-800.webp 800w, images/03-redondela-pontevedra/pontevedra-lerez-1600.webp 1440w",
     "alt": "Pontevedra spiegelt sich im Fluss Lérez",
     "credit": "Foto: Davide Boscolo / Unsplash",
     "creditUrl": "https://unsplash.com/photos/rYULeCMMrQ8"
    },
    {
     "id": "02",
     "motif": "Bucht von San Simón",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "03",
     "motif": "Steinweg bei Canicouva",
     "status": "RIGHTS_UNCLEAR",
     "src": null
    },
    {
     "id": "04",
     "motif": "Austern in Arcade",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "06",
     "motif": "Brücke über den Lérez",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/03-redondela-pontevedra/pontevedra-bruecke-800.webp",
     "srcset": "images/03-redondela-pontevedra/pontevedra-bruecke-800.webp 800w, images/03-redondela-pontevedra/pontevedra-bruecke-1600.webp 1440w",
     "alt": "Steinbrücke über den Lérez in Pontevedra",
     "credit": "Foto: Davide Boscolo / Unsplash",
     "creditUrl": "https://unsplash.com/photos/uuZLYAu0K1w"
    },
    {
     "id": "07",
     "motif": "Virxe Peregrina, Patronin der Pilger",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/03-redondela-pontevedra/pontevedra-virxe-peregrina-800.webp",
     "srcset": "images/03-redondela-pontevedra/pontevedra-virxe-peregrina-800.webp 800w, images/03-redondela-pontevedra/pontevedra-virxe-peregrina-1600.webp 960w",
     "alt": "Statue der Virxe Peregrina im Santuario von Pontevedra",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Pontevedra_-_Iglesia_de_la_Virgen_Peregrina_11.jpg",
     "pos": "center 25%"
    },
    {
     "id": "08",
     "motif": "Praza da Leña",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/03-redondela-pontevedra/pontevedra-praza-da-lena-800.webp",
     "srcset": "images/03-redondela-pontevedra/pontevedra-praza-da-lena-800.webp 800w, images/03-redondela-pontevedra/pontevedra-praza-da-lena-1600.webp 1600w",
     "alt": "Praza da Leña mit Wegkreuz in der Altstadt von Pontevedra",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Praza_da_Leña,_Pontevedra.jpg"
    },
    {
     "id": "16",
     "motif": "Illa das Esculturas",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    }
   ]
  },
  "04-pontevedra-armenteira": {
   "title": "Pontevedra → Armenteira",
   "hero": {
    "id": "10",
    "motif": "Combarro: Hórreo an der Ría",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/04-pontevedra-armenteira/combarro-horreo-ria-800.webp",
    "credit": "Foto: Miguel Ángel Sanz / Unsplash",
    "srcset": "images/04-pontevedra-armenteira/combarro-horreo-ria-800.webp 800w, images/04-pontevedra-armenteira/combarro-horreo-ria-1600.webp 1600w",
    "alt": "Hórreo mit Kreuzen am Ufer der Ría de Pontevedra in Combarro",
    "creditUrl": "https://unsplash.com/photos/YGLIezz-gNg",
    "pos": "center 55%"
   },
   "gallery": [
    {
     "id": "01",
     "motif": "Kloster Poio mit Hórreo",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "02",
     "motif": "Hórreos am Hafen Combarro",
     "status": "SOURCE_CANDIDATE_NOT_VERIFIED",
     "src": null
    },
    {
     "id": "04",
     "motif": "Fischerei-Detail in Combarro",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/04-pontevedra-armenteira/combarro-fischerei-800.webp",
     "srcset": "images/04-pontevedra-armenteira/combarro-fischerei-800.webp 800w, images/04-pontevedra-armenteira/combarro-fischerei-1600.webp 1600w",
     "alt": "Anker und Tau am Hafen von Combarro",
     "credit": "Foto: Arturo Rey / Unsplash",
     "creditUrl": "https://unsplash.com/photos/F57Y95pfzCo"
    },
    {
     "id": "05",
     "motif": "Waldweg nach Armenteira",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "06",
     "motif": "Kloster Armenteira",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "07",
     "motif": "Kreuzgang Kloster Armenteira",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/04-pontevedra-armenteira/armenteira-kreuzgang-800.webp",
     "srcset": "images/04-pontevedra-armenteira/armenteira-kreuzgang-800.webp 800w, images/04-pontevedra-armenteira/armenteira-kreuzgang-1600.webp 1600w",
     "alt": "Kreuzgang des Klosters Santa María de Armenteira",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Mosteiro_de_Santa_María_de_Armenteira,_Meis,_Galicia.jpg"
    },
    {
     "id": "K1",
     "motif": "Kloster Armenteira",
     "status": "WIKIMEDIA_LINKED",
     "src": "images/04-pontevedra-armenteira/armenteira-kloster-800.webp",
     "srcset": "images/04-pontevedra-armenteira/armenteira-kloster-800.webp 800w, images/04-pontevedra-armenteira/armenteira-kloster-1600.webp 960w",
     "alt": "Romanische Klosterkirche Santa María de Armenteira",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Mosteiro_de_Armenteira._Galiza._Galicia_03.jpg",
     "replaces": "04",
     "license": "Autor und Lizenz",
     "licenseUrl": "https://commons.wikimedia.org/wiki/File:Mosteiro_de_Armenteira._Galiza._Galicia_03.jpg",
     "edited": true
    }
   ]
  },
  "05-armenteira-vilanova": {
   "title": "Armenteira → Vilanova",
   "hero": {
    "id": "06",
    "motif": "Boote am Strand, Ría de Arousa",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/05-armenteira-vilanova/arousa-boote-strand-800.webp",
    "srcset": "images/05-armenteira-vilanova/arousa-boote-strand-800.webp 800w, images/05-armenteira-vilanova/arousa-boote-strand-1600.webp 1600w",
    "alt": "Rote Fischerboote am Strand der Illa de Arousa",
    "credit": "Foto: Antoni Estapé / Unsplash",
    "creditUrl": "https://unsplash.com/photos/nNQ48gqv6ts",
    "pos": "center 60%"
   },
   "gallery": [
    {
     "id": "01",
     "motif": "Hafen in der Ría de Arousa",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/05-armenteira-vilanova/arousa-hafen-800.webp",
     "srcset": "images/05-armenteira-vilanova/arousa-hafen-800.webp 800w, images/05-armenteira-vilanova/arousa-hafen-1600.webp 1600w",
     "alt": "Fischerboot im Hafen der Illa de Arousa",
     "credit": "Foto: Jose Monteagudo / Unsplash",
     "creditUrl": "https://unsplash.com/photos/d486-hRid7o"
    },
    {
     "id": "04",
     "motif": "Albariño-Weinberge",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "07",
     "motif": "Ruta da Pedra e da Auga",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/05-armenteira-vilanova/ruta-pedra-auga-800.webp",
     "srcset": "images/05-armenteira-vilanova/ruta-pedra-auga-800.webp 800w, images/05-armenteira-vilanova/ruta-pedra-auga-1600.webp 960w",
     "alt": "Kleiner Wasserfall zwischen Farnen auf der Ruta da Pedra e da Auga",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Ruta_Da_Pedra_E_Da_Auga_(34194882).jpeg",
     "pos": "center 40%"
    }
   ],
   "heroNext": {
    "id": "H5",
    "motif": "Ruta da Pedra e da Auga",
    "status": "WIKIMEDIA_VERIFIED",
    "src": "images/05-armenteira-vilanova/ruta-pedra-auga-wasserfall-800.webp",
    "srcset": "images/05-armenteira-vilanova/ruta-pedra-auga-wasserfall-800.webp 800w, images/05-armenteira-vilanova/ruta-pedra-auga-wasserfall-1600.webp 1392w",
    "alt": "Wasserfall zwischen Farnen und Moos auf der Ruta da Pedra e da Auga",
    "credit": "Foto: Uxiogeno",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Ruta_da_Pedra_e_da_Auga.jpg",
    "pos": "center 50%",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
    "edited": true
   }
  },
  "06-translatio-padron": {
   "title": "Translatio → Padrón",
   "hero": {
    "id": "02",
    "motif": "Ría de Arousa",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/06-translatio-padron/ria-de-arousa-800.webp",
    "srcset": "images/06-translatio-padron/ria-de-arousa-800.webp 800w, images/06-translatio-padron/ria-de-arousa-1600.webp 1600w",
    "alt": "Boote vor der Illa de Arousa in der Ría de Arousa",
    "credit": "Foto: Wi-Sin Llajaruna / Unsplash",
    "creditUrl": "https://unsplash.com/photos/kjVHYOZN6R0",
    "pos": "center 55%"
   },
   "gallery": [
    {
     "id": "05",
     "motif": "Muschelfarmen (Bateas)",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "06",
     "motif": "Steinkreuz am Ulla",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "07",
     "motif": "Kirche Santiago, Padrón",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    },
    {
     "id": "08",
     "motif": "Pimientos de Padrón",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/06-translatio-padron/pimientos-de-padron-800.webp",
     "srcset": "images/06-translatio-padron/pimientos-de-padron-800.webp 800w, images/06-translatio-padron/pimientos-de-padron-1600.webp 1280w",
     "alt": "Pimientos de Padrón mit Pommes in der Pfanne",
     "credit": "Foto: tommao wang / Unsplash",
     "creditUrl": "https://unsplash.com/photos/0fKt2ufCINw"
    },
    {
     "id": "B1",
     "motif": "Torres de Oeste, Catoira",
     "status": "WIKIMEDIA_LINKED",
     "src": "images/06-translatio-padron/catoira-torres-do-oeste-800.webp",
     "srcset": "images/06-translatio-padron/catoira-torres-do-oeste-800.webp 640w",
     "alt": "Ruine der Torres de Oeste am Ufer des Ulla bei Catoira",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Torres_de_Oeste_Catoira.jpg",
     "license": "Autor und Lizenz",
     "licenseUrl": "https://commons.wikimedia.org/wiki/File:Torres_de_Oeste_Catoira.jpg",
     "edited": true
    },
    {
     "id": "P1",
     "motif": "Kirche Santiago in Padrón",
     "status": "WIKIMEDIA_LINKED",
     "src": "images/06-translatio-padron/padron-igrexa-santiago-800.webp",
     "srcset": "images/06-translatio-padron/padron-igrexa-santiago-800.webp 800w, images/06-translatio-padron/padron-igrexa-santiago-1600.webp 960w",
     "alt": "Fassade der Kirche Santiago in Padrón",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Igrexa_de_Santiago_de_Padrón.jpg",
     "license": "Autor und Lizenz",
     "licenseUrl": "https://commons.wikimedia.org/wiki/File:Igrexa_de_Santiago_de_Padrón.jpg",
     "edited": true
    },
    {
     "id": "P2",
     "motif": "O Pedrón",
     "status": "WIKIMEDIA_VERIFIED",
     "src": "images/06-translatio-padron/padron-pedron-800.webp",
     "srcset": "images/06-translatio-padron/padron-pedron-800.webp 800w, images/06-translatio-padron/padron-pedron-1600.webp 960w",
     "alt": "Der Pedrón: römischer Stein unter dem Altar, an dem das Boot des Apostels festgemacht haben soll",
     "credit": "Foto: Dodro",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:NO_ORI_ESES_D_S_P.jpg",
     "license": "CC BY-SA 4.0",
     "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
     "edited": true
    }
   ],
   "heroNext": {
    "id": "H6",
    "motif": "Steinbrücke über den Sar in Padrón",
    "status": "WIKIMEDIA_LINKED",
    "src": "images/06-translatio-padron/padron-bruecke-sar-800.webp",
    "srcset": "images/06-translatio-padron/padron-bruecke-sar-800.webp 800w, images/06-translatio-padron/padron-bruecke-sar-1600.webp 1280w",
    "alt": "Alte Steinbrücke über den Río Sar in Padrón",
    "credit": "Foto: Wikimedia Commons",
    "creditUrl": "https://commons.wikimedia.org/wiki/File:Puente_sobre_el_río_Sar_en_Padrón.jpg",
    "pos": "center 55%",
    "license": "Autor und Lizenz",
    "licenseUrl": "https://commons.wikimedia.org/wiki/File:Puente_sobre_el_río_Sar_en_Padrón.jpg",
    "edited": true
   }
  },
  "07-padron-santiago": {
   "title": "Padrón → Santiago",
   "hero": {
    "id": "07",
    "motif": "Kathedrale von Santiago",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/07-padron-santiago/santiago-kathedrale-800.webp",
    "srcset": "images/07-padron-santiago/santiago-kathedrale-800.webp 800w, images/07-padron-santiago/santiago-kathedrale-1600.webp 1600w",
    "alt": "Westfassade der Kathedrale von Santiago an der Praza do Obradoiro",
    "credit": "Foto: Victoriano Izquierdo / Unsplash",
    "creditUrl": "https://unsplash.com/photos/Lcp8NXa_GjU",
    "pos": "center 30%"
   },
   "gallery": [
    {
     "id": "02",
     "motif": "Iria Flavia",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/07-padron-santiago/iria-flavia-800.webp",
     "srcset": "images/07-padron-santiago/iria-flavia-800.webp 800w, images/07-padron-santiago/iria-flavia-1600.webp 1600w",
     "alt": "Kirche Santa María de Iria Flavia bei Padrón",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Lateral_view_of_Saint_Mary_Church_in_Iria_Flavia,_Padrón,_Galicia,_Spain.jpg"
    },
    {
     "id": "03",
     "motif": "Santuario A Escravitude",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/07-padron-santiago/escravitude-800.webp",
     "srcset": "images/07-padron-santiago/escravitude-800.webp 800w, images/07-padron-santiago/escravitude-1600.webp 960w",
     "alt": "Santuario da Escravitude mit Doppeltürmen",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Image-A_Escravitude.Padron.Galiza1.jpg",
     "pos": "center 30%"
    },
    {
     "id": "04",
     "motif": "Pilger auf dem Obradoiro",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/07-padron-santiago/obradoiro-pilger-800.webp",
     "credit": "Foto: Pablo Bretón / Unsplash",
     "srcset": "images/07-padron-santiago/obradoiro-pilger-800.webp 800w, images/07-padron-santiago/obradoiro-pilger-1600.webp 1483w",
     "alt": "Pilger mit Fahrrad vor der Kathedrale auf der Praza do Obradoiro",
     "creditUrl": "https://unsplash.com/photos/3FfNpGvIS0o",
     "pos": "center 60%"
    },
    {
     "id": "05",
     "motif": "Waldweg bei Teo",
     "status": "ORIGINAL_NOT_IDENTIFIED",
     "src": null
    }
   ]
  },
  "08-santiago-stadt": {
   "title": "Santiago de Compostela",
   "hero": null,
   "gallery": [
    {
     "id": "S01",
     "motif": "Rúa do Franco",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/08-santiago-stadt/santiago-rua-do-franco-800.webp",
     "srcset": "images/08-santiago-stadt/santiago-rua-do-franco-800.webp 800w, images/08-santiago-stadt/santiago-rua-do-franco-1600.webp 1600w",
     "alt": "Altstadtgasse Rúa do Franco in Santiago",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Rua_do_Franco_-_panoramio.jpg"
    },
    {
     "id": "S02",
     "motif": "Mercado de Abastos",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/08-santiago-stadt/santiago-mercado-800.webp",
     "srcset": "images/08-santiago-stadt/santiago-mercado-800.webp 800w, images/08-santiago-stadt/santiago-mercado-1600.webp 1600w",
     "alt": "Gemüsestände am Mercado de Abastos in Santiago",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Santiago_de_Compostela_-_Mercado_de_Abastos_-_01.jpg"
    },
    {
     "id": "S04",
     "motif": "Praza do Obradoiro",
     "status": "WIKIMEDIA_ATTRIBUTION_PENDING",
     "src": "images/08-santiago-stadt/santiago-obradoiro-panorama-800.webp",
     "srcset": "images/08-santiago-stadt/santiago-obradoiro-panorama-800.webp 800w, images/08-santiago-stadt/santiago-obradoiro-panorama-1600.webp 1600w",
     "alt": "Panorama der Praza do Obradoiro mit Kathedrale",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Catedral_de_Santiago_de_Compostela_desde_la_Praza_do_Obradoiro.jpg"
    },
    {
     "id": "S05",
     "motif": "Kathedrale, Obradoiro-Fassade",
     "status": "WIKIMEDIA_LINKED",
     "src": "images/08-santiago-stadt/santiago-kathedrale-fassade-800.webp",
     "srcset": "images/08-santiago-stadt/santiago-kathedrale-fassade-800.webp 800w, images/08-santiago-stadt/santiago-kathedrale-fassade-1600.webp 960w",
     "alt": "Barocke Obradoiro-Fassade der Kathedrale von Santiago",
     "credit": "Foto: Wikimedia Commons",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Catedral_de_Santiago_de_Compostela_agosto_2018_(cropped).jpg",
     "license": "Autor und Lizenz",
     "licenseUrl": "https://commons.wikimedia.org/wiki/File:Catedral_de_Santiago_de_Compostela_agosto_2018_(cropped).jpg",
     "edited": true
    },
    {
     "id": "S06",
     "motif": "Hostal dos Reis Católicos",
     "status": "WIKIMEDIA_VERIFIED",
     "src": "images/08-santiago-stadt/santiago-hostal-reis-catolicos-800.webp",
     "srcset": "images/08-santiago-stadt/santiago-hostal-reis-catolicos-800.webp 800w, images/08-santiago-stadt/santiago-hostal-reis-catolicos-1600.webp 960w",
     "alt": "Hostal dos Reis Católicos an der Praza do Obradoiro",
     "credit": "Foto: Angel Torres",
     "creditUrl": "https://commons.wikimedia.org/wiki/File:Hostal_dos_Reis_Católicos._Praza_do_obradoiro._Santiago_de_Compostela.jpg",
     "license": "CC BY 2.0",
     "licenseUrl": "https://creativecommons.org/licenses/by/2.0/",
     "edited": true
    }
   ]
  },
  "09-a-coruna": {
   "title": "A Coruña",
   "hero": {
    "id": "C05",
    "motif": "Torre de Hércules",
    "status": "UNSPLASH_VERIFIED",
    "src": "images/09-a-coruna/coruna-torre-hercules-800.webp",
    "srcset": "images/09-a-coruna/coruna-torre-hercules-800.webp 800w, images/09-a-coruna/coruna-torre-hercules-1600.webp 1600w",
    "alt": "Torre de Hércules über der Küste bei Sonnenuntergang",
    "credit": "Foto: Borre / Unsplash",
    "creditUrl": "https://unsplash.com/photos/zZdxxAEhOYg",
    "pos": "center 15%"
   },
   "gallery": [
    {
     "id": "C01",
     "motif": "Praza de María Pita",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/09-a-coruna/coruna-maria-pita-800.webp",
     "srcset": "images/09-a-coruna/coruna-maria-pita-800.webp 800w, images/09-a-coruna/coruna-maria-pita-1600.webp 1600w",
     "alt": "Rathaus an der Praza de María Pita durch die Arkaden gesehen",
     "credit": "Foto: Vladan Raznatovic / Unsplash",
     "creditUrl": "https://unsplash.com/photos/IzQlhV5gF14"
    },
    {
     "id": "C02",
     "motif": "Galerías de la Marina",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/09-a-coruna/coruna-galerias-800.webp",
     "srcset": "images/09-a-coruna/coruna-galerias-800.webp 800w, images/09-a-coruna/coruna-galerias-1600.webp 1600w",
     "alt": "Verglaste Galerien und Hafen an der Avenida da Mariña",
     "credit": "Foto: Javier Balseiro / Unsplash",
     "creditUrl": "https://unsplash.com/photos/Y1TNMU0zXEA"
    },
    {
     "id": "C03",
     "motif": "Strand Orzán am Abend",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/09-a-coruna/coruna-orzan-abend-800.webp",
     "srcset": "images/09-a-coruna/coruna-orzan-abend-800.webp 800w, images/09-a-coruna/coruna-orzan-abend-1600.webp 1600w",
     "alt": "Strand und Stadt von A Coruña im Abendlicht",
     "credit": "Foto: Jose Antonio Gallego Vázquez / Unsplash",
     "creditUrl": "https://unsplash.com/photos/GW2UneFp40c"
    },
    {
     "id": "C04",
     "motif": "Torre de Hércules im Blütenmeer",
     "status": "UNSPLASH_VERIFIED",
     "src": "images/09-a-coruna/coruna-torre-blumen-800.webp",
     "srcset": "images/09-a-coruna/coruna-torre-blumen-800.webp 800w, images/09-a-coruna/coruna-torre-blumen-1600.webp 1600w",
     "alt": "Blühende Wiese vor dem Torre de Hércules",
     "credit": "Foto: maría Yolanda C.P. / Unsplash",
     "creditUrl": "https://unsplash.com/photos/CwCu42ShXkw"
    }
   ]
  }
 }
};
