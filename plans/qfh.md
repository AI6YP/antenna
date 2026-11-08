# QFH Antenna

status: planning (draft 4)

Two separate QFH antennas for HAM LEO Sat operation, RX/TX, <50 W, RHCP,
two masts, mounted >1.5 m above wood house roof.

| band | original target | proposed design band (see sat table) |
|------|-----------------|--------------------------------------|
| 2m   | 146 ± 2 MHz     | 144.3 – 146.0 MHz, center ~145.6 (agreed) |
| 70cm | 435 ± 15 MHz    | 432.1 – 438.0 MHz, center ~435.5 (agreed) |

Operation: full-duplex (V/u + U/v), hear own downlink. No preamp.

Pattern goal: more horizon gain (LEO passes spend most time at low elevation)
→ taller/narrower QFH than classic hemispherical (D/H 0.44), tune via NEC.

## Operational HAM LEO sats (AMSAT, updated 2026-10-31)

Source: https://www.amsat.org/live-fm-satellites/ ,
https://www.amsat.org/live-linear-satellites/ , status: https://www.amsat.org/status/

### FM

| sat              | uplink MHz        | downlink MHz | mode | note |
|------------------|-------------------|--------------|------|------|
| AO-91 (Fox-1B)   | 435.250           | 145.960      | U/v  | sunlight only |
| AO-123 (ASRTU-1) | 145.850 (67 Hz)   | 435.400      | V/u  | |
| CAS-3H (LilacSat-2) | 144.350        | 437.200      | V/u  | no schedule, beacon 437.200 |
| IO-86 (LAPAN-A2) | 145.880 (88.5 Hz) | 435.880      | V/u  | ±30° lat orbit |
| ISS              | 145.990 (67 Hz)   | 437.800      | V/u  | APRS 145.825 |
| PO-101 (Diwata-2)| 437.500 (141.3 Hz)| 145.900      | U/v  | dying, scheduled |
| RS95S (QMR-KWT-2)| 145.920 (67 Hz)   | 436.950      | V/u  | testing, SSTV |
| SO-50            | 145.850 (67 Hz)   | 436.795      | V/u  | arm 74.4 Hz |
| TEVEL2-1..9      | 145.970           | 436.400      | V/u  | unreliable |

### Linear (SSB/CW)

| sat            | uplink MHz        | downlink MHz      | mode |
|----------------|-------------------|-------------------|------|
| AO-7 mode B    | 432.125 – 432.175 | 145.925 – 145.975 | U/v |
| AO-73 (FUNcube-1) | 435.130 – 435.150 | 145.950 – 145.970 | U/v |
| FO-29 (JAS-2)  | 145.900 – 146.000 | 435.800 – 435.900 | V/u |
| JO-97 (JY1Sat) | 435.100 – 435.120 | 145.855 – 145.875 | U/v |
| RS-44          | 145.935 – 145.995 | 435.610 – 435.670 | V/u |
| TO-108 (CAS-6) | 435.270 – 435.290 | 145.915 – 145.935 | U/v |

UHF span used: 432.125 – 437.800 MHz (~±0.65 %). VHF span: 144.350 – 146.000
(only CAS-3H below 145.8). → ±15 MHz not needed; ±3 MHz enough.

Digital/telemetry-only birds: out of scope. Table kept static.

### Popularity (AMSAT status API, "Heard" reports, last 30 days, 2026-11-08)

LoTW / eQSL: no public per-satellite aggregate (LoTW stats only for own account;
SAT_NAME is in ADIF but not exposed). Use AMSAT status API as proxy:
`https://status.amsat.org/api/v1/summary.php?hours=720` (also catalog.php?include_stats=1).

| sat          | mode | heard | 70cm role |
|--------------|------|-------|-----------|
| RS-44        | V/u  | 815   | RX |
| ISS FM       | V/u  | 660   | RX |
| SO-50        | V/u  | 499   | RX |
| FO-29        | V/u  | 498   | RX |
| JO-97        | U/v  | 266   | TX |
| AO-7 B       | U/v  | 239   | TX |
| AO-123       | V/u  | 160   | RX |
| RS95S        | V/u  | 64    | RX |
| IO-86        | V/u  | 38    | RX |

→ top-4 all V/u: 70cm antenna = main RX, 2m = main TX.
→ 2m TX 3rd harmonic (437.7) vs 70cm RX = #1 interference issue.

## Materials

- Frame: PVC pipe (mast + crossarms), two size sets:
  - USA Sch40 (OD mm): 1/2" 21.3, 3/4" 26.7, 1" 33.4, 1-1/4" 42.2, 1-1/2" 48.3, 2" 60.3
  - Belarus metric (OD mm, ГОСТ/ISO): 16, 20, 25, 32, 40, 50, 63, 75, 90, 110
