'use strict';

// nec2++ runner. Binary lookup order:
//   1. opts.bin
//   2. $NEC2PP
//   3. local clone ../../tmolteno/necpp/build/src/nec2++ (relative to repo root)
//   4. nec2++ on $PATH

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const localBin = path.resolve(__dirname, '../../../tmolteno/necpp/build/src/nec2++');

const findBin = (opts = {}) => {
  if (opts.bin) { return opts.bin; }
  if (process.env.NEC2PP) { return process.env.NEC2PP; }
  if (fs.existsSync(localBin)) { return localBin; }
  return 'nec2++';
};

// deck: NEC card text -> {bin, out: raw .out text}
const run = (deck, opts = {}) => {
  const bin = findBin(opts);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'necpp-'));
  const inp = path.join(dir, 'in.nec');
  const out = path.join(dir, 'out.out');
  try {
    fs.writeFileSync(inp, deck);
    execFileSync(bin, ['-i' + inp, '-o' + out], {stdio: ['ignore', 'pipe', 'pipe']});
    return {bin, out: fs.readFileSync(out, 'utf8')};
  } finally {
    if (!opts.keep) { fs.rmSync(dir, {recursive: true, force: true}); }
  }
};

module.exports = {localBin, findBin, run};
