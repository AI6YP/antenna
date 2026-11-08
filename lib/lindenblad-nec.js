'use strict';

// Parasitic Lindenblad -> NEC2 deck (nec2++). mm in, meters in deck.
// Driven: bottom sleeve wire + 1-segment feed wire (centered on gap, gap filled) + top wire.
// Coax inside sleeve: ideal choke (nothing below sleeve except mast after PVC section).
// Mast: metal wire from roof, PVC section (not modeled), antenna bottom at metal + pvc above roof.

const nd = require('./nec-deck.js');
const sim = require('./sim.js');
const {translate} = require('./geom.js');

const {grounds, necDefaults} = nd;

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
  wires.push(...nd.mastWires(env, zRoof));

  const d = p.driven, q = p.parasitic;
  const dd = res.dims.driven;
  const out = nd.build({
    comments: [
      'Parasitic Lindenblad ' + p.freq + ' MHz, ' + p.polarization,
      'driven L ' + d.length + ' (top ' + +dd.top.toFixed(2) + ', sleeve ' + +dd.bottom.toFixed(2) + ') od ' + d.od + ' mm',
      'parasitic n ' + q.n + ' L ' + q.length + ' od ' + q.od + ' r ' + q.radius + ' tilt ' + q.tilt + ' z ' + q.z + ' mm',
      'ground ' + (env.ground || 'free') + (gnd ? ', roof ' + zRoof + ' mm' : '') +
        ', mast metal ' + (m.metal || 0) + ' pvc ' + (m.pvc || 0) + ' mm'
    ],
    wires, gnd,
    maxSeg: fp.maxSeg,
    sweep: {fLo: fp.fLo, fHi: fp.fHi, steps: fp.steps},
    patFreqs: [p.band[0], p.freq, p.band[1]],
    pattern: o.pattern
  });
  return {...out, dz, zRoof};
};

const summarize = sim.summarize;
const simulate = (res, opts = {}) => sim.simulate(deck, res, opts);

module.exports = {grounds, necDefaults, deck, summarize, simulate};