- Loops:
  - 2m: RG-213 (OD 10.3 mm)
  - 70cm: RG-58 (OD ~5 mm, bend radius 25 mm); RG-6 rejected (bends too large vs D≈107 mm, Al braid)
  - loop conductor = coax outer surface → VF ≈ 1 (not coax VF)
  - coax VF matters only for feed/balun leg and phasing lines

## Install

- 1.0 m metal mast + 0.5 m PVC, >1.5 m above wood roof
- 10 m HWATEL 3D-FB 50 Ω to shack (loss approx 1 dB @145, ~1.8 dB @435 — verify datasheet)
- NEC model: metal mast as wire (ungrounded, floating), coax down mast (choke)
- roof: wooden building, flat roof → model as real ground (poor/dry) at roof level; wood ignored
- mast spacing 2m↔70cm: 2–5 m (NEC sweep for isolation)
- connectors: N
- model both antennas together → mutual coupling / isolation 2m↔70cm

## Match box (per antenna, outdoor)

- 2m box: match + LPF (pass 144–146, kill 432–438 ≥ 50–60 dB, 3rd harmonic)
- 70cm box: match + HPF (pass 432–438, kill 144–146 ≥ 50–60 dB, protect RX from own 50 W)
- 50 W rated: air coils, mica/ceramic HV caps, weatherproof box, N connectors
- isolation budget: antenna isolation (NEC) + filter rejection vs RX desense
- target: 60 dB rejection per filter
- target: SWR < 1.35 over band at box N connector (antenna Z(f) from NEC, later VNA .s1p)
- combined match + filter, one ladder per box:
  - 70cm: HPF ladder (series C, shunt L); high-pass L-match (series C / shunt L) = first HPF section
  - 2m: LPF ladder (series L, shunt C); low-pass L-match (series L / shunt C) = first LPF section
  - source termination = antenna Z(f) (complex, freq dependent) → not a textbook equal-termination
    Chebyshev; start from Chebyshev prototype, then JS optimizer tunes all elements jointly:
    objective = max |S11| in band (SWR < 1.35) + min rejection at 437.7 / 146 MHz ≥ 60 dB
  - rejection gap → add trap (series LC to ground at 437.7 / parallel LC trap) or go 7th order
  - verify in ngspice with antenna modeled as Z(f) (Touchstone / behavioral source)
  - Z seen by box = antenna Z transformed by feed coax (infinite-balun leg, top → box at base);
    include that line (length, Z0, VF, loss) in the optimizer, or put box at top feed point
- topology: Chebyshev, hand-wound air coils + SMD caps (C0G/NP0, high-Q, V rating ≥ 500 V or series/parallel)
- design: JS synthesis (prototype g-values) + JS optimizer (component snap to E-series, coil turns/Ø/pitch)
- verify: ngspice netlist gen + AC sweep (S21/S11), compare JS result; later VNA .s1p

Ideal Chebyshev stopband (calc, no parasitics):

| order | ripple dB | LPF fc 165 @ 437.7 | HPF fc 400 @ 146 |
|-------|-----------|--------------------|------------------|
| 5     | 0.1       | 48.5 dB            | 50.0 dB          |
| 5     | 0.5       | 55.7 dB            | 57.2 dB          |
| 7     | 0.1       | 76.8 dB            | 78.9 dB          |

→ 5th order misses 60 dB at these cutoffs. Options: lower/raise fc (cost: passband loss/return loss),
add series/parallel trap at 437.7 / 146 (Cauer-like), go 7th order, or count NEC antenna isolation into budget.

## Feed / match options (to model + compare)

1. Self-phased (big/small loop) + infinite balun (feedline inside one loop leg)
2. Self-phased + 1/4 λ coax sleeve/bazooka balun
3. Self-phased + ferrite choke at feedpoint
4. Equal loops + 90° quadrature hybrid (phasing line or 3 dB hybrid)
5. Match: Z0 transformer (1/4 λ section), stub, or loop-length trim
6. Tuning knobs: small loop length, loop ratio, feed gap

## Software

- Vanilla CommonJS calculator (no deps), pure fns, bundled for web page by esbuild
- Layout: bin/ lib/ test/; mocha + chai; eslint; Node 26; linux; nec2++ built w/ clang
- Plots: Observable Plot (web page)
- Optimizer budget: < 20 h total nec2++ runtime
- NodeJS CLI: JSON in → JSON (dimensions, cut list, drill template) + NEC deck out
- NEC deck via existing `nec-2.js`; run `nec2++`; parse output (Z, SWR, gain, AR)
- Optimizer loop: calc → NEC → adjust params → new calc (iterate to SWR/AR target)
- Cross-check vs existing calculators / models:
  - https://github.com/dj-on-github/necfull
  - https://www.rfwireless-world.com/calculators/qfh-antenna-basics
  - https://shackwiki.com/qfh-antenna-calculator/
  - https://github.com/kaklik/QFH-Antenna
  - ~~https://github.com/oceantrotter/QFH2nec~~ (skipped)
  - jcoppens QFH calculator (classic reference)

