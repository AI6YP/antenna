'use strict';

// Lossless transmission line + complex helpers. Units: mm, MHz, ohm.

const {C} = require('./util.js');

const cx = {
  add: (a, b) => ({re: a.re + b.re, im: a.im + b.im}),
  mul: (a, b) => ({re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re}),
  div: (a, b) => {
    const d = b.re * b.re + b.im * b.im;
    return {re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d};
  },
  inv: a => cx.div({re: 1, im: 0}, a)
};

// electrical length (rad) of line: physical length l (mm), velocity factor vf, at f (MHz)
const theta = (l, vf, f) => 2 * Math.PI * f * l / (vf * C);

// physical length (mm) of electrical fraction k of a wavelength (0.5 = half-wave) at f
const lengthOf = (k, vf, f) => k * vf * C / f;

// input impedance of lossless line Z0, electrical length th, terminated by zl:
// Zin = Z0 (ZL + j Z0 tan th) / (Z0 + j ZL tan th)
const zin = (zl, z0, th) => {
  const t = Math.tan(th);
  const num = {re: zl.re, im: zl.im + z0 * t};
  const den = {re: z0 - zl.im * t, im: zl.re * t};
  return cx.mul({re: z0, im: 0}, cx.div(num, den));
};

// parallel combination of impedances
const parallel = zs => cx.inv(zs.reduce((s, z) => cx.add(s, cx.inv(z)), {re: 0, im: 0}));

module.exports = {cx, theta, lengthOf, zin, parallel};
