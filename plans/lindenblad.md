# Lindenblad Antenna

status: planning (draft 2)

Lindenblad = new default antenna of the tool + web page. QFH = legacy (weak horizon gain), kept working.

Omni, CP, horizon-heavy antenna for HAM LEO sats. Zenith null accepted.
Bands, sat tables, install, match box: same as [qfh.md](./qfh.md) (QFH work kept as is, separate).

| band | design band       | center |
|------|-------------------|--------|
| 2m   | 144.3 – 146.0 MHz | ~145.6 |
| 70cm | 432.1 – 438.0 MHz | ~435.5 |

## Design options

1. **Parasitic Lindenblad (AA2TX) — MVP, 2m + 70cm**
   central vertical driven dipole + N parasitic tilted elements (N = 3, 4, 5; classic 4)
2. Classic: 4 × λ/2 folded dipoles, 4 × λ/2 300 Ω twin-lead (China, VF measure) → hub → match
3. EZ-Lindenblad (AA2TX): 4 × tube dipoles, 4 × 0.374 λ 75 Ω coax (SWR 2.7 trick → 200 Ω ‖ 4 = 50 Ω)

Options 2, 3: post-MVP, same tool (variant param).

## Reference: AA2TX Parasitic 70cm (AMSAT Proc. 2006, `ref/70ParaLindy.pdf`)

| item | inch | mm | note |
|------|------|----|------|
| driven dipole overall | 12-3/8 | 314.3 | 2 × 6-1/16" (154 mm) + 1/4" gap (6.35) |
| driven tube OD | 3/4 | 19.05 | Al 17 ga |
| parasitic length | 11.75 | 298.5 | #8 AWG Al wire Ø3.26 (or 1/8" tube) |
| parasitic radius (axis → wire) | 4-1/16 | 103.2 | 0.15 λ |
| parasitic tilt | 30° | | sense **inverted** vs classic Lindy for RHCP |

- driven ≈ 32 Ω at resonance (coupling); lengthened +3/4" (19 mm) → inductive; with ~4 pF feed stray C = L-match → 50 Ω
- parasitic tuned so induced current ~180° vs driven: cancels half vertical E → V/H equal, quadrature
- tilt sense: "looking toward hub, left side up" → RHCP (classic Lindy: right side up = RHCP).
  amsat-bb 2019: common NEC mistake = LHCP. → verify sign in NEC like QFH twist.
- balun: 2 × Fair-Rite 2643540002 ferrite on coax at bottom of dipole; coax runs down axis
  (our design: no ferrite, sleeve feed, see Feed)
- EZNEC: 7.47 dBic @ 3° elev (10 ft above real ground), azimuth ripple < 0.1 dB
- measured SWR < 1.5 over 426–446 MHz; 50 W key-down 9.5 min OK, 100 W → ferrites warm

2m: no AA2TX parasitic original. Start = 70cm × (436/145.6 ≈ 2.995), then retune in NEC
(driven Ø 57 mm impractical → 20–25 mm Al tube; parasitic Ø ~8–10 mm Al tube; r ≈ 309 mm).
Cross-check: holl_ands 4nec2 2m parasitic model (imageevent), 5b4az `2m_Lindenblad.nec` (classic).

## Install

- same as QFH: 1.0 m metal mast + 0.5 m PVC, >1.5 m above wood roof, poor ground at roof level
- box under antenna (match + LPF/HPF, see qfh.md Match box)
- no 2m↔70cm coupling modeling
- stack: driven dipole → 3D printed adapter → PVC section (length = param, ≥ λ/2 target,
  2m ≈ 1 m) → 3D printed adapter → metal mast
- driven dipole collinear with metal mast + coax down axis → model mast as wire, sweep PVC length

## Feed (no balun parts)

Coax fished through bottom half of driven dipole = coaxial sleeve dipole (AF6SA style):

- bottom tube = sleeve; coax shield bonded to bottom tube at TOP (feed gap), center → top tube
- bottom end of sleeve open, coax centered (printed spacers) → inside of sleeve + coax shield =
  λ/4 stub shorted at top → high Z at sleeve mouth → chokes common-mode current (built-in balun)
- stub electrical length shortened by coax jacket dielectric → sleeve length ≠ radiator optimum;
  AF6SA tunes by trimming sleeve only. Stub Z0 = 60·ln(ID_tube / OD_coax) → bigger ratio = better choke
- coax: thin (RG-58 / RG-316 / LMR-240) inside 2m ~20–25 mm tube, 70cm ~16–19 mm tube
- NEC: cannot model coax inside tube → model outer surfaces only; choke as ideal (no wire below
  sleeve) vs finite (mast wire + LD series Z at sleeve mouth); verify with VNA

## Match

Driven ≈ 32 Ω (coupling). Candidates (compare in NEC + box optimizer):

- a) AA2TX: lengthen driven (+X) + feed stray C → L-match 50 Ω at antenna (stray C modeled later)
- c) none at antenna: 32 Ω → coax → box under antenna does match + filter (SWR ~1.6 on short run)

Default: c) (box exists anyway), a) as option if box-less build wanted.