### Draft input JSON (units: mm, MHz)

```json
{
  "freq": 435.5,
  "band": [432.1, 438.0],
  "turns": 0.5,
  "ratioDH": 0.44,
  "loopFactors": { "big": 1.026, "small": 0.975 },
  "turnLength": 1,
  "conductor": { "type": "coax", "od": 6.9 },
  "bendRadius": 30,
  "polarization": "RHCP",
  "feed": "infinite-balun",
  "frame": { "standard": "BY", "mast": 32, "arm": 20 },
  "env": { "ground": "poor", "height": 1500 }
}
```

### Draft output JSON

- loops: big/small: total length, height, diameter, corner compensation
- cut list (+ connection allowance)
- frame: crossarm lengths, drill heights, hole Ø
- nec: deck text; results: Z, SWR, gain(elev), AR(elev) per freq

## NEC model (phase 2 decisions)

- wire radius = braid OD / 2 (cable table: RG-58, RG-213; jacket loading LD later if needed)
- feed: two equal voltage sources, one per loop at top center (= parallel feed); Z = V / (I1 + I2)
- infinite balun / coax inside antenna: later (with feed/match variants)
- mast: metal wire, floating (not grounded), coax taped down mast modeled as part of mast wire
- roof 4 m above real ground; mast base on roof; antenna bottom 1.5 m above roof
- ground: free space first, then real ground (Sommerfeld GN 2)
- sweep: f0 ± 5 %, 41 steps (Z, SWR); pattern (gain, AR, RHCP/LHCP) vs elevation at f_low, f0, f_high
- RHCP twist check: RHCP vs LHCP gain at zenith

## Web page (replaces Observable notebooks)

Static site, no framework. `web/` source → `docs/` build, committed.
Hosting: Cloudflare Pages from this repo, output dir `docs/`, no build step on CF → https://antenna.drom.si

