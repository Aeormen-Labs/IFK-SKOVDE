# Bilder att lägga in

Sajten är byggd med platshållare. Lägg filerna nedan i den här mappen med exakt
filnamn så byts platshållaren ut automatiskt (ingen kod behöver ändras).
Saknas en fil visas en blå platta med bildtext, så sajten fungerar även utan bilder.

| Filnamn | Var den visas | Rekommenderat format |
|---|---|---|
| `logo.svg` | Header, footer, flik-ikon. **Byt ut platshållar-märket mot klubbens riktiga.** | SVG (eller PNG 512×512, uppdatera då sökvägen i `assets/js/main.js`) |
| `hero-vision.jpg` | Startsidan, sektionen Vision 2030 | 1600×1200 |
| `arena.jpg` | Matcher, sektionen Södermalms IP | 1600×1000 |
| `samarbete.jpg` | Klubben, sektionen om Skövde KIK | 1600×1000 |
| `historia-1.jpg` | Historia, sidokolumn | 1200×1500 (stående) |
| `news-*.jpg` | Nyhetskort på startsidan (filnamn anges per nyhet i `data.js`) | 1600×900 |
| `team-*.jpg` | Lagkort (filnamn anges per lag i `data.js`) | 1600×900 |
| `prod-*.jpg` | Produktbilder i shoppen (filnamn anges per produkt i `data.js`) | 1200×1200 (kvadrat) |

Tips
- Hämta lagfoton och nyhetsbilder från nuvarande sida på svenskalag.se. Använd bara
  bilder klubben äger rättigheterna till och där personer på bild samtyckt.
- Komprimera till under 300 kB per bild (t.ex. squoosh.app).