## Materials

- elements: Al tube (driven + parasitic); OD param in 1 mm steps (+ wall), no fixed size table
- arms: PVC pipe (hub → parasitic), size sets as QFH
- 3D printed parts, natural (uncolored) PETG / ASA / PC (natural = no RF-lossy pigments):
  - hub: driven center insulator (gap) + N arm sockets
  - adjustable parasitic adapter on arm end: slides along arm (radius), rotates (tilt,
    detents / scale), optional z offset → tune passives on real antenna, then lock
  - mast adapters: dipole ↔ PVC, PVC ↔ metal mast
  - coax centering spacers inside sleeve
- CAD: Replicad (OpenCascade WASM, JS) — params from calculator → STL / STEP, in CLI + web page
- coax: RG-58 / LMR-240 class through ferrites; N connector at box

## Software

### Refactor (shared core, QFH behavior unchanged, tests stay green)

- `lib/geom.js`: vec ops, len, fillet, polyline segmentation (from qfh.js)
- `lib/nec-deck.js`: GW/GM/GE/GN/EX/LD/FR/RP builder, mast wires, grounds (from qfh-nec.js)
- `lib/sim.js`: run (native/wasm) + summarize (Z, SWR, RHCP/LHCP, AR) (from qfh-nec.js)
- `lib/antennas/index.js`: registry `{lindenblad (default), qfh (legacy)}`, each module exports
  `{defaults, params (schema: min/max/step/unit/i18n key → sliders), dimensions, geometry, deck}`
- `lib/qfh.js`, `lib/qfh-nec.js` → thin wrappers (keep API + tests)
- `lib/lindenblad.js`: dims + geometry (variant parasitic first)
- `lib/lindenblad-nec.js` (or inside module): deck
- CLI: `bin/antenna.js` — JSON in has `"type": "qfh" | "lindenblad"`; `bin/qfh.js` kept as alias
- web: antenna selector; form generated from `params` schema (sliders); 3D + plots generic;
  live WASM NEC on slider change (debounced); i18n EN/RU keys per param
- data: `scripts/build-data.js` loops over registry → `web/data/lindenblad-{2m,70cm}-{free,poor}.json`
- tests: `test/lindenblad.js` (AA2TX 70cm fixture dims, geometry symmetry, tilt sign),
  `test/lindenblad-nec.js` (deck sanity, RHCP > LHCP at 10–30° elev)

### Draft input JSON (mm, MHz)

```json
{
  "type": "lindenblad",
  "variant": "parasitic",
  "freq": 435.5,
  "band": [432.1, 438.0],
  "polarization": "RHCP",
  "driven":    { "length": 314.3, "od": 19.05, "gap": 6.35 },
  "parasitic": { "n": 4, "length": 298.5, "od": 3.26, "radius": 103.2, "tilt": 30, "zOffset": 0 },
  "feed": { "type": "coax-ferrite", "strayC": 4e-12 },
  "hub":  { "print": true, "arm": 20 },
  "env":  { "ground": "poor", "height": 1500, "mast": { "metal": 1000, "pvc": 500 } }
}
```

All lengths absolute mm. Sliders: driven length, sleeve length, parasitic length, radius, tilt,
N (default 4; 3 / 5 for comparison), parasitic z-offset, ODs (1 mm step), PVC section length.

### Draft output JSON

- dims: driven halves, parasitic cut length, arm length, hub params (OpenSCAD), cut list
- nec: deck; results Z, SWR (50 Ω and after box), RHCP/LHCP/AR vs elev at f_low/f0/f_high, azimuth ripple

## NEC model

- driven: 1 wire, odd segs, EX at center (gap + stray C later: 2 wires + LD/NT)
- parasitic: N wires, center at (r, φ_k = 2πk/N), tangent direction tilted ±30° (sign = polarization)
- mast: metal wire below PVC section, floating; coax on mast = mast wire
- free space → GN 2 poor ground; sweep f0 ± 5 %, 41 steps; RP elev 0–90 + azimuth cut (ripple vs N)
- tilt sign check: RHCP − LHCP at 10–30° > 15 dB

## Phases

1. Refactor shared core (geom, deck, sim, registry, CLI `bin/antenna.js`); QFH tests green
   - [x] lib/util.js (C, lambda, merge), lib/geom.js (v3, dist, polylineLength, fillet, translate)
   - [x] lib/nec-deck.js (grounds, plan, place, mastWires, build: wires with feed {sign} → deck)
   - [x] lib/sim.js (summarize, simulate(deckFn), compact); sweep[].feeds (was .loops)
   - [x] lib/antennas.js registry {type, title, legacy, defaults, calc, deck, summarize, simulate};
         default = first of ['lindenblad', 'qfh'] registered → lindenblad once phase 2 lands
   - [x] bin/antenna.js (--type, --list, --nec, --sim; input "type"); bin/qfh.js = alias
   - [x] scripts/build-data.js iterates examples/<type>-*.json via registry
   - [x] QFH decks + CLI JSON + web/data byte-identical to pre-refactor; test/core.js
   - [ ] web: antenna selector + params schema sliders (→ phase 5)
