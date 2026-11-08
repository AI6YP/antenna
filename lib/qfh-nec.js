'use strict';

// QFH -> NEC2 deck (nec2++). Geometry in mm from qfh.geometry, NEC in meters.

const nec2 = require('./nec2.js');
const {wireRadius} = require('./cables.js');

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

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

const fmt = x => +x.toFixed(6);

// polyline -> wire pieces; first + last pieces (collinear through top center) merged into feed wire
const loopWires = loop => {
  const pts = loop.points;
  const n = pts.length;
  // pts[0] == pts[n-1] == top center; feed wire: pts[n-2] -> pts[1]
  const wires = [{a: pts[n - 2], b: pts[1], feed: true}];
  for (let i = 1; i < n - 2; i++) { wires.push({a: pts[i], b: pts[i + 1]}); }
  return wires;
};

// mast + coax (taped) as one floating metal wire on axis
const mastWires = (env, zRoof) => {
  const m = env.mast || {};
  if (!(m.metal > 0)) { return []; }
  return [{a: [0, 0, zRoof], b: [0, 0, zRoof + m.metal], radius: (m.od || 40) / 2, mast: true}];
};

const deck = (res, opts) => {
  const o = {...necDefaults, ...opts};
  const p = res.input;
  const g = res.geometry;
  const env = p.env || {};
  const gnd = grounds[env.ground || 'free'];
  if (gnd === undefined) { throw new Error('unknown ground: ' + env.ground); }

  const f0 = p.freq;
  const fLo = f0 * (1 - o.sweep.span);
  const fHi = f0 * (1 + o.sweep.span);
  const lambdaMin = 299792.458 / Math.max(fHi, p.band[1]); // mm
  const maxSeg = lambdaMin / o.segPerLambda;

  // vertical placement: roof at zRoof (0 in free space), antenna bottom env.height above roof
  const zRoof = gnd ? (env.roof || 4000) : 0;
  const zMin = Math.min(...g.loops.map(l => l.zBottom));
  const dz = zRoof + (env.height || 1500) - zMin;
  const sh = q => [q[0], q[1], q[2] + dz];

  const r = wireRadius(p.conductor);
  const wires = [];
  const feeds = [];
  g.loops.forEach(loop => {
    loopWires(loop).forEach(w => {
      wires.push({...w, a: sh(w.a), b: sh(w.b), radius: r, loop: loop.name, feedSign: loop.feedSign});
    });
  });
  wires.push(...mastWires(env, zRoof));

  const cards = [
    nec2.comment('QFH ' + f0 + ' MHz, turns ' + p.turns + ', D/H ' + p.ratioDH + ', ' + p.polarization),
    nec2.comment('conductor ' + (p.conductor.name || '') + ' od ' + p.conductor.od + ' mm, wire radius ' + r + ' mm, bend R ' + p.bendRadius + ' mm'),
    nec2.comment('ground ' + (env.ground || 'free') + (gnd ? ', roof ' + zRoof + ' mm' : '')),
    nec2.commentEnd()
  ];
  wires.forEach((w, i) => {
    const tag = i + 1;
    // thick mast: segment >= 4 radius (thin-wire kernel)
    const segMax = w.mast ? Math.max(maxSeg, 4 * w.radius) : maxSeg;
    let nSeg = Math.max(1, Math.ceil(len(w.a, w.b) / segMax));
    if (w.feed) {
      nSeg = Math.max(3, nSeg + ((nSeg + 1) % 2)); // odd -> center segment on axis
      feeds.push({loop: w.loop, tag, seg: (nSeg + 1) / 2, sign: w.feedSign});
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
  const steps = o.sweep.steps;
  cards.push(nec2.freq({step: {type: 'linear', count: steps}, freq: fmt(fLo), incr: fmt((fHi - fLo) / (steps - 1))}));
  cards.push(nec2.execute());

  // patterns: band edges + center
  const pt = o.pattern;
  const nTheta = Math.round((gnd ? 90 : 180) / pt.dTheta) + 1;
  const patFreqs = [p.band[0], f0, p.band[1]];
  patFreqs.forEach(f => {
    cards.push(nec2.freq({step: {type: 'linear', count: 1}, freq: fmt(f), incr: 0}));
    cards.push(nec2.pattern({nTheta, nPhi: pt.nPhi, theta0: 0, phi0: 0, dTheta: pt.dTheta, dPhi: pt.dPhi}));
  });
  cards.push(nec2.theEnd());

  return {
    text: cards.join('\n') + '\n',
    wires, feeds, maxSeg, dz, zRoof,
    sweep: {fLo, fHi, steps},
    patFreqs,
    segments: wires.reduce((s, w) => s + w.nSeg, 0)
  };
};

const necout = require('./necout.js');

// summarize nec2++ output text
const summarize = (out, d, opts = {}) => {
  const blocks = necout.parse(out);
  const z0 = opts.z0 || 50;
  const sweep = blocks.filter(b => !b.pattern.length).map(b => {
    const z = necout.parallelZ(b.inputs);
    return {freq: b.freq, z, swr: necout.swr(z, z0), loops: b.inputs.map(x => ({tag: x.tag, z: x.z}))};
  });
  const patterns = blocks.filter(b => b.pattern.length).map(b => ({
    freq: b.freq,
    points: b.pattern.map(pt => ({theta: pt.theta, phi: pt.phi, total: pt.total, ...necout.circular(pt)}))
  }));
  return {deck: d, sweep, patterns, warnings: (out.match(/WARNING/g) || []).length};
};

// run nec2++ (node only; runner injectable, e.g. WASM in browser)
const simulate = (res, opts = {}) => {
  const d = deck(res, opts);
  const run = opts.run || (text => require('./necpp.js').run(text, opts).out);
  return summarize(run(d.text), d, opts);
};

module.exports = {grounds, necDefaults, loopWires, deck, summarize, simulate};
