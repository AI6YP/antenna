#!/usr/bin/env node
'use strict';

// Precompute NEC results for reference designs -> web/data/*.json (needs nec2++)

const fs = require('node:fs');
const path = require('node:path');
const {qfh, qfhNec} = require('../lib/index.js');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'web/data');
fs.mkdirSync(out, {recursive: true});

const designs = ['qfh-2m', 'qfh-70cm'];
const grounds = ['free', 'poor'];

const index = [];
for (const name of designs) {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'examples', name + '.json'), 'utf8'));
  for (const ground of grounds) {
    const input = {...base, env: {...base.env, ground}};
    const res = qfh.calc(input);
    const t0 = Date.now();
    const sim = qfhNec.simulate(res);
    const file = name + '-' + ground + '.json';
    const round = x => +x.toFixed(4);
    fs.writeFileSync(path.join(out, file), JSON.stringify({
      name, ground,
      date: new Date().toISOString(),
      input: res.input,
      segments: sim.deck.segments,
      warnings: sim.warnings,
      sweep: sim.sweep.map(s => ({freq: round(s.freq), r: round(s.z.re), x: round(s.z.im), swr: round(s.swr)})),
      patterns: sim.patterns.map(p => ({
        freq: p.freq,
        points: p.points.map(q => ({theta: q.theta, phi: q.phi, rhcp: round(q.rhcp), lhcp: round(q.lhcp), arDb: round(q.arDb)}))
      }))
    }) + '\n');
    index.push({name, ground, file});
    console.log(file, sim.deck.segments, 'segments', Date.now() - t0, 'ms');
  }
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2) + '\n');
