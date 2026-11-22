"""
Membuat pustaka musik awal Ruang Cerita: 8 instrumen ORISINAL hasil sintesis (tanpa sampel, tanpa hak cipta).
Tiap lagu adalah loop 8 birama yang menyambung mulus. Hasil: public/music/*.wav + public/music/catalog.json

Jalankan ulang:  python scripts/gen-music.py
Untuk memakai lagu asli (berlisensi): taruh file audio di public/music/ lalu tambahkan entri di catalog.json
(id, title, artist, file, duration, colors, featured).
"""
import json
import os
import wave

import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'music')
CHORDS = {'maj': [0, 4, 7], 'min': [0, 3, 7], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], 'dom7': [0, 4, 7, 10]}
PENTA = [0, 2, 4, 7, 9]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def adsr(n, a, d, s, r):
    a, d, r = max(1, int(a * SR)), int(d * SR), max(1, int(r * SR))
    env = np.ones(n) * s
    a = min(a, n)
    env[:a] = np.linspace(0, 1, a)
    d = min(d, max(0, n - a))
    if d:
        env[a:a + d] = np.linspace(1, s, d)
    r = min(r, n)
    env[n - r:] *= np.linspace(1, 0, r)
    return env


def tone(freq, dur, harm, a=.01, d=.1, s=.7, r=.1, detune=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for i, h in enumerate(harm, start=1):
        sig += h * np.sin(2 * np.pi * freq * i * t)
        if detune:
            sig += .5 * h * np.sin(2 * np.pi * freq * (1 + detune) * i * t)
    return sig * adsr(n, a, d, s, r)


def add(buf, sig, start, gain=1.0):
    s = int(start * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[:e - s] * gain


def kick():
    n = int(.28 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 18) + 42
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)


def snare(rng):
    n = int(.2 * SR)
    t = np.arange(n) / SR
    return (rng.standard_normal(n) * .6 + np.sin(2 * np.pi * 190 * t) * .5) * np.exp(-t * 22)


def hat(rng, open_=False):
    n = int((.18 if open_ else .05) * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    noise = noise - np.concatenate(([0], noise[:-1])) * .9     # tapis sederhana: buang bunyi rendah
    return noise * np.exp(-t * (14 if open_ else 70)) * .5


def render(spec, seed):
    rng = np.random.default_rng(seed)
    bpm, root, prog, style = spec['bpm'], spec['root'], spec['prog'], spec['style']
    beat = 60.0 / bpm
    bar = beat * 4
    bars = 8
    tail = 1.6
    buf = np.zeros(int((bar * bars + tail) * SR))
    lead_note = rng.integers(0, len(PENTA))
    for b in range(bars):
        off, kind = prog[b % len(prog)]
        base = root + off
        tones = [base + i for i in CHORDS[kind]]
        t0 = b * bar
        # pad
        for n in tones:
            add(buf, tone(midi(n + 12), bar + .4, [1, .3, .12], a=.25, d=.4, s=.7, r=.5, detune=.004), t0, .07)
        # bass
        bass = base - 24
        steps = [0, 1.5, 2, 3] if style != 'none' else [0]
        for st in steps:
            add(buf, tone(midi(bass), beat * (.9 if style != 'none' else 3.8), [1, .35], a=.01, d=.15, s=.5, r=.12), t0 + st * beat, .3)
        # arpeggio
        if spec.get('arp'):
            for i in range(8):
                n = tones[(i * (2 if i % 3 else 1)) % len(tones)] + 12 * (1 + (i % 2 == 1 and spec.get('arp') == 'wide'))
                add(buf, tone(midi(n + 12), beat * .6, [1, .5, .22, .1], a=.004, d=.2, s=.15, r=.2), t0 + i * beat / 2, .1)
        # melodi
        if spec.get('lead'):
            pos = 0.0
            while pos < 4:
                step = rng.choice([-2, -1, 0, 1, 2], p=[.2, .25, .1, .25, .2])
                lead_note = int(np.clip(lead_note + step, 0, len(PENTA) * 2 - 1))
                n = root + 12 + PENTA[lead_note % len(PENTA)] + 12 * (lead_note // len(PENTA)) + 12
                ln = rng.choice([.5, 1, 1.5])
                if rng.random() < .8:
                    add(buf, tone(midi(n), beat * ln * .95, [1, .4, .15], a=.02, d=.2, s=.5, r=.18), t0 + pos * beat, .12)
                pos += ln
        # drum
        if style in ('pop', 'lofi', 'chill'):
            if style == 'pop':
                kicks, snares, hats = [0, 1, 2, 3], [1, 3], [i + .5 for i in range(4)]
            elif style == 'lofi':
                kicks, snares, hats = [0, 2.5], [1, 3], [i * .5 for i in range(8)]
            else:
                kicks, snares, hats = [0, 2], [3], [1, 3]
            for k in kicks:
                add(buf, kick(), t0 + k * beat, .55)
            for s in snares:
                add(buf, snare(rng), t0 + s * beat, .22 if style != 'pop' else .3)
            for h in hats:
                sw = (.06 * beat if style == 'lofi' and (h * 2) % 2 == 1 else 0)
                add(buf, hat(rng, False), t0 + h * beat + sw, .12)
    # lipat ekor ke awal agar loop menyambung tanpa klik
    n = int(bar * bars * SR)
    body, rest = buf[:n].copy(), buf[n:]
    body[:len(rest)] += rest
    # gema ringan
    d = int(.27 * SR)
    echo = np.roll(body, d) * .28 + np.roll(body, d * 2) * .12
    body = body + echo
    body = np.tanh(body * 1.4) / 1.4
    body = body / (np.max(np.abs(body)) + 1e-9) * .72
    return body


TRACKS = [
    dict(id='pagi-ceria', title='Pagi Ceria', bpm=108, root=60, style='pop', arp=True, lead=True, featured=True, colors=['#fdba74', '#f97316'],
         prog=[(0, 'maj'), (7, 'maj'), (9, 'min'), (5, 'maj')]),
    dict(id='semangat-pikr', title='Semangat PIK-R', bpm=120, root=62, style='pop', arp='wide', lead=True, featured=True, colors=['#fb923c', '#e11d48'],
         prog=[(0, 'maj'), (7, 'maj'), (11 - 12, 'min'), (5 - 12, 'maj')]),
    dict(id='langkah-santai', title='Langkah Santai', bpm=82, root=53, style='lofi', arp=True, lead=True, featured=True, colors=['#fde68a', '#f59e0b'],
         prog=[(0, 'maj7'), (9, 'm7'), (2, 'm7'), (7, 'dom7')]),
    dict(id='senja-di-kota', title='Senja di Kota', bpm=92, root=57, style='lofi', arp=False, lead=True, featured=True, colors=['#c084fc', '#7c3aed'],
         prog=[(0, 'min'), (-4, 'maj'), (3, 'maj'), (-2, 'maj')]),
    dict(id='petualangan', title='Petualangan', bpm=128, root=55, style='pop', arp='wide', lead=True, colors=['#34d399', '#0d9488'],
         prog=[(0, 'maj'), (7, 'maj'), (9, 'min'), (5, 'maj')]),
    dict(id='hujan-sore', title='Hujan Sore', bpm=70, root=52, style='chill', arp=True, lead=False, colors=['#60a5fa', '#6366f1'],
         prog=[(0, 'm7'), (-4, 'maj7'), (3, 'maj'), (-2, 'maj')]),
    dict(id='tenang', title='Tenang', bpm=64, root=60, style='none', arp=True, lead=False, colors=['#a7f3d0', '#14b8a6'],
         prog=[(0, 'maj7'), (9, 'm7'), (5, 'maj7'), (7, 'dom7')]),
    dict(id='gelombang', title='Gelombang', bpm=98, root=58, style='chill', arp=False, lead=True, colors=['#93c5fd', '#2563eb'],
         prog=[(0, 'maj'), (-3, 'min'), (-7, 'maj'), (-5, 'maj')]),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    catalog = []
    for i, spec in enumerate(TRACKS):
        sig = render(spec, 100 + i)
        pcm = (sig * 32767).astype('<i2')
        path = os.path.join(OUT, spec['id'] + '.wav')
        with wave.open(path, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        dur = round(len(sig) / SR, 1)
        catalog.append(dict(id=spec['id'], title=spec['title'], artist='PIK-R Studio', file=f"music/{spec['id']}.wav", duration=dur,
                            colors=spec['colors'], featured=bool(spec.get('featured'))))
        print(f"{spec['id']:16s} {dur:5.1f}s  {os.path.getsize(path) / 1024 / 1024:.2f} MB")
    with open(os.path.join(OUT, 'catalog.json'), 'w', encoding='utf-8') as f:
        json.dump({'tracks': catalog}, f, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
