'use strict';

const {expect} = require('chai');
const {lindenblad, lindenbladNec, necout, sim: simLib} = require('../lib/index.js');

// AA2TX: symmetric dipole, ferrite choke ~ ideal; sleeve choke tested separately
const base = {...require('../examples/lindenblad-70cm.json'), env: {ground: 'free'}, feed: {choke: 'ideal'}, driven: {top: 153.975, sleeve: 153.975}};
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

  it('sleeve choke: coax wire sleeve mouth -> mast top, parallel RLC on top segment', () => {
    const res = lindenblad.calc({...base, feed: {choke: 'sleeve'}});
    const d = lindenbladNec.deck(res);
    const c = d.wires.find(w => w.part === 'coax');
    expect(c.a[2] - c.b[2]).to.be.closeTo(500, 1e-9); // pvc section
    expect(d.text).to.match(/^LD 1 \d+ 1 1 [\d.e+]+ [\d.e-]+ [\d.e-]+$/m);
    expect(lindenbladNec.deck(lindenblad.calc({...base, feed: {choke: 'none'}})).text).to.not.match(/^LD/m);
    expect(lindenbladNec.deck(lindenblad.calc({...base, feed: {choke: 'none'}})).wires.some(w => w.part === 'coax')).to.equal(true);
  });

  it('azimuth rings: RP for elev 0..30, 3 deg', () => {
    const d = lindenbladNec.deck(lindenblad.calc(base));
    expect(d.text).to.match(/^RP 0 4 120 1000 60 0 10 3$/m);
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

  it('AA2TX 70cm: zAnt inductive at f0 (lengthened); + 4 pF stray C -> ~50 ohm', function () {
    this.timeout(60000);
    const res = lindenblad.calc(base);
    const sim = lindenbladNec.simulate(res);
    const st = simLib.stats(sim, res.input);
    expect(st.zAnt.re).to.be.within(30, 50);
    expect(st.zAnt.im).to.be.above(10);
    // shunt C: by hand vs summarize
    const z = necout.shuntC(st.zAnt, 4e-12, st.freq);
    expect(st.z.re).to.be.closeTo(z.re, 1e-9);
    expect(st.z.re).to.be.within(40, 65);
    expect(Math.abs(st.z.im)).to.be.below(10);
    expect(st.swrBandMax).to.be.below(1.5);
    // azimuth ripple (N = 4) small
    expect(st.elev[10].ripple).to.be.below(0.5);
  });
});

describe('lindenblad-nec: sleeve choke (NEC)', () => {
  it('no choke detunes badly; sleeve at lambda/4 stub length matches', function () {
    this.timeout(60000);
    const run = feed => {
      const res = lindenblad.calc({...base, feed});
      return simLib.stats(lindenbladNec.simulate(res), res.input);
    };
    expect(run({choke: 'none'}).swr).to.be.above(2.5);
    const st = run({choke: 'sleeve'});
    expect(st.swr).to.be.below(2);
    const tuned = lindenblad.calc({...base, driven: {top: 142, sleeve: null}, feed: {choke: 'sleeve'}}); // auto = lambda/4
    expect(simLib.stats(lindenbladNec.simulate(tuned), tuned.input).swr).to.be.below(1.3);
  });
});
