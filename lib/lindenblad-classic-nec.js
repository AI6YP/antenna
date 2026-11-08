'use strict';

// Classic Lindenblad -> NEC2 deck (nec2++). mm in, meters in deck.
// Each folded dipole = 4 wires: fed conductor (voltage source on center segment, all N in phase),
// end wire, other conductor (same segment count, aligned), end wire.
// Phasing lines + hub + match not in NEC: post-processed (deck.zPost, lib/lindenblad-classic.js network).
// By N-fold symmetry all dipole Z equal -> equal lines deliver equal voltages, so equal NEC sources
// are exact for the pattern. Lines assumed balanced + non-radiating, ideal balun at hub (no coax wire).
// Mast: metal wire from roof; PVC section (not modeled) up to the antenna bottom (lowest element point).

const nd = require('./nec-deck.js');
const sim = require('./sim.js');
const {translate, dist} = require('./geom.js');
const {network} = require('./lindenblad-classic.js');

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

  const wires = [];
  for (const e of g.elements) {
    const n0 = Math.max(3, Math.ceil(dist(e.fed[0], e.fed[1]) / fp.maxSeg));
    const nSeg = n0 + ((n0 + 1) % 2); // odd -> source on center segment
    const nEnd = Math.max(1, Math.round(dist(e.fed[1], e.other[1]) / fp.maxSeg)); // short: 1 segment
    const r1 = e.od / 2, r2 = e.od2 / 2, rEnd = Math.min(r1, r2);
    wires.push(
      {a: sh(e.fed[0]), b: sh(e.fed[1]), radius: r1, part: 'fed', k: e.k, feed: {sign: 1, nSeg}},
      {a: sh(e.fed[1]), b: sh(e.other[1]), radius: rEnd, part: 'end', k: e.k, segs: nEnd},
      {a: sh(e.other[1]), b: sh(e.other[0]), radius: r2, part: 'other', k: e.k, segs: nSeg},
      {a: sh(e.other[0]), b: sh(e.fed[0]), radius: rEnd, part: 'end', k: e.k, segs: nEnd}
    );
  }
  wires.push(...nd.mastWires(env, zRoof));

  const q = p.element, ln = res.dims.line, mt = res.dims.match;
  const out = nd.build({
    comments: [
      'Classic Lindenblad ' + p.freq + ' MHz, ' + p.polarization + ', ' + q.n + ' folded dipoles',
      'element L ' + q.length + ' od ' + q.od + ' od2 ' + res.dims.element.od2 + ' spacing ' + q.spacing + ' fold ' + q.fold +
        ' r ' + q.radius + ' tilt ' + q.tilt + ' lean ' + q.lean + ' z ' + q.z + ' mm',
      'lines ' + ln.z0 + ' ohm vf ' + ln.vf + ' L ' + +ln.length.toFixed(2) + (ln.auto ? ' auto' : '') + ' mm, match ' + mt.type +
        (mt.type === 'qwt' ? ' ' + p.match.z0 + ' ohm L ' + +mt.length.toFixed(2) + ' mm' : '') +
        ', stray C ' + p.feed.strayC + ' pF (post-processing)',
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
  const zPost = (inputs, f) => network(inputs.map(x => x.z), f, p, res.dims);
  return {...out, dz, zRoof, zPost};
};

const summarize = sim.summarize;
const simulate = (res, opts = {}) => sim.simulate(deck, res, opts);

module.exports = {grounds, necDefaults, deck, summarize, simulate};
