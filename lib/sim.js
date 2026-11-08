'use strict';

// NEC output -> summary (Z, SWR, RHCP/LHCP, AR); run via nec2++ (native) or injected runner (WASM).

const necout = require('./necout.js');

const point = pt => ({theta: pt.theta, phi: pt.phi, total: pt.total, ...necout.circular(pt)});

// summarize nec2++ output text; feeds in parallel -> Z = 1 / sum(Y)
// d.shuntC (F): stray capacitance across feed terminals -> z = zAnt || C (zAnt = NEC value)
const summarize = (out, d, opts = {}) => {
  const blocks = necout.parse(out);
  const z0 = opts.z0 || 50;
  const sweep = blocks.filter(b => !b.pattern.length).map(b => {
    const zAnt = necout.parallelZ(b.inputs);
    const z = necout.shuntC(zAnt, d.shuntC, b.freq);
    return {freq: b.freq, z, zAnt, swr: necout.swr(z, z0), feeds: b.inputs.map(x => ({tag: x.tag, z: x.z}))};
  });
  const patterns = blocks.filter(b => b.pattern.length).map(b => {
    const res = {freq: b.freq, points: b.patterns[0].map(point)};
    if (b.patterns[1]) { res.azimuth = b.patterns[1].map(point); }
    return res;
  });
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
const cpt = q => ({theta: q.theta, phi: q.phi, rhcp: round(q.rhcp), lhcp: round(q.lhcp), arDb: round(q.arDb)});
const compact = sim => ({
  segments: sim.deck.segments,
  warnings: sim.warnings,
  sweep: sim.sweep.map(s => ({freq: round(s.freq), r: round(s.z.re), x: round(s.z.im), swr: round(s.swr)})),
  patterns: sim.patterns.map(p => {
    const res = {freq: p.freq, points: p.points.map(cpt)};
    if (p.azimuth) { res.azimuth = p.azimuth.map(cpt); }
    return res;
  })
});

// figures of merit at design freq: Z, SWR in band, co-pol gain / AR (phi = 0 cut), azimuth ripple
const nearest = (arr, f) => arr.reduce((m, x) => (Math.abs(x.freq - f) < Math.abs(m.freq - f) ? x : m));
const stats = (sim, input, elevs = [0, 10, 20, 30]) => {
  const co = input.polarization === 'LHCP' ? 'lhcp' : 'rhcp';
  const s0 = nearest(sim.sweep, input.freq);
  const inBand = sim.sweep.filter(s => s.freq >= input.band[0] - 1e-9 && s.freq <= input.band[1] + 1e-9);
  const best = sim.sweep.reduce((m, s) => (s.swr < m.swr ? s : m));
  const p = nearest(sim.patterns, input.freq);
  const cut = elev => p.points.find(q => q.phi === 0 && Math.abs(90 - q.theta - elev) < 1e-6);
  const res = {
    freq: input.freq,
    z: s0.z, zAnt: s0.zAnt, swr: s0.swr,
    swrBandMax: Math.max(...inBand.map(s => s.swr)),
    swrMin: {freq: best.freq, swr: best.swr, z: best.z},
    elev: {}
  };
  for (const e of elevs) {
    const q = cut(e);
    if (!q) { continue; }
    const r = {gain: q[co], ar: q.arDb};
    if (p.azimuth) {
      const ring = p.azimuth.filter(a => Math.abs(90 - a.theta - e) < 1e-6).map(a => a[co]);
      if (ring.length) { r.ripple = Math.max(...ring) - Math.min(...ring); }
    }
    res.elev[e] = r;
  }
  return res;
};

module.exports = {summarize, simulate, compact, stats};
