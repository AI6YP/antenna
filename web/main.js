import {createView} from './view3d.js';
import {createPatternView, kinds as patKinds, ranges as patRanges} from './pattern3d.js';
import * as plots from './plots.js';
import * as status from './status.js';
import * as sats from './sats.js';
import * as toolbar from './toolbar.js';
import {t, apply as applyI18n, onLang} from './i18n.js';
import lindenblad from './antennas/lindenblad.js';
import qfh from './antennas/qfh.js';

const adapters = {lindenblad, qfh}; // first = default

const url = new URL(location.href);
let A = adapters[url.searchParams.get('a')] || lindenblad;
let state = A.init(A.defaultBand);

// ---- antenna selector -------------------------------------------------------
const selEl = document.getElementById('antenna-select');
const renderSelector = () => {
  selEl.innerHTML = '<span class="seg">' + Object.values(adapters).map(a =>
    '<button type="button" data-a="' + a.type + '" aria-pressed="' + (a === A) + '">' + t('a.' + a.type) +
    (a.legacy ? ' <small>(' + t('a.legacy') + ')</small>' : '') + '</button>').join('') + '</span>';
};
selEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-a]');
  if (!b || adapters[b.dataset.a] === A) { return; }
  A = adapters[b.dataset.a];
  state = A.init(A.defaultBand);
  const u = new URL(location.href);
  u.searchParams.set('a', A.type);
  history.replaceState(null, '', u);
  liveOk = true;
  lastRes = null;
  lastSim = null;
  renderAll();
  recalc();
});

// ---- form (generated from adapter fields) -----------------------------------
const form = document.getElementById('inputs');
let lastRes = null;
const fmtV = (f, v) => (typeof v === 'number' ? (f.step < 1 ? v.toFixed(1) : String(Math.round(v * 100) / 100)) : String(v));

// effective value for nullable (auto) fields: from calc dims
const autoValue = key => (key === 'driven.sleeve' && lastRes ? lastRes.dims.driven.bottom : undefined);

const control = f => {
  const v = A.get(state, f.key);
  const name = ' data-key="' + f.key + '"';
  if (f.type === 'select') {
    return '<select' + name + '>' + f.options.map(o => '<option' + (String(o) === String(v) ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
  }
  if (f.type === 'number') {
    return '<input' + name + ' type="number" step="' + f.step + '" value="' + v + '">';
  }
  const isAuto = f.nullable && v === null;
  const val = isAuto ? autoValue(f.key) : v;
  const dis = isAuto ? ' disabled' : '';
  return '<span class="range"><input' + name + ' type="range" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + val + '"' + dis + '>' +
    '<input' + name + ' type="number" step="' + f.step + '" value="' + fmtV(f, val ?? 0) + '"' + dis + '></span>' +
    (f.nullable ? '<label class="auto"><input type="checkbox" data-auto="' + f.key + '"' + (isAuto ? ' checked' : '') + '> ' + t('f.auto') + '</label>' : '');
};

const renderForm = () => {
  form.innerHTML = A.fields(state).map(f =>
    '<label class="' + (f.type === 'range' ? 'wide' : '') + '"><span>' + t('f.' + f.key) + '</span>' + control(f) + '</label>').join('');
};

form.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.auto) {
    const key = el.dataset.auto;
    state = A.set(state, key, el.checked ? null : Math.round(autoValue(key)));
    recalc();
    renderForm();
    return;
  }
  const key = el.dataset.key;
  if (!key) { return; }
  if (el.value === '') { return; }
  state = A.set(state, key, el.value);
  if (key === 'band') {
    renderForm();
  } else {
    // sync twin (range <-> number)
    form.querySelectorAll('[data-key="' + key + '"]').forEach(o => { if (o !== el) { o.value = el.value; } });
  }
  recalc();
});

// ---- calc + 3D ----------------------------------------------------------------
const view = createView(document.getElementById('view3d'));

const recalc = () => {
  try {
    const res = A.calc(A.toInput(state));
    lastRes = res;
    document.getElementById('dims').innerHTML = A.renderDims(res, t);
    view.update(res, A.build3d);
    // refresh auto (nullable) displays
    form.querySelectorAll('input[data-auto]:checked').forEach(cb => {
      const v = autoValue(cb.dataset.auto);
      form.querySelectorAll('[data-key="' + cb.dataset.auto + '"]').forEach(o => { o.value = v.toFixed(1); });
    });
    scheduleSim();
  } catch (err) {
    document.getElementById('dims').innerHTML = '<p class="note">⚠ ' + err.message + '</p>';
  }
};

