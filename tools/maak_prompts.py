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
        "Voeg bij elke prompt een referentiefoto van Marcel toe. Formaat 16:9 liggend, minstens 1920 x 1080.",
        "Sla elk beeld op in deze map met de bestandsnaam hieronder (.jpg, .png of .webp).",
        "",
    ]
    done = 0
    for sid, sc in data["scenes"].items():
        if sc.get("image"):
            continue
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
    total = sum(1 for s in data["scenes"].values() if not s.get("image"))
    print(f"PROMPTS.md geschreven in {ep_dir.relative_to(ROOT)}  ({done}/{total} beelden klaar)")


if __name__ == "__main__":
    main()
