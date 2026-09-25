# Marcelflix

Een verrassingswebsite: een streamingdienst met Marcel (Britse korthaar, blauwgrijs, oranje ogen) in de hoofdrol van elke serie. Elke aflevering is een interactief verhaal in Bandersnatch-stijl: beelden met langzame zoom/pan, Marcel als verteller met ondertitels, en keuzes met een timer.

Volledig statisch (HTML/CSS/JS, geen build, geen backend). Draait gratis op GitHub Pages.

## Lokaal bekijken

`fetch()` werkt niet vanaf `file://`, dus start een mini-server in de projectmap:

```bash
python3 -m http.server 8000
```

Surf dan naar <http://localhost:8000>. Op je gsm in hetzelfde wifi-netwerk: `http://<ip-van-je-computer>:8000`.

## Online zetten (GitHub Pages)

1. Push naar GitHub.
2. Ga naar *Settings → Pages*, kies *Deploy from a branch*, branch `main`, map `/ (root)`.
3. Na een minuutje staat de site op `https://<gebruiker>.github.io/<repo>/`.

## Structuur

```
index.html            één pagina, alles gaat via #/-routes
site.json             profielen, volgorde van de series, top 10, "nieuw"
css/style.css
js/                   main (router), views (schermen), player (speler), sound, store, data, ui
assets/               icoon; optioneel intro.mp3 (anders wordt het intro-geluid gesynthetiseerd)
series/<serie>/
    series.json       titel, beschrijving, reviews, afleveringen, muziek, teaser
    poster.jpg        (optioneel) affiche; zonder beeld tekent de site een affiche in de stijl van de serie
    muziek.mp3        (optioneel) achtergrondmuziek, loopt en wordt zachter tijdens de vertelling
    ep1/
        episode.json  scènes en keuzes
        beeldprompts.md  gegenereerd overzicht van alle beeldprompts
        s01.jpg s01.mp3 s02.jpg s02.mp3 …   (bestandsnaam = scène-ID)
tools/                maak_audio.py, beeldprompts.py, controleer.py
```

## Beelden en audio toevoegen

Zet ze gewoon in de map van de aflevering met als naam de scène-ID: `s03.jpg`, `s03.mp3`. Meer is er niet nodig.

- **Ontbreekt het beeld?** De speler toont een placeholder met het scène-ID, de bestandsnaam en de beeldprompt.
- **Ontbreekt de audio?** De ondertitels lopen dan op een geschatte timing. Met audio worden ze verdeeld over de lengte van het mp3-bestand.
- Beelden in 16:9 (bv. 1920×1080 of 1600×900, jpg rond 200–400 kB) laden snel op gsm.
- Wil je een ander bestand gebruiken voor één scène (bv. een echte foto), zet dan `"image": "marcel-kast.jpg"` bij die scène.

### Audio genereren (edge-tts)

```bash
pip install edge-tts
python3 tools/maak_audio.py series/rookie/ep1
```

Dat schrijft per scène een `.txt` en maakt de `.mp3` met de Vlaamse stem (`nl-BE-ArnaudNeural`, `-10%`, `-5Hz`, in te stellen via `"voice"` in episode.json of per scène). Bij een nieuwe run worden enkel scènes met gewijzigde tekst of stem opnieuw gemaakt.

- `--alleen s01,s11a` doet enkel die scènes, `--opnieuw` alles, `--enkel-txt` maakt enkel de tekstbestanden.
- Tekst tussen `[vierkante haken]` is een placeholder: die wordt niet uitgesproken en het script waarschuwt. Vervang ze door je eigen tekst voor je de audio maakt.
- Moet de uitspraak anders zijn dan de ondertitel? Zet een `"tts"`-veld bij de scène.

### Beeldprompts

```bash
python3 tools/beeldprompts.py series/rookie/ep1
```

Maakt `beeldprompts.md` met per scène de volledige prompt (scèneprompt + stijlzin uit `"style"`) en een ✅/⬜ of het beeld er al is.

## Een nieuwe aflevering toevoegen (zonder code)

1. Maak een map, bv. `series/stranger/ep1/`, met daarin een `episode.json` (kopieer die van de pilot als voorbeeld).
2. Haal in `series/stranger/series.json` bij die aflevering `"soon": true` weg. Klaar, ze is speelbaar.
3. Controleer of alles klopt:

   ```bash
   python3 tools/controleer.py
   ```

   Dat meldt kapotte verwijzingen, onbereikbare scènes, ongeldige JSON en welke beelden en audio nog ontbreken.

