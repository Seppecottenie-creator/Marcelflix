# Covers: prompts voor alle series en films

## Stijl: één stijl voor alles, realistisch en filmisch

Gebruik voor **alle** covers en **alle** afleveringsbeelden dezelfde stijl: fotorealistisch, als een still uit een echte film of serie. Elke titel krijgt wel een eigen kleur en belichting (zijn "look"), zodat ze in de rijen van elkaar verschillen.

Waarom niet animatie, of een mix?

- **Marcel moet herkenbaar blijven.** Een AI-model houdt zijn gezicht, vacht en oranje ogen het best vast in een realistische stijl. In cartoonstijl wordt hij al snel "een grijze kat" in plaats van Marcel.
- **Cover en aflevering moeten matchen.** De pilot is al geschreven als "cinematic still from a police TV drama". Een getekende cover op een realistische aflevering voelt als een ander product.
- **Een mix oogt goedkoop** in de rijen op de homepagina. Echte streamingdiensten tonen ook één consistente beeldtaal.
- **De parodie werkt beter realistisch:** een echte kat, doodernstig belicht als een filmster, is net het grappige.

De afwisseling komt dus van de **look per titel** (kleurgradatie, licht, decor). Neem die look-zin ook over in de `style` van de afleveringen van die titel. Dan passen cover en aflevering bij elkaar.

## Referentiefoto's: stuur er 3 à 5

Meer dan 5 helpt niet en verwart het model soms. Kies:

1. **Gezicht recht van voren**, scherp, ogen goed zichtbaar (het belangrijkste).
2. **Gezicht schuin of van opzij** (vorm van de kop en de oren).
3. **Hele lichaam**, zittend of liggend (bouw en verhoudingen).
4. *Optioneel:* een foto bij daglicht en een bij warm binnenlicht (de echte vachtkleur).

Tips:

- Enkel Marcel op de foto, geen andere dieren of mensen. Geen filters of zwaar bewerkte kleuren.
- Liefst foto's met een rustige achtergrond. Een drukke achtergrond sluipt soms mee in het beeld.
- Gebruik **steeds dezelfde set** foto's voor alle covers, dan blijft Marcel overal dezelfde kat.

## Werkwijze in Gemini

1. Start **één gesprek** voor alle covers en plak eerst dit bericht, samen met je referentiefoto's:

   > Dit is mijn kat Marcel, een Britse korthaar. Ik ga je vragen om een reeks filmposters te maken met exact deze kat in de hoofdrol. Houd zijn uiterlijk altijd identiek aan de foto's: ronde kop, dicht blauwgrijs vachtje, diep oranje ogen, dezelfde oorvorm. Zet nooit tekst, letters, titels of logo's in het beeld.

2. Vraag per titel eerst de **poster** en daarna de **brede versie**. Plak telkens de prompt hieronder.
3. Wijkt Marcel af? Upload de gezichtsfoto opnieuw met "zelfde kat als op deze foto, let op de kop en de ogen".
4. **Geen tekst op de covers.** De site zet de titel zelf over de poster. Staat er toch tekst op, vraag dan "dezelfde afbeelding zonder tekst".

## Formaten en bestandsnamen

| Wat | Formaat | Waar de site het toont | Bestandsnaam |
|---|---|---|---|
| Poster | **staand 2:3** (bv. 1000 × 1500) | kaarten in de rijen | `assets/covers/<id>.jpg` |
| Brede versie | **liggend 16:9** (bv. 1920 × 1080) | grote banner (home) en seriepagina | `assets/covers/<id>-wide.jpg` |

- Bij de **poster** staat de titel onderaan: houd het onderste derde rustig (donker, weinig details).
- Bij de **brede versie** staat de tekst links: zet Marcel **rechts** in beeld en houd links rustig.
- Maak de bestanden kleiner via squoosh.app (jpg, kwaliteit ±75): posters rond 150 kB, brede versies rond 300 kB.
- Koppel ze daarna in `data/catalog.json` bij de juiste titel:
  `"poster": "assets/covers/rookie.jpg", "backdrop": "assets/covers/rookie-wide.jpg"`

