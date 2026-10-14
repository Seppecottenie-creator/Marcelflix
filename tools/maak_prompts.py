#!/usr/bin/env python3
"""
Marcelflix: maak een lijst met kant-en-klare beeldprompts voor een aflevering.

Gebruik:
    python tools/maak_prompts.py series/rookie/ep1

Schrijft PROMPTS.md in de map van de aflevering, met per scène de volledige prompt
(scène + vaste stijlzin) en de bestandsnaam waaronder je het beeld moet opslaan.
Scènes waarvan het beeld al bestaat, worden aangevinkt.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) < 2:
        sys.exit("Gebruik: python tools/maak_prompts.py series/rookie/ep1")
    ep_dir = (ROOT / sys.argv[1]).resolve()
    data = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    style = data.get("style", "")
    lines = [
        f"# Beeldprompts: {data.get('series', '')} · {data['title']}",
        "",
        data.get("refNote", "Voeg bij elke prompt een referentiefoto van Marcel toe.") + " Formaat 16:9 liggend, minstens 1920 x 1080.",
        "Sla elk beeld op in deze map met de bestandsnaam hieronder (.jpg, .png of .webp).",
        "",
    ]
    done = 0
    total = 0
    split = lambda t: [x.strip() for x in re.findall(r'[^.!?…]+[.!?…]+["”’)]*|[^.!?…]+$', t) if x.strip()]
    for sid, sc in data["scenes"].items():
        if sc.get("shots"):
            # Scène met meerdere beelden: één prompt per shot, met de zinnen die erbij horen
            sents = split(sc["text"])
            lines += [f"# Scène {sid}", ""]
            for i, sh in enumerate(sc["shots"]):
                end = sc["shots"][i + 1]["at"] if i + 1 < len(sc["shots"]) else len(sents)
                exists = any((ep_dir / f"{sh['id']}.{x}").exists() for x in ("jpg", "png", "webp", "jpeg"))
                done += exists
                total += 1
                lines += [
                    f"## {'[x]' if exists else '[ ]'} {sh['id']}.jpg",
                    "",
                    "```",
                    f"{sh['prompt'].strip().rstrip('.')}. {style}",
                    "```",
                    "",
                    f"_Marcel zegt:_ {' '.join(sents[sh['at']:end])}",
                    "",
                ]
            continue
        if sc.get("image"):
            continue
        total += 1
        exists = any((ep_dir / f"{sid}.{x}").exists() for x in ("jpg", "png", "webp", "jpeg"))
        done += exists
        lines += [
            f"## {'[x]' if exists else '[ ]'} {sid}.jpg",
            "",
            "```",
            f"{sc['prompt'].strip().rstrip('.')}. {style}",
            "```",
            "",
            f"_Marcel zegt:_ {sc['text']}",
            "",
        ]
    (ep_dir / "PROMPTS.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"PROMPTS.md geschreven in {ep_dir.relative_to(ROOT)}  ({done}/{total} beelden klaar)")


if __name__ == "__main__":
    main()
