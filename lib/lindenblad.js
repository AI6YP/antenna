'use strict';

// Parasitic Lindenblad (AA2TX style) calculator + geometry.
// Central vertical driven dipole (bottom half = coax sleeve) + N parasitic elements
// tilted from horizontal around a circle. Units: mm, MHz, degrees. z up, feed gap center at z = 0.
//
// Parasitic element k: center (r cos phi_k, r sin phi_k, z), phi_k = phase + 360 k / n,
// direction d = cos(tilt) t + s sin(tilt) u, t = (-sin phi, cos phi, 0) (CCW tangent),
// u = cos(lean) z + sin(lean) r (element plane rotated about t by lean; lean > 0: upper end outward,
// lean = 0: vertical plane tangent to the circle; plane angle to horizon = 90 - |lean|).
// Seen from outside looking toward hub, t points right. AA2TX: "left side up" -> RHCP => s = -1.
// (classic driven Lindenblad: right side up -> RHCP; parasitic inverts the sense)

const {C, merge} = require('./util.js');
const {v3, translate} = require('./geom.js');
const {cables} = require('./cables.js');
const choke = require('./choke.js');

const tiltSign = {RHCP: -1, LHCP: +1};

// AA2TX, A Parasitic Lindenblad Antenna for 70cm, AMSAT Proceedings 2006 (inch -> mm)
const defaults = {
  variant: 'parasitic',
  freq: 435.5,
  band: [432.1, 438.0],
  polarization: 'RHCP',
  driven: {
    top: 142,        // top half; NEC-tuned for auto sleeve (RG-58, 435.5, Q 100, 4 pF): SWR 1.24, band max 1.42
    sleeve: null,    // bottom half (coax sleeve) length; null -> quarter-wave stub length at freq
    od: 19.05,       // tube OD (3/4")
    gap: 6.35,       // feed gap (1/4")
    wall: 1          // tube wall (17 ga = 1.47); sleeve stub uses ID = od - 2 wall
  },
  parasitic: {
    n: 4,
    length: 298.5,   // 11.75"
    od: 3.26,        // #8 AWG Al
    radius: 103.2,   // axis -> element center (4-1/16")
    tilt: 30,        // deg, element rotation inside its plane (from horizontal when lean = 0)
    lean: 0,         // deg, element plane rotation about tangent axis (> 0: upper end outward)
    z: 0,            // element center height vs feed gap
    phase: 0         // deg, azimuth of element 0
  },
  feed: {
    strayC: 4,       // pF across feed gap (AA2TX estimate), applied to NEC Z in parallel
    coax: 'RG-58',   // runs inside sleeve, down through PVC section to mast
    // sleeve: lambda/4 stub at sleeve mouth (parallel RLC); ideal: no coax wire; none: no choke (worst case)
    choke: 'sleeve',
    q: 100           // sleeve stub Q (parallel R = Q w0 L)
  },
  hub: {arm: 20},    // PVC arm OD, mm
  env: {ground: 'poor', height: 1500, mast: {metal: 1000, pvc: 500, od: 40}}
};

// slider schema (web); path into input
const params = [
  {path: 'freq', min: 100, max: 1300, step: 0.1, unit: 'MHz'},
  {path: 'driven.top', min: 20, max: 800, step: 1, unit: 'mm'},
  {path: 'driven.sleeve', min: 20, max: 800, step: 1, unit: 'mm', nullable: true}, // null = lambda/4 stub
  {path: 'driven.od', min: 3, max: 40, step: 1, unit: 'mm'},
  {path: 'parasitic.n', min: 3, max: 5, step: 1},
  {path: 'parasitic.length', min: 50, max: 1500, step: 1, unit: 'mm'},
  {path: 'parasitic.od', min: 1, max: 20, step: 1, unit: 'mm'},
  {path: 'parasitic.radius', min: 20, max: 600, step: 1, unit: 'mm'},
  {path: 'parasitic.tilt', min: 0, max: 60, step: 1, unit: 'deg'},
  {path: 'parasitic.lean', min: -60, max: 60, step: 1, unit: 'deg'},
  {path: 'parasitic.z', min: -300, max: 300, step: 1, unit: 'mm'},
  {path: 'feed.choke', options: ['sleeve', 'ideal', 'none']},
  {path: 'feed.coax', options: Object.keys(cables)},
  {path: 'feed.strayC', min: 0, max: 10, step: 0.1, unit: 'pF'},
  {path: 'env.mast.pvc', min: 0, max: 2000, step: 10, unit: 'mm'},
  {path: 'polarization', options: ['RHCP', 'LHCP']}
];

const checkFeed = p => {
  const f = p.feed;
  if (!cables[f.coax]) { throw new Error('unknown coax: ' + f.coax); }
  if (!['sleeve', 'ideal', 'none'].includes(f.choke)) { throw new Error('feed.choke must be sleeve, ideal or none'); }
  if (!(p.driven.od - 2 * p.driven.wall > cables[f.coax].od)) { throw new Error('driven tube ID must be > coax OD'); }
  if (!(f.strayC >= 0)) { throw new Error('feed.strayC must be >= 0 pF'); }
};

const rad = deg => deg * Math.PI / 180;

// element direction in local frame (t, r, z) of its center
const localDir = (q, s) => {
  const t = rad(q.tilt), l = rad(q.lean);
  return {t: Math.cos(t), r: s * Math.sin(t) * Math.sin(l), z: s * Math.sin(t) * Math.cos(l)};
};

// min horizontal distance from z axis to element axis segment: |(r + x a) r^ + x b t^|, |x| <= L/2
const axisDist = (q, s) => {
  const d = localDir(q, s);
  const a = d.r, b = d.t, h = q.length / 2;
  const x = Math.max(-h, Math.min(h, a * a + b * b > 0 ? -q.radius * a / (a * a + b * b) : 0));
  return Math.hypot(q.radius + x * a, x * b);
};

