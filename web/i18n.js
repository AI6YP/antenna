// EN / RU strings. t(key, vars) with {name} interpolation.

export const dict = {
  en: {
    title: 'QFH antennas for HAM LEO satellites — AI6YP',
    h1: 'QFH antennas for HAM LEO satellites',
    intro: 'Two quadrifilar helix antennas (2&nbsp;m and 70&nbsp;cm), RHCP, full-duplex V/u and U/v, &lt;&nbsp;50&nbsp;W. Calculator, 3D model and NEC2 simulation.',
    source: 'source',
    'theme.light': 'Day', 'theme.dark': 'Night', 'theme.auto': 'Auto',
    'h.status': 'Status', 'h.calc': 'Calculator', 'h.sim': 'NEC2 simulation', 'h.sats': 'Satellites',

    'state.done': 'done', 'state.wip': 'in progress', 'state.todo': 'todo',
    'ph.calc': 'Calculator (Coppens method)',
    'ph.calc.n': 'matches jcoppens, shackwiki, rfwireless, kaklik references',
    'ph.nec': 'NEC2 model + nec2++ runner + parser',
    'ph.nec.n': 'RHCP twist / feed polarity verified',
    'ph.web': 'Web page: calculator + three.js + Observable Plot',
    'ph.web.n': 'this page',
    'ph.opt': 'Antenna optimizer (scale, loop factors, turns, D/H)',
    'ph.opt.n': 'resonance ~2.5 % low today',
    'ph.wasm': 'nec2++ → WASM (clang / wasi-sdk), live simulation in browser',
    'ph.wasm.n': 'bit-identical to native',
    'ph.feed': 'Feed / balun variants (infinite balun)',
    'ph.frame': 'Frame + drilling template, USA / BY size sets',
    'ph.box': 'Match box: match + LPF (2 m) / HPF (70 cm), ngspice check',
    'ph.build': 'Build instructions EN + RU',
    'ph.meas': 'Build, VNA measurement, model feedback',

    'f.band': 'band', 'f.freq': 'f0, MHz', 'f.turns': 'turns', 'f.ratioDH': 'D / H', 'f.cable': 'cable',
    'f.bendRadius': 'bend R, mm', 'f.arm': 'crossarm OD, mm', 'f.polarization': 'polarization',

    'd.mm': 'mm', 'd.big': 'big loop', 'd.small': 'small loop',
    'd.totalC': 'conductor length to cut', 'd.total': 'electrical length',
    'd.D': 'diameter D (center to center)', 'd.H': 'height H',
    'd.Dc': 'crossarm straight part Dc', 'd.Di': 'internal diameter Di',
    'd.side': 'helical side (with bends)', 'd.sideC': 'helical side straight part',
    'd.note': 'λ {lambda} mm · compensated λ {lambdaC} mm · bend correction {bend} mm/corner · Coppens optimum conductor Ø {opt} mm',
    'd.warnBend': '⚠ bends take most of the crossarm span — reduce bend R or use thinner cable.',

    'v.legend': '<span style="color:#e8590c">■ big loop</span> <span style="color:#1c7ed6">■ small loop</span> ■ PVC · drag to rotate',

    'g.free': 'free space', 'g.poor': 'poor ground, 4 m roof + 1.5 m mast',
    'p.swr': 'SWR (50&nbsp;Ω, no match)', 'p.z': 'Feed impedance, Ω',
    'p.gain': 'Gain vs elevation, dBic (φ = 0°)', 'p.ar': 'Axial ratio vs elevation, dB',
    'ax.mhz': 'MHz', 'ax.ohm': 'Ω', 'ax.swr': 'SWR', 'ax.elev': 'elevation °', 'ax.dbic': 'dBic', 'ax.ar': 'AR dB',
    'p.gainKey': 'solid RHCP, dashed LHCP',
    'p.mhz': '{f} MHz',

    's.design': '{freq} MHz, {cable}, {turns} turn, D/H {dh}, bend R {r} mm',
    's.live': 'Live nec2++ (WebAssembly) for the inputs above: {design}. Unoptimized Coppens dimensions: resonance is ~2.5 % low.',
    's.pre': 'Precomputed with nec2++ for the reference design: {design} ({seg} segments).',
    's.running': '⏳ nec2++ (WASM) running, {seg} segments…',
    's.done': '✓ {seg} segments, {sec} s in your browser',
    's.error': '⚠ WASM simulation unavailable ({msg}); showing precomputed results.',

    'sat.sat': 'sat', 'sat.mode': 'mode', 'sat.up': 'uplink MHz', 'sat.down': 'downlink MHz', 'sat.heard': 'heard / 30 d',
    'sat.linear': 'linear', 'sat.fm': 'FM',
    'sat.src': 'Sources: amsat.org live FM / linear satellites, AMSAT status API.'
  },
  ru: {
    title: 'QFH-антенны для любительских низкоорбитальных спутников — AI6YP',
    h1: 'QFH-антенны для любительских низкоорбитальных спутников',
    intro: 'Две квадрифилярные спиральные антенны (2&nbsp;м и 70&nbsp;см), правая круговая поляризация (RHCP), полный дуплекс V/u и U/v, &lt;&nbsp;50&nbsp;Вт. Калькулятор, 3D-модель и моделирование NEC2.',
    source: 'исходники',
    'theme.light': 'День', 'theme.dark': 'Ночь', 'theme.auto': 'Авто',
    'h.status': 'Состояние', 'h.calc': 'Калькулятор', 'h.sim': 'Моделирование NEC2', 'h.sats': 'Спутники',

    'state.done': 'готово', 'state.wip': 'в работе', 'state.todo': 'в планах',
    'ph.calc': 'Калькулятор (метод Коппенса)',
    'ph.calc.n': 'совпадает с jcoppens, shackwiki, rfwireless, kaklik',
    'ph.nec': 'Модель NEC2 + запуск nec2++ + разбор результатов',
    'ph.nec.n': 'направление намотки и полярность питания для RHCP проверены',
    'ph.web': 'Веб-страница: калькулятор + three.js + Observable Plot',
    'ph.web.n': 'эта страница',
    'ph.opt': 'Оптимизатор антенны (масштаб, коэффициенты петель, витки, D/H)',
    'ph.opt.n': 'сейчас резонанс занижен на ~2,5 %',
    'ph.wasm': 'nec2++ → WASM (clang / wasi-sdk), моделирование прямо в браузере',
    'ph.wasm.n': 'результаты идентичны нативной версии',
    'ph.feed': 'Варианты питания / симметрирования (infinite balun)',
    'ph.frame': 'Каркас и шаблон сверловки, размеры США / РБ',
    'ph.box': 'Коробка согласования: согласование + ФНЧ (2 м) / ФВЧ (70 см), проверка в ngspice',
    'ph.build': 'Инструкции по сборке EN + RU',
    'ph.meas': 'Сборка, измерения VNA, уточнение модели',

    'f.band': 'диапазон', 'f.freq': 'f0, МГц', 'f.turns': 'витки', 'f.ratioDH': 'D / H', 'f.cable': 'кабель',
    'f.bendRadius': 'радиус изгиба, мм', 'f.arm': 'Ø траверсы, мм', 'f.polarization': 'поляризация',

    'd.mm': 'мм', 'd.big': 'большая петля', 'd.small': 'малая петля',
    'd.totalC': 'длина проводника (отрезать)', 'd.total': 'электрическая длина',
    'd.D': 'диаметр D (по осям)', 'd.H': 'высота H',
    'd.Dc': 'прямой участок траверсы Dc', 'd.Di': 'внутренний диаметр Di',
    'd.side': 'спиральная сторона (с изгибами)', 'd.sideC': 'прямой участок спиральной стороны',
    'd.note': 'λ {lambda} мм · скорректированная λ {lambdaC} мм · поправка на изгиб {bend} мм/угол · оптимальный Ø проводника по Коппенсу {opt} мм',
    'd.warnBend': '⚠ изгибы занимают бо́льшую часть траверсы — уменьшите радиус изгиба или возьмите кабель тоньше.',

    'v.legend': '<span style="color:#e8590c">■ большая петля</span> <span style="color:#1c7ed6">■ малая петля</span> ■ ПВХ · вращайте мышью',

    'g.free': 'свободное пространство', 'g.poor': 'плохая почва, крыша 4 м + мачта 1,5 м',
    'p.swr': 'КСВ (50&nbsp;Ом, без согласования)', 'p.z': 'Входное сопротивление, Ом',
    'p.gain': 'Усиление от угла места, дБic (φ = 0°)', 'p.ar': 'Коэффициент эллиптичности (AR) от угла места, дБ',
    'ax.mhz': 'МГц', 'ax.ohm': 'Ом', 'ax.swr': 'КСВ', 'ax.elev': 'угол места °', 'ax.dbic': 'дБic', 'ax.ar': 'AR дБ',
    'p.gainKey': 'сплошная — RHCP, пунктир — LHCP',
    'p.mhz': '{f} МГц',

    's.design': '{freq} МГц, {cable}, {turns} витка, D/H {dh}, радиус изгиба {r} мм',
    's.live': 'nec2++ (WebAssembly) в реальном времени для параметров выше: {design}. Размеры по Коппенсу без оптимизации: резонанс занижен на ~2,5 %.',
    's.pre': 'Заранее рассчитано в nec2++ для опорной конструкции: {design} ({seg} сегментов).',
    's.running': '⏳ nec2++ (WASM) считает, {seg} сегментов…',
    's.done': '✓ {seg} сегментов, {sec} с в вашем браузере',
    's.error': '⚠ моделирование WASM недоступно ({msg}); показаны заранее рассчитанные результаты.',

    'sat.sat': 'спутник', 'sat.mode': 'режим', 'sat.up': 'вверх (uplink), МГц', 'sat.down': 'вниз (downlink), МГц', 'sat.heard': 'отчётов / 30 дн',
    'sat.linear': 'линейный', 'sat.fm': 'ЧМ',
    'sat.src': 'Источники: amsat.org (FM и линейные спутники), AMSAT status API.'
  }
};

export const langs = ['en', 'ru'];

const pick = () => {
  const q = new URLSearchParams(location.search).get('lang');
  if (langs.includes(q)) { return q; }
  const s = localStorage.getItem('lang');
  if (langs.includes(s)) { return s; }
  return (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
};

let lang = pick();
const listeners = [];

export const getLang = () => lang;

export const t = (key, vars) => {
  let s = dict[lang][key];
  if (s === undefined) { s = dict.en[key]; }
  if (s === undefined) { return key; }
  if (vars) { s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)); }
  return s;
};

export const setLang = l => {
  if (!langs.includes(l)) { return; }
  lang = l;
  localStorage.setItem('lang', l);
  const url = new URL(location.href);
  url.searchParams.set('lang', l);
  history.replaceState(null, '', url);
  apply();
  listeners.forEach(fn => fn(l));
};

export const onLang = fn => listeners.push(fn);

// static elements: data-i18n="key" (innerHTML)
export const apply = () => {
  document.documentElement.lang = lang;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
};
