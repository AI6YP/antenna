'use strict';

const {expect} = require('chai');
const {lindenblad, lindenbladNec} = require('../lib/index.js');

const base = {...require('../examples/lindenblad-70cm.json'), env: {ground: 'free'}};
delete base.type;

const at = (pat, theta, phi = 0) => pat.points.find(p => p.theta === theta && p.phi === phi);

describe('lindenblad-nec', () => {
  it('deck: 1-segment feed on axis at gap center, parasitic + mast wires', () => {
    const d = lindenbladNec.deck(lindenblad.calc(base));
    expect(d.feeds).to.have.length(1);
    const w = d.wires[d.feeds[0].tag - 1];
    expect(w.part).to.equal('feed');
    expect(w.nSeg).to.equal(1);
    expect((w.a[2] + w.b[2]) / 2).to.be.closeTo(d.dz, 1e-9); // gap center
    expect(d.wires.filter(x => x.part === 'parasitic')).to.have.length(4);
    expect(d.wires.filter(x => x.mast)).to.have.length(1);
    // antenna bottom = metal + pvc above roof
    const zBot = Math.min(...d.wires.filter(x => !x.mast).flatMap(x => [x.a[2], x.b[2]]));
    expect(zBot).to.be.closeTo(d.zRoof + 1500, 1e-9);
    expect(d.text).to.match(/^EN$/m);
  });

  it('no mast when mast.metal = 0', () => {
    const d = lindenbladNec.deck(lindenblad.calc({...base, env: {ground: 'free', mast: {metal: 0}}}));
    expect(d.wires.filter(x => x.mast)).to.have.length(0);
  });

  for (const pol of ['RHCP', 'LHCP']) {
    it(pol + ': co-pol > cross-pol by 15 dB at 0-30 deg elev, AR < 3 dB, zenith null (NEC)', function () {
      this.timeout(60000);
      const sim = lindenbladNec.simulate(lindenblad.calc({...base, polarization: pol}));
      const center = sim.patterns.find(p => Math.abs(p.freq - base.freq) < 0.01);
      const co = pol === 'RHCP' ? 'rhcp' : 'lhcp';
      const x = pol === 'RHCP' ? 'lhcp' : 'rhcp';
      for (const elev of [0, 10, 20, 30]) {
        const q = at(center, 90 - elev);
        expect(q[co] - q[x], 'elev ' + elev).to.be.above(15);
        expect(q.arDb, 'elev ' + elev).to.be.below(3);
      }
      expect(at(center, 0)[co]).to.be.below(at(center, 80)[co] - 20); // zenith null
    });
  }

  it('AA2TX 70cm: driven inductive at f0, R 30-50 ohm; resonance below band (lengthened)', function () {
    this.timeout(60000);
    const sim = lindenbladNec.simulate(lindenblad.calc(base));
    const z = sim.sweep.reduce((m, s) => Math.abs(s.freq - 435.5) < Math.abs(m.freq - 435.5) ? s : m).z;
    expect(z.re).to.be.within(30, 50);
    expect(z.im).to.be.above(10);
    // with ~4 pF feed stray C in parallel -> near 50 ohm (AA2TX L-match)
    const w = 2 * Math.PI * 435.5e6;
    const y = {re: z.re / (z.re ** 2 + z.im ** 2), im: -z.im / (z.re ** 2 + z.im ** 2) + w * 4e-12};
    const zr = y.re / (y.re ** 2 + y.im ** 2), zi = -y.im / (y.re ** 2 + y.im ** 2);
    expect(zr).to.be.within(40, 65);
    expect(Math.abs(zi)).to.be.below(10);
  });
});
