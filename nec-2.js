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

module.exports = {
    comment: comment,
    commentEnd: commentEnd,
    theEnd: theEnd,
    specWire: specWire,
    specEnd: specEnd,
    excitation: excitation,
    freq: freq
};
