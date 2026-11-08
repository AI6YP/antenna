'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {expect} = require('chai');
const {necpp} = require('../lib/index.js');

describe('necpp', () => {

  it('finds a binary', () => {
    expect(necpp.findBin()).to.be.a('string');
  });

  it('runs dipole deck (geometry from examples/dipole.nec + XQ)', function () {
    this.timeout(30000);
    const base = fs.readFileSync(path.join(__dirname, '../examples/dipole.nec'), 'utf8');
    const deck = base
      .replace(/^FR .*$/m, 'FR 0 1 0 0 140 0')
      .replace(/^EN/m, 'XQ\nEN');
    const res = necpp.run(deck);
    expect(res.out).to.match(/ANTENNA INPUT PARAMETERS/);
  });
});
