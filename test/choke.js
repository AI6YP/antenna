'use strict';

const {expect} = require('chai');
const {choke, cables, necout} = require('../lib/index.js');

describe('choke', () => {
  it('air coax line: Z0 = 60 ln(b/a), vf = 1', () => {
    const l = choke.stubLine({b: 10, a: 2, j: 2, er: 1});
    expect(l.z0).to.be.closeTo(59.9585 * Math.log(5), 1e-3);
    expect(l.vf).to.be.closeTo(1, 1e-9);
  });

  it('jacket dielectric lowers vf and Z0', () => {
    const a = choke.stubLine({b: 8.5, a: 1.8, j: 2.475, er: 1});
    const b = choke.stubLine({b: 8.5, a: 1.8, j: 2.475, er: 3});
    expect(b.vf).to.be.below(a.vf);
    expect(b.z0).to.be.below(a.z0);
  });

  it('sleeve: f0 quarter wave, LC resonant at f0, near-f0 reactance matches stub', () => {
    const s = choke.sleeve({length: 154, tubeId: 17.05, coax: cables.cables['RG-58']});
    expect(1 / (2 * Math.PI * Math.sqrt(s.L * s.C)) / 1e6).to.be.closeTo(s.f0, 1e-6);
    const f = s.f0 * 0.995, w = 2 * Math.PI * f * 1e6;
    const xLC = 1 / (1 / (w * s.L) - w * s.C);
    expect(xLC / s.z(f).im).to.be.closeTo(1, 0.02);
    expect(() => choke.sleeve({length: 154, tubeId: 4, coax: cables.cables['RG-58']})).to.throw(/tube ID/);
  });

  it('necout.shuntC', () => {
    const z = necout.shuntC({re: 50, im: 0}, 1e-12, 100);
    const x = -1 / (2 * Math.PI * 100e6 * 1e-12);
    const y = {re: 1 / 50, im: -1 / x};
    const d = y.re ** 2 + y.im ** 2;
    expect(z.re).to.be.closeTo(y.re / d, 1e-9);
    expect(z.im).to.be.closeTo(-y.im / d, 1e-9);
    expect(necout.shuntC({re: 1, im: 2}, 0, 100)).to.deep.equal({re: 1, im: 2});
  });
});
