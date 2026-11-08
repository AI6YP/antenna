'use strict';

// Classic Lindenblad: N (= 4) half-wave folded dipoles around a circle, tilted from horizontal,
// each fed by an equal half-wave 300 ohm twin-lead line to a common hub (lines repeat the dipole Z,
// N in parallel -> Z / N at the hub), then optional quarter-wave match to 50 ohm coax.
// References: W6SHP (AMSAT J. 1990/91, MININEC tables by WD4ECK), F1AGW 137.5 MHz, IW5EDI 137 MHz.
// Units: mm, MHz, degrees. z up, element (fold midline) center at z = element.z.
//
// Element k: center (r cos phi_k, r sin phi_k, z), phi_k = phase + 360 k / n, direction
// d = cos(tilt) t + s sin(tilt) u (see lindenblad-common.js). Folded dipole = 2 parallel conductors
// spaced element.spacing (center to center) along offset p:
//   fold 'plane':  p = -s sin(tilt) t + cos(tilt) u (in the element plane, perpendicular to d, upward)
//   fold 'radial': p = t x u (plane normal, outward)
// fed conductor (od) at center - p spacing / 2, other conductor (od2) at center + p spacing / 2.
// Tilt sense: classic driven Lindenblad, looking toward hub, right end up -> RHCP (s = +1),
// opposite of the parasitic variant (verified in NEC, test/lindenblad-classic-nec.js).

const {C, merge} = require('./util.js');
const {v3, translate, segDist} = require('./geom.js');
const {rad, localDir} = require('./lindenblad-common.js');
const tline = require('./tline.js');

const tiltSign = {RHCP: +1, LHCP: -1};

// W6SHP Table 2 (437 MHz, MININEC, WD4ECK): 1/4" rod folded dipole, 2 cm spacing -> 26.7 cm, 264 ohm;
// 0.3 lambda between opposite dipoles (r = 0.15 lambda); twin-lead 300 ohm, vf 0.82, lambda/2
const defaults = {
  variant: 'classic',
  freq: 435.5,
  band: [432.1, 438.0],
  polarization: 'RHCP',
  element: {
    n: 4,
    length: 267,     // folded dipole overall conductor length (end wire to end wire)
    od: 6.35,        // fed conductor (1/4" rod)
    od2: null,       // other conductor; null -> same as od (bent from one rod)
    spacing: 20,     // conductor center to center
    radius: 103,     // axis -> fold midline center (0.15 lambda)
    tilt: 30,        // deg from horizontal (lean = 0)
    lean: 0,         // deg, element plane rotation about tangent axis (> 0: upper end outward)
    z: 0,            // element center height (= hub height)
    phase: 0,        // deg, azimuth of element 0
    fold: 'plane'    // plane: conductors one above the other in the element plane; radial: inner / outer
  },
  line: {            // phasing lines, one per dipole, dipole feed -> hub
    z0: 300,         // ohm (TV twin-lead; China: measure VF)
    vf: 0.82,
    length: null     // mm; null -> electrical half-wave at freq (Z repeats)
  },
  match: {           // hub -> 50 ohm coax
    type: 'none',    // none: hub Z direct (box under antenna matches) | qwt: quarter-wave transformer
    z0: 60,          // qwt line impedance (ideal sqrt(50 Zhub))
    vf: 0.66,
    length: null     // mm; null -> electrical quarter-wave at freq
  },
  feed: {strayC: 0}, // pF across each dipole feed, parallel (post-processing)
  hub: {arm: 20},    // PVC arm OD, mm
  env: {ground: 'poor', height: 1500, mast: {metal: 1000, pvc: 500, od: 40}}
};

// slider schema (web); path into input
const params = [
  {path: 'freq', min: 100, max: 1300, step: 0.1, unit: 'MHz'},
  {path: 'element.n', min: 3, max: 5, step: 1},
  {path: 'element.length', min: 50, max: 1500, step: 1, unit: 'mm'},
  {path: 'element.od', min: 1, max: 20, step: 1, unit: 'mm'},
  {path: 'element.od2', min: 1, max: 20, step: 1, unit: 'mm', nullable: true}, // null = od
  {path: 'element.spacing', min: 3, max: 150, step: 1, unit: 'mm'},
  {path: 'element.radius', min: 20, max: 600, step: 1, unit: 'mm'},
  {path: 'element.tilt', min: 0, max: 60, step: 1, unit: 'deg'},
  {path: 'element.lean', min: -60, max: 60, step: 1, unit: 'deg'},
  {path: 'element.fold', options: ['plane', 'radial']},
  {path: 'line.z0', min: 50, max: 600, step: 1, unit: 'ohm'},
  {path: 'line.vf', min: 0.5, max: 1, step: 0.01},
  {path: 'line.length', min: 50, max: 2000, step: 1, unit: 'mm', nullable: true}, // null = lambda/2
  {path: 'match.type', options: ['none', 'qwt']},
  {path: 'match.z0', min: 25, max: 150, step: 1, unit: 'ohm'},
  {path: 'feed.strayC', min: 0, max: 10, step: 0.1, unit: 'pF'},
  {path: 'env.mast.pvc', min: 0, max: 2000, step: 10, unit: 'mm'},
  {path: 'polarization', options: ['RHCP', 'LHCP']}
];

