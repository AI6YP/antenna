'use strict';

const {expect} = require('chai');
const {lindenblad, geom} = require('../lib/index.js');

const close = (a, b, eps = 1e-9) => expect(a).to.be.closeTo(b, eps);

describe('lindenblad', () => {
  it('defaults = AA2TX 70cm (inch -> mm)', () => {
    const {dims} = lindenblad.calc({});
    close(dims.driven.length, 12.375 * 25.4, 0.1);
    close(dims.driven.top, 6.0625 * 25.4, 0.05);
    close(dims.driven.bottom, dims.driven.top);
    close(dims.parasitic.length, 11.75 * 25.4, 0.1);
    close(dims.parasitic.radius, 4.0625 * 25.4, 0.1);
    close(dims.parasitic.radiusLambda, 0.15, 0.005); // AA2TX: 0.15 lambda
    expect(dims.parasitic.n).to.equal(4);
  });

  it('sleeve sets bottom half, top = rest', () => {
    const {dims, geometry: g} = lindenblad.calc({driven: {sleeve: 140}});
    close(dims.driven.bottom, 140);
    close(dims.driven.top + dims.driven.bottom + dims.driven.gap, dims.driven.length);
    close(g.driven.bottom[0][2], -dims.driven.gap / 2 - 140);
    close(g.driven.top[1][2], dims.driven.gap / 2 + dims.driven.top);
  });

  for (const n of [3, 4, 5]) {
    it('n = ' + n + ': elements equally spaced, length, radius, tilt', () => {
      const res = lindenblad.calc({parasitic: {n, z: 10}});
      const q = res.input.parasitic;
      const els = res.geometry.parasitic;
      expect(els).to.have.length(n);
      els.forEach((e, k) => {
        close(e.phi, 2 * Math.PI * k / n);
        close(geom.dist(e.a, e.b), q.length);
        close(Math.hypot(e.center[0], e.center[1]), q.radius);
        close(e.center[2], 10);
        // tilt from horizontal
        close(Math.asin(Math.abs(e.b[2] - e.a[2]) / q.length) * 180 / Math.PI, q.tilt);
        // element axis horizontal component is tangential (perpendicular to radius)
        close(e.dir[0] * Math.cos(e.phi) + e.dir[1] * Math.sin(e.phi), 0);
      });
    });
  }

  it('RHCP: looking toward hub, left end up (AA2TX); LHCP mirrored', () => {
    for (const [pol, leftUp] of [['RHCP', true], ['LHCP', false]]) {
      const e = lindenblad.calc({polarization: pol}).geometry.parasitic[0]; // phi = 0, at +x
      // viewer at +x looking to -x: right = +y, left = -y
      const left = e.a[1] < e.b[1] ? e.a : e.b;
      const right = left === e.a ? e.b : e.a;
      expect(left[2] > right[2]).to.equal(leftUp);
    }
  });

  it('zBottom / zTop cover driven + parasitic', () => {
    const {geometry: g, dims} = lindenblad.calc({});
    close(g.zBottom, -dims.driven.gap / 2 - dims.driven.bottom);
    close(g.zTop, dims.driven.gap / 2 + dims.driven.top);
  });

  it('validation', () => {
    expect(() => lindenblad.calc({freq: 0})).to.throw(/freq/);
    expect(() => lindenblad.calc({polarization: 'X'})).to.throw(/polarization/);
    expect(() => lindenblad.calc({parasitic: {n: 2.5}})).to.throw(/parasitic.n/);
    expect(() => lindenblad.calc({parasitic: {tilt: 90}})).to.throw(/tilt/);
    expect(() => lindenblad.calc({parasitic: {radius: 5}})).to.throw(/clear/);
    expect(() => lindenblad.calc({driven: {sleeve: 400}})).to.throw(/sleeve/);
    expect(() => lindenblad.calc({variant: 'classic'})).to.throw(/not implemented/);
  });
});
