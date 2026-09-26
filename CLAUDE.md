# Marcelflix — projectbriefing

## Wat is dit
Een verrassingswebsite voor mijn vriendin: een parodie op een streamingdienst ("Marcelflix") met onze kat **Marcel** (Britse korthaar, 1,5 jaar, blauwgrijs, ronde kop, diep oranje ogen) als ster van elke serie. Elke aflevering is een interactief verhaal van enkele minuten in Bandersnatch-stijl: AI-beelden met langzame zoom/pan, Marcel als ik-verteller (TTS-audio) met ondertitels, en keuzes met timer die het verhaal sturen.

- Taal van de site: Nederlands (Vlaams).
- Budget: €0. Statische site, gehost op **GitHub Pages**. Geen backend nodig.
- Moet vooral **perfect werken op gsm** (portrait én landscape), maar ook op desktop.
- Toon: over the top, filmisch, grappig, met hart.

## Line-up (Marcelflix Originals)
Parodieën op wat we graag kijken. Enkel de sfeer overnemen: geen echte personages, logo's of titellettertypes. Titels mogen in het Engels.
Alles staat in `data/catalog.json` (`type`: series of film, `status`: available / soon / secret).

**Series:** The Rookie: Feline Division (pilot "De Zaak Vaas", speelbaar), Stranger Paws, Breaking Bowl, The Pawffice, Katnonkels (Nonkels), The Crown (van de kast), La Casa de Brokjes, Game of Cushions.
**Films:** Marcel Bond: License to Purr, Catanic, Pride & Purrjudice, Purrstellar, Harry Pawter en de Steen der Brokjes, Spider-Marcel, Mission: Impawsible, Top Gun: Meowerick, Jurassic Purrk, Home Alone: Marcel Edition.
**Geheim:** Director's Cut "De Drie Amigos" (`directors-cut`), ontgrendelt als alle 3 eindes van de pilot gevonden zijn. Geen romantiek: een gek avontuur door verschillende landen met Marcel en de dieren van de ouders, Arthur (Europese korthaar, bruin gestreept, witte kin, altijd nors) en Odiel (grote beige krulhond, vrolijk). Aflevering "De Jacht op de Gouden Brok": Parijs of Egypte, Mexico, jungletempel; 3 keuzes, 2 eindes.

