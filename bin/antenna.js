#!/usr/bin/env node
'use strict';

// Usage:
//   antenna <input.json>             JSON in -> JSON out (dims + geometry)
//   antenna < input.json
//   antenna <input.json> --nec       NEC deck out
//   antenna <input.json> --sim       run nec2++ -> JSON (sweep: Z, SWR; patterns: RHCP/LHCP/AR)
//   antenna --type qfh ...           antenna type (else input "type", else default)
//   antenna --list                   list antenna types
//   antenna <input.json> --sweep path=from:to:step [--sweep path=v1,v2] [--json]
//                                    NEC param sweep (grid) -> table: Z (with stray C), Z antenna,
//                                    SWR, gain / AR / azimuth ripple at 0, 10, 20, 30 deg elevation

const fs = require('node:fs');
const {antennas, sweep} = require('../lib/index.js');

const main = (forceType) => {
  const args = process.argv.slice(2);
  if (args.includes('--list')) {
    const def = antennas.defaultType();
    for (const [k, a] of Object.entries(antennas.antennas)) {
      process.stdout.write(k + (k === def ? ' (default)' : '') + (a.legacy ? ' (legacy)' : '') + '  ' + a.title + '\n');
    }
    return;
  }
  const ti = args.indexOf('--type');
  const type = forceType || (ti >= 0 ? args[ti + 1] : undefined);
  const valueIdx = new Set(args.flatMap((a, i) => (a === '--type' || a === '--sweep' ? [i + 1] : [])));
  const file = args.find((a, i) => !a.startsWith('--') && !valueIdx.has(i));
  const specs = args.flatMap((a, i) => (a === '--sweep' ? [sweep.parseSpec(args[i + 1])] : []));
  const src = fs.readFileSync(file || 0, 'utf8');
  const {antenna, input} = antennas.resolve(src.trim() ? JSON.parse(src) : {}, type);
  if (specs.length) {
    const rows = sweep.run(antenna, input, specs);
    process.stdout.write(args.includes('--json') ? JSON.stringify(rows, null, 2) + '\n' : sweep.table(rows));
    return;
  }
  const res = antenna.calc(input);
  if (args.includes('--nec')) {
    process.stdout.write(antenna.deck(res).text);
    return;
  }
  if (args.includes('--sim')) {
    const sim = antenna.simulate(res);
    process.stdout.write(JSON.stringify({type: antenna.type, input: res.input, dims: res.dims, sweep: sim.sweep, patterns: sim.patterns, warnings: sim.warnings}, null, 2) + '\n');
    return;
  }
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
};

module.exports = main;

if (require.main === module) { main(); }
