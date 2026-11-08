import * as Plot from '@observablehq/plot';

const W = 540, H = 300;

const band = (input, y1, y2) => Plot.rectY([input.band], {x1: d => d[0], x2: d => d[1], y1, y2, fill: 'currentColor', fillOpacity: 0.08});

export const swr = (data) => Plot.plot({
  width: W, height: H, grid: true,
  x: {label: 'MHz'}, y: {label: 'SWR', domain: [1, 3]},
  marks: [
    band(data.input, 1, 3),
    Plot.ruleY([1.35], {stroke: 'green', strokeDasharray: '4 3'}),
    Plot.lineY(data.sweep, {x: 'freq', y: d => Math.min(d.swr, 3), stroke: 'currentColor', strokeWidth: 2}),
    Plot.tip(data.sweep, Plot.pointerX({x: 'freq', y: d => Math.min(d.swr, 3), title: d => d.freq.toFixed(2) + ' MHz  SWR ' + d.swr.toFixed(2)}))
  ]
});

export const z = (data) => {
  const rows = data.sweep.flatMap(d => [{freq: d.freq, v: d.r, k: 'R'}, {freq: d.freq, v: d.x, k: 'X'}]);
  const ext = Math.max(...rows.map(r => Math.abs(r.v)));
  return Plot.plot({
    width: W, height: H, grid: true,
    x: {label: 'MHz'}, y: {label: 'Ω'},
    color: {legend: true, domain: ['R', 'X'], range: ['#e8590c', '#1c7ed6']},
    marks: [
      band(data.input, -ext, ext),
      Plot.ruleY([0]),
      Plot.lineY(rows, {x: 'freq', y: 'v', stroke: 'k', strokeWidth: 2}),
      Plot.tip(rows, Plot.pointerX({x: 'freq', y: 'v', stroke: 'k', title: d => d.k + ' ' + d.v.toFixed(1) + ' Ω @ ' + d.freq.toFixed(2)}))
    ]
  });
};

// elevation = 90 - theta (phi = 0); theta > 90 -> below horizon
const elevRows = (data, keys, phi = 0) => data.patterns.flatMap(p => p.points
  .filter(q => q.phi === phi)
  .flatMap(q => keys.map(k => ({elev: 90 - q.theta, v: Math.max(q[k], -40), k, f: p.freq.toFixed(1) + ' MHz'}))));

export const gain = (data) => Plot.plot({
  width: W, height: H, grid: true,
  x: {label: 'elevation °', domain: [-90, 90]}, y: {label: 'dBic', domain: [-40, 8]},
  color: {legend: true},
  marks: [
    Plot.ruleX([0]),
    Plot.lineY(elevRows(data, ['rhcp']), {x: 'elev', y: 'v', stroke: 'f', strokeWidth: 2}),
    Plot.lineY(elevRows(data, ['lhcp']), {x: 'elev', y: 'v', stroke: 'f', strokeDasharray: '3 3'}),
    Plot.text(['solid RHCP, dashed LHCP'], {frameAnchor: 'top-left', dx: 4, dy: 4})
  ]
});

export const ar = (data) => Plot.plot({
  width: W, height: H, grid: true,
  x: {label: 'elevation °', domain: [0, 90]}, y: {label: 'AR dB', domain: [0, 12]},
  color: {legend: true},
  marks: [
    Plot.ruleY([3], {stroke: 'green', strokeDasharray: '4 3'}),
    Plot.lineY(elevRows(data, ['arDb']).filter(r => r.elev >= 0).map(r => ({...r, v: Math.min(r.v, 12)})), {x: 'elev', y: 'v', stroke: 'f', strokeWidth: 2})
  ]
});
