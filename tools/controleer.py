#!/usr/bin/env python3
"""Controleert alle series en afleveringen op fouten, zodat je een nieuwe
aflevering kunt toevoegen zonder de site te breken.

Gebruik:
    python3 tools/controleer.py

Controleert: geldige JSON, bestaande startscène, alle "next"-verwijzingen,
keuzes, onbereikbare scènes, doodlopende scènes en ontbrekende beelden/audio.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors = 0
warnings = 0


def err(msg):
    global errors
    errors += 1
    print(f"  ✗ {msg}")


def warn(msg):
    global warnings
    warnings += 1
    print(f"  ! {msg}")


def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        err(f"{path.relative_to(ROOT)} ontbreekt")
    except json.JSONDecodeError as e:
        err(f"{path.relative_to(ROOT)}: ongeldige JSON (regel {e.lineno}, kolom {e.colno}): {e.msg}")
    return None


def check_episode(folder):
    ep = load(folder / "episode.json")
    if not ep:
        return
    scenes = ep.get("scenes") or {}
    if not scenes:
        err("geen scènes")
        return
    start = ep.get("start")
    if start not in scenes:
        err(f'startscène "{start}" bestaat niet')

    def targets(sc):
        t = [sc["next"]] if sc.get("next") else []
        ch = sc.get("choice")
        if ch:
            opts = ch.get("options") or []
            if len(opts) < 2:
                warn("keuze met minder dan 2 opties")
            t += [o.get("next") for o in opts]
        return t

    for sid, sc in scenes.items():
        if not sc.get("text"):
            warn(f"{sid}: geen tekst")
        for t in targets(sc):
            if not t:
                err(f"{sid}: keuze-optie zonder \"next\"")
            elif t not in scenes:
                err(f'{sid}: verwijst naar "{t}", maar die scène bestaat niet')
        ch = sc.get("choice")
        if ch:
            d = ch.get("default", 0)
            if not isinstance(d, int) or not 0 <= d < len(ch.get("options") or []):
                err(f"{sid}: default {d} is geen geldige optie")
            for o in ch.get("options") or []:
                if not o.get("label"):
                    err(f"{sid}: optie zonder label")
            if sc.get("next"):
                warn(f'{sid}: heeft zowel "choice" als "next" (next wordt genegeerd)')

    # bereikbaarheid
    seen, stack = set(), [start] if start in scenes else []
    while stack:
        s = stack.pop()
        if s in seen or s not in scenes:
            continue
        seen.add(s)
        stack += targets(scenes[s])
    for sid in scenes:
        if sid not in seen:
            warn(f"{sid}: onbereikbaar vanaf de start")

    endings = [sid for sid, sc in scenes.items() if sc.get("ending")]
    finals = [sid for sid, sc in scenes.items() if not targets(sc)]
    print(f"  {len(scenes)} scènes, {sum(1 for s in scenes.values() if s.get('choice'))} keuzes, "
          f"{len(endings)} eindes, laatste scène(s): {', '.join(finals) or '—'}")

    missing_img = [sid for sid, sc in scenes.items() if not (folder / sc.get("image", f"{sid}.jpg")).exists()]
    missing_mp3 = [sid for sid, sc in scenes.items() if not (folder / sc.get("audio", f"{sid}.mp3")).exists()]
    if missing_img:
        print(f"  · beelden nog te maken ({len(missing_img)}): {', '.join(missing_img)}")
    if missing_mp3:
        print(f"  · audio nog te maken ({len(missing_mp3)}): {', '.join(missing_mp3)}")


def main():
    site = load(ROOT / "site.json")
    if not site:
        sys.exit(1)
    for sid in site.get("series", []):
        folder = ROOT / "series" / sid
        print(f"\n▶ {sid}")
        s = load(folder / "series.json")
        if not s:
            continue
        ids = [e.get("id") for e in s.get("episodes", [])]
        if len(ids) != len(set(ids)):
            err("dubbele aflevering-ID's")
        for e in s.get("episodes", []):
            if e.get("soon"):
                print(f"  {e.get('id')}: binnenkort")
                continue
            print(f"  {e.get('id')}: {e.get('title')}")
            check_episode(folder / e["id"])
        if s.get("teaser") and s["teaser"] not in site.get("series", []):
            err(f'teaser "{s["teaser"]}" is geen bekende serie')
    for key in ("top10", "new"):
        for sid in site.get(key, []):
            if sid not in site.get("series", []):
                err(f'site.json {key}: onbekende serie "{sid}"')
    print(f"\n{errors} fout(en), {warnings} waarschuwing(en).")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
