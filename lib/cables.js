'use strict';

// Coax cables used as QFH loop conductors. mm.
// od: jacket outer diameter (Coppens length correction uses this)
// braidOd: outer diameter of braid = current-carrying surface (NEC wire radius = braidOd / 2)
// jacketEr: jacket dielectric constant (sleeve choke stub: coax shield inside tube)
// values approximate, TODO verify vs datasheets
const cables = {
  'RG-58': {od: 4.95, braidOd: 3.6, z0: 50, vf: 0.66, minBend: 25, jacketEr: 3.0},
  'RG-213': {od: 10.3, braidOd: 8.0, z0: 50, vf: 0.66, minBend: 50, jacketEr: 3.0},
  'RG-6': {od: 6.9, braidOd: 5.4, z0: 75, vf: 0.82, minBend: 35, jacketEr: 3.0},
  'RG-316': {od: 2.5, braidOd: 2.0, z0: 50, vf: 0.69, minBend: 13, jacketEr: 2.1},
  'LMR-240': {od: 6.1, braidOd: 4.8, z0: 50, vf: 0.84, minBend: 19, jacketEr: 2.3}
};

// conductor -> NEC radius, mm
const wireRadius = conductor => {
  if (conductor.braidOd) { return conductor.braidOd / 2; }
  const c = cables[conductor.name];
  if (c) { return c.braidOd / 2; }
  return conductor.od / 2; // tube / bare wire
};

module.exports = {cables, wireRadius};
