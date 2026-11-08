'use strict';

// Generic NEC2 deck builder (nec2++). Geometry in mm, deck in meters.
// Antenna modules produce wires [{a, b, radius, feed?, mast?}] -> build() -> deck text.

const nec2 = require('./nec2.js');
const {dist} = require('./geom.js');
const {C} = require('./util.js');

const grounds = {
  free: null,
  poor: {eps: 5, sig: 0.001},
  average: {eps: 13, sig: 0.005},
  good: {eps: 20, sig: 0.0303}
};

const necDefaults = {
  segPerLambda: 40,      // max segment = lambda(f max) / segPerLambda
  sweep: {span: 0.05, steps: 41}, // f0 * (1 +- span), steps points
  pattern: {dTheta: 2, nPhi: 4, dPhi: 90} // elevation cuts
};

const fmt = x => +x.toFixed(6);

const groundOf = env => {
  const name = (env && env.ground) || 'free';
  const gnd = grounds[name];
  if (gnd === undefined) { throw new Error('unknown ground: ' + name); }
  return gnd;
};

// frequency plan: sweep f0 +- span, max segment from highest frequency
const plan = (p, o) => {
  const fLo = p.freq * (1 - o.sweep.span);
  const fHi = p.freq * (1 + o.sweep.span);
  const lambdaMin = C / Math.max(fHi, p.band[1]); // mm
  return {fLo, fHi, steps: o.sweep.steps, maxSeg: lambdaMin / o.segPerLambda};
};

// vertical placement: roof at zRoof (0 in free space), antenna bottom env.height above roof
const place = (env, gnd, zMin) => {
  const zRoof = gnd ? (env.roof || 4000) : 0;
  const dz = zRoof + (env.height || 1500) - zMin;
  return {zRoof, dz};
};

// mast + coax (taped) as one floating metal wire on axis, from roof up
const mastWires = (env, zRoof) => {
  const m = env.mast || {};
  if (!(m.metal > 0)) { return []; }
  return [{a: [0, 0, zRoof], b: [0, 0, zRoof + m.metal], radius: (m.od || 40) / 2, mast: true}];
};

// opts: {comments, wires, gnd, maxSeg, sweep: {fLo, fHi, steps}, patFreqs, pattern}
// wire.feed: {sign} -> odd segment count, voltage source on center segment
const build = opts => {
  const {wires, gnd, maxSeg} = opts;
  const cards = opts.comments.map(c => nec2.comment(c));
  cards.push(nec2.commentEnd());
  const feeds = [];
  wires.forEach((w, i) => {
    const tag = i + 1;
    // thick mast: segment >= 4 radius (thin-wire kernel)
    const segMax = w.mast ? Math.max(maxSeg, 4 * w.radius) : maxSeg;
    let nSeg = Math.max(1, Math.ceil(dist(w.a, w.b) / segMax));
    if (w.feed) {
      nSeg = Math.max(3, nSeg + ((nSeg + 1) % 2)); // odd -> center segment
      feeds.push({...w.feed, tag, seg: (nSeg + 1) / 2});
    }
    w.tag = tag;
    w.nSeg = nSeg;
    cards.push(nec2.specWire({
      tag, numberOfSegments: nSeg,
      w: [w.a, w.b].map(q => ({x: fmt(q[0] / 1000), y: fmt(q[1] / 1000), z: fmt(q[2] / 1000)})),
      radius: fmt(w.radius / 1000)
    }));
  });
  cards.push(nec2.specEndGround(gnd ? -1 : 0));
  if (gnd) { cards.push(nec2.ground({type: 2, eps: gnd.eps, sig: gnd.sig})); }
  feeds.forEach(f => cards.push(nec2.excitation({type: 'voltage', tag: f.tag, index: f.seg, v: {re: f.sign, im: 0}})));

  // impedance sweep
  const {fLo, fHi, steps} = opts.sweep;
  cards.push(nec2.freq({step: {type: 'linear', count: steps}, freq: fmt(fLo), incr: fmt((fHi - fLo) / (steps - 1))}));
  cards.push(nec2.execute());

  // patterns: theta 0..90 (ground) or 0..180 (free space)
  const pt = opts.pattern;
  const nTheta = Math.round((gnd ? 90 : 180) / pt.dTheta) + 1;
  opts.patFreqs.forEach(f => {
    cards.push(nec2.freq({step: {type: 'linear', count: 1}, freq: fmt(f), incr: 0}));
    cards.push(nec2.pattern({nTheta, nPhi: pt.nPhi, theta0: 0, phi0: 0, dTheta: pt.dTheta, dPhi: pt.dPhi}));
  });
  cards.push(nec2.theEnd());

  return {
    text: cards.join('\n') + '\n',
    wires, feeds, maxSeg,
    sweep: opts.sweep,
    patFreqs: opts.patFreqs,
    segments: wires.reduce((s, w) => s + w.nSeg, 0)
  };
};

module.exports = {grounds, necDefaults, fmt, groundOf, plan, place, mastWires, build};
