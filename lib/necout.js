'use strict';

// nec2++ .out parser: per frequency -> input parameters, radiation pattern

const num = s => parseFloat(s);

// split output into frequency blocks
const parse = text => {
  const parts = text.split(/-+\s*FREQUENCY\s*-+/).slice(1);
  return parts.map(part => {
    const fm = part.match(/FREQUENCY=\s*([-+.\dE]+)\s*MHZ/);
    const res = {freq: fm ? num(fm[1]) : NaN, inputs: [], pattern: [], patterns: []};

    const ip = part.indexOf('ANTENNA INPUT PARAMETERS');
    if (ip >= 0) {
      const lines = part.slice(ip).split('\n').slice(3);
      for (const line of lines) {
        const c = line.trim().split(/\s+/);
        if (c.length < 11 || !/^\d+$/.test(c[0])) { break; }
        res.inputs.push({
          tag: +c[0], seg: +c[1],
          v: {re: num(c[2]), im: num(c[3])},
          i: {re: num(c[4]), im: num(c[5])},
          z: {re: num(c[6]), im: num(c[7])},
          y: {re: num(c[8]), im: num(c[9])},
          power: num(c[10])
        });
      }
    }

    // all RP tables in this frequency block (e.g. elevation cut + azimuth rings)
    res.patterns = part.split('RADIATION PATTERNS').slice(1).map(tbl => {
      const pts = [];
      for (const line of tbl.split('\n').slice(4)) {
        const c = line.trim().split(/\s+/);
        if (c.length === 11 && !isNaN(num(c[7]))) { c.splice(7, 0, 'NONE'); } // zero field: no SENSE
        if (c.length < 12 || isNaN(num(c[0]))) { break; }
        pts.push({
          theta: num(c[0]), phi: num(c[1]),
          vert: num(c[2]), horiz: num(c[3]), total: num(c[4]),
          ar: num(c[5]), tilt: num(c[6]), sense: c[7],
          eTheta: {mag: num(c[8]), phase: num(c[9])},
          ePhi: {mag: num(c[10]), phase: num(c[11])}
        });
      }
      return pts;
    });
    res.pattern = res.patterns[0] || [];
    return res;
  });
};

// complex helpers
const cadd = (a, b) => ({re: a.re + b.re, im: a.im + b.im});
const cdiv = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return {re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d};
};

// parallel feed: each source sees Yk = Ik / Vk (polarity included); Z = 1 / sum(Yk)
const parallelZ = inputs => {
  const y = inputs.reduce((s, x) => cadd(s, cdiv(x.i, x.v)), {re: 0, im: 0});
  return cdiv({re: 1, im: 0}, y);
};

// Z in parallel with capacitance c (F) at freq f (MHz)
const shuntC = (z, c, f) => {
  if (!c) { return z; }
  const y = cdiv({re: 1, im: 0}, z);
  return cdiv({re: 1, im: 0}, {re: y.re, im: y.im + 2 * Math.PI * f * 1e6 * c});
};

const swr = (z, z0 = 50) => {
  const g = cdiv({re: z.re - z0, im: z.im}, {re: z.re + z0, im: z.im});
  const m = Math.hypot(g.re, g.im);
  return m >= 1 ? Infinity : (1 + m) / (1 - m);
};

// split total gain into RHCP / LHCP (dBic) from axial ratio (minor/major) and sense
const circular = pt => {
  const r = Math.abs(pt.ar); // NEC: 0 linear, 1 circular
  const co = (1 + r) ** 2 / (2 * (1 + r * r));
  const g = 10 ** (pt.total / 10);
  const db = x => (x > 0 ? 10 * Math.log10(x) : -999);
  const gCo = db(g * co), gX = db(g * (1 - co));
  const right = pt.sense === 'RIGHT';
  return {
    rhcp: right ? gCo : gX,
    lhcp: right ? gX : gCo,
    arDb: r > 0 ? 20 * Math.log10(1 / r) : Infinity
  };
};

module.exports = {parse, parallelZ, shuntC, swr, circular};
