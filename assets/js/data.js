/* =====================================================================
   IFK Skövde FK – ALLT INNEHÅLL SOM ÄNDRAS OFTA FINNS HÄR.
   Redigera den här filen för att uppdatera matcher, tabell, lag,
   organisation, nyheter, produkter och kontaktuppgifter.
   Ingen kod behöver röras. Datum skrivs som ÅÅÅÅ-MM-DD.
   ===================================================================== */
window.IFK = {

  club: {
    name: "IFK Skövde FK",
    shortName: "IFK Skövde",
    founded: 1907,
    ground: "Södermalms IP",
    city: "Skövde",
    league: "Division 2 Norra Götaland",
    email: "kansli@ifkskovdefk.se",          // TODO: verifiera
    phone: "0500-00 00 00",                   // TODO: verifiera
    address: "Södermalms IP, 541 00 Skövde",  // TODO: verifiera
    orgNr: "",                                // TODO: fyll i
    swish: "123 000 00 00",                   // TODO: verifiera Swish-nummer
    social: {
      instagram: "https://www.instagram.com/ifkskovdefk/",
      facebook: "https://www.facebook.com/ifkskovdefk",
      x: "https://x.com/ifkskovdefk",
      svenskalag: "https://www.svenskalag.se/ifkskovdefk"
    },
    externalTable: "https://www.svenskfotboll.se/serier-cuper/tabell-och-resultat/div-2-norra-gotaland-herr-2026/131957/"
  },

  /* Rabatt-popup: visas efter `delaySeconds`, en gång per besökare (localStorage). */
  promo: {
    enabled: true,
    code: "IFK10",
    percent: 10,
    delaySeconds: 15,
    headline: "10 % på alla ordrar",
    text: "Som tack för att du stöttar IFK Skövde får du 10 % rabatt på hela shoppen. Koden läggs på automatiskt i kassan."
  },

  /* Beställningar: sätt orderEndpoint till en Formspree/Getform-URL för att ta emot
     ordrar som e-post utan egen server. Lämnas tom öppnas kundens e-postprogram
     med en färdig order (mailto). */
  shop: {
    orderEndpoint: "",
    orderEmail: "shop@ifkskovdefk.se",       // TODO: verifiera
    shippingFee: 59,
    freeShippingFrom: 799,
    currency: "kr"
  },

  /* Matcher säsongen 2026. score: null = ej spelad / resultat ej inlagt.
     home: true = hemmamatch på Södermalms IP. */
  fixtures: [
    { date: "2026-05-29", time: "19:00", home: true,  opponent: "Skara FC",        score: [1, 0], competition: "Division 2 Norra Götaland" },
    { date: "2026-07-31", time: "19:00", home: false, opponent: "Ahlafors IF",     score: [0, 0], competition: "Division 2 Norra Götaland" },
    { date: "2026-08-08", time: "15:00", home: false, opponent: "Grebbestads IF",  score: [1, 1], competition: "Division 2 Norra Götaland" },
    { date: "2026-08-15", time: "15:00", home: true,  opponent: "Herrestads AIF",  score: [2, 2], competition: "Division 2 Norra Götaland" },
    { date: "2026-08-22", time: "15:00", home: false, opponent: "Vänersborgs FK",  score: [1, 0], competition: "Division 2 Norra Götaland" },
    { date: "2026-08-30", time: "15:00", home: false, opponent: "Skara FC",        score: null,   competition: "Division 2 Norra Götaland" },
    { date: "2026-09-04", time: "19:00", home: true,  opponent: "Motala AIF FK",   score: null,   competition: "Division 2 Norra Götaland" },
    { date: "2026-09-12", time: "15:00", home: false, opponent: "IFK Kumla",       score: null,   competition: "Division 2 Norra Götaland" },
    { date: "2026-09-18", time: "19:00", home: true,  opponent: "IK Tord",         score: null,   competition: "Division 2 Norra Götaland" },
    { date: "2026-09-27", time: "15:00", home: false, opponent: "Husqvarna FF",    score: null,   competition: "Division 2 Norra Götaland" }
  ],

  /* Tabell. Fyll på med samtliga 14 lag när ni uppdaterar. */
  table: {
    updated: "2026-08-23",
    note: "Topp 8 visas. Hela tabellen finns hos Svensk fotboll.",
    rows: [
      { team: "Husqvarna FF",      p: 18, w: 15, d: 3, l: 0, gf: 44, ga: 12, pts: 48 },
      { team: "Skara FC",          p: 18, w: 12, d: 4, l: 2, gf: 36, ga: 20, pts: 40 },
      { team: "IFK Skövde FK",     p: 18, w: 10, d: 4, l: 4, gf: 34, ga: 22, pts: 34, form: ["W","D","D","D","W"] },
      { team: "Ahlafors IF",       p: 18, w: 8,  d: 7, l: 3, gf: 38, ga: 22, pts: 31 },
      { team: "Grebbestads IF",    p: 18, w: 9,  d: 3, l: 6, gf: 32, ga: 26, pts: 30 },
      { team: "Herrestads AIF",    p: 18, w: 7,  d: 6, l: 5, gf: 35, ga: 33, pts: 27 },
      { team: "Stenungsunds IF",   p: 18, w: 7,  d: 5, l: 6, gf: 34, ga: 25, pts: 26 },
      { team: "Motala AIF FK",     p: 17, w: 5,  d: 5, l: 7, gf: 22, ga: 22, pts: 20 }
    ]
  },

  /* Lag. category: senior | ungdom | dam | knatte */
  teams: [
    { name: "Herr A",        category: "senior", level: "Division 2 Norra Götaland", coach: "Zurab Tsiskaridze", note: "Representationslaget. Hemmaarena Södermalms IP.", img: "team-herr-a.jpg", link: "https://www.svenskalag.se/ifkskovdefk-seniorer" },
    { name: "Herr U",        category: "senior", level: "Utvecklingslag", coach: "", note: "Steget mellan akademi och A-lag.", img: "team-herr-u.jpg", link: "https://www.svenskalag.se/ifkskovdefk-seniorer" },
    { name: "U19 / Junior",  category: "ungdom", level: "Junior", coach: "", note: "Sista steget i akademin.", img: "team-u19.jpg", link: "https://www.svenskalag.se/ifkskovdefk/lag" },
    { name: "U16",           category: "ungdom", level: "Pojkar 16", coach: "", note: "", img: "team-u16.jpg", link: "https://www.svenskalag.se/ifkskovdefk-u16" },
    { name: "P14",           category: "ungdom", level: "Pojkar 14", coach: "", note: "", img: "team-p14.jpg", link: "https://www.svenskalag.se/ifkskovdefk-p12-2" },
    { name: "P12",           category: "ungdom", level: "Pojkar 12", coach: "", note: "", img: "team-p12.jpg", link: "https://www.svenskalag.se/ifkskovdefk/lag" },
    { name: "P10",           category: "ungdom", level: "Pojkar 10", coach: "", note: "", img: "team-p10.jpg", link: "https://www.svenskalag.se/ifkskovdefk/lag" },
    { name: "P8",            category: "ungdom", level: "Pojkar 8", coach: "", note: "", img: "team-p08.jpg", link: "https://www.svenskalag.se/ifkskovdefk-p08" },
    { name: "Knattefotboll", category: "knatte", level: "5–7 år", coach: "", note: "Lek, rörelse och första kontakten med bollen. Alla är välkomna.", img: "team-knatte.jpg", link: "https://www.svenskalag.se/ifkskovdefk/lag" },
    { name: "Dam & flick – Skövde KIK", category: "dam", level: "Samarbetsförening", coach: "", note: "Sedan 2023 driver IFK Skövde FK och Skövde KIK gemensamt kansli och administration. Flick- och damfotbollen spelar i Skövde KIK.", img: "team-skik.jpg", link: "https://www.skik.se/" }
  ],

  /* Organisation. Lägg till/ta bort personer fritt. */
  organisation: {
    board: [
      { name: "Fredrik Ahlberg", role: "Ordförande" },
      { name: "Namn kommer", role: "Vice ordförande" },
      { name: "Namn kommer", role: "Kassör" },
      { name: "Namn kommer", role: "Sekreterare" },
      { name: "Namn kommer", role: "Ledamot" },
      { name: "Namn kommer", role: "Ledamot" }
    ],
    office: [
      { name: "Tobias Sandberg", role: "Klubbchef", email: "" },
      { name: "Namn kommer", role: "Kanslist", email: "" }
    ],
    sport: [
      { name: "Zurab Tsiskaridze", role: "Huvudtränare Herr A" },
      { name: "Namn kommer", role: "Assisterande tränare Herr A" },
      { name: "Namn kommer", role: "Sportchef" },
      { name: "Namn kommer", role: "Akademiansvarig" }
    ],
    committees: [
      { name: "Sportkommittén", text: "Ansvarar för seniorverksamheten, tränarrekrytering och spelarlogistik." },
      { name: "Ungdomskommittén", text: "Driver akademin från knatte till junior, utbildar ledare och håller ihop den röda tråden i spelarutbildningen." },
      { name: "Marknad & partner", text: "Sponsorer, partnerpaket, evenemang och matchdagsupplevelsen på Södermalms IP." },
      { name: "Arrangemang & kiosk", text: "Matchvärdar, kiosk, entré och alla ideella som får matchdagen att fungera." }
    ]
  },

  news: [
    { date: "2026-08-23", title: "Seger i Vänersborg – tredjeplatsen behålls", text: "1–0 på bortaplan och IFK ligger kvar på tredje plats med tio omgångar kvar.", img: "news-vanersborg.jpg" },
    { date: "2026-08-15", title: "Poängdelning mot Herrestad", text: "2–2 hemma på Södermalms IP efter en sen kvittering.", img: "news-herrestad.jpg" },
    { date: "2026-01-10", title: "Tobias Sandberg ny klubbchef", text: "Tobias Sandberg tillträdde i januari som klubbchef för IFK Skövde Fotboll.", img: "news-klubbchef.jpg" }
  ],

  /* Partners. Logotyp läggs i assets/img/sponsors/ med filnamnet i `img`.
     Saknas filen visas företagsnamnet som text. url: företagets hemsida. */
  sponsors: [
    { name: "Swedbank",                    url: "https://www.swedbank.se",                     img: "swedbank.png" },
    { name: "Furhoffs",                    url: "https://www.furhoffs.se",                     img: "furhoffs.png" },
    { name: "Länsförsäkringar Skaraborg",  url: "https://www.lansforsakringar.se/skaraborg/",  img: "lansforsakringar-skaraborg.png" },
    { name: "SISAB Svets & Verktygsgrossisten", url: "https://www.sisabsweden.se",             img: "sisab.png" },
    { name: "Hellbergs Buss",              url: "https://www.hellbergsbuss.se",                img: "hellbergs-buss.png" },
    { name: "Lindströms Bil",              url: "https://www.lindstromsbil.se",                img: "lindstroms-bil.png" },
    { name: "Skeppsviken Bygg & Fastighet", url: "https://www.skeppsviken.se",                 img: "skeppsviken.png" },
    { name: "HSB",                         url: "https://www.hsb.se",                          img: "hsb.png" },
    { name: "JumpYard Skövde",             url: "https://jumpyard.se/skovde/",                 img: "jumpyard.png" },
    { name: "Glaskedjan Skövde",           url: "https://skovde.glaskedjan.se",                img: "glaskedjan-skovde.png" },
    { name: "Daloc",                       url: "https://www.daloc.se",                        img: "daloc.png" },
    { name: "Spar",                        url: "",                                            img: "spar.png" },   // TODO: hemsida saknas, fyll i
    { name: "Renta Skövde",                url: "https://renta.se/maskinuthyrning-skovde/",    img: "renta.png" },
    { name: "Henrik Berggren Produktion",  url: "https://hbp.se",                              img: "henrik-berggren-produktion.png" },
    { name: "Volvo",                       url: "https://www.volvocars.com/se/",               img: "volvo.png" },
    { name: "Intersport – till webshopen", url: "https://www.intersport.se",                   img: "intersport.png" }  // TODO: byt till klubbens teamshop-länk
  ],

  /* Produkter. sizes: [] om storlek inte behövs. badge: valfri etikett. */
  products: [
    { id: "hemma-2026",  name: "Matchtröja Hemma 2026", cat: "Matchkläder", price: 699, sizes: ["S","M","L","XL","XXL"], badge: "Ny", img: "prod-hemma.jpg", desc: "Blå/svart matchtröja i samma utförande som A-laget bär på Södermalms IP." },
    { id: "borta-2026",  name: "Matchtröja Borta 2026", cat: "Matchkläder", price: 699, sizes: ["S","M","L","XL","XXL"], img: "prod-borta.jpg", desc: "Vit bortatröja med blå detaljer." },
    { id: "hemma-barn",  name: "Matchtröja Hemma Barn", cat: "Barn", price: 549, sizes: ["116","128","140","152","164"], img: "prod-hemma-barn.jpg", desc: "Hemmatröjan i barnstorlekar." },
    { id: "trana",       name: "Träningströja", cat: "Träning", price: 449, sizes: ["S","M","L","XL","XXL"], img: "prod-traning.jpg", desc: "Lätt funktionströja i klubbens blå." },
    { id: "hoodie",      name: "Klubbhoodie", cat: "Supporter", price: 599, sizes: ["S","M","L","XL","XXL"], badge: "Populär", img: "prod-hoodie.jpg", desc: "Svart hoodie med broderat klubbmärke." },
    { id: "halsduk",     name: "Halsduk IFK Skövde", cat: "Supporter", price: 199, sizes: [], img: "prod-halsduk.jpg", desc: "Stickad halsduk i blått, svart och vitt." },
    { id: "keps",        name: "Keps", cat: "Supporter", price: 249, sizes: [], img: "prod-keps.jpg", desc: "Justerbar keps med klubbmärke." },
    { id: "flaska",      name: "Vattenflaska 0,7 l", cat: "Träning", price: 149, sizes: [], img: "prod-flaska.jpg", desc: "Klubbens flaska till träning och match." },
    { id: "mossa",       name: "Mössa", cat: "Supporter", price: 199, sizes: [], img: "prod-mossa.jpg", desc: "Varm mössa för höstmatcherna." },
    { id: "sasongskort", name: "Säsongskort Herr A 2027", cat: "Supporter", price: 900, sizes: [], badge: "Stötta klubben", img: "prod-sasongskort.jpg", desc: "Alla hemmamatcher i seriespelet 2027. Levereras digitalt." },
    { id: "shorts-barn", name: "Träningsshorts Barn", cat: "Barn", price: 249, sizes: ["116","128","140","152","164"], img: "prod-shorts-barn.jpg", desc: "Svarta shorts i barnstorlekar." },
    { id: "paket",       name: "Supporterpaket", cat: "Supporter", price: 549, compareAt: 647, sizes: [], badge: "Spara 98 kr", img: "prod-paket.jpg", desc: "Halsduk, keps och mössa i ett paket." }
  ]
};
