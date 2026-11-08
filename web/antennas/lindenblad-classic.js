// Classic Lindenblad web adapter: 4 x lambda/2 folded dipoles + lambda/2 300 ohm twin-lead -> hub
import lib from '../../lib/browser.js';
import ex70 from '../../examples/lindenblad-classic-70cm.json';
import ex2m from '../../examples/lindenblad-classic-2m.json';

const {lindenblad, cables, util} = lib;

const strip = ({type, ...rest}) => rest; // eslint-disable-line no-unused-vars
const presets = {'2m': strip(ex2m), '70cm': strip(ex70)};

const init = band => ({band, input: util.merge({}, presets[band])});

const getPath = (o, path) => path.split('.').reduce((v, k) => (v === undefined || v === null ? undefined : v[k]), o);
const setPath = (path, v) => path.split('.').reduceRight((acc, k) => ({[k]: acc}), v);

const full = state => lindenblad.normalize(state.input);

// effective value of nullable (auto) field
const autoValue = (key, res) => {
  if (key === 'element.od2') { return res.dims.element.od2; }
  if (key === 'line.length') { return res.dims.line.length; }
  return undefined;
};

// slider range: band preset value +- k
const rel = (state, path, k = 0.3) => {
  const pre = presets[state.band];
  const v = getPath(full({input: pre}), path) ?? autoValue(path, lindenblad.calc(pre));
  return {min: Math.floor(v * (1 - k)), max: Math.ceil(v * (1 + k))};
};

const fields = state => [
  {key: 'band', type: 'select', options: Object.keys(presets)},
  {key: 'freq', type: 'number', step: 0.1},
  {key: 'polarization', type: 'select', options: ['RHCP', 'LHCP']},
  {key: 'element.n', type: 'select', options: [3, 4, 5]},
  {key: 'element.length', type: 'range', step: 1, ...rel(state, 'element.length')},
  {key: 'element.od', type: 'range', step: 0.05, min: 1, max: 20},
  {key: 'element.od2', type: 'range', step: 0.05, min: 1, max: 20, nullable: true, autoKey: 'f.auto.od2'},
  {key: 'element.spacing', type: 'range', step: 1, ...rel(state, 'element.spacing', 0.75)},
  {key: 'element.fold', type: 'select', options: ['plane', 'radial']},
  {key: 'element.radius', type: 'range', step: 1, ...rel(state, 'element.radius', 0.5)},
  {key: 'element.tilt', type: 'range', step: 1, min: 0, max: 60},
  {key: 'element.lean', type: 'range', step: 1, min: -60, max: 60},
  {key: 'line.z0', type: 'range', step: 1, min: 50, max: 600},
  {key: 'line.vf', type: 'range', step: 0.01, min: 0.5, max: 1},
  {key: 'line.length', type: 'range', step: 1, nullable: true, autoKey: 'f.auto.half', ...rel(state, 'line.length')},
  {key: 'match.type', type: 'select', options: ['none', 'qwt']},
  {key: 'match.z0', type: 'range', step: 1, min: 25, max: 150},
  {key: 'feed.strayC', type: 'range', step: 0.1, min: 0, max: 10},
  {key: 'env.mast.pvc', type: 'range', step: 10, min: 0, max: 2000}
];

const get = (state, key) => (key === 'band' ? state.band : getPath(full(state), key));

const strKeys = ['polarization', 'element.fold', 'match.type'];
const set = (state, key, value) => {
  if (key === 'band') { return init(value); }
  const v = strKeys.includes(key) ? value : (value === null ? null : +value);
  return {...state, input: util.merge(state.input, setPath(key, v))};
};

const toInput = state => util.merge({}, state.input);

const f1 = x => x.toFixed(1);
const f2 = x => String(+x.toFixed(2));
const renderDims = (res, t) => {
  const d = res.dims, q = d.element, ln = d.line, m = d.match;
  const row = (k, v, note = '') => '<tr><td>' + t(k) + '</td><td>' + v + '</td><td class="note">' + note + '</td></tr>';
  return '<table><thead><tr><th>' + t('d.mm') + '</th><th></th><th></th></tr></thead><tbody>' +
    row('dc.len', q.n + ' × ' + f1(q.length), q.lengthLambda.toFixed(3) + ' λ') +
    row('dc.od', f2(q.od) + ' / ' + f2(q.od2), t('dc.stepUp', {k: q.stepUp.toFixed(2)})) +
    row('dc.spacing', f1(q.spacing), t('dc.fold.' + q.fold)) +
    row('dc.cut', q.cut === null ? '—' : f1(q.cut), q.cut === null ? t('dc.cutNone') : t('dc.cutNote')) +
    row('dl.radius', f1(q.radius), q.radiusLambda.toFixed(3) + ' λ · ' + t('dc.opposite', {v: q.oppositeLambda.toFixed(3)})) +
    row('dl.tilt', q.tilt + '°', t('dl.span', {dz: f1(q.dz), dh: f1(q.dh)})) +
    row('dl.lean', q.lean + '°', t('dl.leanNote', {elev: f1(q.elev), dr: f1(q.dr)})) +
    row('dc.clear', f1(q.neighbor), 'r min ' + f1(q.rMin)) +
    row('dc.line', q.n + ' × ' + f1(ln.length), ln.z0 + ' Ω · VF ' + ln.vf + ' · ' + f1(ln.deg) + '°' + (ln.auto ? ' (' + t('dc.auto') + ')' : '')) +
    row('dc.slack', f1(ln.slack), t('dc.path', {p: f1(ln.path)})) +
    row('dc.match', m.type === 'qwt' ? f1(m.length) : '—', m.type === 'qwt' ? t('dc.qwt', {z0: res.input.match.z0, vf: m.vf}) : t('dc.none')) +
    '</tbody></table>' +
    '<p class="note">' + t('dc.note', {lambda: f1(d.wavelength)}) + '</p>';
};

