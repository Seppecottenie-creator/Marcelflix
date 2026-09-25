#!/usr/bin/env python3
"""
Marcelflix: genereer Marcels vertelstem voor een aflevering met Edge TTS (gratis).

Eenmalig installeren:
    pip install edge-tts

Gebruik (vanuit de hoofdmap van het project):
    python tools/genereer_audio.py series/rookie/ep1
    python tools/genereer_audio.py series/rookie/ep1 --scene s03          # één scène opnieuw
    python tools/genereer_audio.py series/rookie/ep1 --force              # alles overschrijven
    python tools/genereer_audio.py series/rookie/ep1 --rate=-15% --pitch=-8Hz
    python tools/genereer_audio.py --stemmen                              # toon Vlaamse/Nederlandse stemmen

Standaardinstellingen komen uit data/config.json ("voice").
Bestaande mp3's worden overgeslagen, zodat je veilig opnieuw kunt draaien.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

try:
    import edge_tts
except ImportError:
    sys.exit("edge-tts ontbreekt. Installeer met:  pip install edge-tts")


def load_voice_defaults():
    try:
        cfg = json.loads((ROOT / "data" / "config.json").read_text(encoding="utf-8"))
        return cfg.get("voice", {})
    except Exception:
        return {}


async def list_voices():
    voices = await edge_tts.list_voices()
    for v in voices:
        if v["Locale"].startswith("nl-"):
            print(f'{v["ShortName"]:28} {v["Gender"]:7} {v["Locale"]}')


async def synth(text, out, voice, rate, pitch):
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(str(out))


async def main():
    d = load_voice_defaults()
    ap = argparse.ArgumentParser(description="Genereer vertelstem per scène")
    ap.add_argument("episode", nargs="?", help="map van de aflevering, bv. series/rookie/ep1")
    ap.add_argument("--voice", default=d.get("name", "nl-BE-ArnaudNeural"))
    ap.add_argument("--rate", default=d.get("rate", "-10%"))
    ap.add_argument("--pitch", default=d.get("pitch", "-5Hz"))
    ap.add_argument("--scene", help="alleen deze scène")
    ap.add_argument("--force", action="store_true", help="bestaande mp3's overschrijven")
    ap.add_argument("--stemmen", action="store_true", help="toon beschikbare Nederlandstalige stemmen")
    a = ap.parse_args()

    if a.stemmen:
        await list_voices()
        return
    if not a.episode:
        ap.error("geef de map van een aflevering op, bv. series/rookie/ep1")

    ep_dir = (ROOT / a.episode).resolve() if not Path(a.episode).is_absolute() else Path(a.episode)
    data = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    scenes = data["scenes"]
    ids = [a.scene] if a.scene else list(scenes.keys())

    print(f"Stem: {a.voice}  snelheid {a.rate}  toonhoogte {a.pitch}")
    made = skipped = 0
    for sid in ids:
        sc = scenes.get(sid)
        if not sc:
            print(f"  ! scène {sid} bestaat niet")
            continue
        out = ep_dir / (sc.get("audio") or f"{sid}.mp3")
        if out.exists() and not a.force:
            skipped += 1
            continue
        text = sc["text"]
        # tekst ook bewaren, handig om te vergelijken of zelf in te spreken
        (ep_dir / f"{sid}.txt").write_text(text, encoding="utf-8")
        print(f"  ▶ {sid}: {text[:60]}{'…' if len(text) > 60 else ''}")
        try:
            await synth(text, out, a.voice, a.rate, a.pitch)
            made += 1
        except Exception as e:
            print(f"    ! mislukt: {e}")
    print(f"\nKlaar: {made} nieuw, {skipped} overgeslagen (bestonden al). Gebruik --force om te overschrijven.")


if __name__ == "__main__":
    asyncio.run(main())
