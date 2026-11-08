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
  choke: require('./choke.js'),
  antennas: require('./antennas.js'),
  lindenblad: require('./lindenblad.js'),
  lindenbladNec: require('./lindenblad-nec.js'),
  lindenbladClassic: require('./lindenblad-classic.js'),
  lindenbladClassicNec: require('./lindenblad-classic-nec.js'),
  tline: require('./tline.js'),
  // legacy QFH
  qfh: require('./qfh.js'),
  qfhNec: require('./qfh-nec.js')
};
