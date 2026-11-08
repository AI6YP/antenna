'use strict';

// Parasitic Lindenblad -> NEC2 deck (nec2++). mm in, meters in deck.
// Driven: bottom sleeve wire + 1-segment feed wire (centered on gap, gap filled) + top wire.
// Coax inside sleeve: ideal choke (nothing below sleeve except mast after PVC section).
// Mast: metal wire from roof, PVC section (not modeled), antenna bottom at metal + pvc above roof.

const nd = require('./nec-deck.js');
const sim = require('./sim.js');
const {translate} = require('./geom.js');
const {cables} = require('./cables.js');

// azimuth rings for ripple (N-fold symmetry: N = 3/4/5 -> period 120/90/72 deg)
const necDefaults = {...nd.necDefaults, azimuth: {elev: [0, 10, 20, 30], dPhi: 3}, sphere: {dTheta: 5, dPhi: 5}};
const {grounds} = nd;

const deck = (res, opts) => {
  const o = {...necDefaults, ...opts};
  const p = res.input;
  const g = res.geometry;
  const env = p.env || {};
  const gnd = nd.groundOf(env);
  const fp = nd.plan(p, o);
  const m = env.mast || {};
  const height = (m.metal > 0) ? m.metal + (m.pvc || 0) : (env.height || 1500);
  const {zRoof, dz} = nd.place({...env, height}, gnd, g.zBottom);
  const sh = q => translate(q, [0, 0, dz]);

  const dr = g.driven;
  const rD = dr.od / 2;
  const s = Math.min(fp.maxSeg, dr.top[1][2] / 2, -dr.bottom[0][2] / 2); // feed segment length
  const wires = [
    {a: sh(dr.bottom[0]), b: sh([0, 0, -s / 2]), radius: rD, part: 'sleeve'},
    {a: sh([0, 0, -s / 2]), b: sh([0, 0, s / 2]), radius: rD, part: 'feed', feed: {sign: 1, nSeg: 1}},
    {a: sh([0, 0, s / 2]), b: sh(dr.top[1]), radius: rD, part: 'top'}
  ];
  g.parasitic.forEach(e => wires.push({a: sh(e.a), b: sh(e.b), radius: e.od / 2, part: 'parasitic', k: e.k}));
  // coax from sleeve mouth down through PVC section to mast top (or roof)
  const mouth = sh(dr.bottom[0]);
  const zMast = zRoof + (m.metal > 0 ? m.metal : 0);
  if (p.feed.choke !== 'ideal' && mouth[2] - zMast > 1) {
    const sl = res.dims.sleeve;
    const coax = {a: mouth, b: [0, 0, zMast], radius: cables[p.feed.coax].od / 2, part: 'coax'};
    if (p.feed.choke === 'sleeve') { coax.load = {type: 'parallel', R: sl.R, L: sl.L, C: sl.C, seg: 1}; }
    wires.push(coax);
  }
  wires.push(...nd.mastWires(env, zRoof));

  const d = p.driven, q = p.parasitic;
  const dd = res.dims.driven;
  const out = nd.build({
    comments: [
      'Parasitic Lindenblad ' + p.freq + ' MHz, ' + p.polarization,
      'driven L ' + +dd.length.toFixed(2) + ' (top ' + +dd.top.toFixed(2) + ', sleeve ' + +dd.bottom.toFixed(2) +
        (res.dims.sleeve.auto ? ' auto' : '') + ', gap ' + d.gap + ') od ' + d.od + ' mm',
      'parasitic n ' + q.n + ' L ' + q.length + ' od ' + q.od + ' r ' + q.radius + ' tilt ' + q.tilt + ' lean ' + q.lean + ' z ' + q.z + ' mm',
      'feed stray C ' + p.feed.strayC + ' pF (applied in post-processing), coax ' + p.feed.coax + ', choke ' + p.feed.choke +
        (p.feed.choke === 'sleeve' ? ' (f0 ' + res.dims.sleeve.f0.toFixed(1) + ' MHz, Z0 ' + res.dims.sleeve.z0.toFixed(1) + ' ohm, Q ' + p.feed.q + ')' : ''),
      'ground ' + (env.ground || 'free') + (gnd ? ', roof ' + zRoof + ' mm' : '') +
        ', mast metal ' + (m.metal || 0) + ' pvc ' + (m.pvc || 0) + ' mm'
    ],
    wires, gnd,
    maxSeg: fp.maxSeg,
    sweep: {fLo: fp.fLo, fHi: fp.fHi, steps: fp.steps},
    patFreqs: [p.band[0], p.freq, p.band[1]],
    pattern: o.pattern,
    azimuth: o.azimuth,
    sphere: o.sphere
  });
  return {...out, dz, zRoof, shuntC: (p.feed.strayC || 0) * 1e-12};
};

const summarize = sim.summarize;
const simulate = (res, opts = {}) => sim.simulate(deck, res, opts);

module.exports = {grounds, necDefaults, deck, summarize, simulate};
