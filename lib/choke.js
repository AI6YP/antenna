'use strict';

// Sleeve choke: coax inside bottom dipole tube, shield bonded to tube at top (feed gap),
// open at bottom -> shorted coaxial stub (tube inner wall / coax shield), jacket as layered dielectric.
// Input impedance at sleeve mouth Z = j Z0 tan(beta l); near quarter-wave ~ parallel RLC.
// Units: mm, MHz, ohm, H, F.

const {C} = require('./util.js');

const MU0 = 4e-7 * Math.PI;
const EPS0 = 8.8541878128e-12;

// b: tube inner radius, a: shield (braid) radius, j: jacket radius, er: jacket dielectric
const stubLine = ({b, a, j, er}) => {
  if (!(b > j && j >= a && a > 0)) { throw new Error('sleeve: need tube ID > coax OD'); }
  const Lp = MU0 / (2 * Math.PI) * Math.log(b / a);                      // H/m
  const Cp = 2 * Math.PI * EPS0 / (Math.log(j / a) / er + Math.log(b / j)); // F/m
  const vf = 1 / (Math.sqrt(Lp * Cp) * C * 1e3); // C in mm/us -> m/s = C * 1e3
  return {z0: Math.sqrt(Lp / Cp), vf, erEff: 1 / (vf * vf)};
};

// sleeve: {length, tubeId, coax: {od, braidOd, jacketEr}, q}
const sleeve = s => {
  const line = stubLine({b: s.tubeId / 2, a: s.coax.braidOd / 2, j: s.coax.od / 2, er: s.coax.jacketEr || 1});
  const f0 = line.vf * C / (4 * s.length);       // MHz, quarter-wave resonance
  const w0 = 2 * Math.PI * f0 * 1e6;
  const cap = Math.PI / (4 * w0 * line.z0);       // F
  const ind = 1 / (w0 * w0 * cap);                // H
  const q = s.q || 100;
  const res = q * w0 * ind;                       // ohm, parallel R
  // exact lossless stub impedance at f (MHz)
  const z = f => {
    const th = 2 * Math.PI * f * s.length / (line.vf * C);
    return {re: 0, im: line.z0 * Math.tan(th)};
  };
  return {z0: line.z0, vf: line.vf, length: s.length, f0, L: ind, C: cap, R: res, q, z};
};

module.exports = {stubLine, sleeve};
