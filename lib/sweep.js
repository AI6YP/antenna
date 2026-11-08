'use strict';

// Parameter sweeps: path=from:to:step (or v1,v2,...) -> grid of inputs -> NEC stats rows.

const {merge} = require('./util.js');
const sim = require('./sim.js');

// 'a.b.c', v -> {a: {b: {c: v}}}
const setPath = (path, v) => path.split('.').reduceRight((acc, k) => ({[k]: acc}), v);

const parseValue = s => {
  if (s === 'null') { return null; }
  const n = Number(s);
  return Number.isNaN(n) ? s : n;
};

// 'env.mast.pvc=0:2000:250' | 'parasitic.n=3,4,5' | 'polarization=RHCP,LHCP'
const parseSpec = spec => {
  const eq = spec.indexOf('=');
  if (eq < 1) { throw new Error('sweep spec: path=from:to:step or path=v1,v2: ' + spec); }
  const path = spec.slice(0, eq), rhs = spec.slice(eq + 1);
  let values;
  if (rhs.includes(':')) {
    const [a, b, st] = rhs.split(':').map(Number);
    if (!(st > 0) || !(b >= a)) { throw new Error('sweep range: from <= to, step > 0: ' + spec); }
    values = [];
    for (let i = 0; a + i * st <= b + 1e-9; i++) { values.push(+(a + i * st).toFixed(9)); }
  } else {
    values = rhs.split(',').map(parseValue);
  }
  return {path, values};
};

// cartesian product of specs -> [{label: {path: v}, input}]
const grid = (base, specs) => specs.reduce((acc, {path, values}) => acc.flatMap(c => values.map(v => ({
  label: {...c.label, [path]: v},
  input: merge(c.input, setPath(path, v))
}))), [{label: {}, input: base}]);

const run = (antenna, base, specs, opts = {}) => grid(base, specs).map(({label, input}) => {
  const res = antenna.calc(input);
  const s = antenna.simulate(res, opts);
  return {label, stats: sim.stats(s, res.input), segments: s.deck.segments, warnings: s.warnings};
});

const f1 = x => (x === undefined ? '-' : x.toFixed(1));
const f2 = x => (x === undefined ? '-' : x.toFixed(2));

// rows -> aligned text table
const table = rows => {
  if (!rows.length) { return ''; }
  const keys = Object.keys(rows[0].label);
  const elevs = Object.keys(rows[0].stats.elev);
  const head = [...keys, 'R', 'X', 'Rant', 'Xant', 'SWR', 'SWRband', 'fmin', 'SWRmin',
    ...elevs.flatMap(e => ['G' + e, 'AR' + e, 'rip' + e])];
  const body = rows.map(({label, stats: st}) => [
    ...keys.map(k => String(label[k])),
    f1(st.z.re), f1(st.z.im), f1(st.zAnt.re), f1(st.zAnt.im), f2(st.swr), f2(st.swrBandMax),
    f1(st.swrMin.freq), f2(st.swrMin.swr),
    ...elevs.flatMap(e => [f1(st.elev[e].gain), f1(st.elev[e].ar), f2(st.elev[e].ripple)])
  ]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map(r => r[i].length)));
  return [head, ...body].map(r => r.map((c, i) => c.padStart(w[i])).join(' ')).join('\n') + '\n';
};

module.exports = {setPath, parseSpec, grid, run, table};
