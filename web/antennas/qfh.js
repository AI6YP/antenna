// QFH (legacy) web adapter
import lib from '../../lib/browser.js';

const {qfh, cables} = lib;

const presets = {
  '2m': {freq: 145.6, band: [144.3, 146.0], cable: 'RG-213', bendRadius: 60},
  '70cm': {freq: 435.5, band: [432.1, 438.0], cable: 'RG-58', bendRadius: 25}
};

const init = band => {
  const pre = presets[band];
  return {band, freq: pre.freq, turns: 0.5, ratioDH: 0.44, cable: pre.cable, bendRadius: pre.bendRadius, arm: 20, polarization: 'RHCP'};
};

const fields = () => [
  {key: 'band', type: 'select', options: Object.keys(presets)},
  {key: 'freq', type: 'number', step: 0.1},
  {key: 'turns', type: 'select', options: [0.5, 0.75, 1, 1.25, 1.5]},
  {key: 'ratioDH', type: 'number', step: 0.01},
  {key: 'cable', type: 'select', options: Object.keys(cables.cables).filter(k => k !== 'RG-316' && k !== 'LMR-240')},
  {key: 'bendRadius', type: 'number', step: 1},
  {key: 'arm', type: 'number', step: 1},
  {key: 'polarization', type: 'select', options: ['RHCP', 'LHCP']}
];

const get = (state, key) => state[key];

const set = (state, key, value) => (key === 'band' ? init(value) : {...state, [key]: value});

const toInput = state => {
  const c = cables.cables[state.cable];
  return {
    freq: +state.freq, band: presets[state.band].band, turns: +state.turns, ratioDH: +state.ratioDH,
    conductor: {type: 'coax', name: state.cable, od: c.od},
    bendRadius: +state.bendRadius, polarization: state.polarization,
    frame: {standard: 'BY', mast: 32, arm: +state.arm}
  };
};

const fmt = x => x.toFixed(1);
const renderDims = (res, t) => {
  const d = res.dims;
  const rows = ['totalC', 'total', 'D', 'H', 'Dc', 'Di', 'side', 'sideC'];
  return '<table><thead><tr><th>' + t('d.mm') + '</th><th class="big">' + t('d.big') + '</th><th class="small">' + t('d.small') +
    '</th></tr></thead><tbody>' +
    rows.map(k => '<tr><td>' + t('d.' + k) + '</td><td>' + fmt(d.big[k]) + '</td><td>' + fmt(d.small[k]) + '</td></tr>').join('') +
    '</tbody></table>' +
    '<p class="note">' + t('d.note', {lambda: fmt(d.wavelength), lambdaC: fmt(d.wavelengthC), bend: fmt(d.bendCorr), opt: fmt(d.optDiam)}) + '</p>' +
    (d.big.Dc < 0.3 * d.big.D ? '<p class="note">' + t('d.warnBend') + '</p>' : '');
};

const build3d = (res, h) => {
  const {THREE, COLORS, tube, rod, sphere} = h;
  const group = new THREE.Group();
  const p = res.input, g = res.geometry;
  const rCable = p.conductor.od / 2;
  const arm = p.frame.arm / 2, mast = p.frame.mast / 2;
  const zTop = Math.max(...g.loops.map(l => l.zTop));
  const zBot = Math.min(...g.loops.map(l => l.zBottom));
  // PVC boom (antenna) + extension down to metal mast
  const pvcBottom = zBot - (p.env.mast?.pvc || 500);
  group.add(rod([0, 0, pvcBottom], [0, 0, zTop + 3 * arm], mast, COLORS.pvc, 0.55));
  const metal = p.env.mast?.metal || 1000;
  group.add(rod([0, 0, pvcBottom - metal], [0, 0, pvcBottom], 20, COLORS.metal));
  for (const l of g.loops) {
    group.add(tube(l.points, rCable, COLORS[l.name], false));
    // crossarms (PVC) at top and bottom, along loop plane
    const c = Math.cos(l.phi0), s = Math.sin(l.phi0);
    const r = res.dims[l.name].D / 2 + 2 * rCable;
    group.add(rod([-r * c, -r * s, l.zTop], [r * c, r * s, l.zTop], arm, COLORS.pvc, 0.55));
    const tw = l.phi0 + g.twist * 2 * Math.PI * p.turns;
    group.add(rod([-r * Math.cos(tw), -r * Math.sin(tw), l.zBottom], [r * Math.cos(tw), r * Math.sin(tw), l.zBottom], arm, COLORS.pvc, 0.55));
  }
  group.add(sphere([0, 0, zTop], rCable * 2.2, COLORS.feed));
  return {group, frame: {zTop, zBot, key: 'qfh/' + p.freq + '/' + p.turns + '/' + p.ratioDH}};
};

const designText = (i, t) => t('s.qfh.design', {freq: i.freq, cable: i.conductor.name, turns: i.turns, dh: i.ratioDH, r: i.bendRadius});

export default {
  type: 'qfh', legacy: true, defaultBand: '70cm', presets,
  nec: lib.qfhNec,
  calc: qfh.calc, init, fields, get, set, toInput, renderDims, build3d, designText,
  legendKey: 'v.qfh.legend', liveKey: 's.qfh.live',
  // NEC opts: legacy deck + full sphere for 3D pattern view
  necOpts: {sphere: {dTheta: 5, dPhi: 5}}
};
