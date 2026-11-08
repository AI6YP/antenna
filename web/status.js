// project status (mirror of plans/qfh.md phases)
import {t} from './i18n.js';

export const phases = [
  {state: 'done', key: 'ph.calc', note: true},
  {state: 'done', key: 'ph.nec', note: true},
  {state: 'wip', key: 'ph.web', note: true},
  {state: 'done', key: 'ph.wasm', note: true},
  {state: 'todo', key: 'ph.opt', note: true},
  {state: 'todo', key: 'ph.feed'},
  {state: 'todo', key: 'ph.frame'},
  {state: 'todo', key: 'ph.box'},
  {state: 'todo', key: 'ph.build'},
  {state: 'todo', key: 'ph.meas'}
];

export const render = el => {
  el.innerHTML = '<ol>' + phases.map(p =>
    '<li class="' + p.state + '">' + t(p.key) +
    '<span class="tag ' + p.state + '">' + t('state.' + p.state) + '</span>' +
    (p.note ? ' <span class="note">— ' + t(p.key + '.n') + '</span>' : '') + '</li>'
  ).join('') + '</ol>';
};