Status (v0, done):
- [x] web/index.html, style.css, main.js (calculator form + dims table), view3d.js (three.js), plots.js (Plot), status.js, sats.js
- [x] scripts/build-data.js: precomputed nec2++ results → web/data/*.json (2m / 70cm × free / poor ground)
- [x] scripts/build-web.js: esbuild bundle (three + Plot + lib/browser.js) → docs/; `npm run dev` = watch + serve :8000
- [x] WASM nec2++: scripts/build-wasm.sh (wasi-sdk 33 clang, wasm32-wasip1, -fwasm-exceptions exnref,
      8 MB stack) → web/wasm/nec2pp.wasm (686 KB); runs full nec2++ CLI via @bjorn3/browser_wasi_shim
      in a Web Worker; results bit-identical to native (test/nec-wasm.js); 70cm 0.34 s, 2m 0.81 s in Chromium
  - upstream note (tmolteno/necpp): c_geometry.cpp:199 prints int64_t with %5d → garbage wire table
    columns on wasm32 (cosmetic); misc.cpp / nec2cpp.cpp guards could use `|| defined(__wasi__)`
- [x] GitHub Pages: https://ai6yp.github.io/antenna/ (master /docs)
- [x] toolbar top-right: theme [Day | Night | Auto] (html[data-theme], localStorage), language [EN | RU]
      (web/i18n.js dictionary, ?lang=ru|en, localStorage, navigator.language default); all content EN + RU
- [ ] drill template SVG, cut list, USA/BY size sets, build pages en/ru

- calculator: lib/browser.js (CommonJS, no node modules) bundled by esbuild into docs/assets/app.js
- 3D: three.js (import map, CDN or npm) — loops as tubes (conductor OD), PVC frame + crossarms,
  metal mast, orbit controls, step highlight, optional NEC current magnitude coloring
- plots: Observable Plot (https://github.com/observablehq/plot) — SWR, Z (R, X), elevation pattern
  (RHCP / LHCP), AR vs elevation, filter S21/S11, measured .s1p overlay
- inputs: band, cable, turns, D/H, bend R, size set USA/BY → live dims, cut list, drill template (SVG, print 1:1)
- NEC results: precomputed JSON for reference designs; live NEC in browser via nec2++ → WASM (clang / wasi-sdk)
- pages:
  - `index.html` calculator + 3D + plots
  - `en/build-2m.html`, `en/build-70cm.html` — step-by-step build instructions
  - `ru/build-2m.html`, `ru/build-70cm.html` — same, Russian
  - shared step definitions (lib/steps.js, text keys en/ru), per-step 3D view + numbers from calculator

### Build steps (draft)

1. Design inputs: band, cable, frame size set → calculator output
2. Bill of materials: PVC, cable lengths (+ allowance), N connector, box, hardware
3. Tools: saw, drill + bits, heat gun (PVC), cable cutter, soldering iron, VNA
4. Cut list: mast boom, 4 crossarms (2 top, 2 bottom), loop cables big/small
5. Drilling template: crossarm hole heights on mast, crossarm end holes (Dc), printed 1:1 (PDF/SVG)
6. Assemble frame: crossarms through mast, 90° rotated, small loop top offset
7. Form loops: bend radius jig, helix twist direction (RHCP!), thread cables through holes
8. Bottom connections: shield-to-shield continuous loops
9. Top feed: two loops in parallel, coax / infinite balun routing
10. Match box: matching + LPF (2m) / HPF (70cm), N connector, weatherproof
11. First test: VNA sweep, compare to NEC, trim small loop / loop ratio
12. Mount: PVC 0.5 m + metal 1 m mast, coax choke, 2–5 m spacing between antennas
13. Weatherproof: seal ends, UV protection, drain holes
14. On-air check: ISS / SO-50 / RS-44 pass, compare RX reports

## Measurements

- VNA .s1p files saved in repo (e.g. `meas/`), parser in lib, overlay measured vs model on web page

## Phases

1. Calculator formulas (classic Kilgus/jcoppens) + unit tests vs references (jcoppens, shackwiki)
   - [x] fixtures: test/fixtures/{jcoppens,shackwiki,recorded}.json
   - [x] lib/qfh.js dimensions() — Coppens algorithm, c / turnLength / loopFactors configurable
   - [x] geometry(): 3D polylines, corners = 90° fillets in π/8 linear segments,
         feed at top (both loops' tops at feed level, small loop top offset by crossarm OD),
         bottom horizontals continuous; RHCP twist sign to verify in NEC
         (polyline length within 0.3% of electrical length; chord error)
   - note (Coppens): D/H 0.3–0.4 gives better horizon coverage than 0.44
2. NEC geometry gen (segmented helix + bends + crossarm-free) + nec2++ runner + parser
   - [x] lib/qfh-nec.js deck(): GW per polyline piece, feed wire through top center (odd segs),
         two sources (small loop polarity = -twist), mast wire, GN 2, FR sweep + RP at band edges/center
   - [x] lib/necout.js parse(): input params, patterns; parallelZ = 1/ΣY; swr; RHCP/LHCP split from AR + sense
   - [x] CLI: bin/qfh.js --nec | --sim
   - [x] twist verified: twist +1 + small feed -1 → RHCP up (+4.4 dBic, F/B 12.5 dB, 70cm free space)
   - first results (Coppens dims, D/H 0.44, 0.5 turn):
     - resonance ~2.5 % low (SWR min 142.0 / 427.9 MHz), Z ~30 Ω → needs retune + match
     - RHCP 4.1–4.4 dBic zenith, ~-1.4…-2.8 dBic at 10° elev, AR ~3.3 dB at 10°
     - ground (poor, 5.5 m) barely changes Z; adds ripple to pattern
   - [ ] wire insulation (jacket) loading, crossarm-free assumption check
   - [ ] build docs: feed polarity = which loop halves go to center conductor (from feedSign)
3. Optimize antenna (free space; final check with ground)
   - params: scale, loopFactors.big, loopFactors.small, turns 0.5–1.5, D/H 0.25–0.5
   - antenna objective: centered resonance + phasing → AR < 3 dB over 10–90° elev,
     max RHCP at 10–30° elev, smooth Z over band (matchable); 50 Ω not required (box matches)
   - algorithm: grid over turns × multi-start Nelder–Mead; 20 nec2++ workers (20 cores);
     reduced deck while optimizing (band-only sweep, 3 pattern freqs, 4 φ cuts); budget < 20 h
   - output: Pareto list (low-angle gain vs AR vs Z flatness) → pick design → full deck
4. Feed/match variants modeled
5. Frame/drill template, size sets USA/BY
6. Web page: calculator + three.js + Observable Plot; build instructions EN + RU
7. Match box = match + filter in one ladder (co-optimized, see Match box)
8. Build, measure (VNA available), feed back into model

## Open issues

- RG-6 75 Ω in infinite-balun leg: feed Z vs 50 Ω 3D-FB → match in box
- RG-6 power at 435 MHz/50 W: OK, check connector
- mast spacing 2m↔70cm antenna: TBD from NEC isolation
- Ground model: wood roof ~ ignore; real ground below roof height
