'use strict';

// QFH (quadrifilar helix) calculator.
// Pure functions, no deps, CommonJS. Paste-able into an ObservableHQ cell.
// Units: lengths in mm, frequency in MHz, angles in degrees (unless noted).

const C = 299792.458; // speed of light, mm * MHz

const defaults = {
  freq: 435.5,          // design center frequency, MHz
  band: [432.1, 438.0], // MHz, for NEC sweep / optimizer
  turns: 0.5,           // helix turns over loop height
  ratioDH: 0.44,        // diameter / height
  loopFactors: {big: 1.026, small: 0.975}, // loop length / compensated wavelength (Coppens)
  turnLength: 1,        // loop length in wavelengths (1, 1.5, 2)
  c: C,                 // speed of light used (jcoppens: 300000)
  conductor: {type: 'coax', od: 6.9}, // mm, outer diameter
  bendRadius: 30,       // mm, fixed input
  polarization: 'RHCP',
  feed: 'infinite-balun',
  frame: {standard: 'BY', mast: 32, arm: 20}, // mm, PVC OD
  env: {ground: 'poor', height: 1500, mast: {metal: 1000, pvc: 500}} // mm
};

const isObj = o => o !== null && typeof o === 'object' && !Array.isArray(o);

const merge = (a, b) => {
  const res = {...a};
  for (const key of Object.keys(b || {})) {
    res[key] = (isObj(a[key]) && isObj(b[key])) ? merge(a[key], b[key]) : b[key];
  }
  return res;
};

const normalize = input => {
  const p = merge(defaults, input);
  if (!(p.freq > 0)) { throw new Error('freq must be > 0 MHz'); }
  if (!(p.turns > 0)) { throw new Error('turns must be > 0'); }
  if (!(p.ratioDH > 0)) { throw new Error('ratioDH must be > 0'); }
  if (!(p.loopFactors.big > p.loopFactors.small)) { throw new Error('loopFactors.big must be > loopFactors.small'); }
  if (!(p.conductor.od > 0)) { throw new Error('conductor.od must be > 0 mm'); }
  if (!(p.bendRadius >= 0)) { throw new Error('bendRadius must be >= 0 mm'); }
  if (!['RHCP', 'LHCP'].includes(p.polarization)) {
    throw new Error('polarization must be RHCP or LHCP');
  }
  return p;
};

const lambda = freq => C / freq; // mm

// Length correction vs conductor diameter, 0..16 mm, 1 mm step (Coppens table)
const deltaTable = [
  1.045, 1.053, 1.060, 1.064, 1.068, 1.070, 1.070, 1.071,
  1.071, 1.070, 1.070, 1.070, 1.070, 1.069, 1.069, 1.068,
  1.067
];

// linear interpolation, diameter clamped to [0, 15] mm (as jcoppens)
const delta = od => {
  const d = Math.max(0, Math.min(15, od));
  const i = Math.floor(d);
  return deltaTable[i] + (deltaTable[i + 1] - deltaTable[i]) * (d - i);
};

// corner: length saved by bending radius R vs sharp 90 deg corner
const bendCorrection = R => 2 * R - Math.PI * R / 2;

// one bifilar loop: 2 horizontal (D) + 2 helical sides
// side = sqrt(H^2 + (turns * pi * D)^2), H = D / ratioDH
const loop = (lc, k, p) => {
  const R = p.bendRadius;
  const total = lc * k;                       // electrical loop length
  const totalC = total + 4 * bendCorrection(R); // conductor cut length
  const D = 0.5 * totalC / (1 + Math.sqrt(1 / (p.ratioDH ** 2) + (p.turns * Math.PI) ** 2));
  const side = (totalC - 2 * D) / 2;
  return {
    total,          // loop length before bend compensation
    totalC,         // conductor length to cut
    D,              // horizontal separation (center to center) = helix diameter
    Dc: D - 2 * R,  // straight horizontal part (crossarm, hole to hole)
    Di: D - p.conductor.od, // internal diameter
    H: D / p.ratioDH,       // antenna (loop) height
    side,           // helical side length incl. bends
    sideC: side - 2 * R     // straight helical part, without bends
  };
};

// Classic Coppens dimensions. All mm.
const dimensions = p => {
  const wavelength = p.c / p.freq;
  const wavelengthC = p.turnLength * wavelength * delta(p.conductor.od);
  return {
    wavelength,
    wavelengthC,
    bendCorr: bendCorrection(p.bendRadius),
    optDiam: 0.0088 * wavelengthC, // Coppens "optimum" conductor diameter
    big: loop(wavelengthC, p.loopFactors.big, p),
    small: loop(wavelengthC, p.loopFactors.small, p)
  };
};

// ---- 3D geometry -------------------------------------------------------
// Coordinates mm, z up. Feed at top: top of big loop at z = dims.big.H,
// small loop top offset down by crossarm OD (arms cross at the mast).
// Each loop = closed polyline starting/ending at its top center (feed gap):
//   top radial out -> corner -> helix down -> corner -> bottom horizontal
//   through axis -> corner -> helix up -> corner -> top radial in.
// Corners: 90 deg fillet of radius bendRadius, cornerSteps linear pieces (pi/8 each).
//
// twist: +1 -> going down the helix, azimuth increases (CCW seen from above),
// i.e. left-handed helix.
// feedSign: polarity of loop source (+1: positive from the phi0+pi half to the phi0 half).
// Verified in NEC (free space, 435.5 MHz): twist +1 with small loop feed -1 -> RHCP up
// (+4.4 dBic zenith, F/B 12.5 dB). Rule: small loop feed sign = -twist.
const twistSign = {RHCP: +1, LHCP: -1};

