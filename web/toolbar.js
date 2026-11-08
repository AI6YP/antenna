// top-right toolbar: [Day | Night | Auto]  [EN | RU]
import {t, getLang, setLang, langs, onLang} from './i18n.js';
import {themes, getTheme, setTheme} from './theme.js';

export const render = el => {
  const draw = () => {
    const th = getTheme(), l = getLang();
    el.innerHTML =
      '<div class="seg" role="group" aria-label="theme">' + themes.map(x =>
        '<button data-theme-btn="' + x + '" aria-pressed="' + (x === th) + '">' + t('theme.' + x) + '</button>').join('') + '</div>' +
      '<div class="seg" role="group" aria-label="language">' + langs.map(x =>
        '<button data-lang-btn="' + x + '" aria-pressed="' + (x === l) + '">' + x.toUpperCase() + '</button>').join('') + '</div>';
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) { return; }
    if (b.dataset.themeBtn) { setTheme(b.dataset.themeBtn); draw(); }
    if (b.dataset.langBtn) { setLang(b.dataset.langBtn); }
  });
  onLang(draw);
  draw();
};
