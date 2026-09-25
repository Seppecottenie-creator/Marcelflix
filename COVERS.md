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

   > Dit is mijn kat Marcel, een Britse korthaar. Ik ga je vragen om een reeks filmbeelden te maken met Marcel in de hoofdrol. Gebruik mijn foto's alleen als referentie voor zijn uiterlijk: ronde brede kop, korte stompe snuit, dicht blauwgrijs vachtje zonder strepen, kleine afgeronde oren, diep oranje ogen. Kopieer of knip de foto's nooit uit: bedenk telkens een nieuwe houding die bij de scène past, en belicht hem met het licht van die scène, zodat het één echte foto lijkt. Alle beelden zijn fotorealistisch, als stills uit een live-action film. Zet nooit tekst, letters, titels of logo's in het beeld, tenzij ik het uitdrukkelijk vraag.

2. Vraag per titel eerst de **poster** en daarna de **brede versie**. Plak telkens de prompt hieronder.
3. **Plakt Gemini de kat uit je foto in de scène** (zelfde houding, ander licht)? Stuur: "Gebruik mijn foto's alleen als referentie voor zijn uiterlijk, kopieer nooit de foto, zijn houding of de belichting. Laat hem in een nieuwe houding in deze scène ontstaan, belicht door het licht van de scène." Helpt dat niet: vraag eerst de scène zonder kat, en laat Marcel er daarna in zetten.
4. Wijkt Marcel af? Upload de gezichtsfoto opnieuw met "zelfde kat als op deze foto, let op de kop en de ogen".
5. **Geen tekst op de covers.** De site zet de titel zelf over de poster. Staat er toch tekst op, vraag dan "dezelfde afbeelding zonder tekst".

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
A real photograph, like a still from a live-action film or series shot on a full-frame cinema camera on a practical set. Natural light, realistic shadows and fur texture, subtle film grain. Not a painting, not digital art, not an illustration, not CGI. No text, no letters, no title, no logo, no watermark. The cat is the exact grey British Shorthair from the reference photos: round face, dense blue-grey fur, deep orange eyes, realistic cat anatomy.
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
**Look:** formal royal portrait, palace throne room, muted deep blue, red and gold, prestigious historical drama (knipogen: voorouderportretten, rode loper, kroonjuwelen als kattenspeelgoed, theeservies, corgi's)

**Poster (2:3):**
```
A formal royal portrait: the cat sits majestically and perfectly upright on top of a tall antique wardrobe as if it were a throne, a small golden crown with red velvet on his head. Behind him a heavy dark blue velvet curtain with gold tassels and a large gilded oil painting of a grey cat ancestor in ermine robes. At the foot of the wardrobe a red velvet cushion with a golden ball of yarn and a jewelled feather wand as crown jewels, and a corgi looking up at him in awe. Cool, dignified palace light from a tall window, muted deep blue, red and gold color grade, serious and regal expression, prestigious historical drama look, calm dark lower third.
```
**Breed (16:9):**
```
A grand palace throne room with tall windows, heavy blue velvet curtains and a crystal chandelier. The walls are lined with gilded oil-painting portraits of the cat's royal ancestors: grey cats in ermine robes and crowns. A red carpet runs across the polished floor towards a tall antique cabinet on the right side of the frame, where the cat sits perfectly upright on top, wearing a small golden crown with red velvet, looking down with royal disdain. At the foot of the cabinet: a red velvet cushion holding the "crown jewels" (a golden ball of yarn and a jewelled feather cat-toy wand as a scepter), a small table with a silver tea set, and two corgis sitting politely and looking up at him in awe. Cool palace light, muted deep blue, red and gold color grade, prestigious historical drama look, slightly calmer area on the left.
```

## La Casa de Brokjes · `heist`
**Look:** heist thriller, bold red and black, high contrast; rode overall, kluis vol snoepjes, brokjes die als biljetten neerregenen (geen maskers)

**Poster (2:3):**
```
A dramatic heist thriller poster: the cat sits upright and confident, wearing a small red hooded jumpsuit, in front of a huge open round bank-vault door. Inside the vault are shelves stacked with bags of cat treats. Hundreds of pieces of dry cat kibble rain down through the air around him like banknotes in a heist. Bold red and black color scheme, dramatic spotlight from above, dark background, high-contrast heist thriller look, calm dark lower third. No masks.
```
**Breed (16:9):**
```
A dark kitchen at night turned into a heist headquarters: a massive round steel vault door built into the pantry stands open, revealing shelves full of cat treat bags glowing in warm light. A table on the left with a hand-drawn floor plan of the kitchen, arrows and pins, no readable words. Dry cat kibble rains down through the air like banknotes. On the right side of the frame the cat, wearing a small red hooded jumpsuit, looks back over his shoulder into the camera with a determined, sly expression. Bold red and black color scheme, dramatic high-contrast lighting with red accents, heist thriller look, calmer darker area on the left. No masks.
```

## Game of Cushions · `thrones`
**Look:** live-action period drama op een echte set, koude stenen hal, kaarslicht; een troon met een zitting van zetelkussens en een rugleuning van zwaarden (vermijd "epic fantasy", dat geeft digitale kunst)

**Poster (2:3):**
```
Do not copy the pose or lighting from the reference photos: create a new pose that fits this scene. A real photograph, like a still from a live-action period drama filmed on a practical set. A tall throne whose seat is made of real stacked sofa cushions and pillows in velvet and linen, and whose back is a fan of dozens of real old metal swords rising up behind the cushions, like a throne of swords. The cat lies broad and smug on top of the cushions, his body turned three-quarters, head slightly tilted, front paws draped over the edge of the top cushion, looking down at the camera like a bored king. A real fur blanket hangs over the cushions. Behind him a cold stone hall with a tall arched window and real candles on iron candelabras. Lit by cold blue window light and warm candlelight, with real shadows in his fur and candlelight glinting on the scratched sword blades. Calm dark lower third.
```
**Breed (16:9):**
```
A real photograph, like a still from a live-action period drama filmed on a practical set: a cold medieval stone hall with long wooden tables, real candles, fur blankets, frost on an old radiator, a few snowflakes near a tall arched window, visible cold breath in the air. On the right side of the frame a tall throne with a seat of real stacked sofa cushions and a back made of a fan of dozens of real old metal swords. The cat stands on top of the cushions in profile, one front paw raised, gazing out over the hall like a conqueror. Lit by cold window light and warm candlelight, with real shadows in his fur and light glinting on the sword blades. Calmer darker area on the left.
```

---

# Films

## Marcel Bond: License to Purr · `bond`
**Look:** glamorous 1960s spy film on a practical set, black and gold, casino; de schurk is de rode laserstip (geen wapens)

**Poster (2:3):**
```
Do not copy the pose or lighting from the reference photos: create a new pose that fits this scene. A real photograph, like a still from a glamorous live-action 1960s spy film shot on a practical set. The cat sits upright and cool on a black leather armchair in a luxurious dark casino, wearing a tiny black tuxedo jacket with a black bow tie, head turned slightly, giving the camera a confident, unimpressed look. Next to him on a small table a martini glass with an olive and a stack of gold casino chips. A small red laser dot glows menacingly on the armrest beside his paw. Dramatic spotlight from above, deep black shadows, golden bokeh lights in the background, calm dark lower third. No guns.
```
**Breed (16:9):**
```
A real photograph, like a still from a glamorous live-action 1960s spy film shot on a practical set: a luxurious casino at night with a roulette wheel, green felt card tables, crystal chandeliers and golden bokeh lights. On the right side of the frame the cat, wearing a tiny black tuxedo jacket and bow tie, lies elegantly on the green felt of a card table between stacks of casino chips and a martini glass, watching a small red laser dot creeping across the felt towards him with narrowed eyes. Warm golden light with deep black shadows, calmer darker area on the left. No guns.
```

## Catanic · `catanic`
**Look:** grand romantic epic on an ocean liner, golden sunset and deep blue sea; de boeg ("king of the world"), een blauw hartvormig juweel, een ijsberg in de verte

**Poster (2:3):**
```
Do not copy the pose or lighting from the reference photos: create a new pose that fits this scene. A real photograph, like a still from a grand live-action romantic epic, taken on the deck of a huge early-1900s ocean liner at golden hour. The camera stands on the deck just behind the bow, low and slightly to the side. The cat is a normal-sized house cat, small compared to the ship: he stands on the white railing at the very tip of the bow, seen from behind and in three-quarter profile, chest out, head raised into the wind, fur blowing, like the king of the world. A thick rope coil and a brass ship's bell next to him show his real size. Around his neck a delicate chain with a blue heart-shaped diamond pendant that catches the sunlight. Ahead of him a warm golden sunset over an endless ocean. The polished wooden deck fills the calm lower third.
```
**Breed (16:9):**
```
A real photograph, like a still from a grand live-action romantic epic: the bow of a huge early-1900s ocean liner at golden sunset, polished wooden deck, white railings, ropes and a bell. Far away on the left horizon a pale iceberg glows in the last sunlight. On the right side of the frame the cat sits dreamily on a folded blanket on a wooden deck chair, the blue heart-shaped diamond pendant around his neck catching the light, gazing out over the sea with the wind in his fur. Warm golden and cold blue tones, calmer sky and sea on the left.
```

## Pride & Purrjudice · `pride`
**Look:** Regency-era period romance in a real English country house, soft pastel light, gentle haze; een zonnestraal op de zetel, een mistig veld bij zonsopgang

**Poster (2:3):**
```
Do not copy the pose or lighting from the reference photos: create a new pose that fits this scene. A real photograph, like a still from a live-action Regency-era period romance filmed in a real English country house. An elegant drawing room with pale green walls, tall sash windows and gauzy curtains; outside a misty green countryside at dawn. The cat, a normal-sized house cat, lies gracefully on a cream velvet chaise longue by the window, bathed in a single soft beam of morning sunlight, head raised with a proud, slightly haughty expression. A small vase of wildflowers and an old leather-bound book on a side table. Soft, dreamy pastel light, gentle haze, calm lower third with the pale wooden floor and the hem of the chaise.
```
**Breed (16:9):**
```
A real photograph, like a still from a live-action Regency-era period romance: a misty English meadow at dawn, tall dewy grass glowing in the first golden light, an old stone manor house faintly visible through the mist on the left. On the right side of the frame the cat, a normal-sized house cat, walks slowly through the tall wet grass towards the camera with a proud, determined gaze, dew on his fur. Soft pastel sunrise light, gentle haze, calmer misty area on the left.
```

## Purrstellar · `purrstellar`
**Look:** live-action sci-fi op een echte set, amber en diep zwart; cockpit met zwart gat, stoffige boerderij, stof in lijnen op de vloer, een gloeiend kattenluik

**Poster (2:3):**
```
Do not copy the pose or lighting from the reference photos: create a new pose that fits this scene. A real photograph, like a still from a live-action science-fiction film shot on a practical spaceship set. The cat, a normal-sized house cat, sits upright on a worn pilot seat inside a cramped, realistic spacecraft cockpit full of switches, cables and scratched metal panels, gazing up in awe through a large front window. Outside the window an enormous black hole with a glowing golden ring of light fills the view, its warm light falling across his face and fur. Dark cockpit console in the calm lower third. Muted amber and deep black tones, realistic reflections on the glass.
```
**Breed (16:9):**
```
A real photograph, like a still from a live-action science-fiction film: an old dusty farmhouse room at dusk, a huge dust storm rolling over the cornfields visible through the window on the left. Fine dust has fallen on the wooden floor in strange straight lines, like a coded message. A tall bookshelf stands against the wall with a few books pushed out as if by an invisible hand. On the right side of the frame the cat, a normal-sized house cat, sits beside the back door and stares intently at the cat flap, which glows with a strange soft golden light from the other side. Warm amber dusk light, floating dust in the air, calmer darker area on the left.
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
