# Marcelflix

Een streamingdienst met één ster: Marcel. Interactieve afleveringen in Bandersnatch-stijl, met AI-beelden, Marcel als verteller en keuzes met een timer.

Statische site: geen backend, geen build-stap. Draait gratis op GitHub Pages.

## Online zetten (GitHub Pages)

1. Maak op GitHub een nieuwe repository, bijvoorbeeld `kattenfilms`, zodat de naam niets verraadt.
   Hij mag **Public** zijn (Pages gratis) of Private als je GitHub Pro hebt.
2. Zet alle bestanden van deze map in de repo, via GitHub Desktop, of:
   ```bash
   git remote add origin https://github.com/<jouw-naam>/kattenfilms.git
   git branch -M main
   git push -u origin main
   ```
3. Ga op GitHub naar **Settings → Pages**. Kies bij *Build and deployment*: **Deploy from a branch**, branch `main`, map `/ (root)`. Klik op **Save**.
4. Na een minuutje staat de site op `https://<jouw-naam>.github.io/kattenfilms/`.

Elke `git push` zet daarna automatisch de nieuwe versie online.

**Lokaal testen:** open de site niet als los bestand, maar start een mini-webserver in deze map:
```bash
python -m http.server 8000
```
Ga dan naar http://localhost:8000.

## Werkwijze per aflevering

| Stap | Wat | Waar |
|---|---|---|
| 1 | Script en keuzes | `series/<serie>/<afl>/episode.json` |
| 2 | Beeldprompts maken | `python tools/maak_prompts.py series/rookie/ep1` → `PROMPTS.md` |
| 3 | Beelden genereren | opslaan als `s01.jpg`, `s02.jpg`, … in de map van de aflevering |
| 4 | Stem genereren | `python tools/genereer_audio.py series/rookie/ep1` → `s01.mp3`, … |
| 5 | Testen | `python -m http.server 8000` |
| 6 | Online | `git add . && git commit -m "Nieuwe beelden" && git push` |

Ontbreekt een beeld of een mp3, dan toont de speler een placeholder met de prompt, en loopt de tekst op tijd. Je kunt dus alles testen voordat de beelden klaar zijn.

### Stem (gratis, Edge TTS)
```bash
pip install edge-tts
python tools/genereer_audio.py series/rookie/ep1                     # alle scènes
python tools/genereer_audio.py series/rookie/ep1 --scene s03 --force # één scène opnieuw
python tools/genereer_audio.py --stemmen                             # alle Nederlandstalige stemmen
```
Standaardstem, snelheid en toonhoogte staan in `data/config.json` onder `voice`.
Zelf ingesproken? Zet gewoon je eigen `s01.mp3` in de map.

### Beelden
- Geef bij elke generatie een referentiefoto van Marcel mee.
- 16:9 liggend, minstens 1920 x 1080. `.jpg`, `.png` of `.webp` mag.
- Houd bestanden onder ~500 kB (bv. via squoosh.app), zodat het vlot laadt op gsm.

## Aanpassen

| Wat | Bestand |
|---|---|
| Profielen ("Ik", "Marcel") | `data/config.json` |
| Series en films, beschrijvingen, reviews | `data/catalog.json` (`type`: `series` of `film`) |
| Scènes, tekst, keuzes, eindes | `series/<serie>/<afl>/episode.json` |
| Persoonlijke boodschap (geheime aflevering) | `series/directors-cut/ep1/episode.json`, scène `d03` |
| Eigen muziek per serie | zet `"music": "series/rookie/muziek.mp3"` bij de serie in `catalog.json` |

### Scène-opties in `episode.json`
```json
"s03": {
  "prompt": "beeldbeschrijving (Engels)",
  "text": "Wat Marcel zegt. Zin per zin ondertiteld.",
  "narration": "Optioneel: gesproken tekst in een andere taal (evenveel zinnen als text).",
  "motion": "in | out | left | right | zoom | none",
  "look": "noir | cctv | warm | stranger",
  "focus": "50% 35%",
  "sfx": "glass",
  "image": "eigen-bestand.jpg",
  "next": "s04",
  "choice": { "prompt": "Vraag?", "options": [ { "label": "Optie 1", "next": "s04a" }, { "label": "Optie 2", "next": "s04b" } ], "default": 0 },
  "ending": { "id": "A", "title": "Naam van het einde" }
}
```
Een scène heeft `next`, `choice` of niets (dan is de aflevering gedaan). Een `ending` toont een eindkaart en gaat daarna naar `next`.

### Een nieuwe serie beschikbaar maken
1. Maak `series/stranger/ep1/episode.json` (kopieer die van de Rookie als basis).
2. Zet in `data/catalog.json` bij die serie `"status": "available"`.
3. Optioneel: `"poster"` en `"backdrop"` met eigen beelden, anders wordt er automatisch een poster getekend.

## Geheimen
- **Director's Cut** verschijnt pas op de home ("Speciaal voor jou") wanneer alle 3 eindes van *De Zaak Vaas* gevonden zijn. Vergeet je boodschap in scène `d03` niet.
- Voortgang en gevonden eindes worden per toestel bewaard. Onderaan de home staat "Voortgang wissen" om zelf opnieuw te testen.