// ---- simulation -------------------------------------------------------------
const sim = {ground: 'free', kind: 'rhcp', range: 30};
const simControls = document.getElementById('sim-controls');
const renderSimControls = () => {
  simControls.innerHTML = ['free', 'poor'].map(g => '<label><input type="radio" name="ground" value="' + g + '"' +
    (sim.ground === g ? ' checked' : '') + '> ' + t('g.' + g) + '</label>').join('');
};
simControls.addEventListener('change', e => {
  sim.ground = e.target.value;
  if (liveOk) { scheduleSim(); } else { loadSim(); }
});

// 3D pattern controls
const patView = createPatternView(document.getElementById('pattern3d'));
const patControls = document.getElementById('pattern-controls');
const renderPatControls = () => {
  const seg = (name, list, cur, label) => '<span class="seg">' + list.map(v =>
    '<button type="button" data-' + name + '="' + v + '" aria-pressed="' + (v === cur) + '">' + label(v) + '</button>').join('') + '</span>';
  patControls.innerHTML = seg('kind', patKinds, sim.kind, k => t('p3.' + k)) + ' ' + seg('range', patRanges, sim.range, r => r + ' dB');
};
patControls.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) { return; }
  if (b.dataset.kind) { sim.kind = b.dataset.kind; }
  if (b.dataset.range) { sim.range = +b.dataset.range; }
  renderPatControls();
  if (lastSim) { showPattern(lastSim.data); }
});

const put = (id, node) => { const el = document.getElementById(id); el.replaceChildren(node); };

let lastSim = null, lastStatus = null;

const setStatus = st => {
  lastStatus = st;
  statusEl.textContent = st ? t(st.key, st.vars) : '';
};

const showPattern = data => {
  const p = data.patterns.find(x => x.sphere);
  const r = patView.update(p && p.sphere, {kind: sim.kind, range: sim.range});
  patView.setLegend(r ? t('p3.legend', {f: p.freq.toFixed(1), kind: t('p3.' + sim.kind), max: r.gmax.toFixed(1), range: sim.range}) : t('p3.none'));
};

const showSim = (data, noteKey, vars) => {
  lastSim = {data, noteKey, vars};
  document.getElementById('sim-note').textContent = t(noteKey, {...vars, design: A.designText(data.input, t)});
  put('plot-swr', plots.swr(data));
  put('plot-z', plots.z(data));
  put('plot-gain', plots.gain(data));
  put('plot-ar', plots.ar(data));
  showPattern(data);
};

// fallback: precomputed results for reference design
const loadSim = async () => {
  const name = A.type + '-' + state.band + '-' + sim.ground;
  try {
    const data = await (await fetch('data/' + name + '.json')).json();
    showSim(data, 's.pre', {seg: data.segments});
  } catch (err) {
    setStatus({key: 's.error', vars: {msg: err.message}});
  }
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
  const inp = A.toInput(state);
  const res = A.calc({...inp, env: {...(inp.env || {}), ground: sim.ground}});
  const deck = A.nec.deck(res, A.necOpts);
  setStatus({key: 's.running', vars: {seg: deck.segments}});
  try {
    const {out, ms} = await necRun(deck.text);
    if (seq !== simSeq) { return; } // superseded
    const s = A.nec.summarize(out, deck);
    const data = {
      input: res.input,
      sweep: s.sweep.map(x => ({freq: x.freq, r: x.z.re, x: x.z.im, swr: x.swr})),
      patterns: s.patterns
    };
    showSim(data, A.liveKey, {});
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

// ---- language-dependent rendering ---------------------------------------------
const renderAll = () => {
  applyI18n();
  view.setLegend(t(A.legendKey));
  status.render(document.getElementById('status-list'));
  sats.render(document.getElementById('sat-table'));
  renderSelector();
  renderForm();
  renderSimControls();
  renderPatControls();
  if (lastRes) { document.getElementById('dims').innerHTML = A.renderDims(lastRes, t); }
  if (lastSim) { showSim(lastSim.data, lastSim.noteKey, lastSim.vars); }
  setStatus(lastStatus);
};
onLang(renderAll);

toolbar.render(document.getElementById('toolbar'));
recalc();
renderAll();