Profielen: "Ik" (voor haar) en "Marcel"; via "Profielen beheren" kies je per profiel een icoon (uitsnedes van Marcel uit de covers of emoji's, bewaard in localStorage). Navigatie: Home, Series, Films (met genrefilter).
"Mijn lijst" en "Vind ik leuk" (👍) per titel en per profiel in localStorage; verborgen overzicht op `#/smaak` (niet gelinkt) met likes, lijst, uitgekeken titels en eindes + knop om als tekst te kopiëren.
Home-rijen: Verder kijken, Mijn lijst, Marcelflix Originals, Films, Series, genre-rijen, Top 10 van het moment (volgorde in `data/config.json` → `top10`).

## Wat er gebouwd moet worden
1. **Intro**: korte logo-animatie "MARCELFLIX" met geluid.
2. **"Wie kijkt er?"**: profielen "Ik" en "Marcel".
3. **Home**: grote hero-banner met uitgelichte serie, rijen ("Verder kijken", "Series", "Films", genre-rijen), nep-ratings en reviews ("Oordelend. Meesterlijk. 5/5.").
4. **Seriepagina**: poster, beschrijving, afleveringen (niet-beschikbare als "Binnenkort").
5. **Speler** (het belangrijkste):
   - Scène = één beeld fullscreen met Ken Burns-effect (zoom/pan), audio van de verteller, ondertitels zin per zin gesynchroniseerd met de audio (of op timing wanneer audio ontbreekt).
   - Keuzemomenten: twee knoppen onderaan met aftellende balk van 10 seconden; bij geen keuze → standaardoptie.
   - Achtergrondmuziek per serie + optionele geluidseffecten per scène.
   - Eindscherm per einde (titel van het einde, "Opnieuw spelen", "Andere keuze proberen"), gevolgd door teaser van de volgende serie.
   - Voortgang en gevonden eindes onthouden in localStorage (met try/catch).
   - Werkt ook zonder beelden/audio: toon dan een placeholder met het scène-ID en de beeldprompt, zodat ik alles kan testen vóór de beelden klaar zijn.
6. **Nieuwe aflevering toevoegen zonder code**: één map + één databestand.

## Mapstructuur (voorstel)
```
/index.html
/assets/ (logo, UI-geluiden, fonts)
/series/rookie/
    series.json          (titel, beschrijving, poster, muziek, afleveringen)
    ep1/
        episode.json     (scènes + keuzes)
        s01.jpg  s01.mp3
        s02.jpg  s02.mp3 ...
```
Bestandsnaam van beeld en audio = scène-ID.

### episode.json (voorstel)
```json
{
  "title": "De Zaak Vaas",
  "start": "s01",
  "scenes": {
    "s01": { "text": "…", "next": "s02" },
    "s03": { "text": "…", "choice": { "prompt": "Wat doe je?", "options": [
      { "label": "Ondervraag de plant", "next": "s04a" },
      { "label": "Onderzoek de scherven", "next": "s04b" } ], "default": 0 } },
    "s09a": { "text": "…", "ending": "Einde A: Gerechtelijke dwaling", "next": "s12" }
  }
}
```

## Audio-workflow (ik doe dit zelf)
Stem via Edge TTS, Vlaamse stem:
```
pip install edge-tts
edge-tts --voice nl-BE-ArnaudNeural --rate=-10% --pitch=-5Hz --file s01.txt --write-media s01.mp3
```
Handig: een klein script dat uit `episode.json` per scène een `.txt` maakt en daarna alle mp3's genereert.

## Pilot: The Rookie: Feline Division — "De Zaak Vaas"
17 scènes, 3 keuzes, 3 eindes. Marcel onderzoekt een gebroken vaas en ontdekt dat hij zelf de dader is.

Stijlzin achter elke beeldprompt: *cinematic still from a police TV drama, warm natural daylight, shallow depth of field, 16:9. The cat is the exact grey British Shorthair from the reference photo: round face, dense blue-grey fur, deep orange eyes.*

| ID | Beeldprompt | Vertelling (Marcel) | Volgende |
|---|---|---|---|
| s01 | Cat sits proudly on a white cabinet, tiny police badge and cap beside him, morning light | Mijn eerste dag bij het korps. Ik ben Marcel. Agent Marcel. Ze zeggen dat ik te jong ben. Ze zeggen veel. | s02 |
| s02 | Close-up of a smartphone showing an alert, cat's face reflected in the screen | Tien uur twaalf. Een melding. Code rood in de woonkamer. Een vaas. Of wat ervan over is. | s03 |
| s03 | Shattered vase on the floor, red and white flowers and water, police tape | De plaats delict. Scherven. Water. Bloemen die nooit meer rechtop zullen staan. Iemand gaat hiervoor boeten. | KEUZE: Ondervraag de plant → s04a / Onderzoek de scherven → s04b |
| s04a | Cat stares at a pothos plant under an interrogation lamp | De plant. Altijd in de buurt. Altijd stil. Te stil. Ik vroeg waar ze was om tien uur. Ze zei niets. | s05a |
| s05a | Pothos leaves trembling, one leaf pointing to the hallway | Na een uur brak ze. Met een blad wees ze naar de gang. Een grijze schim, fluisterde ze. Planten fluisteren niet. Toch hoorde ik het. | s06 |
| s04b | Cat inspects a shard through a magnifying glass | Ik bekeek de scherven. Scherp, zoals mijn verstand. En toen zag ik het. | s05b |
| s05b | Macro of one fluffy blue-grey hair on a wet shard | Een haar. Grijs. Dicht. Zacht. Heel zacht, eigenlijk. Dit zegt niets. Veel wezens zijn grijs. | s06 |
| s06 | Vacuum cleaner in a dark closet, dramatic side light, like a suspect | Mijn instinct zei: de stofzuiger. Luid. Onvoorspelbaar. We hebben een verleden samen. | s07 |
| s07 | Cat and vacuum cleaner face each other across a table, noir interrogation room | Zijn alibi? De stekker zat niet in het stopcontact. Handig. Veel te handig. | KEUZE: Arresteer de stofzuiger → s08a / Bekijk de camerabeelden → s08b |
| s08a | Vacuum cleaner behind cardboard bars, cat standing guard, satisfied | Ik arresteerde hem. Geen vragen meer. Het korps applaudisseerde. Nu ja, niemand applaudisseerde. Maar in mijn hoofd wel. | s09a |
| s09a | Cat receives a medal made of a cat treat, grey pawprint visible behind him | Zaak gesloten. Promotie. Maar soms, 's nachts, denk ik aan die pootafdruk. Niet lang. Ik slaap snel in. | EINDE A: Gerechtelijke dwaling → s12 |
| s08b | Grainy security-camera footage, timestamp 10:11, blurry grey shape leaping | Er was een camera. Tien uur elf. Een wazige figuur. Grijs. Rond. Springt op de kast. | s09b |
| s09b | Pixelated freeze-frame of two glowing orange eyes | Ik zoomde in. Twee oranje ogen. Ik ken die ogen. Ik zie ze elke dag in de spiegel. | s10 |
| s10 | Cat looking shocked, dolly-zoom effect, dark room | Dit is duidelijk gemanipuleerd. AI. Deepfake. Een complot. Toch? | KEUZE: Beken → s11a / Wis het bewijs → s11b |
| s11a | Cat curled in a woman's lap on a sofa, golden evening light, only her hands visible | Eerlijk duurt het langst. Ik bekende. Ze zuchtte. Ze aaide me toch. Ze vergeeft me altijd. [persoonlijke boodschap, nog in te vullen] | EINDE B: Eerlijk duurt het langst → s12 |
| s11b | Cat lying triumphantly on a cabinet among flowers, staring into the camera (echte foto gebruiken) | De gsm viel. Van de tafel. Per ongeluk. Er is geen bewijs. Er is alleen Marcel. | EINDE C: Het perfecte misdrijf → s12 |
| s12 | Dark hallway at night, clock showing 03:00, Christmas lights flickering red | Volgende week, op Marcelflix. Om drie uur 's nachts ren ik door de gang. Jullie denken dat ik gek ben. Ik zie iets wat jullie niet zien. | einde aflevering |

## Eerste opdracht voor Claude Code
Bouw de volledige Marcelflix-site met de pilot als speelbare aflevering, eerst met placeholders voor beelden en audio. Andere series tonen als "Binnenkort". Voeg ook een script toe dat de `.txt`-bestanden en mp3's per scène genereert via edge-tts.

## Status (september 2026)
De site is gebouwd: `index.html`, `css/style.css`, `js/app.js` (views + routing), `js/player.js` (interactieve speler), `js/sound.js` (gesynthetiseerde geluiden).
Data: `data/config.json`, `data/catalog.json`, `series/<serie>/<afl>/episode.json`. Hulpscripts in `tools/`.
Hosting: GitHub Pages vanaf `main` / root (zie README). Geen build-stap.
Nog te doen: beelden genereren voor de pilot (zie `series/rookie/ep1/PROMPTS.md`), audio genereren, optionele slotzin in `series/directors-cut/ep1/episode.json` scène d09, volgende series schrijven.
