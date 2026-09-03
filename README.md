# IFK Skövde FK – webbplats

Statisk flersidig webbplats i ren HTML, CSS och JavaScript. Inget byggsteg.
Öppna `index.html` i en webbläsare eller lägg mappen på valfritt webbhotell.

## Sidor

| Fil | Innehåll |
|---|---|
| `index.html` | Start: nästa match med nedräkning, senaste resultat, kommande matcher, nyheter, tabell, Vision 2030, partners |
| `matcher.html` | Spelschema med filter (kommande/spelade/hemma/borta), tabell, kalenderexport, matchdagsinfo |
| `lag.html` | Alla lag med filter per kategori, länk till respektive lagsida på Svenskalag |
| `klubben.html` | Organisation: årsmöte, styrelse, kansli, sportslig ledning, kommittéer, samarbetet med Skövde KIK, värderingar, dokument |
| `historia.html` | Tidslinje 1907 → i dag, färgerna |
| `vision.html` | Superettan 2030: vägen dit, byggstenar, målsiffror |
| `kontakt.html` | Kansli, kontaktformulär, hitta hit, börja spela, partner, engagera dig |
| `shop.html` | Shop med kategorier, tröjbyggare (namn + nummer med förhandsvisning), varukorg med merförsäljning, rabattkod och kassa |
| `spelare.html` | Truppen: spelarkort som vänds och visar säsongsstatistik |
| `fantasy.html` | IFK Skövde Fantasy: konto, lagval, poäng, tabeller, ligor. Tippa resultatet och rösta på matchens lirare |
| `admin.html` | Kansliet: mata in matchstatistik och publicera omgångar (kräver adminkonto) |

## Uppdatera innehåll

Allt som ändras ofta ligger i **`assets/js/data.js`**:

- `fixtures` – matcher. `score: null` = ej spelad. Nästa match, nedräkning och topplistan räknas ut automatiskt.
- `table` – tabellen. Fyll på med alla 14 lag och ändra `updated`.
- `teams`, `organisation`, `news`, `sponsors`, `products` – självförklarande listor.
- `club` – adress, e-post, telefon, Swish, sociala medier. Poster märkta `TODO` behöver verifieras.
- `promo` – rabatt-popupen: kod, procent, fördröjning (sekunder), av/på.
- `shop` – frakt, fri frakt-gräns, order-e-post och `orderEndpoint`.

## Fantasy, tips och röstning

Allt interaktivt går genom `assets/js/backend.js` som har två lägen:

- **Demoläge** (standard): inget är ifyllt i `IFK.firebase`. Konton, lag och poäng sparas
  bara i besökarens egen webbläsare. Bra för att testa, men tabeller delas inte.
- **Firebase**: skapa ett gratis Firebase-projekt, aktivera *Authentication* (E-post/lösenord,
  gärna Google) och *Firestore*. Klistra in `apiKey`, `authDomain`, `projectId` och `appId`
  i `IFK.firebase` i `data.js`. Ladda upp `firebase/firestore.rules` som säkerhetsregler och
  byt ut adminadressen där och i `IFK.admins`.

Så går en omgång till:
1. Supportrar sätter sin elva på `fantasy.html` före avspark. Laget låses automatiskt.
2. Efter matchen öppnar kansliet `admin.html`, fyller i minuter, mål, assist osv. per spelare
   och resultatet. Fansens röst på matchens lirare är förifylld.
3. **Publicera omgången** räknar poäng för alla lag, tipsen och uppdaterar tabellerna.
4. Lägg även in resultatet i `fixtures` i `data.js` så att spelschemat visar rätt.

Poängreglerna finns i `assets/js/scoring.js` och visas under fliken Regler.

## Beställningar från shoppen

Utan inställningar öppnas kundens e-postprogram med ordern förifylld till `shop.orderEmail`.
För att ta emot ordrar utan att kunden behöver skicka mejlet själv:

1. Skapa ett gratis formulär på formspree.io (eller getform.io).
2. Klistra in URL:en i `shop.orderEndpoint` i `data.js`.

Ordern skickas då som JSON till er inkorg. Betalning sker via Swish eller faktura enligt
instruktionen kunden får efter beställningen. Vill ni ta kortbetalning senare kan kassan
kopplas till Stripe Payment Links utan att resten av sajten ändras.

## Rabatt-popup

Visas efter 15 sekunder, en gång per besökare (sparas i webbläsaren). Knappen
”Handla med 10 % rabatt” lägger koden i varukorgen automatiskt. Koden IFK10 valideras
i kassan mot `promo.code`.

## Publicera

Mappen är helt statisk. Exempel:

- **Firebase Hosting**: `firebase init hosting` med `ifkskovde-site` som public-mapp.
- **Netlify / Vercel / GitHub Pages**: peka på mappen, klart.
- **Svenskalag**: sajten kan länkas från nuvarande sida; medlemsfunktioner (kallelser, avgifter) ligger kvar på Svenskalag.

## Bilder

Se `assets/img/README.md` för lista över bildfiler som ska läggas in.

## Att verifiera innan lansering

- Kontaktuppgifter, Swish-nummer och org.nr i `data.js` (märkta TODO).
- Namn i styrelse, kansli och sportslig ledning (”Namn kommer”).
- Resterande matcher och resultat säsongen 2026, hela tabellen.
- Entrépriser och matchdagsinfo i `matcher.html`.
- Produkter, priser och storlekar i shoppen.
- Målsiffror på visionssidan (`vision.html`).
- Tröjnummer och `academy`-markering i `squad` i `data.js`.
- Instagram-inlägg att visa på startsidan (`IFK.instagram.posts`).
