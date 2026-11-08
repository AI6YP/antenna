'use strict';

const {expect} = require('chai');
const {qfh, qfhNec, necout} = require('../lib/index.js');

const base = {...require('../examples/qfh-70cm.json'), env: {ground: 'free'}};

const at = (pat, theta, phi = 0) => pat.points.find(p => p.theta === theta && p.phi === phi);

describe('qfh-nec', () => {

  it('deck: feed wires odd segments, centered source', () => {
    const d = qfhNec.deck(qfh.calc(base));
    expect(d.feeds).to.have.length(2);
    for (const f of d.feeds) {
      const w = d.wires[f.tag - 1];
      expect(w.nSeg % 2).to.equal(1);
      expect(f.seg).to.equal((w.nSeg + 1) / 2);
    }
    expect(d.text).to.match(/^EN$/m);
  });

  for (const pol of ['RHCP', 'LHCP']) {
    it(pol + ': main lobe up, co-pol > cross-pol by 15 dB at zenith (NEC)', function () {
      this.timeout(60000);
      const sim = qfhNec.simulate(qfh.calc({...base, polarization: pol}));
      const center = sim.patterns.find(p => Math.abs(p.freq - base.freq) < 0.01);
      const up = at(center, 0);
      const down = at(center, 180);
      const co = pol === 'RHCP' ? 'rhcp' : 'lhcp';
      const x = pol === 'RHCP' ? 'lhcp' : 'rhcp';
      expect(up[co] - up[x]).to.be.above(15);
      expect(up[co]).to.be.above(down[co] + 6);
      expect(sim.sweep).to.have.length(41);
    });
  }

  it('parallelZ sums admittances incl. polarity', () => {
    const z = necout.parallelZ([
      {v: {re: 1, im: 0}, i: {re: 0.02, im: 0}},
      {v: {re: -1, im: 0}, i: {re: -0.02, im: 0}}
    ]);
    expect(z.re).to.be.closeTo(25, 1e-9);
    expect(z.im).to.be.closeTo(0, 1e-9);
  });

  it('parse: pattern row without SENSE (zero field)', () => {
    const txt = [
      '--------- FREQUENCY --------', 'FREQUENCY=  1.4560E+02 MHZ',
      '----- RADIATION PATTERNS -----', 'h1', 'h2', 'h3',
      '   88.00      0.00     -8.43    -4.73    -3.19      0.6524     87.63 RIGHT   3.7810E-01     20.67  5.7859E-01    -67.25',
      '   90.00      0.00   -999.99  -999.99  -198.99      0.0000      0.00         6.4083E-11   -161.24  9.1931E-11    111.67',
      '    0.00     90.00      0.98     1.23     4.11      0.8631    -50.72 RIGHT   1.1164E+00    150.62  1.1492E+00     52.38',
      ''
    ].join('\n');
    const [b] = necout.parse(txt);
    expect(b.pattern).to.have.length(3);
    expect(b.pattern[1].sense).to.equal('NONE');
    expect(b.pattern[2].phi).to.equal(90);
  });

  it('swr', () => {
    expect(necout.swr({re: 50, im: 0})).to.be.closeTo(1, 1e-9);
    expect(necout.swr({re: 100, im: 0})).to.be.closeTo(2, 1e-9);
  });
});