const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => v3.mul(a, 1 / v3.len(a))
};

const polylineLength = pts => {
  let res = 0;
  for (let i = 1; i < pts.length; i++) { res += v3.len(v3.sub(pts[i], pts[i - 1])); }
  return res;
};

// 90 deg fillet at corner P: in along dIn, out along dOut (unit, dIn ⊥ dOut).
// returns n+1 points from P - R dIn to P + R dOut
const fillet = (P, dIn, dOut, R, n) => {
  const C = v3.add(v3.sub(P, v3.mul(dIn, R)), v3.mul(dOut, R));
  const res = [];
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) * i / n;
    res.push(v3.add(C, v3.add(v3.mul(dOut, -R * Math.cos(a)), v3.mul(dIn, R * Math.sin(a)))));
  }
  return res;
};

// helix on cylinder radius r, from (phiTop, zTop) down to zTop - H, rotating sgn * 2 pi turns
const helix = (r, phiTop, zTop, H, turns, sgn) => {
  const dphi = sgn * 2 * Math.PI * turns;
  const L = Math.hypot(H, r * Math.abs(dphi)); // arc length
  const at = s => { // s: arc length from top
    const t = s / L, phi = phiTop + dphi * t;
    return [r * Math.cos(phi), r * Math.sin(phi), zTop - H * t];
  };
  const tangent = s => { // unit, pointing down the helix
    const phi = phiTop + dphi * s / L;
    return v3.norm([-r * dphi * Math.sin(phi), r * dphi * Math.cos(phi), -H]);
  };
  return {L, at, tangent};
};

const loopPath = (l, phi0, zTop, p, o) => {
  const r = l.D / 2, R = p.bendRadius, n = o.cornerSteps;
  const sgn = twistSign[p.polarization];
  const radial = phi => [Math.cos(phi), Math.sin(phi), 0];
  const nHelix = Math.max(1, Math.ceil((Math.hypot(l.H, Math.PI * p.turns * l.D) - 2 * R) / o.maxSeg));
  const pts = [[0, 0, zTop]];

  const side = (phiTop, up) => {
    const h = helix(r, phiTop, zTop, l.H, p.turns, sgn);
    const sTop = R, sBot = h.L - R;
    const ss = [];
    for (let i = 0; i <= nHelix; i++) { ss.push(sTop + (sBot - sTop) * i / nHelix); }
    if (up) { ss.reverse(); }
    return {h, ss};
  };

  // side A: down from phi0
  {
    const {h, ss} = side(phi0, false);
    const P = h.at(0);
    pts.push(...fillet(P, radial(phi0), h.tangent(0), R, n).slice(0, n));
    ss.forEach(s => pts.push(h.at(s)));
    const Q = h.at(h.L), phiB = phi0 + sgn * 2 * Math.PI * p.turns;
    pts.push(...fillet(Q, h.tangent(h.L), v3.mul(radial(phiB), -1), R, n).slice(1));
    pts.push([0, 0, zTop - l.H]); // bottom center (continuous)
  }
  // side B: up to phi0 + pi
  {
    const {h, ss} = side(phi0 + Math.PI, true);
    const phiB = phi0 + Math.PI + sgn * 2 * Math.PI * p.turns;
    const Q = h.at(h.L);
    pts.push(...fillet(Q, radial(phiB), v3.mul(h.tangent(h.L), -1), R, n).slice(0, n));
    ss.forEach(s => pts.push(h.at(s)));
    const P = h.at(0);
    pts.push(...fillet(P, v3.mul(h.tangent(0), -1), v3.mul(radial(phi0 + Math.PI), -1), R, n).slice(1));
  }
  pts.push([0, 0, zTop]);
  return pts;
};

const geometryDefaults = {
  cornerSteps: 4,    // 90 deg / 4 = pi/8 per linear piece
  maxSeg: null,      // max helix piece, mm (default lambda / 40)
  topOffset: null    // small loop top below big loop top, mm (default frame.arm)
};

const geometry = (p, dims, opts) => {
  const o = {...geometryDefaults, ...opts};
  if (o.maxSeg === null) { o.maxSeg = dims.wavelength / 40; }
  if (o.topOffset === null) { o.topOffset = p.frame.arm; }
  const zBig = dims.big.H;
  const zSmall = zBig - o.topOffset;
  const loops = [
    {name: 'big', phi0: 0, zTop: zBig, zBottom: zBig - dims.big.H, points: loopPath(dims.big, 0, zBig, p, o)},
    {name: 'small', phi0: Math.PI / 2, zTop: zSmall, zBottom: zSmall - dims.small.H, points: loopPath(dims.small, Math.PI / 2, zSmall, p, o)}
  ];
  const tw = twistSign[p.polarization];
  loops[0].feedSign = 1;
  loops[1].feedSign = -tw;
  loops.forEach(l => {
    l.length = polylineLength(l.points);
    l.feed = {point: l.points[0], dir: [Math.cos(l.phi0), Math.sin(l.phi0), 0]};
  });
  return {opts: o, twist: tw, loops};
};

const calc = input => {
  const p = normalize(input);
  const dims = dimensions(p);
  return {
    input: p,
    dims,
    geometry: geometry(p, dims)
  };
};

module.exports = {
  C,
  defaults,
  merge,
  normalize,
  lambda,
  deltaTable,
  delta,
  bendCorrection,
  dimensions,
  twistSign,
  fillet,
  polylineLength,
  geometry,
  calc
};
