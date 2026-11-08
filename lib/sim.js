'use strict';

// NEC output -> summary (Z, SWR, RHCP/LHCP, AR); run via nec2++ (native) or injected runner (WASM).

const necout = require('./necout.js');

// summarize nec2++ output text; feeds in parallel -> Z = 1 / sum(Y)
const summarize = (out, d, opts = {}) => {
  const blocks = necout.parse(out);
  const z0 = opts.z0 || 50;
  const sweep = blocks.filter(b => !b.pattern.length).map(b => {
    const z = necout.parallelZ(b.inputs);
    return {freq: b.freq, z, swr: necout.swr(z, z0), feeds: b.inputs.map(x => ({tag: x.tag, z: x.z}))};
  });
  const patterns = blocks.filter(b => b.pattern.length).map(b => ({
    freq: b.freq,
    points: b.pattern.map(pt => ({theta: pt.theta, phi: pt.phi, total: pt.total, ...necout.circular(pt)}))
  }));
  return {deck: d, sweep, patterns, warnings: (out.match(/WARNING/g) || []).length};
};

// deckFn(res, opts) -> deck; runner: opts.run(text) -> out text (default native nec2++)
const simulate = (deckFn, res, opts = {}) => {
  const d = deckFn(res, opts);
  const run = opts.run || (text => require('./necpp.js').run(text, opts).out);
  return summarize(run(d.text), d, opts);
};

// compact JSON for web / CLI
const round = x => +x.toFixed(4);
const compact = sim => ({
  segments: sim.deck.segments,
  warnings: sim.warnings,
  sweep: sim.sweep.map(s => ({freq: round(s.freq), r: round(s.z.re), x: round(s.z.im), swr: round(s.swr)})),
  patterns: sim.patterns.map(p => ({
    freq: p.freq,
    points: p.points.map(q => ({theta: q.theta, phi: q.phi, rhcp: round(q.rhcp), lhcp: round(q.lhcp), arDb: round(q.arDb)}))
  }))
});

module.exports = {summarize, simulate, compact};
