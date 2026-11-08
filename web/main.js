import lib from '../lib/browser.js';
import {createView} from './view3d.js';
import * as plots from './plots.js';
import * as status from './status.js';
import * as sats from './sats.js';

const {qfh, qfhNec, cables} = lib;

const presets = {
  '2m': {freq: 145.6, band: [144.3, 146.0], conductor: {type: 'coax', name: 'RG-213', od: 10.3}, bendRadius: 60, data: 'qfh-2m'},
  '70cm': {freq: 435.5, band: [432.1, 438.0], conductor: {type: 'coax', name: 'RG-58', od: 4.95}, bendRadius: 25, data: 'qfh-70cm'}
};

const fields = [
  {key: 'band', label: 'band', type: 'select', options: Object.keys(presets)},
  {key: 'freq', label: 'f0, MHz', step: 0.1},
  {key: 'turns', label: 'turns', type: 'select', options: [0.5, 0.75, 1, 1.25, 1.5]},
  {key: 'ratioDH', label: 'D / H', step: 0.01},
  {key: 'cable', label: 'cable', type: 'select', options: Object.keys(cables.cables)},
  {key: 'bendRadius', label: 'bend R, mm', step: 1},
  {key: 'arm', label: 'crossarm OD, mm', step: 1},
  {key: 'polarization', label: 'polarization', type: 'select', options: ['RHCP', 'LHCP']}
];

const state = {band: '70cm', freq: 435.5, turns: 0.5, ratioDH: 0.44, cable: 'RG-58', bendRadius: 25, arm: 20, polarization: 'RHCP'};

const form = document.getElementById('inputs');
const renderForm = () => {
  form.innerHTML = fields.map(f => {
    const v = state[f.key];
    const ctl = f.type === 'select'
      ? '<select name="' + f.key + '">' + f.options.map(o => '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>'
      : '<input name="' + f.key + '" type="number" step="' + f.step + '" value="' + v + '">';
    return '<label>' + f.label + ctl + '</label>';
  }).join('');
};

const toInput = () => {
  const pre = presets[state.band];
  const c = cables.cables[state.cable];
  return {
    freq: +state.freq, band: pre.band, turns: +state.turns, ratioDH: +state.ratioDH,
    conductor: {type: 'coax', name: state.cable, od: c.od},
    bendRadius: +state.bendRadius, polarization: state.polarization,
    frame: {standard: 'BY', mast: 32, arm: +state.arm}
  };
};

const fmt = x => x.toFixed(1);
const renderDims = res => {
  const d = res.dims, rows = [
    ['conductor length to cut', 'totalC'],
    ['electrical length', 'total'],
    ['diameter D (center to center)', 'D'],
    ['height H', 'H'],
    ['crossarm straight part Dc', 'Dc'],
    ['internal diameter Di', 'Di'],
    ['helical side (with bends)', 'side'],
    ['helical side straight part', 'sideC']
  ];
  document.getElementById('dims').innerHTML =
    '<table><thead><tr><th>mm</th><th class="big">big loop</th><th class="small">small loop</th></tr></thead><tbody>' +
    rows.map(([t, k]) => '<tr><td>' + t + '</td><td>' + fmt(d.big[k]) + '</td><td>' + fmt(d.small[k]) + '</td></tr>').join('') +
    '</tbody></table>' +
    '<p class="note">λ ' + fmt(d.wavelength) + ' mm · compensated λ ' + fmt(d.wavelengthC) +
    ' mm · bend correction ' + fmt(d.bendCorr) + ' mm/corner · Coppens optimum conductor Ø ' + fmt(d.optDiam) + ' mm</p>' +
    (res.dims.big.Dc < 0.3 * res.dims.big.D ? '<p class="note">⚠ bends take most of the crossarm span — reduce bend R or use thinner cable.</p>' : '');
};

const view = createView(document.getElementById('view3d'));

const recalc = () => {
  try {
    const res = qfh.calc(toInput());
    renderDims(res);
    view.update(res);
    scheduleSim();
  } catch (err) {
    document.getElementById('dims').innerHTML = '<p class="note">⚠ ' + err.message + '</p>';
  }
};

form.addEventListener('input', e => {
  const k = e.target.name;
  state[k] = e.target.value;
  if (k === 'band') {
    const pre = presets[state.band];
    Object.assign(state, {freq: pre.freq, cable: pre.conductor.name, bendRadius: pre.bendRadius});
    renderForm();
  }
  recalc();
});

// precomputed NEC results
const sim = {ground: 'free'};
const simControls = document.getElementById('sim-controls');
simControls.innerHTML = '<label><input type="radio" name="ground" value="free" checked> free space</label>' +
  '<label><input type="radio" name="ground" value="poor"> poor ground, 4 m roof + 1.5 m mast</label>';
simControls.addEventListener('change', e => {
  sim.ground = e.target.value;
  if (liveOk) { scheduleSim(); } else { loadSim(); }
});

const put = (id, node) => { const el = document.getElementById(id); el.replaceChildren(node); };

const showSim = (data, note) => {
  document.getElementById('sim-note').textContent = note;
  put('plot-swr', plots.swr(data));
  put('plot-z', plots.z(data));
  put('plot-gain', plots.gain(data));
  put('plot-ar', plots.ar(data));
};

// fallback: precomputed results for reference design
const loadSim = async () => {
  const name = presets[state.band].data + '-' + sim.ground;
  const data = await (await fetch('data/' + name + '.json')).json();
  const i = data.input;
  showSim(data, 'Precomputed with nec2++ for the reference design: ' + i.freq + ' MHz, ' + i.conductor.name + ', ' +
    i.turns + ' turn, D/H ' + i.ratioDH + ', bend R ' + i.bendRadius + ' mm (' + data.segments + ' segments).');
};

// live: nec2++ WASM in a Web Worker
const worker = new Worker(new URL('assets/nec-worker.js', document.baseURI), {type: 'module'});
const wasmUrl = new URL('wasm/nec2pp.wasm', document.baseURI).href;
const pending = new Map();
let nextId = 1;
worker.onmessage = e => {
  const {id} = e.data;
  const cb = pending.get(id);
  pending.delete(id);
  if (cb) { cb(e.data); }
};
const necRun = deck => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, d => (d.error ? reject(new Error(d.error)) : resolve(d)));
  worker.postMessage({id, deck, wasmUrl});
});

