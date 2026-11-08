'use strict';

// Antenna registry. Each entry:
//   calc(input) -> res {input, dims, geometry}
//   deck(res, opts) -> NEC deck {text, wires, feeds, segments, ...}
//   simulate(res, opts) -> {sweep, patterns, ...} (native nec2++ or opts.run)
//   summarize(out, deck, opts)
//   defaults, legacy, title

const qfh = require('./qfh.js');
const qfhNec = require('./qfh-nec.js');
const lindenblad = require('./lindenblad.js');
const lindenbladNec = require('./lindenblad-nec.js');

const antennas = {
  lindenblad: {
    type: 'lindenblad',
    title: 'Lindenblad: parasitic (AA2TX, default) | classic (folded dipoles + twin-lead), "variant"',
    legacy: false,
    variants: lindenblad.variants,
    defaults: lindenblad.defaults,
    params: lindenblad.params,
    calc: lindenblad.calc,
    deck: lindenbladNec.deck,
    summarize: lindenbladNec.summarize,
    simulate: lindenbladNec.simulate
  },
  qfh: {
    type: 'qfh',
    title: 'QFH (quadrifilar helix)',
    legacy: true, // weak horizon gain; kept working
    defaults: qfh.defaults,
    calc: qfh.calc,
    deck: qfhNec.deck,
    summarize: qfhNec.summarize,
    simulate: qfhNec.simulate
  }
};

// preferred default first (lindenblad = new default once registered)
const order = ['lindenblad', 'qfh'];
const defaultType = () => order.find(k => antennas[k]);

const get = type => {
  const t = type || defaultType();
  const a = antennas[t];
  if (!a) { throw new Error('unknown antenna type: ' + t + ' (known: ' + Object.keys(antennas).join(', ') + ')'); }
  return a;
};

// input JSON with optional "type" -> {antenna, input without type}
const resolve = (input, type) => {
  const {type: t, ...rest} = input || {};
  return {antenna: get(type || t), input: rest};
};

module.exports = {antennas, order, defaultType, get, resolve};
