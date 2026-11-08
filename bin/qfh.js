#!/usr/bin/env node
'use strict';

// Usage:
//   qfh <input.json>          JSON in -> JSON out (dims + geometry)
//   qfh < input.json
//   qfh <input.json> --nec    NEC deck out
//   qfh <input.json> --sim    run nec2++ -> JSON (sweep: Z, SWR; patterns: RHCP/LHCP/AR)

const fs = require('node:fs');
const {qfh, qfhNec} = require('../lib/index.js');

const main = () => {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--'));
  const src = fs.readFileSync(file || 0, 'utf8');
  const input = src.trim() ? JSON.parse(src) : {};
  const res = qfh.calc(input);
  if (args.includes('--nec')) {
    process.stdout.write(qfhNec.deck(res).text);
    return;
  }
  if (args.includes('--sim')) {
    const sim = qfhNec.simulate(res);
    process.stdout.write(JSON.stringify({input: res.input, dims: res.dims, sweep: sim.sweep, patterns: sim.patterns, warnings: sim.warnings}, null, 2) + '\n');
    return;
  }
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
};

main();
