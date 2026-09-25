#!/usr/bin/env python3
"""Maakt per scène een .txt en een .mp3 (via edge-tts) uit episode.json.

Gebruik:
    pip install edge-tts
    python3 tools/maak_audio.py series/rookie/ep1
    python3 tools/maak_audio.py series/rookie/ep1 --alleen s01,s11a
    python3 tools/maak_audio.py series/rookie/ep1 --opnieuw        # alles opnieuw
    python3 tools/maak_audio.py series/rookie/ep1 --enkel-txt      # geen mp3's

Stem, snelheid en toonhoogte komen uit "voice" in episode.json (of per scène),
anders uit de standaardwaarden hieronder. Een scène kan ook een apart "tts"-veld
hebben als de uitspraak anders moet dan de ondertitel (bv. "Tien uur twaalf").

Een mp3 wordt enkel opnieuw gemaakt als de tekst of stem veranderde
(of met --opnieuw). Tekst tussen [vierkante haken] is een placeholder:
die wordt niet uitgesproken en je krijgt een waarschuwing.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

DEFAULT_VOICE = {"voice": "nl-BE-ArnaudNeural", "rate": "-10%", "pitch": "-5Hz"}


def spoken_text(scene):
    text = scene.get("tts") or scene.get("text") or ""
    placeholders = re.findall(r"\[[^\]]*\]", text)
    text = re.sub(r"\[[^\]]*\]", "", text)
    return re.sub(r"\s+", " ", text).strip(), placeholders


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("map", help="map van de aflevering (met episode.json), bv. series/rookie/ep1")
    ap.add_argument("--alleen", help="enkel deze scène-ID's, komma-gescheiden")
    ap.add_argument("--opnieuw", action="store_true", help="ook bestaande mp3's opnieuw maken")
    ap.add_argument("--enkel-txt", action="store_true", help="enkel .txt-bestanden schrijven")
    ap.add_argument("--voice", help="stem overschrijven, bv. nl-BE-DenaNeural")
    args = ap.parse_args()

    folder = Path(args.map)
    if folder.is_file():
        folder = folder.parent
    ep_file = folder / "episode.json"
    if not ep_file.exists():
        sys.exit(f"Geen episode.json gevonden in {folder}")
    ep = json.loads(ep_file.read_text(encoding="utf-8"))
    only = set(args.alleen.split(",")) if args.alleen else None
    base_voice = {**DEFAULT_VOICE, **ep.get("voice", {})}

    made = skipped = 0
    for sid, scene in ep.get("scenes", {}).items():
        if only and sid not in only:
            continue
        text, placeholders = spoken_text(scene)
        if placeholders:
            print(f"  ⚠ {sid}: placeholder niet uitgesproken: {' '.join(placeholders)}")
        if not text:
            print(f"  – {sid}: geen tekst, overgeslagen")
            continue

        voice = {**base_voice, **scene.get("voice", {})}
        if args.voice:
            voice["voice"] = args.voice
        # De txt bevat enkel de uit te spreken tekst; de gebruikte stem houden we bij
        # in een verborgen .stem-bestand, zodat een stemwissel ook een nieuwe mp3 geeft.
        txt = folder / f"{sid}.txt"
        stamp = folder / f".{sid}.stem"
        mp3 = folder / f"{scene.get('audio', sid + '.mp3')}"
        signature = f"{voice['voice']}|{voice['rate']}|{voice['pitch']}"

        unchanged = (
            txt.exists() and txt.read_text(encoding="utf-8") == text
            and stamp.exists() and stamp.read_text(encoding="utf-8") == signature
        )
        txt.write_text(text, encoding="utf-8")
        if args.enkel_txt:
            continue
        if mp3.exists() and mp3.stat().st_size > 0 and unchanged and not args.opnieuw:
            skipped += 1
            continue

        cmd = [
            sys.executable, "-m", "edge_tts",
            "--voice", voice["voice"],
            f"--rate={voice['rate']}",
            f"--pitch={voice['pitch']}",
            "--file", str(txt),
            "--write-media", str(mp3),
        ]
        print(f"  ♪ {sid}: {text[:60]}{'…' if len(text) > 60 else ''}")
        try:
            subprocess.run(cmd, check=True)
        except FileNotFoundError:
            sys.exit("edge-tts niet gevonden. Installeer met: pip install edge-tts")
        except subprocess.CalledProcessError as e:
            mp3.unlink(missing_ok=True)  # geen leeg/half bestand laten staan
            sys.exit(f"edge-tts faalde voor {sid} (code {e.returncode}). Is edge-tts geïnstalleerd en ben je online?")
        stamp.write_text(signature, encoding="utf-8")
        made += 1

    if args.enkel_txt:
        print(f"Klaar: .txt-bestanden geschreven in {folder}")
    else:
        print(f"Klaar: {made} mp3('s) gemaakt, {skipped} ongewijzigd overgeslagen.")


if __name__ == "__main__":
    main()
