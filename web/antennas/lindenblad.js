// Parasitic Lindenblad web adapter (default antenna)
import lib from '../../lib/browser.js';
import ex70 from '../../examples/lindenblad-70cm.json';
import ex2m from '../../examples/lindenblad-2m.json';

const {lindenblad, cables, util} = lib;

const strip = ({type, ...rest}) => rest; // eslint-disable-line no-unused-vars
const presets = {'2m': strip(ex2m), '70cm': strip(ex70)};

const init = band => ({band, input: util.merge({}, presets[band])});

// path helpers
const getPath = (o, path) => path.split('.').reduce((v, k) => (v === undefined || v === null ? undefined : v[k]), o);
const setPath = (path, v) => path.split('.').reduceRight((acc, k) => ({[k]: acc}), v);

// effective (defaults merged) input
const full = state => lindenblad.normalize(state.input);

// slider ranges: rel -> preset value +- 30 %, else fixed
const rel = (state, path, k = 0.3) => {
  const v = getPath(full({input: presets[state.band]}), path) ?? getPath(lindenblad.calc(presets[state.band]).dims, 'driven.bottom');
  return {min: Math.floor(v * (1 - k)), max: Math.ceil(v * (1 + k))};
};

const fields = state => {
  const pl = getPath(full({input: presets[state.band]}), 'parasitic.length');
  return [
    {key: 'band', type: 'select', options: Object.keys(presets)},
    {key: 'freq', type: 'number', step: 0.1},
    {key: 'polarization', type: 'select', options: ['RHCP', 'LHCP']},
    {key: 'driven.top', type: 'range', step: 1, ...rel(state, 'driven.top')},
    {key: 'driven.sleeve', type: 'range', step: 1, nullable: true, ...rel(state, 'driven.sleeve')},
    {key: 'driven.od', type: 'range', step: 1, min: 6, max: 40},
    {key: 'parasitic.n', type: 'select', options: [3, 4, 5]},
    {key: 'parasitic.length', type: 'range', step: 1, ...rel(state, 'parasitic.length')},
    {key: 'parasitic.od', type: 'range', step: 1, min: 1, max: 20},
    {key: 'parasitic.radius', type: 'range', step: 1, ...rel(state, 'parasitic.radius', 0.5)},
    {key: 'parasitic.tilt', type: 'range', step: 1, min: 0, max: 60},
    {key: 'parasitic.lean', type: 'range', step: 1, min: -60, max: 60},
    {key: 'parasitic.z', type: 'range', step: 1, min: -Math.round(pl / 2), max: Math.round(pl / 2)},
    {key: 'feed.choke', type: 'select', options: ['sleeve', 'ideal', 'none']},
    {key: 'feed.coax', type: 'select', options: ['RG-58', 'RG-316', 'LMR-240']},
    {key: 'feed.strayC', type: 'range', step: 0.1, min: 0, max: 10},
    {key: 'env.mast.pvc', type: 'range', step: 10, min: 0, max: 2000}
  ];
};

const get = (state, key) => (key === 'band' ? state.band : getPath(full(state), key));

const set = (state, key, value) => {
  if (key === 'band') { return init(value); }
  const num = ['polarization', 'feed.choke', 'feed.coax'].includes(key) ? value : (value === null ? null : +value);
  return {...state, input: util.merge(state.input, setPath(key, num))};
};

const toInput = state => util.merge({}, state.input);

const f1 = x => x.toFixed(1);
const renderDims = (res, t) => {
  const d = res.dims, dd = d.driven, q = d.parasitic, s = d.sleeve;
  const row = (k, v, note = '') => '<tr><td>' + t(k) + '</td><td>' + v + '</td><td class="note">' + note + '</td></tr>';
  return '<table><thead><tr><th>' + t('d.mm') + '</th><th></th><th></th></tr></thead><tbody>' +
    row('dl.top', f1(dd.top)) +
    row('dl.sleeve', f1(dd.bottom), s.auto ? t('dl.auto') : '') +
    row('dl.gap', f1(dd.gap)) +
    row('dl.length', f1(dd.length), (dd.lengthLambda).toFixed(3) + ' λ') +
    row('dl.od', f1(dd.od) + ' / ' + f1(s.tubeId)) +
    row('dl.stub', f1(s.f0) + ' MHz', 'Z0 ' + f1(s.z0) + ' Ω · X ' + (Math.abs(s.x) > 1e5 ? '∞' : Math.round(s.x) + ' Ω') + ' · λ/4 ' + f1(s.lengthQW)) +
    row('dl.plen', q.n + ' × ' + f1(q.length), (q.lengthLambda).toFixed(3) + ' λ') +
    row('dl.pod', f1(q.od)) +
    row('dl.radius', f1(q.radius), (q.radiusLambda).toFixed(3) + ' λ') +
    row('dl.tilt', q.tilt + '°', t('dl.span', {dz: f1(q.dz), dh: f1(q.dh)})) +
    row('dl.lean', q.lean + '°', t('dl.leanNote', {elev: f1(q.elev), dr: f1(q.dr)})) +
    row('dl.clear', f1(q.clearance), 'r min ' + f1(q.rMin)) +
    '</tbody></table>' +
    '<p class="note">' + t('dl.note', {lambda: f1(d.wavelength)}) + '</p>';
};

