#!/usr/bin/env node
'use strict';

// web/ -> docs/ (static site for Cloudflare Pages, antenna.drom.si)

const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'web');
const dst = path.join(root, 'docs');

const watch = process.argv.includes('--watch');

const copy = () => {
  fs.mkdirSync(dst, {recursive: true});
  for (const f of ['index.html', 'style.css']) {
    fs.copyFileSync(path.join(src, f), path.join(dst, f));
  }
  fs.cpSync(path.join(src, 'data'), path.join(dst, 'data'), {recursive: true});
  fs.writeFileSync(path.join(dst, '.nojekyll'), ''); // GitHub Pages: serve as-is
};

const opts = {
  entryPoints: [path.join(src, 'main.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  external: ['node:*'],
  minify: !watch,
  sourcemap: watch,
  outfile: path.join(dst, 'assets/app.js'),
  logLevel: 'info'
};

const main = async () => {
  copy();
  if (watch) {
    const ctx = await esbuild.context(opts);
    await ctx.watch();
    const {port} = await ctx.serve({servedir: dst, port: 8000});
    console.log('http://localhost:' + port);
  } else {
    await esbuild.build(opts);
  }
};

main();
