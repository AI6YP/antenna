'use strict';

const {expect} = require('chai');
const {qfh} = require('../lib/index.js');

const fixture = name => require(`./fixtures/${name}.json`);

// fixture input -> calculator input
const toInput = (i, extra) => ({
  freq: i.freq,
  turns: i.turns,
  bendRadius: i.bendRadius,
  ratioDH: i.ratio,
  conductor: {od: i.wire},
  turnLength: i.nrwavel || 1,
  ...extra
});

// compare every numeric field present in expected
const check = (actual, expected, tol, path = '') => {
  for (const [key, val] of Object.entries(expected)) {
    const where = path + '.' + key;
    if (typeof val === 'object') {
      check(actual[key], val, tol, where);
    } else {
      const t = (typeof tol === 'function') ? tol(val) : tol;
      expect(actual[key], where).to.be.closeTo(val, t);
    }
  }
};

describe('qfh', () => {

  it('lambda 300 MHz ~ 999.3 mm', () => {
    expect(qfh.lambda(300)).to.be.closeTo(999.31, 0.01);
  });

  it('normalize applies defaults', () => {
    const p = qfh.normalize({freq: 145.6});
    expect(p.freq).to.equal(145.6);
    expect(p.turns).to.equal(0.5);
    expect(p.conductor.od).to.equal(6.9);
  });

  it('normalize deep merges', () => {
    const p = qfh.normalize({conductor: {od: 10.3}});
    expect(p.conductor).to.deep.equal({type: 'coax', od: 10.3});
  });

  it('normalize rejects bad input', () => {
    expect(() => qfh.normalize({freq: 0})).to.throw();
    expect(() => qfh.normalize({loopFactors: {big: 0.9, small: 1}})).to.throw();
    expect(() => qfh.normalize({polarization: 'H'})).to.throw();
    expect(() => qfh.normalize({conductor: {od: 0}})).to.throw();
  });

  it('delta interpolates and clamps', () => {
    expect(qfh.delta(0)).to.equal(1.045);
    expect(qfh.delta(0.5)).to.be.closeTo(1.049, 1e-9);
    expect(qfh.delta(15)).to.equal(1.068);
    expect(qfh.delta(40)).to.equal(1.068);
  });

  it('bend correction R=15 -> 6.44 mm', () => {
    expect(qfh.bendCorrection(15)).to.be.closeTo(6.438, 0.001);
  });

  it('loop geometry is self consistent', () => {
    const {dims} = qfh.calc({freq: 435.5, turns: 0.75, ratioDH: 0.35});
    for (const l of [dims.big, dims.small]) {
      const side = l.D * Math.sqrt(1 / 0.35 ** 2 + (0.75 * Math.PI) ** 2);
      expect(2 * l.D + 2 * side).to.be.closeTo(l.totalC, 1e-9);
    }
  });

  describe('vs jcoppens qfhcalc.js', () => {
    for (const {input, output} of fixture('jcoppens').cases) {
      it(JSON.stringify(input), () => {
        const {dims} = qfh.calc(toInput(input, {c: 300000}));
        check(dims, output, 0.1); // source truncates to 0.1 mm
      });
    }
  });

  describe('vs shackwiki ant2.js', () => {
    for (const {input, output} of fixture('shackwiki').cases) {
      it(JSON.stringify(input), () => {
        const {dims} = qfh.calc(toInput(input));
        check(dims, output, 0.051);
      });
    }
  });

  describe('vs recorded values', () => {
    for (const {from, input, c, output, tolerance} of fixture('recorded').cases) {
      it(from, () => {
        const {dims} = qfh.calc(toInput(input, {c}));
        check(dims, output, tolerance ? (v => Math.abs(v) * tolerance) : 0.11);
      });
    }
  });

  describe('geometry', () => {
    const cases = [
      require('../examples/qfh-70cm.json'),
      require('../examples/qfh-2m.json'),
      {freq: 435.5, turns: 1, ratioDH: 0.3, bendRadius: 10, conductor: {od: 5}},
      {freq: 145.6, turns: 0.75, ratioDH: 0.35, polarization: 'LHCP'}
    ];
    for (const input of cases) {
      const {input: p, dims, geometry: g} = qfh.calc(input);
      describe(JSON.stringify(input), () => {
        for (const l of g.loops) {
          const d = dims[l.name];
          const pts = l.points;
          it(l.name + ': closed at top center', () => {
            expect(pts[0]).to.deep.equal(pts[pts.length - 1]);
            expect(pts[0][0]).to.equal(0);
            expect(pts[0][1]).to.equal(0);
            expect(pts[0][2]).to.equal(l.zTop);
          });
          it(l.name + ': length ~ electrical total (< 0.5%)', () => {
            expect(l.length / d.total).to.be.closeTo(1, 0.005);
          });
          it(l.name + ': radius <= D/2, z within loop', () => {
            for (const q of pts) {
              expect(Math.hypot(q[0], q[1])).to.be.at.most(d.D / 2 + 1e-9);
              expect(q[2]).to.be.within(l.zBottom - 1e-9, l.zTop + 1e-9);
            }
            expect(l.zTop - l.zBottom).to.be.closeTo(d.H, 1e-9);
          });
          it(l.name + ': no gaps; helix/corner pieces <= maxSeg, straights <= D/2', () => {
            for (let i = 1; i < pts.length; i++) {
              const a = pts[i - 1], b = pts[i];
              const dl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
              expect(dl).to.be.above(0);
              const straight = Math.abs(a[2] - b[2]) < 1e-9; // horizontal radial runs, segmented later by NEC builder
              expect(dl).to.be.at.most((straight ? d.D / 2 : g.opts.maxSeg) + 1e-9);
            }
          });
          it(l.name + ': twist direction', () => {
            // first point below top corner: azimuth moves by twist sign from phi0
            const q = pts.find(q => q[2] < l.zTop - p.bendRadius - 1);
            const dphi = Math.atan2(q[1], q[0]) - l.phi0;
            expect(Math.sign(Math.atan2(Math.sin(dphi), Math.cos(dphi)))).to.equal(g.twist);
          });
        }
        it('small loop top offset by crossarm OD', () => {
          expect(g.loops[0].zTop - g.loops[1].zTop).to.equal(p.frame.arm);
        });
      });
    }
  });

  it('fillet: 90 deg arc, tangent ends, radius R', () => {
    const pts = qfh.fillet([0, 0, 0], [1, 0, 0], [0, 0, -1], 10, 4);
    expect(pts).to.have.length(5);
    expect(pts[0][0]).to.be.closeTo(-10, 1e-9);
    expect(pts[4][2]).to.be.closeTo(-10, 1e-9);
    for (const q of pts) { expect(Math.hypot(q[0] + 10, q[2] + 10)).to.be.closeTo(10, 1e-9); }
  });

});
