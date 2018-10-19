#!/usr/bin/env node

const nec2 = require('./nec-2');

const lambda = f => (984 / f).toString().slice(0, 4);

console.log([
    nec2.comment('Half-wavelength dipole 915MHz'),
    nec2.commentEnd(),
    nec2.specWire({
        tag: 1,
        numberOfSegments: 9,
        w: [
            {x:0, y:-lambda(915) / 2, z:0},
            {x:0, y: lambda(915) / 2, z:0}
        ],
        radius: 0.001
    }),
    nec2.specEnd(),
    nec2.excitation({
        type: 'voltage',
        tag: 1,
        index: 5,
        v: {re: 10, im: 0}
    }),
    nec2.freq({
        step: {type: 'linear', count: 100},
        freq: 100,
        incr: 10
    }),
    nec2.theEnd()
].join('\n'));
