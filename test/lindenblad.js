'use strict';

const {expect} = require('chai');
const {lindenblad, geom} = require('../lib/index.js');

const close = (a, b, eps = 1e-9) => expect(a).to.be.closeTo(b, eps);
const L = deg => deg * Math.PI / 180;

describe('lindenblad', () => {
  it('AA2TX 70cm (inch -> mm), sleeve = top', () => {
    const {dims} = lindenblad.calc({driven: {top: 153.975, sleeve: 153.975}});
    close(dims.driven.length, 12.375 * 25.4, 0.1);
    close(dims.driven.top, 6.0625 * 25.4, 0.05);
    close(dims.driven.bottom, dims.driven.top);
    close(dims.parasitic.length, 11.75 * 25.4, 0.1);
    close(dims.parasitic.radius, 4.0625 * 25.4, 0.1);
    close(dims.parasitic.radiusLambda, 0.15, 0.005); // AA2TX: 0.15 lambda
    expect(dims.parasitic.n).to.equal(4);
  });

  it('default sleeve = quarter-wave stub length', () => {
    const {dims} = lindenblad.calc({});
    close(dims.driven.bottom, dims.sleeve.lengthQW);
    close(dims.sleeve.f0, 435.5, 1e-6);
    expect(dims.sleeve.auto).to.equal(true);
  });

  it('top + sleeve independent, length = top + gap + sleeve', () => {
    const {dims, geometry: g} = lindenblad.calc({driven: {top: 150, sleeve: 140}});
    close(dims.driven.bottom, 140);
    close(dims.driven.top, 150);
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

  for (const pol of ['RHCP', 'LHCP']) {
    it(pol + ' lean: plane rotates about tangent; upper end outward for lean > 0', () => {
      const flat = lindenblad.calc({polarization: pol}).geometry.parasitic;
      const lean0 = lindenblad.calc({polarization: pol, parasitic: {lean: 0}}).geometry.parasitic;
      lean0.forEach((e, k) => { expect(e.a).to.deep.equal(flat[k].a); });
      for (const lean of [-40, 25]) {
        const res = lindenblad.calc({polarization: pol, parasitic: {lean}});
        const q = res.input.parasitic;
        res.geometry.parasitic.forEach(e => {
          const rh = [Math.cos(e.phi), Math.sin(e.phi), 0];
          const th = [-Math.sin(e.phi), Math.cos(e.phi), 0];
          const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
          close(geom.dist(e.a, e.b), q.length);
          // tangent component unchanged by lean
          close(Math.abs(dot(e.dir, th)), Math.cos(q.tilt * Math.PI / 180));
          // plane normal n = t x u, u = cos(lean) z + sin(lean) r: element has no n component
          const L = lean * Math.PI / 180;
          const u = [rh[0] * Math.sin(L), rh[1] * Math.sin(L), Math.cos(L)];
          close(dot(e.dir, geom.v3.cross(th, u)), 0);
          // upper end radial offset sign = sign(lean)
          const up = e.a[2] > e.b[2] ? e.a : e.b;
          expect(Math.sign(dot(geom.v3.sub(up, e.center), rh))).to.equal(Math.sign(lean));
        });
        close(res.dims.parasitic.elev, Math.asin(Math.sin(q.tilt * Math.PI / 180) * Math.cos(L(lean))) * 180 / Math.PI, 1e-9);
      }
    });
  }

  it('lean: clearance = closest approach of element axis to mast', () => {
    const {dims} = lindenblad.calc({parasitic: {lean: -50}});
    expect(dims.parasitic.rMin).to.be.below(dims.parasitic.radius);
    expect(() => lindenblad.calc({parasitic: {lean: -60, radius: 12}})).to.throw(/clear/);
    expect(() => lindenblad.calc({parasitic: {lean: 90}})).to.throw(/lean/);
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
    expect(() => lindenblad.calc({driven: {sleeve: -1}})).to.throw(/sleeve/);
    expect(() => lindenblad.calc({driven: {top: 0}})).to.throw(/top/);
    expect(() => lindenblad.calc({variant: 'ez'})).to.throw(/not implemented/);
  });
});