### episode.json

```json
{
  "title": "De Zaak Vaas",
  "start": "s01",
  "choiceSeconds": 10,
  "style": "cinematic still …",
  "voice": { "voice": "nl-BE-ArnaudNeural", "rate": "-10%", "pitch": "-5Hz" },
  "scenes": {
    "s01": { "prompt": "…", "text": "…", "next": "s02" },
    "s03": { "prompt": "…", "text": "…",
             "choice": { "prompt": "Wat doe je?", "default": 0, "options": [
               { "label": "Ondervraag de plant", "next": "s04a" },
               { "label": "Onderzoek de scherven", "next": "s04b" } ] } },
    "s09a": { "prompt": "…", "text": "…", "ending": "Einde A: Gerechtelijke dwaling", "next": "s12" }
  }
}
```

Velden per scène (alles behalve `text` is optioneel):

| Veld | Betekenis |
|---|---|
| `text` | wat Marcel zegt; wordt zin per zin ondertiteld |
| `prompt` | beeldprompt (voor de placeholder en `beeldprompts.md`) |
| `next` | volgende scène |
| `choice` | keuze: `prompt`, `options` (`label` + `next`), `default` (index bij geen keuze) |
| `ending` | titel van het einde, bv. `"Einde B: Eerlijk duurt het langst"`; toont het eindscherm. Met `next` gaat het daarna verder (bv. naar de teaser-scène). |
| `camera` | `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `pan-up`, `pan-down`, `dolly`, `still`, of `{ "from": "scale(1.1)", "to": "scale(1.3) translateX(-3%)" }` |
| `focus` | punt waarop ingezoomd wordt, bv. `"30% 40%"` |
| `effect` | `vhs` (bewakingscamera), `flicker` (rood flikkerlicht), `noir` (zwart-wit) |
| `label` | klein label bovenaan, bv. `"Volgende week"` |
| `image` / `audio` | ander bestand dan `<id>.jpg` / `<id>.mp3` |
| `sfx` | geluidseffect: `"glas.mp3"` of `{ "file": "glas.mp3", "at": 1.5, "volume": 0.8 }` (bestand in de map van de aflevering, of `assets/…`) |
| `music` | ander muziekstuk vanaf deze scène (pad relatief aan de serie-map) |
| `tts` | andere tekst voor de stem dan voor de ondertitel |
| `note` | notitie voor jezelf, zichtbaar op de placeholder |
| `duration` | duur in seconden als er geen audio is (anders geschat) |
| `pause` | pauze na de scène in seconden (standaard 0,6) |

Op aflevering-niveau kan ook `"outro": { "title": "…", "text": "…" }`: dan toont het eindscherm die tekst in plaats van de teaser.

## De Director's Cut

`series/directorscut/` is verborgen (`"hidden": true`) en verschijnt pas wanneer alle speelbare afleveringen van de andere series uitgekeken zijn. Nu is dat enkel de pilot. Voeg je later afleveringen toe, dan moeten die ook bekeken worden. Wie ze al ontgrendeld had, houdt ze.

De tekst in `series/directorscut/ep1/episode.json` is een aanzet met `[placeholders]` voor jullie eigen verhaal. Vul die in vóór je de audio maakt.

## Testen

- Voeg `?debug=1` toe aan een speler-URL om het scène-ID, audio/timing en de duur te zien (blijft aan tot `?debug=0`).
- Spring direct naar een scène: `#/kijk/rookie/ep1/s10`.
- In de browserconsole: `marcelflix.unlock()` ontgrendelt de Director's Cut, `marcelflix.reset()` wist alle voortgang.
- Toetsen in de speler: spatie = pauze, → = overslaan, 1/2 = keuze, C = ondertitels, M = geluid, F = volledig scherm, Esc = terug.

## Aanpassen

- **Namen en kleuren van de profielen**: `site.json` → `profiles` (`accessory`: `strik`, `bril`, `kroon` of `pet`).
- **Uitgelichte serie, top 10, "nieuw"**: `site.json`.
- **Eigen intro-geluid**: zet `assets/intro.mp3` in de map.
- **Beschrijvingen, reviews, teaser na de aflevering**: `series/<serie>/series.json` (`"teaser": "stranger"`).
