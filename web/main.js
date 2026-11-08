import lib from '../lib/browser.js';
import {createView} from './view3d.js';
import * as plots from './plots.js';
import * as status from './status.js';
import * as sats from './sats.js';
import * as toolbar from './toolbar.js';
import {t, apply as applyI18n, onLang} from './i18n.js';

const {qfh, qfhNec, cables} = lib;

const presets = {
  '2m': {freq: 145.6, band: [144.3, 146.0], conductor: {type: 'coax', name: 'RG-213', od: 10.3}, bendRadius: 60, data: 'qfh-2m'},
  '70cm': {freq: 435.5, band: [432.1, 438.0], conductor: {type: 'coax', name: 'RG-58', od: 4.95}, bendRadius: 25, data: 'qfh-70cm'}
};

const fields = [
  {key: 'band', type: 'select', options: Object.keys(presets)},
  {key: 'freq', step: 0.1},
  {key: 'turns', type: 'select', options: [0.5, 0.75, 1, 1.25, 1.5]},
  {key: 'ratioDH', step: 0.01},
  {key: 'cable', type: 'select', options: Object.keys(cables.cables)},
  {key: 'bendRadius', step: 1},
  {key: 'arm', step: 1},
  {key: 'polarization', type: 'select', options: ['RHCP', 'LHCP']}
];

const state = {band: '70cm', freq: 435.5, turns: 0.5, ratioDH: 0.44, cable: 'RG-58', bendRadius: 25, arm: 20, polarization: 'RHCP'};

const form = document.getElementById('inputs');
const renderForm = () => {
  form.innerHTML = fields.map(f => {
    const v = state[f.key];
    const ctl = f.type === 'select'
      ? '<select name="' + f.key + '">' + f.options.map(o => '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>'
      : '<input name="' + f.key + '" type="number" step="' + f.step + '" value="' + v + '">';
    return '<label>' + t('f.' + f.key) + ctl + '</label>';
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
  const d = res.dims;
  const rows = ['totalC', 'total', 'D', 'H', 'Dc', 'Di', 'side', 'sideC'];
  document.getElementById('dims').innerHTML =
    '<table><thead><tr><th>' + t('d.mm') + '</th><th class="big">' + t('d.big') + '</th><th class="small">' + t('d.small') +
    '</th></tr></thead><tbody>' +
    rows.map(k => '<tr><td>' + t('d.' + k) + '</td><td>' + fmt(d.big[k]) + '</td><td>' + fmt(d.small[k]) + '</td></tr>').join('') +
    '</tbody></table>' +
    '<p class="note">' + t('d.note', {lambda: fmt(d.wavelength), lambdaC: fmt(d.wavelengthC), bend: fmt(d.bendCorr), opt: fmt(d.optDiam)}) + '</p>' +
    (d.big.Dc < 0.3 * d.big.D ? '<p class="note">' + t('d.warnBend') + '</p>' : '');
};

const view = createView(document.getElementById('view3d'));
let lastRes = null;

const recalc = () => {
  try {
    const res = qfh.calc(toInput());
    lastRes = res;
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
const renderSimControls = () => {
  simControls.innerHTML = ['free', 'poor'].map(g => '<label><input type="radio" name="ground" value="' + g + '"' +
    (sim.ground === g ? ' checked' : '') + '> ' + t('g.' + g) + '</label>').join('');
};
simControls.addEventListener('change', e => {
  sim.ground = e.target.value;
  if (liveOk) { scheduleSim(); } else { loadSim(); }
});

const put = (id, node) => { const el = document.getElementById(id); el.replaceChildren(node); };

// last shown simulation + status, re-rendered on language change
let lastSim = null, lastStatus = null;

const designText = i => t('s.design', {freq: i.freq, cable: i.conductor.name, turns: i.turns, dh: i.ratioDH, r: i.bendRadius});

const setStatus = st => {
  lastStatus = st;
  statusEl.textContent = st ? t(st.key, st.vars) : '';
};

const showSim = (data, noteKey, vars) => {
  lastSim = {data, noteKey, vars};
  document.getElementById('sim-note').textContent = t(noteKey, {...vars, design: designText(data.input)});
  put('plot-swr', plots.swr(data));
  put('plot-z', plots.z(data));
  put('plot-gain', plots.gain(data));
  put('plot-ar', plots.ar(data));
};

// fallback: precomputed results for reference design
const loadSim = async () => {
  const name = presets[state.band].data + '-' + sim.ground;
  const data = await (await fetch('data/' + name + '.json')).json();
  showSim(data, 's.pre', {seg: data.segments});
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
  setStatus({key: 's.running', vars: {seg: deck.segments}});
  try {
    const {out, ms} = await necRun(deck.text);
    if (seq !== simSeq) { return; } // superseded
    const s = qfhNec.summarize(out, deck);
    const data = {
      input: res.input,
      sweep: s.sweep.map(x => ({freq: x.freq, r: x.z.re, x: x.z.im, swr: x.swr})),
      patterns: s.patterns
    };
    showSim(data, 's.live', {});
    setStatus({key: 's.done', vars: {seg: deck.segments, sec: (ms / 1000).toFixed(2)}});
  } catch (err) {
    liveOk = false;
    setStatus({key: 's.error', vars: {msg: err.message}});
    loadSim();
  }
};

function scheduleSim () {
  if (!liveOk) { return; }
  clearTimeout(simTimer);
  simTimer = setTimeout(runLive, 300);
}

// language-dependent rendering
const renderAll = () => {
  applyI18n();
  view.setLegend(t('v.legend'));
  status.render(document.getElementById('status-list'));
  sats.render(document.getElementById('sat-table'));
  renderForm();
  renderSimControls();
  if (lastRes) { renderDims(lastRes); }
  if (lastSim) { showSim(lastSim.data, lastSim.noteKey, lastSim.vars); }
  setStatus(lastStatus);
};
onLang(renderAll);

toolbar.render(document.getElementById('toolbar'));
renderAll();
recalc();
