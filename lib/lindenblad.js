'use strict';

// Parasitic Lindenblad (AA2TX style) calculator + geometry.
// Central vertical driven dipole (bottom half = coax sleeve) + N parasitic elements
// tilted from horizontal around a circle. Units: mm, MHz, degrees. z up, feed gap center at z = 0.
//
// Parasitic element k: center (r cos phi_k, r sin phi_k, z), phi_k = phase + 360 k / n,
// direction d = cos(tilt) t + s sin(tilt) z, t = (-sin phi, cos phi, 0) (CCW tangent).
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
    length: 314.3,   // overall tip to tip incl. gap (12-3/8")
    od: 19.05,       // tube OD (3/4")
    gap: 6.35,       // feed gap (1/4")
    wall: 1,         // tube wall (17 ga = 1.47); sleeve stub uses ID = od - 2 wall
    sleeve: null     // bottom half (sleeve) length; null -> (length - gap) / 2
  },
  parasitic: {
    n: 4,
    length: 298.5,   // 11.75"
    od: 3.26,        // #8 AWG Al
    radius: 103.2,   // axis -> element center (4-1/16")
    tilt: 30,        // deg from horizontal
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
  {path: 'driven.length', min: 50, max: 1500, step: 1, unit: 'mm'},
  {path: 'driven.sleeve', min: 20, max: 800, step: 1, unit: 'mm', nullable: true},
  {path: 'driven.od', min: 3, max: 40, step: 1, unit: 'mm'},
  {path: 'parasitic.n', min: 3, max: 5, step: 1},
  {path: 'parasitic.length', min: 50, max: 1500, step: 1, unit: 'mm'},
  {path: 'parasitic.od', min: 1, max: 20, step: 1, unit: 'mm'},
  {path: 'parasitic.radius', min: 20, max: 600, step: 1, unit: 'mm'},
  {path: 'parasitic.tilt', min: 0, max: 60, step: 1, unit: 'deg'},
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

const normalize = input => {
  const p = merge(defaults, input);
  const d = p.driven, q = p.parasitic;
  if (p.variant !== 'parasitic') { throw new Error('variant not implemented: ' + p.variant); }
  if (!(p.freq > 0)) { throw new Error('freq must be > 0 MHz'); }
  if (!['RHCP', 'LHCP'].includes(p.polarization)) { throw new Error('polarization must be RHCP or LHCP'); }
  if (!(d.od > 0) || !(q.od > 0)) { throw new Error('od must be > 0 mm'); }
  if (!(d.gap >= 0) || !(d.length > d.gap)) { throw new Error('driven.length must be > driven.gap'); }
  if (d.sleeve !== null && !(d.sleeve > 0 && d.sleeve < d.length - d.gap)) {
    throw new Error('driven.sleeve must be in (0, length - gap)');
  }
  if (!(Number.isInteger(q.n) && q.n >= 2)) { throw new Error('parasitic.n must be integer >= 2'); }
  checkFeed(p);
  if (!(q.length > 0)) { throw new Error('parasitic.length must be > 0 mm'); }
  if (!(q.tilt >= 0 && q.tilt < 90)) { throw new Error('parasitic.tilt must be in [0, 90)'); }
  // element must clear the driven tube: closest approach of element axis to z axis = radius
  if (!(q.radius > (d.od + q.od) / 2)) { throw new Error('parasitic.radius must clear driven tube'); }
  return p;
};

const rad = deg => deg * Math.PI / 180;

const dimensions = p => {
  const d = p.driven, q = p.parasitic;
  const wavelength = C / p.freq;
  const bottom = d.sleeve === null ? (d.length - d.gap) / 2 : d.sleeve;
  const top = d.length - d.gap - bottom;
  const t = rad(q.tilt);
  const sl = choke.sleeve({length: bottom, tubeId: d.od - 2 * d.wall, coax: cables[p.feed.coax], q: p.feed.q});
  return {
    wavelength,
    sleeve: {
      length: bottom, tubeId: d.od - 2 * d.wall, coax: p.feed.coax,
      z0: sl.z0, vf: sl.vf, f0: sl.f0, L: sl.L, C: sl.C, R: sl.R,
      x: sl.z(p.freq).im,                     // ohm, lossless stub reactance at design freq
      lengthQW: sl.vf * C / (4 * p.freq)      // sleeve length for quarter-wave stub at freq
    },
    driven: {
      length: d.length, top, bottom, gap: d.gap, od: d.od,
      lengthLambda: d.length / wavelength
    },
    parasitic: {
      n: q.n, length: q.length, od: q.od, radius: q.radius, tilt: q.tilt,
      lengthLambda: q.length / wavelength,
      radiusLambda: q.radius / wavelength,
      dz: q.length * Math.sin(t),          // vertical span of one element
      dh: q.length * Math.cos(t),          // horizontal span (chord along tangent)
      rTip: Math.hypot(q.radius, q.length * Math.cos(t) / 2), // axis -> element tip (horizontal)
      clearance: q.radius - (d.od + q.od) / 2 // element surface -> driven surface (closest)
    }
  };
};

// geometry: driven = {bottom: [a, b], top: [a, b]} along z; parasitic = [{a, b, center, phi}]
const geometry = (p, dims) => {
  const q = p.parasitic, dd = dims.driven;
  const s = tiltSign[p.polarization];
  const t = rad(q.tilt);
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
    const dir = v3.add(v3.mul(tang, Math.cos(t)), [0, 0, s * Math.sin(t)]);
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

module.exports = {tiltSign, defaults, params, normalize, dimensions, geometry, calc};