## Vaste zin achter elke prompt

Plak deze zin achter **elke** prompt hieronder:

```
Photorealistic cinematic film poster artwork, dramatic professional lighting, high detail, shallow depth of field. No text, no letters, no title, no logo, no watermark. The cat is the exact grey British Shorthair from the reference photos: round face, dense blue-grey fur, deep orange eyes, realistic cat anatomy.
```

---

# Series

## The Rookie: Feline Division · `rookie`
**Look:** warm natural daylight, amber and navy color grade, police TV drama

**Poster (2:3):**
```
The cat sitting upright and proud on a white cabinet like a rookie police officer, a tiny police cap on his head and a small shiny badge beside him, soft red and blue police lights glowing in the blurred background, warm morning light from the side, dark calm lower third.
```
**Breed (16:9):**
```
Wide shot of a sunny living room turned crime scene, a shattered vase with flowers and police tape on the floor in the left background, the cat on the right side of the frame looking seriously into the camera, warm natural daylight, amber and navy color grade, calm darker area on the left.
```

## Stranger Paws · `stranger`
**Look:** 1980s night, red and blue neon glow, film grain, mysterious

**Poster (2:3):**
```
The cat standing in a dark hallway at night, lit from behind by flickering red Christmas lights, his orange eyes glowing, a digital clock showing 03:00 on the wall, blue moonlight, 1980s film grain, dark calm lower third.
```
**Breed (16:9):**
```
A long dark hallway at 3 a.m. with a string of red fairy lights along the wall, the cat on the right side of the frame mid-sprint with motion blur, shadows stretching behind him, deep red and blue neon color grade, 1980s film grain.
```

## Breaking Bowl · `breaking`
**Look:** harsh desert-yellow color grade, gritty crime drama

**Poster (2:3):**
```
The cat sitting behind an empty food bowl on a kitchen floor, staring intensely at the camera like a crime boss, a thin cloud of steam rising, harsh yellow-green color grade, dusty sunlight through blinds, dark calm lower third.
```
**Breed (16:9):**
```
A kitchen floor in harsh yellow light, rows of perfectly arranged cat kibble on the tiles like a lab, the cat on the right side of the frame looking down at them with a serious expression, gritty crime drama color grade.
```

## The Pawffice · `office`
**Look:** bright sitcom office, beige and light blue, even fluorescent light, awkward deadpan comedy (niet donker of somber)

**Poster (2:3):**
```
A bright, cheerful sitcom-style office: beige walls, light blue carpet, bright even fluorescent lighting, cluttered desks with paper stacks and a stapler. The cat sits proudly on top of his desk and gives the camera an awkward, deadpan side-glance, as if something embarrassing just happened. Next to him a white coffee mug that says WORLD'S BEST BOSS (this is the only text allowed). Light, warm, slightly cheesy TV comedy look, not dark, not moody, calm lower third.
```
**Breed (16:9):**
```
A cluttered, brightly lit open-plan paper company office with beige walls, desks, a copier and a water cooler, a potted plant and a vacuum cleaner standing among the desks like coworkers. The cat on the right side of the frame sits on a swivel chair and stares straight into the camera with a deadpan expression, like a mockumentary talking-head interview. Bright even fluorescent light, warm TV comedy look, not dark, not moody, calmer area on the left.
```

## Katnonkels · `katten`
**Look:** zonnige zomerkomedie zoals de filmposter van Nonkels: felblauwe lucht, witte villa, gazon met dierenhagen, zwembad, verzadigde kleuren