const statusEl = document.getElementById('sim-status');
let simTimer = null, simSeq = 0, liveOk = true;

const runLive = async () => {
  const seq = ++simSeq;
  const input = {...toInput(), env: {ground: sim.ground}};
  const res = qfh.calc(input);
  const deck = qfhNec.deck(res);
  statusEl.textContent = '⏳ nec2++ (WASM) running, ' + deck.segments + ' segments…';
  try {
    const {out, ms} = await necRun(deck.text);
    if (seq !== simSeq) { return; } // superseded
    const s = qfhNec.summarize(out, deck);
    const data = {
      input: res.input,
      sweep: s.sweep.map(x => ({freq: x.freq, r: x.z.re, x: x.z.im, swr: x.swr})),
      patterns: s.patterns
    };
    showSim(data, 'Live nec2++ (WebAssembly) for the inputs above: ' + input.freq + ' MHz, ' + input.conductor.name +
      ', ' + input.turns + ' turn, D/H ' + input.ratioDH + ', bend R ' + input.bendRadius + ' mm. ' +
      'Unoptimized Coppens dimensions: resonance is ~2.5 % low.');
    statusEl.textContent = '✓ ' + deck.segments + ' segments, ' + (ms / 1000).toFixed(2) + ' s in your browser';
  } catch (err) {
    liveOk = false;
    statusEl.textContent = '⚠ WASM simulation unavailable (' + err.message + '); showing precomputed results.';
    loadSim();
  }
};

function scheduleSim () {
  if (!liveOk) { return; }
  clearTimeout(simTimer);
  simTimer = setTimeout(runLive, 300);
}

status.render(document.getElementById('status-list'));
sats.render(document.getElementById('sat-table'));
renderForm();
recalc();
