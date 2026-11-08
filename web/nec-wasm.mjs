// nec2++ WASI module runner (browser + node). Deck text in -> .out text.
import {WASI, File, OpenFile, PreopenDirectory, ConsoleStdout} from '@bjorn3/browser_wasi_shim';

const enc = new TextEncoder();
const dec = new TextDecoder();

// module: WebAssembly.Module (compile once, instantiate per run)
export const createNec = module => ({
  run: async deck => {
    const dir = new PreopenDirectory('/w', new Map([['in.nec', new File(enc.encode(deck))]]));
    let stderr = '';
    const fds = [
      new OpenFile(new File(new Uint8Array())),
      ConsoleStdout.lineBuffered(() => {}),
      ConsoleStdout.lineBuffered(line => { stderr += line + '\n'; }),
      dir
    ];
    const wasi = new WASI(['nec2++', '-i/w/in.nec', '-o/w/out.out'], [], fds, {debug: false});
    // eslint-disable-next-line camelcase
    const inst = await WebAssembly.instantiate(module, {wasi_snapshot_preview1: wasi.wasiImport});
    const rc = wasi.start(inst);
    const out = dir.dir.contents.get('out.out');
    if (rc !== 0 || !out) {
      throw new Error('nec2++ exit ' + rc + ': ' + stderr);
    }
    return dec.decode(out.data);
  }
});