const AXIS = [[0, 0, -1e7], [0, 0, 1e7]];

// conductors of element k: {fed: [a, b], other: [a, b], feed, center, dir, off, phi}
const element = (q, s, k) => {
  const ld = localDir(q, s);
  const phi = rad(q.phase) + 2 * Math.PI * k / q.n;
  const tang = [-Math.sin(phi), Math.cos(phi), 0];
  const rhat = [Math.cos(phi), Math.sin(phi), 0];
  const l = rad(q.lean), tl = rad(q.tilt);
  const u = v3.add(v3.mul([0, 0, 1], Math.cos(l)), v3.mul(rhat, Math.sin(l)));
  const dir = v3.add(v3.add(v3.mul(tang, ld.t), v3.mul(rhat, ld.r)), [0, 0, ld.z]);
  const off = q.fold === 'radial' ?
    v3.cross(tang, u) :
    v3.add(v3.mul(tang, -s * Math.sin(tl)), v3.mul(u, Math.cos(tl)));
  const center = [q.radius * Math.cos(phi), q.radius * Math.sin(phi), q.z];
  const cFed = translate(center, v3.mul(off, -q.spacing / 2));
  const cOther = translate(center, v3.mul(off, q.spacing / 2));
  const ends = c => [translate(c, v3.mul(dir, -q.length / 2)), translate(c, v3.mul(dir, q.length / 2))];
  return {k, phi, center, dir, off, feed: cFed, fed: ends(cFed), other: ends(cOther)};
};

const od2Of = q => (q.od2 === null ? q.od : q.od2);

// closest approach (conductor axes) of element 0 to z axis and to its neighbor element 1
const clearances = (q, s) => {
  const e0 = element(q, s, 0), e1 = element(q, s, 1 % q.n);
  const cond = e => [e.fed, e.other];
  const rMin = Math.min(...cond(e0).map(c => segDist(c[0], c[1], AXIS[0], AXIS[1])));
  const neighbor = Math.min(...cond(e0).flatMap(a => cond(e1).map(b => segDist(a[0], a[1], b[0], b[1]))));
  return {rMin, neighbor: neighbor - Math.max(q.od, od2Of(q))};
};

const checkElement = q => {
  if (!(Number.isInteger(q.n) && q.n >= 2)) { throw new Error('element.n must be integer >= 2'); }
  if (!(q.length > 0)) { throw new Error('element.length must be > 0 mm'); }
  if (!(q.od > 0)) { throw new Error('element.od must be > 0 mm'); }
  if (q.od2 !== null && !(q.od2 > 0)) { throw new Error('element.od2 must be > 0 mm or null'); }
  if (!(q.spacing > (q.od + od2Of(q)) / 2)) { throw new Error('element.spacing must exceed conductor radii (od + od2) / 2'); }
  if (!(q.spacing < q.length / 2)) { throw new Error('element.spacing must be < length / 2'); }
  if (!(q.radius > 0)) { throw new Error('element.radius must be > 0 mm'); }
  if (!(q.tilt >= 0 && q.tilt < 90)) { throw new Error('element.tilt must be in [0, 90)'); }
  if (!(q.lean > -90 && q.lean < 90)) { throw new Error('element.lean must be in (-90, 90)'); }
  if (!['plane', 'radial'].includes(q.fold)) { throw new Error('element.fold must be plane or radial'); }
};

const checkLine = (ln, name) => {
  if (!(ln.z0 > 0)) { throw new Error(name + '.z0 must be > 0 ohm'); }
  if (!(ln.vf > 0 && ln.vf <= 1)) { throw new Error(name + '.vf must be in (0, 1]'); }
  if (ln.length !== null && !(ln.length > 0)) { throw new Error(name + '.length must be > 0 mm or null'); }
};

const normalize = input => {
  const p = merge(defaults, input);
  const q = p.element;
  if (!(p.freq > 0)) { throw new Error('freq must be > 0 MHz'); }
  if (!['RHCP', 'LHCP'].includes(p.polarization)) { throw new Error('polarization must be RHCP or LHCP'); }
  checkElement(q);
  checkLine(p.line, 'line');
  if (!['none', 'qwt'].includes(p.match.type)) { throw new Error('match.type must be none or qwt'); }
  checkLine(p.match, 'match');
  if (!(p.feed.strayC >= 0)) { throw new Error('feed.strayC must be >= 0 pF'); }
  const cl = clearances(q, tiltSign[p.polarization]);
  if (!(cl.rMin > Math.max(q.od, od2Of(q)))) { throw new Error('element.radius: element crosses the axis'); }
  if (q.n > 1 && !(cl.neighbor > 0)) { throw new Error('element.radius: neighbor elements touch'); }
  return p;
};

