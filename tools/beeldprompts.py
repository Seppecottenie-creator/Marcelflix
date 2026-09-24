#!/usr/bin/env python3
"""Schrijft beeldprompts.md in de map van een aflevering: per scène de volledige
prompt (scèneprompt + stijlzin) en of het beeld al bestaat.

Gebruik:
    python3 tools/beeldprompts.py series/rookie/ep1
"""
import json
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    folder = Path(sys.argv[1])
    if folder.is_file():
        folder = folder.parent
    ep = json.loads((folder / "episode.json").read_text(encoding="utf-8"))
    style = ep.get("style", "").strip()
    lines = [f"# Beeldprompts: {ep.get('title', folder.name)}", ""]
    if style:
        lines += [f"Stijlzin (achter elke prompt): *{style}*", ""]
    todo = 0
    for sid, sc in ep.get("scenes", {}).items():
        image = sc.get("image", f"{sid}.jpg")
        exists = (folder / image).exists()
        todo += not exists
        prompt = sc.get("prompt", "").strip()
        full = f"{prompt.rstrip('.')}. {style}" if style else prompt
        lines += [
            f"## {sid} → `{image}` {'✅' if exists else '⬜'}",
            "",
            "```",
            full,
            "```",
        ]
        if sc.get("note"):
            lines.append(f"> {sc['note']}")
        lines.append("")
    out = folder / "beeldprompts.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"{out} geschreven ({todo} beeld(en) nog te maken).")


if __name__ == "__main__":
    main()