const build3d = (res, h) => {
  const {THREE, COLORS, rod, sphere, tube} = h;
  const group = new THREE.Group();
  const p = res.input, g = res.geometry, q = p.element;
  const z = q.z;
  const rArm = (p.hub.arm || 20) / 2;
  const rHub = rArm * 2.2;
  group.add(rod([0, 0, z - rArm * 1.6], [0, 0, z + rArm * 1.6], rHub, COLORS.print)); // printed hub (lines join here)
  for (const e of g.elements) {
    const c = Math.cos(e.phi), s = Math.sin(e.phi);
    // folded dipole: fed conductor, end, other conductor, end (closed loop)
    group.add(rod(e.fed[0], e.fed[1], e.od / 2, COLORS.alu));
    group.add(rod(e.other[0], e.other[1], e.od2 / 2, COLORS.alu));
    group.add(rod(e.fed[1], e.other[1], Math.min(e.od, e.od2) / 2, COLORS.alu));
    group.add(rod(e.other[0], e.fed[0], Math.min(e.od, e.od2) / 2, COLORS.alu));
    group.add(sphere(e.feed, e.od * 0.9, COLORS.feed));
    // PVC arm hub -> printed dipole mount behind the element
    const rEnd = q.radius - q.spacing / 2 - rArm * 1.5;
    group.add(rod([rHub * c, rHub * s, z], [rEnd * c, rEnd * s, z], rArm, COLORS.pvc, 0.55));
    group.add(rod([(rEnd - rArm) * c, (rEnd - rArm) * s, z], [(q.radius - q.spacing / 4) * c, (q.radius - q.spacing / 4) * s, z], rArm * 1.25, COLORS.print));
    // twin-lead: feed point -> along the arm (above it) -> hub
    const w = 5; // half conductor spacing of 300 ohm ribbon
    const side = [-s * w, c * w, 0];
    const top = z + rArm + 4;
    const path = [e.feed, [e.feed[0], e.feed[1], top], [rHub * c, rHub * s, top]];
    for (const sg of [1, -1]) {
      group.add(tube(path.map(pt => [pt[0] + sg * side[0], pt[1] + sg * side[1], pt[2]]), 0.8, COLORS.coax, false));
    }
  }
  // stack: hub -> PVC section (coax inside) -> printed adapter -> metal mast; PVC = mast top -> antenna bottom
  const m = p.env.mast || {};
  const pvc = m.pvc || 0, metal = m.metal || 0;
  const zMast = g.zBottom - pvc;
  const rPvc = (m.od || 40) / 2;
  group.add(rod([0, 0, zMast], [0, 0, z - rArm * 1.6], rPvc, COLORS.pvc, 0.45));
  group.add(rod([0, 0, zMast], [0, 0, z], cables.cables['RG-58'].od / 2, COLORS.coax));
  if (metal > 0) {
    group.add(rod([0, 0, zMast - 25], [0, 0, zMast + 25], rPvc + 3, COLORS.print));
    group.add(rod([0, 0, zMast - metal], [0, 0, zMast], rPvc, COLORS.metal));
  }
  // frame: wide antenna -> use the larger of height and diameter, centered at the hub
  const half = Math.max(g.zTop - g.zBottom, q.radius + q.length / 2) / 2;
  const zc = (g.zTop + g.zBottom) / 2;
  return {group, frame: {zTop: zc + half, zBot: zc - half, key: 'lbc/' + p.freq}};
};

const designText = (i, t) => t('s.lbc.design', {
  freq: i.freq, n: i.element.n, len: i.element.length, od: i.element.od,
  sp: i.element.spacing, r: i.element.radius, tilt: i.element.tilt,
  line: i.line.z0, vf: i.line.vf, match: i.match.type
}) + (i.element.lean ? ', lean ' + i.element.lean + '°' : '');

export default {
  type: 'lindenblad-classic', legacy: false, defaultBand: '70cm', presets,
  nec: lib.lindenbladNec,
  calc: lindenblad.calc, init, fields, get, set, toInput, renderDims, build3d, designText, autoValue,
  legendKey: 'v.lbc.legend', liveKey: 's.lbc.live',
  necOpts: {}
};
