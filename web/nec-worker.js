// Web Worker: runs nec2++ WASM off the main thread
import {createNec} from './nec-wasm.mjs';

let nec = null;

self.onmessage = async e => {
  const {id, deck, wasmUrl} = e.data;
  try {
    if (!nec) {
      const module = await WebAssembly.compileStreaming(fetch(wasmUrl));
      nec = createNec(module);
    }
    const t0 = performance.now();
    const out = await nec.run(deck);
    self.postMessage({id, out, ms: performance.now() - t0});
  } catch (err) {
    self.postMessage({id, error: String(err && err.message || err)});
  }
};
