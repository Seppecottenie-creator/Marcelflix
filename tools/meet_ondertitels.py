#!/usr/bin/env python3
"""
Marcelflix: meet in elke mp3 waar de zinnen beginnen en bewaar dat als "cues" in episode.json,
zodat de ondertitels exact meelopen met de stem (ook als die in een andere taal is).

Eenmalig installeren:
    pip install av numpy

Gebruik (vanuit de hoofdmap):
    python tools/meet_ondertitels.py series/rookie/ep1

Werkt met de gesproken tekst ("narration", anders "text"): het script zoekt de pauzes in de audio
die het best passen bij de zinsgrenzen. Klopt één zin toch niet, pas dan de getallen in "cues" met de hand aan.
"""
import json, re, sys
from pathlib import Path
import av, numpy as np

def envelope(path, hop=0.01):
    c = av.open(str(path)); parts = []
    for fr in c.decode(audio=0):
        x = fr.to_ndarray().astype(np.float32)
        parts.append(x.mean(axis=0) if x.ndim > 1 else x)
    x = np.concatenate(parts); sr = c.streams.audio[0].rate; n = int(sr * hop); m = len(x) // n
    return np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)), hop

def pauses(path, min_len=0.18):
    r, hop = envelope(path); db = 20 * np.log10(r + 1e-9); sil = db < db.max() - 38
    out, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            if (j - i) * hop >= min_len: out.append((i * hop, j * hop))
            i = j
        else: i += 1
    sp = np.where(~sil)[0]
    return out, sp[0] * hop, (sp[-1] + 1) * hop

def split(t):
    return [s.strip() for s in re.findall(r'[^.!?…]+[.!?…]+["”’)]*|[^.!?…]+$', t) if s.strip()]

def cues_for(mp3, spoken):
    sent = split(spoken); N = len(sent)
    if N < 2: return [0.0]
    ps, s0, s1 = pauses(mp3); ps = [q for q in ps if s0 < q[0] < s1]
    vt, acc, last = [], 0, s0          # positie van elke pauze in pure spreektijd
    for a, b in ps: acc += a - last; vt.append(acc); last = b
    voiced = acc + (s1 - last)
    w = [len(re.sub(r'[^\w]', '', x)) for x in sent]; tot = sum(w); acc = 0; exp = []
    for x in w[:-1]: acc += x; exp.append(voiced * acc / tot)
    P = len(ps)
    if P < N - 1: return None
    cost = lambda i, j: ((vt[j] - exp[i]) / 0.8) ** 2 - 1.5 * (ps[j][1] - ps[j][0])
    INF = 1e18; best = [[INF] * P for _ in range(N - 1)]; prev = [[-1] * P for _ in range(N - 1)]
    for j in range(P): best[0][j] = cost(0, j)
    for i in range(1, N - 1):
        m, mj = INF, -1
        for j in range(P):
            if j > 0 and best[i - 1][j - 1] < m: m, mj = best[i - 1][j - 1], j - 1
            if mj >= 0: best[i][j] = m + cost(i, j); prev[i][j] = mj
    j = min(range(P), key=lambda j: best[N - 2][j]); ch = []
    for i in range(N - 2, -1, -1): ch.append(j); j = prev[i][j]
    return [0.0] + [round(max(0, ps[j][1] - 0.15), 2) for j in ch[::-1]]

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    ep = Path(sys.argv[1]); f = ep / "episode.json"
    d = json.loads(f.read_text(encoding="utf-8"))
    for sid, sc in d["scenes"].items():
        mp3 = ep / (sc.get("audio") or f"{sid}.mp3")
        if not mp3.exists(): print(f"  - {sid}: geen mp3"); continue
        c = cues_for(mp3, sc.get("narration") or sc["text"])
        if c: sc["cues"] = c; print(f"  ✓ {sid}: {c}")
        else: print(f"  ! {sid}: te weinig pauzes gevonden, ondertitels lopen op schatting")
    f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
