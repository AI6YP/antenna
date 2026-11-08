'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {expect} = require('chai');
const {qfh, qfhNec, necpp} = require('../lib/index.js');

const wasmFile = path.join(__dirname, '../web/wasm/nec2pp.wasm');

describe('nec2++ wasm', function () {
  this.timeout(120000);
  let nec;

  before(async function () {
    if (!fs.existsSync(wasmFile)) { this.skip(); }
    const {createNec} = await import('../web/nec-wasm.mjs');
    nec = createNec(await WebAssembly.compile(fs.readFileSync(wasmFile)));
  });

  for (const ground of ['free', 'poor']) {
    it('70cm ' + ground + ': same results as native nec2++', async () => {
      const res = qfh.calc({...require('../examples/qfh-70cm.json'), env: {ground}});
      const deck = qfhNec.deck(res);
      const native = qfhNec.summarize(necpp.run(deck.text).out, deck);
      const wasm = qfhNec.summarize(await nec.run(deck.text), deck);
      expect(wasm.sweep).to.have.length(native.sweep.length);
      wasm.sweep.forEach((s, i) => {
        expect(s.z.re).to.be.closeTo(native.sweep[i].z.re, 1e-6);
        expect(s.z.im).to.be.closeTo(native.sweep[i].z.im, 1e-6);
      });
      wasm.patterns.forEach((p, i) => p.points.forEach((q, j) => {
        expect(q.total).to.be.closeTo(native.patterns[i].points[j].total, 1e-6);
      }));
    });
  }
});
