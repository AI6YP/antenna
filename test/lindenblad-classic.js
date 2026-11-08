'use strict';

const {expect} = require('chai');
const {lindenblad, lindenbladClassic: classic, geom, tline, antennas} = require('../lib/index.js');

const close = (a, b, eps = 1e-9) => expect(a).to.be.closeTo(b, eps);
const calc = input => lindenblad.calc({variant: 'classic', ...input});

describe('lindenblad-classic', () => {
  it('dispatch: variant classic via lindenblad + registry', () => {
    const res = calc({});
    expect(res.input.variant).to.equal('classic');
    expect(res.geometry.elements).to.have.length(4);
    expect(antennas.get('lindenblad').calc({variant: 'classic'}).dims).to.deep.equal(res.dims);
    expect(lindenblad.normalize({variant: 'classic'}).line.z0).to.equal(300);
  });

  it('W6SHP 70cm defaults: r = 0.15 lambda, lambda/2 twin-lead vf 0.82 = 28.1 cm', () => {
    const {dims} = calc({freq: 437});
    close(dims.element.oppositeLambda, 0.3, 0.005);
    close(dims.line.length, 281.4, 0.5); // W6SHP Table 2: 28.1 cm
    close(dims.line.deg, 180, 1e-9);
    expect(dims.line.auto).to.equal(true);
    close(dims.element.stepUp, 4);
    close(dims.element.cut, 2 * (267 - 20) + Math.PI * 20);
  });

  for (const n of [3, 4, 5]) {
    it('n = ' + n + ': folded dipoles equally spaced, parallel conductors, tilt, spacing', () => {
      const res = calc({element: {n, z: 10}});
      const q = res.input.element;
      res.geometry.elements.forEach((e, k) => {
        close(e.phi, 2 * Math.PI * k / n);
        close(Math.hypot(e.center[0], e.center[1]), q.radius);
        close(e.center[2], 10);
        for (const c of [e.fed, e.other]) {
          close(geom.dist(c[0], c[1]), q.length);
          close(Math.asin(Math.abs(c[1][2] - c[0][2]) / q.length) * 180 / Math.PI, q.tilt);
        }
        close(geom.dist(e.fed[0], e.other[0]), q.spacing);
        close(geom.dist(e.fed[1], e.other[1]), q.spacing);
        close(geom.v3.dot(e.off, e.dir), 0);
        // fed conductor center = feed point, center = fold midline
        close(geom.dist(e.feed, geom.v3.mul(geom.v3.add(e.fed[0], e.fed[1]), 0.5)), 0);
      });
    });
  }

  it('fold plane: other conductor above fed, in element plane; radial: outward', () => {
    const e = calc({}).geometry.elements[0];
    expect(e.off[2]).to.be.above(0);
    close(e.off[0], 0); // no radial component (phi = 0 -> radial = x)
    const r = calc({element: {fold: 'radial'}}).geometry.elements[0];
    close(r.off[0], 1);
    close(r.off[2], 0);
  });

  it('RHCP: looking toward hub, right end up (classic); LHCP mirrored', () => {
    for (const [pol, rightUp] of [['RHCP', true], ['LHCP', false]]) {
      const e = calc({polarization: pol}).geometry.elements[0]; // phi = 0 at +x, viewer at +x: right = +y
      const [a, b] = e.fed;
      const right = a[1] > b[1] ? a : b, left = right === a ? b : a;
      expect(right[2] > left[2]).to.equal(rightUp);
    }
  });

  it('clearances: axis, neighbors', () => {
    const {dims} = calc({});
    close(dims.element.rMin, 103);
    expect(dims.element.neighbor).to.be.above(0);
    expect(() => calc({element: {radius: 5}})).to.throw(/axis/);
    expect(() => calc({element: {radius: 40, tilt: 0}})).to.throw(/neighbor/);
  });

  it('line length: manual vs auto, slack', () => {
    const {dims} = calc({line: {length: 250}});
    expect(dims.line.auto).to.equal(false);
    close(dims.line.slack, 250 - dims.line.path);
    expect(dims.line.deg).to.be.below(180);
  });

  it('network: lambda/2 lines repeat Z at f0, N in parallel; qwt: Z0^2 / Zhub', () => {
    const res = calc({});
    const zd = {re: 264, im: 0};
    const f0 = res.input.freq;
    const {z, zHub} = classic.network([zd, zd, zd, zd], f0, res.input, res.dims);
    close(zHub.re, 66, 1e-6);
    close(zHub.im, 0, 1e-6);
    close(z.re, 66, 1e-6);
    // off f0: line transforms
    expect(Math.abs(classic.network([zd, zd, zd, zd], f0 * 1.05, res.input, res.dims).zHub.im)).to.be.above(1);
    const m = calc({match: {type: 'qwt', z0: 60}});
    close(m.dims.match.length, tline.lengthOf(0.25, 0.66, f0));
    close(classic.network([zd, zd, zd, zd], f0, m.input, m.dims).z.re, 3600 / 66, 1e-6);
    // stray C lowers |Z| of high-Z dipole
    const c = calc({feed: {strayC: 2}});
    expect(classic.network([zd, zd, zd, zd], f0, c.input, c.dims).zHub.re).to.be.below(66);
  });

  it('tline.zin: matched, short, quarter-wave', () => {
    close(tline.zin({re: 50, im: 0}, 50, 1.234).re, 50);
    close(tline.zin({re: 100, im: 0}, 50, Math.PI / 2).re, 25, 1e-6);
    close(tline.zin({re: 0, im: 0}, 50, Math.PI / 4).im, 50, 1e-9);
    close(tline.parallel([{re: 100, im: 0}, {re: 100, im: 0}]).re, 50);
  });

  it('zBottom / zTop cover all conductors', () => {
    const {geometry: g} = calc({});
    const zs = g.elements.flatMap(e => [...e.fed, ...e.other].map(p => p[2]));
    close(g.zBottom, Math.min(...zs));
    close(g.zTop, Math.max(...zs));
  });

  it('validation', () => {
    expect(() => calc({element: {n: 2.5}})).to.throw(/element.n/);
    expect(() => calc({element: {spacing: 5, od: 6.35}})).to.throw(/spacing/);
    expect(() => calc({element: {od2: -1}})).to.throw(/od2/);
    expect(() => calc({element: {fold: 'x'}})).to.throw(/fold/);
    expect(() => calc({element: {tilt: 90}})).to.throw(/tilt/);
    expect(() => calc({line: {vf: 0}})).to.throw(/line.vf/);
    expect(() => calc({line: {length: 0}})).to.throw(/line.length/);
    expect(() => calc({match: {type: 'stub'}})).to.throw(/match.type/);
    expect(() => calc({polarization: 'X'})).to.throw(/polarization/);
  });
});
