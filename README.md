# antenna
collection of antennas

QFH antennas for HAM LEO satellites (2 m / 70 cm): https://ai6yp.github.io/antenna/

```
npm install
npm test
./bin/qfh.js examples/qfh-70cm.json
nec2++ -iexamples/example1.nec
```

Web page (`web/` → `docs/`):

```
npm run build:data     # precompute nec2++ results (native)
scripts/build-wasm.sh  # nec2++ -> web/wasm/nec2pp.wasm (needs /opt/wasi-sdk >= 33)
npm run build:web      # esbuild -> docs/
npm run dev            # watch + serve http://localhost:8000
```

`lib/necpp.js` looks for nec2++ in: `$NEC2PP`, `../../tmolteno/necpp/build/src/nec2++` (local clone), `$PATH`.
https://github.com/tmolteno/necpp

```
git clone git@github.com:tmolteno/necpp.git
cd necpp
cmake -B build && cmake --build build -j4 && sudo cmake --install build
```

https://github.com/dj-on-github/yagiyagi

https://github.com/KJ7LNW/xnec2c

http://www.qsl.net/4nec2/Tutorial.pdf

http://www.nec2.org/other/nec2prt3.pdf

http://www.af6sa.com/projects/Lindenblad.html

https://stv-ural.ru/radiocom/ants-2b/yagi-vhf-uhf/sputnik/ay-v5u7-q20a/
