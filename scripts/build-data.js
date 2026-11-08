#!/usr/bin/env node
'use strict';

// Precompute NEC results for reference designs -> web/data/*.json (needs nec2++)
// designs: examples/<name>.json; antenna type from "type" field or name prefix (qfh-*, lindenblad-*)

const fs = require('node:fs');
const path = require('node:path');
const {antennas, sim: simLib} = require('../lib/index.js');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'web/data');
fs.mkdirSync(out, {recursive: true});

const designs = fs.readdirSync(path.join(root, 'examples'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.slice(0, -5))
  .filter(name => antennas.antennas[name.split('-')[0]])
  .sort();
const grounds = ['free', 'poor'];

const index = [];
for (const name of designs) {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'examples', name + '.json'), 'utf8'));
  const {antenna, input: base1} = antennas.resolve(base, base.type || name.split('-')[0]);
  for (const ground of grounds) {
    const input = {...base1, env: {...base1.env, ground}};
    const res = antenna.calc(input);
    const t0 = Date.now();
    const sim = antenna.simulate(res);
    const file = name + '-' + ground + '.json';
    fs.writeFileSync(path.join(out, file), JSON.stringify({
      name, type: antenna.type, ground,
      date: new Date().toISOString(),
      input: res.input,
      ...simLib.compact(sim)
    }) + '\n');
    index.push({name, type: antenna.type, ground, file});
    console.log(file, sim.deck.segments, 'segments', Date.now() - t0, 'ms');
  }
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2) + '\n');