const build3d = (res, h) => {
  const {THREE, COLORS, rod, sphere} = h;
  const group = new THREE.Group();
  const p = res.input, g = res.geometry, dr = g.driven, q = p.parasitic;
  const rD = dr.od / 2;
  group.add(rod(dr.top[0], dr.top[1], rD, COLORS.alu));
  group.add(rod(dr.bottom[0], dr.bottom[1], rD, COLORS.sleeve));
  // printed hub: gap insulator + arm sockets, at parasitic z
  const rArm = (p.hub.arm || 20) / 2;
  const rHub = rD + rArm * 1.2;
  group.add(rod([0, 0, -dr.od * 0.4 - p.driven.gap / 2], [0, 0, dr.od * 0.4 + p.driven.gap / 2], rD * 1.15, COLORS.print));
  group.add(rod([0, 0, q.z - rArm * 1.3], [0, 0, q.z + rArm * 1.3], rHub, COLORS.print));
  for (const e of g.parasitic) {
    const c = Math.cos(e.phi), s = Math.sin(e.phi);
    const rEnd = q.radius - q.od / 2 - rArm * 1.2;
    group.add(rod([rHub * c, rHub * s, q.z], [rEnd * c, rEnd * s, q.z], rArm, COLORS.pvc, 0.55));
    // adjustable adapter at arm end
    group.add(rod([(rEnd - rArm) * c, (rEnd - rArm) * s, q.z], [(q.radius + q.od) * c, (q.radius + q.od) * s, q.z], rArm * 1.25, COLORS.print));
    group.add(rod(e.a, e.b, e.od / 2, COLORS.parasitic));
  }
  // stack below sleeve: printed adapter, PVC section (coax inside), printed adapter, metal mast
  const m = p.env.mast || {};
  const zMouth = dr.bottom[0][2];
  const pvc = m.pvc || 0, metal = m.metal || 0, rPvc = rD + 4;
  const zMast = zMouth - pvc;
  if (pvc > 0) {
    group.add(rod([0, 0, zMast], [0, 0, zMouth], rPvc, COLORS.pvc, 0.45));
    group.add(rod([0, 0, zMast], [0, 0, zMouth], cables.cables[p.feed.coax].od / 2, COLORS.coax));
  }
  group.add(rod([0, 0, zMouth - 25], [0, 0, zMouth + 15], rPvc + 3, COLORS.print));
  if (metal > 0) {
    group.add(rod([0, 0, zMast - 25], [0, 0, zMast + 25], (m.od || 40) / 2 + 3, COLORS.print));
    group.add(rod([0, 0, zMast - metal], [0, 0, zMast], (m.od || 40) / 2, COLORS.metal));
  }
  group.add(sphere([0, 0, 0], rD * 1.4, COLORS.feed));
  return {group, frame: {zTop: g.zTop, zBot: g.zBottom, key: 'lb/' + p.freq}};
};

const designText = (i, t) => t('s.lb.design', {
  freq: i.freq, n: i.parasitic.n, top: i.driven.top,
  sleeve: i.driven.sleeve === null ? 'auto' : i.driven.sleeve,
  pl: i.parasitic.length, r: i.parasitic.radius, tilt: i.parasitic.tilt
}) + (i.parasitic.lean ? ', lean ' + i.parasitic.lean + '°' : '');

export default {
  type: 'lindenblad', legacy: false, defaultBand: '70cm', presets,
  nec: lib.lindenbladNec,
  calc: lindenblad.calc, init, fields, get, set, toInput, renderDims, build3d, designText,
  legendKey: 'v.lb.legend', liveKey: 's.lb.live',
  necOpts: {}
};