const normalize = input => {
  const p = merge(defaults, input);
  const d = p.driven, q = p.parasitic;
  if (p.variant !== 'parasitic') { throw new Error('variant not implemented: ' + p.variant); }
  if (!(p.freq > 0)) { throw new Error('freq must be > 0 MHz'); }
  if (!['RHCP', 'LHCP'].includes(p.polarization)) { throw new Error('polarization must be RHCP or LHCP'); }
  if (!(d.od > 0) || !(q.od > 0)) { throw new Error('od must be > 0 mm'); }
  if (!(d.gap >= 0)) { throw new Error('driven.gap must be >= 0 mm'); }
  if (!(d.top > 0)) { throw new Error('driven.top must be > 0 mm'); }
  if (d.sleeve !== null && !(d.sleeve > 0)) { throw new Error('driven.sleeve must be > 0 mm or null'); }
  if (!(Number.isInteger(q.n) && q.n >= 2)) { throw new Error('parasitic.n must be integer >= 2'); }
  checkFeed(p);
  if (!(q.length > 0)) { throw new Error('parasitic.length must be > 0 mm'); }
  if (!(q.tilt >= 0 && q.tilt < 90)) { throw new Error('parasitic.tilt must be in [0, 90)'); }
  if (!(q.lean > -90 && q.lean < 90)) { throw new Error('parasitic.lean must be in (-90, 90)'); }
  // element must clear the driven tube (closest approach of element axis to z axis)
  if (!(axisDist(q, tiltSign[p.polarization]) > (d.od + q.od) / 2)) { throw new Error('parasitic.radius must clear driven tube'); }
  return p;
};

const dimensions = p => {
  const d = p.driven, q = p.parasitic;
  const wavelength = C / p.freq;
  const tubeId = d.od - 2 * d.wall;
  const coax = cables[p.feed.coax];
  const lengthQW = choke.quarterWave({tubeId, coax}, p.freq);
  const bottom = d.sleeve === null ? lengthQW : d.sleeve;
  const top = d.top;
  const length = top + d.gap + bottom;
  const ld = localDir(q, tiltSign[p.polarization]);
  const sl = choke.sleeve({length: bottom, tubeId, coax, q: p.feed.q});
  return {
    wavelength,
    sleeve: {
      length: bottom, tubeId, coax: p.feed.coax, auto: d.sleeve === null,
      z0: sl.z0, vf: sl.vf, f0: sl.f0, L: sl.L, C: sl.C, R: sl.R,
      x: sl.z(p.freq).im,                     // ohm, lossless stub reactance at design freq
      lengthQW                                // sleeve length for quarter-wave stub at freq
    },
    driven: {
      length, top, bottom, gap: d.gap, od: d.od,
      lengthLambda: length / wavelength
    },
    parasitic: {
      n: q.n, length: q.length, od: q.od, radius: q.radius, tilt: q.tilt, lean: q.lean,
      lengthLambda: q.length / wavelength,
      radiusLambda: q.radius / wavelength,
      dz: q.length * Math.abs(ld.z),       // vertical span of one element
      dh: q.length * Math.hypot(ld.t, ld.r), // horizontal span
      dr: q.length * Math.abs(ld.r),       // radial span (lean)
      elev: Math.asin(Math.abs(ld.z)) * 180 / Math.PI, // element angle to horizon
      rTip: Math.max(...[-1, 1].map(k => Math.hypot(q.radius + k * ld.r * q.length / 2, k * ld.t * q.length / 2))), // axis -> farthest tip
      rMin: axisDist(q, tiltSign[p.polarization]), // axis -> element axis, closest
      clearance: axisDist(q, tiltSign[p.polarization]) - (d.od + q.od) / 2 // element surface -> driven surface
    }
  };
};

// geometry: driven = {bottom: [a, b], top: [a, b]} along z; parasitic = [{a, b, center, phi}]
const geometry = (p, dims) => {
  const q = p.parasitic, dd = dims.driven;
  const s = tiltSign[p.polarization];
  const ld = localDir(q, s);
  const driven = {
    od: dd.od,
    bottom: [[0, 0, -dd.gap / 2 - dd.bottom], [0, 0, -dd.gap / 2]],
    top: [[0, 0, dd.gap / 2], [0, 0, dd.gap / 2 + dd.top]],
    feed: [0, 0, 0]
  };
  const parasitic = [];
  for (let k = 0; k < q.n; k++) {
    const phi = rad(q.phase) + 2 * Math.PI * k / q.n;
    const center = [q.radius * Math.cos(phi), q.radius * Math.sin(phi), q.z];
    const tang = [-Math.sin(phi), Math.cos(phi), 0];
    const rhat = [Math.cos(phi), Math.sin(phi), 0];
    const dir = v3.add(v3.add(v3.mul(tang, ld.t), v3.mul(rhat, ld.r)), [0, 0, ld.z]);
    parasitic.push({
      k, phi, center, dir, od: q.od,
      a: translate(center, v3.mul(dir, -q.length / 2)),
      b: translate(center, v3.mul(dir, q.length / 2))
    });
  }
  const zs = [driven.bottom[0][2], driven.top[1][2], ...parasitic.flatMap(e => [e.a[2], e.b[2]])];
  return {tiltSign: s, driven, parasitic, zBottom: Math.min(...zs), zTop: Math.max(...zs)};
};

const calc = input => {
  const p = normalize(input);
  const dims = dimensions(p);
  return {input: p, dims, geometry: geometry(p, dims)};
};

module.exports = {tiltSign, localDir, axisDist, defaults, params, normalize, dimensions, geometry, calc};