2. Lindenblad parasitic calculator + geometry + tests (AA2TX fixture)
   - [x] lib/lindenblad.js: defaults = AA2TX 70cm (mm), normalize/validate, dimensions, geometry,
         params schema (sliders); tilt sign: RHCP = left end up looking toward hub (s = -1)
   - [x] registered in lib/antennas.js → default type; examples/lindenblad-{70cm,2m}.json
3. NEC deck + verify vs AA2TX (70cm: Z ≈ 32 Ω at resonance, ~50 Ω lengthened, RHCP sense, pattern)
   - [x] lib/lindenblad-nec.js: sleeve wire + 1-seg feed wire (gap filled) + top wire, N parasitic,
         mast wire (antenna bottom = metal + pvc above roof), ideal sleeve choke
   - [x] tilt sign verified (free space, 435.5): RHCP − LHCP ≈ 22 dB at 0–20°, AR ≤ 1.4 dB 0–30°,
         RHCP +2.4 dBic @ 0°, 0 dBic @ 30°, −3 @ 46°, zenith null
   - [x] Z(435.5) = 41.6 + j25.3 Ω (lengthened, inductive); + 4 pF stray C ‖ → ≈ 57 Ω (SWR ~1.14)
         → confirms AA2TX L-match; SWR-min 424.6 MHz @ 36.8 Ω (paper: ~32 Ω at resonance)
   - [ ] azimuth ripple needs more φ cuts (current 0/90/180/270 symmetric for N = 4)
   - [ ] gap + stray C model (LD / NT), ground (poor) runs, mast/PVC sweep
4. 2m scaled design + retune (manual sliders)
   - draft examples/lindenblad-2m.json = AA2TX × 2.991, driven Ø25, parasitic Ø10, PVC 1000:
     free space Z(145.6) = 34.2 + j9.5, SWR-min 144.9 MHz 1.53; pattern/AR same as 70cm → retune
5. Web: selector + param sliders + 3D (driven, parasitic, hub, arms, mast) + plots
6. 3D parts: Replicad models (hub, adjustable parasitic adapter, mast adapters, spacers) → STL/STEP
7. Post-MVP: optimizer (lengths, radius, tilt, N → AR < 3 dB 5–45°, max RHCP 5–30°, SWR)
8. Post-MVP: classic (300 Ω twin-lead) + EZ variants; W6SHP tables as fixtures
9. Build pages EN/RU, VNA measure, feed back

## Open questions

- sleeve: shield bonded at top only (decided); ferrite added later only if VNA shows common mode
- PVC section length — NEC sweep
- N = 3 / 5 parasitic: azimuth ripple + Z vs N = 4 — NEC
- 300 Ω twin-lead VF (China) — measure before classic variant
- RHCP vs LHCP: model both; adjustable adapter allows flipping tilt on built antenna

## References

- `ref/70ParaLindy.pdf` — AA2TX, A Parasitic Lindenblad Antenna for 70cm, AMSAT Proc. 2006
  (also https://www.qsl.net/nwlarn/sat/70ParaLindy.pdf)
- `ref/Lindenblad-2meters.pdf` — AA2TX, An EZ-Lindenblad Antenna for 2 Meters, QST Aug 2007
  (https://n3ujj.com/manuals/Lindenblad-2meters.pdf)
- https://www.amsat.org/amsat/articles/w6shp/lindy.html — W6SHP classic, folded dipole tables (MININEC)
- http://www.af6sa.com/projects/Lindenblad.html — AA2TX-based, 70cm sleeve/coax driven, no balun
- https://www.iw5edi.com/ham-radio/6850/building-lindenblad-antenna-for-137mhz — classic 137 MHz, 300 Ω
- http://f1agw.free.fr/Antenne_Lindenblad/Antenne_Lindeblad.htm — classic 137.5 MHz, Ø6 folded, VF 0.82
- https://diebastelkammer.wordpress.com/2014/10/30/leo-sat-antenne-bau-einer-lindenblad-antenne/ — EZ 2m, 3D printed T
- https://www.thingiverse.com/thing:659750 — EZ 2m printed parts
- https://mail.amsat.org/archives/pipermail/amsat-bb/2020-July/078242.html — N0ZGO NEC deck, 3D hub
- https://mail.amsat.org/archives/pipermail/amsat-bb/2019-November/075530.html — RHCP tilt sign gotcha
- https://mail.amsat.org/archives/pipermail/amsat-bb/2020-September/079776.html — one-piece printed hub
- https://imageevent.com/holl_ands/amateurradioantennas — 4nec2 2m parasitic model
- https://www.qsl.net/5/5b4az/pkg/nec2/examples/2m_Lindenblad.nec — classic 2m NEC deck
- https://community.libre.space/t/2m-70cm-lindenblads-and-multiple-sdr-hookup/3268
- https://observablehq.com/@drom/antenna — notes; folded-dipole step-up k = (1 + ln(2s/d1)/ln(2s/d2))²
- https://www.dxzone.com/catalog/Antennas/Lindenblad/
