'use strict';

// browser entry: no node-only modules (sim.simulate needs opts.run)
module.exports = {
  util: require('./util.js'),
  geom: require('./geom.js'),
  nec2: require('./nec2.js'),
  necout: require('./necout.js'),
  necDeck: require('./nec-deck.js'),
  sim: require('./sim.js'),
  cables: require('./cables.js'),
  antennas: require('./antennas.js'),
  // legacy QFH
  qfh: require('./qfh.js'),
  qfhNec: require('./qfh-nec.js')
};
