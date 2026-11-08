'use strict';

const {expect} = require('chai');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {util, geom, necDeck, antennas} = require('../lib/index.js');

const bin = path.resolve(__dirname, '../bin/antenna.js');
const ex70 = path.resolve(__dirname, '../examples/qfh-70cm.json');

describe('core', () => {
  it('util.merge: deep, arrays replaced', () => {
    const m = util.merge({a: {b: 1, c: 2}, l: [1, 2]}, {a: {c: 3}, l: [5]});
    expect(m).to.deep.equal({a: {b: 1, c: 3}, l: [5]});
  });

  it('geom: dist, polylineLength, cross', () => {
    expect(geom.dist([0, 0, 0], [3, 4, 0])).to.equal(5);
    expect(geom.polylineLength([[0, 0, 0], [1, 0, 0], [1, 1, 0]])).to.equal(2);
    expect(geom.v3.cross([1, 0, 0], [0, 1, 0])).to.deep.equal([0, 0, 1]);
  });

  it('necDeck.build: dipole, odd feed segments, ground cards', () => {
    const wires = [{a: [0, 0, -500], b: [0, 0, 500], radius: 5, feed: {sign: 1}}];
    const d = necDeck.build({
      comments: ['dipole'], wires, gnd: necDeck.grounds.poor, maxSeg: 100,
      sweep: {fLo: 140, fHi: 150, steps: 11}, patFreqs: [145], pattern: necDeck.necDefaults.pattern
    });
    expect(d.segments % 2).to.equal(1);
    expect(d.feeds).to.deep.equal([{sign: 1, tag: 1, seg: (d.segments + 1) / 2}]);
    expect(d.text).to.match(/^CM dipole\nCE\nGW 1 11 0 0 -0.5 0 0 0.5 0.005\nGE -1\nGN 2 /);
    expect(d.text).to.match(/\nEN\n$/);
  });

  it('necDeck.groundOf: unknown ground throws', () => {
    expect(() => necDeck.groundOf({ground: 'mud'})).to.throw(/unknown ground/);
  });

  it('antennas registry: get / resolve / default', () => {
    expect(antennas.get('qfh').legacy).to.equal(true);
    expect(antennas.antennas[antennas.defaultType()]).to.be.an('object');
    const {antenna, input} = antennas.resolve({type: 'qfh', freq: 145});
    expect(antenna.type).to.equal('qfh');
    expect(input).to.deep.equal({freq: 145});
    expect(() => antennas.get('yagi')).to.throw(/unknown antenna type/);
  });

  it('CLI: antenna --type qfh --nec == qfh --nec', () => {
    const a = execFileSync(bin, ['--type', 'qfh', ex70, '--nec'], {encoding: 'utf8'});
    const b = execFileSync(path.resolve(__dirname, '../bin/qfh.js'), [ex70, '--nec'], {encoding: 'utf8'});
    expect(a).to.equal(b);
    expect(a).to.match(/^CM QFH 435.5 MHz/);
  });

  it('CLI: --list', () => {
    const s = execFileSync(bin, ['--list'], {encoding: 'utf8'});
    expect(s).to.match(/^qfh .*legacy/m);
  });
});