// folded-dipole step-up ratio (thin-wire estimate): k = (1 + ln(2s/d1) / ln(2s/d2))^2, d1 fed
const stepUp = (s, d1, d2) => (1 + Math.log(2 * s / d1) / Math.log(2 * s / d2)) ** 2;

const dimensions = p => {
  const q = p.element, ln = p.line, m = p.match;
  const wavelength = C / p.freq;
  const s = tiltSign[p.polarization];
  const ld = localDir(q, s);
  const od2 = od2Of(q);
  const cl = clearances(q, s);
  const lineHalf = tline.lengthOf(0.5, ln.vf, p.freq);
  const lineLen = ln.length === null ? lineHalf : ln.length;
  const e0 = element(q, s, 0);
  const path = Math.hypot(e0.feed[0], e0.feed[1], e0.feed[2] - q.z); // feed point -> hub center, straight
  const qwLen = tline.lengthOf(0.25, m.vf, p.freq);
  return {
    wavelength,
    element: {
      n: q.n, length: q.length, od: q.od, od2, spacing: q.spacing, fold: q.fold,
      radius: q.radius, tilt: q.tilt, lean: q.lean,
      lengthLambda: q.length / wavelength,
      radiusLambda: q.radius / wavelength,
      oppositeLambda: 2 * q.radius / wavelength,   // W6SHP: 0.3 lambda between opposite dipoles
      // one-rod bend: 2 straight sides + 2 half-turns of radius spacing / 2 (od2 = od)
      cut: od2 === q.od ? 2 * (q.length - q.spacing) + Math.PI * q.spacing : null,
      stepUp: stepUp(q.spacing, q.od, od2),
      dz: q.length * Math.abs(ld.z),
      dh: q.length * Math.hypot(ld.t, ld.r),
      dr: q.length * Math.abs(ld.r),
      elev: Math.asin(Math.abs(ld.z)) * 180 / Math.PI,
      rMin: cl.rMin,
      neighbor: cl.neighbor             // closest conductor surface gap between adjacent elements
    },
    line: {
      z0: ln.z0, vf: ln.vf, length: lineLen, auto: ln.length === null,
      lengthHalf: lineHalf,
      deg: tline.theta(lineLen, ln.vf, p.freq) * 180 / Math.PI, // electrical length at freq
      path, slack: lineLen - path         // excess over straight feed -> hub run (route / coil)
    },
    match: {
      type: m.type, z0: m.z0, vf: m.vf,
      length: m.type === 'qwt' ? (m.length === null ? qwLen : m.length) : 0,
      auto: m.length === null
    }
  };
};

// geometry: elements [{k, phi, center, dir, off, feed, fed: [a, b], other: [a, b], od, od2}]
const geometry = (p, dims) => {
  const q = p.element;
  const s = tiltSign[p.polarization];
  const elements = [];
  for (let k = 0; k < q.n; k++) { elements.push({...element(q, s, k), od: q.od, od2: dims.element.od2}); }
  const zs = elements.flatMap(e => [...e.fed, ...e.other].map(x => x[2]));
  return {tiltSign: s, hub: [0, 0, q.z], elements, zBottom: Math.min(...zs), zTop: Math.max(...zs)};
};

const calc = input => {
  const p = normalize(input);
  const dims = dimensions(p);
  return {input: p, dims, geometry: geometry(p, dims)};
};

// feed network (post-processing): per-dipole Z (+ stray C) -> line -> N in parallel -> match
// zs: dipole feed impedances, f: MHz, dims from calc. returns {z, zHub}
const network = (zs, f, p, dims) => {
  const c = (p.feed.strayC || 0) * 1e-12;
  const shunt = z => (c ? tline.cx.inv(tline.cx.add(tline.cx.inv(z), {re: 0, im: 2 * Math.PI * f * 1e6 * c})) : z);
  const thL = tline.theta(dims.line.length, p.line.vf, f);
  const zHub = tline.parallel(zs.map(z => tline.zin(shunt(z), p.line.z0, thL)));
  const z = p.match.type === 'qwt' ? tline.zin(zHub, p.match.z0, tline.theta(dims.match.length, p.match.vf, f)) : zHub;
  return {z, zHub};
};

module.exports = {tiltSign, defaults, params, element, clearances, stepUp, normalize, dimensions, geometry, calc, network};