**Poster (2:3):**
```
A sunny, colorful summer comedy movie poster: bright blue sky with fluffy white clouds, a modern white villa, a green lawn with topiary hedges trimmed into animal shapes (one shaped like a giraffe, one like a cat). In the middle ground, the cat's two "uncles" stand side by side on the lawn like a proud but awkward family lineup: a large potted plant and an upright vacuum cleaner. In the foreground the cat lies smugly on the wooden pool deck, front paws crossed, looking into the camera like he owns the place. The lower third is calm blue pool water. Saturated, cheerful summer colors, bright daylight, slightly cheesy comedy poster look.
```
**Breed (16:9):**
```
The garden of a modern white villa under a bright blue sky with fluffy clouds, a green lawn with topiary hedges trimmed into animal shapes, a blue swimming pool with a wooden deck across the front. In the middle of the lawn the potted plant and the upright vacuum cleaner stand side by side like two proud, awkward uncles. On the right side of the frame the cat lounges on a sun lounger under a parasol, looking into the camera with a smug expression. Saturated, cheerful summer colors, bright daylight, comedy movie poster look, calmer sky on the left.
```

## The Crown (van de kast) · `crown`
**Look:** regal, cool palace light, deep blue and gold, historical drama

**Poster (2:3):**
```
The cat sitting majestically on top of a tall wardrobe like a monarch on a throne, a tiny golden crown on his head, velvet drapery in the background, cool regal light, deep blue and gold color grade, calm lower third.
```
**Breed (16:9):**
```
A stately room with tall windows and heavy curtains, the cat on the right sitting on top of a high cabinet looking down with royal disdain, a small golden crown beside him, cool palace light, deep blue and gold color grade.
```

## La Casa de Brokjes · `heist`
**Look:** heist thriller, red accents, high contrast

**Poster (2:3):**
```
The cat standing in front of an open refrigerator glowing in the dark kitchen, wearing a small red scarf like a bandana, looking over his shoulder at the camera, high-contrast heist thriller lighting with red accents, calm lower third.
```
**Breed (16:9):**
```
A dark kitchen at night lit only by the light of an open fridge, a hand-drawn plan on paper on the floor on the left, the cat on the right in a small red scarf looking determined, high-contrast heist thriller look with red accents.
```

## Game of Cushions · `thrones`
**Look:** cold medieval fantasy, grey-blue light, candles, epic

**Poster (2:3):**
```
The cat sitting on a towering stack of sofa cushions like a throne, cold grey-blue light, candles and falling snow in the background, epic medieval fantasy atmosphere, calm lower third.
```
**Breed (16:9):**
```
An epic wide shot of a living room transformed into a cold medieval hall, a huge pile of cushions forming a throne on the right with the cat sitting on top, candles, cold breath in the air, grey-blue fantasy color grade.
```

---

# Films

## Double-O-Marcel: Licence to Purr · `bond`
**Look:** glamorous spy thriller, tuxedo black, gold highlights

**Poster (2:3):**
```
The cat sitting elegantly with a tiny black bow tie, a spotlight from above, a glamorous dark background with golden bokeh, 1960s spy thriller style, calm lower third.
```
**Breed (16:9):**
```
A luxurious dark casino-like room with golden bokeh lights, the cat on the right wearing a tiny black bow tie sitting next to a martini glass, cool confident look, glamorous spy thriller color grade.
```

## Catanic · `catanic`
**Look:** romantic epic, sunset, cold blue sea

**Poster (2:3):**
```
The cat sitting at the front of a large ship's bow at sunset, wind in his fur, the endless ocean behind him, warm golden and cold blue tones, epic romantic drama, calm lower third.
```
**Breed (16:9):**
```
The bow of a grand ocean liner at golden sunset, the cat on the right standing at the very front with the wind in his fur, vast ocean on the left, epic romantic color grade.
```

## Pride & Purrjudice · `pride`
**Look:** soft English countryside, period drama, pastel morning light

**Poster (2:3):**
```
The cat sitting on a windowsill of an old English country house, soft misty morning light over green fields behind him, a delicate lace curtain, pastel period drama palette, calm lower third.
```
**Breed (16:9):**
```
A misty English meadow at dawn with an old manor house in the left background, the cat on the right walking through the tall grass looking proud, soft pastel period drama light.
```

## Purrstellar · `purrstellar`
**Look:** cosmic sci-fi, deep space blacks, dusty amber

