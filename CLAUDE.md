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

## Pilot: The Rookie: Feline Division — "De Zaak Kattenkruid"
Herschreven (vloeiendere, langere zinnen; geen vaas of stofzuiger meer). 17 scènes, 3 keuzes, 3 eindes; de volledige tekst staat in `series/rookie/ep1/episode.json`.
Personages uit het huis voor alle titels (o.a. Teddy de teddybeer, de Happy Plants geel en blauw): `PERSONAGES.md`.
Terugkerende cast en het plan voor aflevering 2 en 3: `series/rookie/PERSONAGES.md` (Peperkoek, Ketchup, Gerrit de Duif, De Vlieg, Pieter de Muis, Rosse Roger). Er doen nooit mensen mee.

## Eerste opdracht voor Claude Code
Bouw de volledige Marcelflix-site met de pilot als speelbare aflevering, eerst met placeholders voor beelden en audio. Andere series tonen als "Binnenkort". Voeg ook een script toe dat de `.txt`-bestanden en mp3's per scène genereert via edge-tts.

## Status (september 2026)
De site is gebouwd: `index.html`, `css/style.css`, `js/app.js` (views + routing), `js/player.js` (interactieve speler), `js/sound.js` (gesynthetiseerde geluiden).
Data: `data/config.json`, `data/catalog.json`, `series/<serie>/<afl>/episode.json`. Hulpscripts in `tools/`.
Hosting: GitHub Pages vanaf `main` / root (zie README). Geen build-stap.
Nog te doen: beelden genereren voor de pilot (zie `series/rookie/ep1/PROMPTS.md`), audio genereren, optionele slotzin in `series/directors-cut/ep1/episode.json` scène d09, volgende series schrijven.
