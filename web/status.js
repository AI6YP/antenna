// project status (mirror of plans/qfh.md phases)
export const phases = [
  {state: 'done', title: 'Calculator (Coppens method)', note: 'matches jcoppens, shackwiki, rfwireless, kaklik references'},
  {state: 'done', title: 'NEC2 model + nec2++ runner + parser', note: 'RHCP twist / feed polarity verified'},
  {state: 'wip', title: 'Web page: calculator + three.js + Observable Plot', note: 'this page'},
  {state: 'todo', title: 'Antenna optimizer (scale, loop factors, turns, D/H)', note: 'resonance ~2.5 % low today'},
  {state: 'todo', title: 'nec2++ → WASM (clang / wasi-sdk), live simulation in browser'},
  {state: 'todo', title: 'Feed / balun variants (infinite balun)'},
  {state: 'todo', title: 'Frame + drilling template, USA / BY size sets'},
  {state: 'todo', title: 'Match box: match + LPF (2 m) / HPF (70 cm), ngspice check'},
  {state: 'todo', title: 'Build instructions EN + RU'},
  {state: 'todo', title: 'Build, VNA measurement, model feedback'}
];

export const render = el => {
  el.innerHTML = '<ol>' + phases.map(p =>
    '<li class="' + p.state + '">' + p.title +
    '<span class="tag ' + p.state + '">' + p.state + '</span>' +
    (p.note ? ' <span class="note">— ' + p.note + '</span>' : '') + '</li>'
  ).join('') + '</ol>';
};