**Poster (2:3):**
```
The cat seen from behind, sitting in front of a huge window looking out at a glowing black hole and stars, dusty amber and deep black color grade, epic space sci-fi, calm lower third.
```
**Breed (16:9):**
```
A vast cosmic landscape with a glowing black hole on the left, the cat on the right sitting on a dusty surface gazing up at it, amber and deep black sci-fi color grade, awe-inspiring scale.
```

## Harry Pawter en de Steen der Brokjes · `pawter`
**Look:** candlelit magical castle, warm gold, fantasy

**Poster (2:3):**
```
The cat sitting on an old leather-bound book in a candlelit stone library, floating candles above him, a small glowing golden stone in front of his paws, warm magical gold light, fantasy atmosphere, calm lower third.
```
**Breed (16:9):**
```
A candlelit stone castle hall with floating candles, old books and a cauldron on the left, the cat on the right looking amazed at a glowing golden stone, warm magical gold color grade.
```

## Spider-Marcel · `spider`
**Look:** urban superhero, red and blue city lights, dynamic angle

**Poster (2:3):**
```
The cat perched high on top of a tall bookcase seen from a dramatic low angle, judging the world below, red and blue city lights through a window behind him, dynamic superhero film composition, calm lower third.
```
**Breed (16:9):**
```
A city skyline at dusk seen through a large window on the left, the cat on the right perched on the very top of a tall cabinet looking down heroically, red and blue light, dynamic low-angle superhero composition.
```

## Mission: Impawsible · `mission`
**Look:** tense action, cool blue-grey, laser red

**Poster (2:3):**
```
The cat hanging upside down on a thin rope in a dark room, red laser beams crossing around him, a cup on a table below, tense action thriller lighting in cool blue-grey, calm lower third.
```
**Breed (16:9):**
```
A dark hallway full of red laser beams on the left, the cat on the right crouching low and focused, ready to jump through them, cool blue-grey action thriller color grade.
```

## Top Gun: Meowerick · `topgun`
**Look:** golden-hour aviation, orange sky, heat haze

**Poster (2:3):**
```
The cat wearing tiny aviator sunglasses, sitting proudly in front of an orange golden-hour sky with a jet silhouette far in the background, heat haze, 1980s action film look, calm lower third.
```
**Breed (16:9):**
```
An airfield at golden hour with a fighter jet silhouette on the left, the cat on the right wearing tiny aviator sunglasses looking cool into the distance, orange sky and heat haze, 1980s action film color grade.
```

## Jurassic Purrk · `jurassic`
**Look:** lush jungle, humid green, adventure

**Poster (2:3):**
```
The cat standing on a mossy rock in a misty prehistoric jungle, huge ferns around him, a giant shadow looming in the fog behind him, humid green adventure film lighting, calm lower third.
```
**Breed (16:9):**
```
A misty prehistoric jungle with giant ferns and a huge dark silhouette in the fog on the left, the cat on the right in the foreground looking back with wide orange eyes, humid green adventure color grade.
```

## Home Alone: Marcel Edition · `homealone`
**Look:** cosy Christmas, warm red and gold, family comedy

**Poster (2:3):**
```
The cat sitting alone in front of a decorated Christmas tree in a warm house, paws on his cheeks in mock shock, fairy lights and presents, warm red and gold family comedy lighting, calm lower third.
```
**Breed (16:9):**
```
A cosy living room decorated for Christmas, a vacuum cleaner at the front door on the left, the cat on the right standing guard on the stairs with a mischievous look, warm red and gold light.
```

---

# Geheim

## Director's Cut · `directors-cut`
**Look:** soft romantic, golden hour, dreamy haze (dezelfde als de aflevering)

**Poster (2:3):**
```
The cat sitting on a windowsill at golden hour, soft dreamy haze, warm backlight glowing through his fur, a single red rose petal beside him, intimate romantic film still, calm lower third.
```
**Breed (16:9):**
```
A cosy living room at golden hour, two cups of tea on the table on the left, the cat on the right curled up on a blanket looking softly into the camera, dreamy haze, warm romantic color grade.
```
