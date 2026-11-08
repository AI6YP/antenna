'use strict';

const comment = p => 'CM ' + p;
const commentEnd = () => 'CE';
const theEnd = () => 'EN';

// GW = Wire Specification
const specWire = p => 'GW ' + [
  p.tag,   // Tag number assigned to all segments of the wire
  p.numberOfSegments,    // Number of segments into which the wire will be divided.
  p.w[0].x, p.w[0].y, p.w[0].z, // beginning of the wire
  p.w[1].x, p.w[1].y, p.w[1].z, // end of the wire
  p.radius
].join(' ');

const specEnd = () => 'GE';

// EX 0 1 5 0 1 0
const excitation = p => {
  const stype = {
    voltage: 0
  };
  return 'EX ' + [
    stype[p.type],
    p.tag,
    p.index,
    0,
    p.v.re,
    p.v.im
  ].join(' ');
};

// FR 0 1 0 0 200 0
const freq = p => {
  const stype = {
    linear: 0,
    multiplicative: 1
  };
  return 'FR ' + [
    stype[p.step.type],
    p.step.count,
    0, 0,
    p.freq, // frequency in MHz
    p.incr  // frequency increment
  ].join(' ');
};

// GE with ground flag: 0 no ground, 1 ground present (current image), -1 ground, no image
const specEndGround = gpflag => 'GE ' + gpflag;

// GN = ground parameters
// type: -1 free space (null ground), 0 finite reflection coef, 1 perfect, 2 Sommerfeld/Norton
const ground = p => 'GN ' + [
  p.type,
  0, 0, 0,
  p.eps || 0,  // relative dielectric constant
  p.sig || 0   // conductivity, S/m
].join(' ');

// XQ = execute (input impedance only)
const execute = () => 'XQ 0';

// RP = radiation pattern
// mode 0: normal (space wave, + ground wave when GN 2), XNDA = 1000 (major/minor axis, power gain)
const pattern = p => 'RP ' + [
  p.mode || 0,
  p.nTheta, p.nPhi,
  p.xnda === undefined ? 1000 : p.xnda,
  p.theta0, p.phi0,
  p.dTheta, p.dPhi
].join(' ');

// LD = loading. type 0 series RLC, 1 parallel RLC (R ohm, L H, C F; 0 = absent), 4 series R + jX
const load = p => 'LD ' + [p.type, p.tag, p.from, p.to, p.a || 0, p.b || 0, p.c || 0].join(' ');

module.exports = {
  load,
  specEndGround,
  ground,
  execute,
  pattern,
  comment: comment,
  commentEnd: commentEnd,
  theEnd: theEnd,
  specWire: specWire,
  specEnd: specEnd,
  excitation: excitation,
  freq: freq
};
