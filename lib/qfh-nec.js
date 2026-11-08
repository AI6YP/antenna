'use strict';

// QFH -> NEC2 deck (nec2++). Geometry in mm from qfh.geometry, NEC in meters.

const nd = require('./nec-deck.js');
const sim = require('./sim.js');
const {wireRadius} = require('./cables.js');
const {translate} = require('./geom.js');

const {grounds, necDefaults} = nd;

// polyline -> wire pieces; first + last pieces (collinear through top center) merged into feed wire
const loopWires = loop => {
  const pts = loop.points;
  const n = pts.length;
  // pts[0] == pts[n-1] == top center; feed wire: pts[n-2] -> pts[1]
  const wires = [{a: pts[n - 2], b: pts[1], feed: true}];
  for (let i = 1; i < n - 2; i++) { wires.push({a: pts[i], b: pts[i + 1]}); }
  return wires;
};

const deck = (res, opts) => {
  const o = {...necDefaults, ...opts};
  const p = res.input;
  const g = res.geometry;
  const env = p.env || {};
  const gnd = nd.groundOf(env);
  const fp = nd.plan(p, o);
  const zMin = Math.min(...g.loops.map(l => l.zBottom));
  const {zRoof, dz} = nd.place(env, gnd, zMin);
  const sh = q => translate(q, [0, 0, dz]);

  const r = wireRadius(p.conductor);
  const wires = [];
  g.loops.forEach(loop => {
    loopWires(loop).forEach(w => {
      wires.push({
        a: sh(w.a), b: sh(w.b), radius: r, loop: loop.name, feedSign: loop.feedSign,
        feed: w.feed ? {loop: loop.name, sign: loop.feedSign} : undefined
      });
    });
  });
  wires.push(...nd.mastWires(env, zRoof));

  const d = nd.build({
    comments: [
      'QFH ' + p.freq + ' MHz, turns ' + p.turns + ', D/H ' + p.ratioDH + ', ' + p.polarization,
      'conductor ' + (p.conductor.name || '') + ' od ' + p.conductor.od + ' mm, wire radius ' + r + ' mm, bend R ' + p.bendRadius + ' mm',
      'ground ' + (env.ground || 'free') + (gnd ? ', roof ' + zRoof + ' mm' : '')
    ],
    wires, gnd,
    maxSeg: fp.maxSeg,
    sweep: {fLo: fp.fLo, fHi: fp.fHi, steps: fp.steps},
    patFreqs: [p.band[0], p.freq, p.band[1]],
    pattern: o.pattern
  });
  return {...d, dz, zRoof};
};

const summarize = sim.summarize;
const simulate = (res, opts = {}) => sim.simulate(deck, res, opts);

module.exports = {grounds, necDefaults, loopWires, deck, summarize, simulate};
