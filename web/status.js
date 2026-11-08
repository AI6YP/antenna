// project status (mirror of plans/lindenblad.md phases)
import {t} from './i18n.js';

export const phases = [
  {state: 'done', key: 'ph.lb.calc', note: true},
  {state: 'done', key: 'ph.lb.nec', note: true},
  {state: 'wip', key: 'ph.lb.web', note: true},
  {state: 'done', key: 'ph.lb.classic', note: true},
  {state: 'done', key: 'ph.wasm', note: true},
  {state: 'todo', key: 'ph.lb.tune'},
  {state: 'todo', key: 'ph.lb.cad'},
  {state: 'todo', key: 'ph.box'},
  {state: 'todo', key: 'ph.lb.opt'},
  {state: 'todo', key: 'ph.lb.var'},
  {state: 'todo', key: 'ph.build'},
  {state: 'todo', key: 'ph.meas'},
  {state: 'done', key: 'ph.qfh', note: true}
];

export const render = el => {
  el.innerHTML = '<ol>' + phases.map(p =>
    '<li class="' + p.state + '">' + t(p.key) +
    '<span class="tag ' + p.state + '">' + t('state.' + p.state) + '</span>' +
    (p.note ? ' <span class="note">— ' + t(p.key + '.n') + '</span>' : '') + '</li>'
  ).join('') + '</ol>';
};
