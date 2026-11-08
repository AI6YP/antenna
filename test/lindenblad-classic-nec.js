'use strict';

const {expect} = require('chai');
const {lindenblad, lindenbladNec, sim: simLib, geom} = require('../lib/index.js');

const base = {...require('../examples/lindenblad-classic-70cm.json'), env: {ground: 'free'}};
delete base.type;

const at = (pat, theta, phi = 0) => pat.points.find(p => p.theta === theta && p.phi === phi);

describe('lindenblad-classic-nec', () => {
  it('deck: 4 closed folded dipoles, 1 source each (center of fed conductor), mast', () => {
    const d = lindenbladNec.deck(lindenblad.calc(base));
    expect(d.feeds).to.have.length(4);
    expect(d.feeds.every(f => f.sign === 1)).to.equal(true);
    for (let k = 0; k < 4; k++) {
      const ws = d.wires.filter(w => w.k === k);
      expect(ws.map(w => w.part)).to.deep.equal(['fed', 'end', 'other', 'end']);
      ws.forEach((w, i) => expect(geom.dist(w.b, ws[(i + 1) % 4].a)).to.be.below(1e-9)); // closed loop
      expect(ws[0].nSeg).to.equal(ws[2].nSeg); // aligned parallel conductors
      expect(ws[0].nSeg % 2).to.equal(1);
    }
    expect(d.wires.filter(x => x.mast)).to.have.length(1);
    const zBot = Math.min(...d.wires.filter(x => !x.mast).flatMap(x => [x.a[2], x.b[2]]));
    expect(zBot).to.be.closeTo(d.zRoof + 1500, 1e-9); // antenna bottom = metal + pvc
    expect(d.text).to.match(/^RP 0 4 120 1000 60 0 10 3$/m);
    expect(d.zPost).to.be.a('function');
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
      expect(at(center, 0)[co]).to.be.below(at(center, 80)[co] - 20);
    });
  }

  it('W6SHP 70cm: dipole Z ~ 264 ohm resistive, hub = Z / 4 through lambda/2 lines, qwt -> 50', function () {
    this.timeout(60000);
    const res = lindenblad.calc(base);
    const sim = lindenbladNec.simulate(res);
    const st = simLib.stats(sim, res.input);
    const s0 = sim.sweep.reduce((m, s) => (Math.abs(s.freq - base.freq) < Math.abs(m.freq - base.freq) ? s : m));
    s0.feeds.forEach(f => {
      expect(f.z.re).to.be.within(240, 290);
      expect(Math.abs(f.z.im)).to.be.below(15);
    });
    expect(st.z.re).to.be.closeTo(st.zAnt.re, 0.01); // lambda/2 lines repeat at f0
    expect(st.z.re).to.be.within(60, 72);
    expect(st.swrBandMax).to.be.below(1.5);
    expect(st.elev[10].ripple).to.be.below(0.5);
    const m = lindenblad.calc({...base, match: {type: 'qwt', z0: 58}});
    const sm = simLib.stats(lindenbladNec.simulate(m), m.input);
    expect(sm.swrBandMax).to.be.below(1.1);
  });
});
