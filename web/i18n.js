// EN / RU strings. t(key, vars) with {name} interpolation.

export const dict = {
  en: {
    title: 'Lindenblad and QFH antennas for HAM LEO satellites — AI6YP',
    h1: 'Lindenblad and QFH antennas for HAM LEO satellites',
    intro: 'Omni circularly polarized antennas for 2&nbsp;m and 70&nbsp;cm LEO satellites, RHCP, full-duplex V/u and U/v, &lt;&nbsp;50&nbsp;W. Parasitic Lindenblad (AA2TX style, default) with strong low-elevation gain, classic Lindenblad (folded dipoles + 300&nbsp;Ω twin-lead); QFH kept as legacy. Calculator, 3D model, live NEC2 simulation and 3D radiation pattern.',
    source: 'source',
    'theme.light': 'Day', 'theme.dark': 'Night', 'theme.auto': 'Auto',
    'h.params': 'Parameters', 'share.copy': 'Copy link', 'share.done': '✓ link with all parameters copied', 'share.reset': 'reset', 'h.status': 'Status', 'h.calc': 'Calculator', 'h.sim': 'NEC2 simulation', 'h.sats': 'Satellites',

    'a.lindenblad': 'Parasitic Lindenblad', 'a.qfh': 'QFH', 'a.legacy': 'legacy',
    'ph.lb.calc': 'Lindenblad calculator + geometry (AA2TX 70 cm reference)',
    'ph.lb.calc.n': 'top / sleeve / parasitic N, length, radius, tilt',
    'ph.lb.nec': 'Lindenblad NEC model: sleeve choke, stray C, mast / PVC, azimuth ripple',
    'ph.lb.nec.n': 'RHCP tilt sense verified, AR ≤ 1.4 dB at 0–30° (free space)',
    'ph.lb.web': 'Web page: antenna selector, sliders, 3D model + 3D radiation pattern',
    'ph.lb.web.n': 'this page',
    'ph.lb.tune': '2 m design retune (sweeps)',
    'ph.lb.cad': '3D printed parts (Replicad): hub, adjustable parasitic adapters, mast adapters',
    'ph.lb.opt': 'Optimizer (lengths, radius, tilt, N)',
    'ph.lb.var': 'EZ-Lindenblad variant (tube dipoles, 75 Ω coax lines)',
    'ph.qfh': 'QFH (legacy): calculator, NEC model, web',
    'ph.qfh.n': 'weak horizon gain → replaced by Lindenblad',

    // classic Lindenblad (folded dipoles + twin-lead)
    'a.lindenblad-classic': 'Classic Lindenblad',
    'f.element.n': 'dipoles N', 'f.element.length': 'folded dipole length, mm', 'f.element.od': 'fed conductor Ø, mm',
    'f.element.od2': 'other conductor Ø, mm', 'f.element.spacing': 'conductor spacing, mm', 'f.element.fold': 'fold plane',
    'f.element.radius': 'radius (axis → dipole), mm', 'f.element.tilt': 'tilt, °', 'f.element.lean': 'plane lean, ° (+ top out)',
    'f.line.z0': 'twin-lead Z0, Ω', 'f.line.vf': 'twin-lead VF', 'f.line.length': 'twin-lead length, mm',
    'f.match.type': 'hub match', 'f.match.z0': 'λ/4 match Z0, Ω',
    'f.auto.od2': '= fed Ø', 'f.auto.half': 'auto (λ/2)',
    'dc.len': 'folded dipoles', 'dc.od': 'conductor Ø fed / other', 'dc.stepUp': 'step-up ≈ {k}',
    'dc.spacing': 'conductor spacing (c-c)', 'dc.fold.plane': 'one above the other, in element plane', 'dc.fold.radial': 'inner / outer (radial)',
    'dc.cut': 'rod cut length (one piece)', 'dc.cutNote': 'bend R = spacing / 2, before feed gap cut', 'dc.cutNone': 'two conductor sizes: build from parts',
    'dc.opposite': 'opposite dipoles {v} λ (W6SHP 0.3)', 'dc.clear': 'clearance between neighbor dipoles',
    'dc.line': 'phasing lines', 'dc.auto': 'auto λ/2', 'dc.slack': 'line slack (route / coil)', 'dc.path': 'straight run feed → hub {p}',
    'dc.match': 'hub match', 'dc.qwt': 'λ/4 line {z0} Ω, VF {vf}', 'dc.none': 'none: hub Z to coax (box under antenna)',
    'dc.note': 'λ {lambda} mm · RHCP: looking toward the hub, right end of each dipole up · lines: equal length, all \'upper\' terminals tied together at the hub (in phase) · balun at hub assumed ideal',
    'v.lbc.legend': '■ aluminium folded dipoles <span style="color:#fab005">■ feed</span> ■ twin-lead ■ PVC / 3D print · drag to rotate',
    's.lbc.design': '{freq} MHz, N {n} folded dipoles {len} mm Ø{od}, spacing {sp} mm at r {r} mm, tilt {tilt}°, {line} Ω lines VF {vf}, match {match}',
    's.lbc.live': 'Live nec2++ (WebAssembly) for the current parameters: {design}. Z at the hub after the phasing lines (lossless) and match; lines and balun not in NEC.',
    'ph.lb.classic': 'Classic Lindenblad: 4 × λ/2 folded dipoles, λ/2 300 Ω twin-lead → hub → match',
    'ph.lb.classic.n': 'NEC matches W6SHP / WD4ECK MININEC tables (265 Ω per dipole, 66 Ω hub)',
    'f.auto': 'auto (λ/4)',
    'f.driven.top': 'top half, mm', 'f.driven.sleeve': 'sleeve (bottom half), mm', 'f.driven.od': 'driven tube Ø, mm',
    'f.parasitic.n': 'parasitic N', 'f.parasitic.length': 'parasitic length, mm', 'f.parasitic.od': 'parasitic Ø, mm',
    'f.parasitic.radius': 'radius (axis → element), mm', 'f.parasitic.tilt': 'tilt, °', 'f.parasitic.lean': 'plane lean, ° (+ top out)', 'f.parasitic.z': 'parasitic height, mm',
    'f.feed.choke': 'choke', 'f.feed.coax': 'coax', 'f.feed.strayC': 'feed stray C, pF', 'f.env.mast.pvc': 'PVC section, mm',

    'dl.top': 'driven top half', 'dl.sleeve': 'sleeve (bottom half, coax inside)', 'dl.auto': 'auto = λ/4 stub',
    'dl.gap': 'feed gap', 'dl.length': 'driven overall', 'dl.od': 'tube OD / ID',
    'dl.stub': 'sleeve stub resonance', 'dl.plen': 'parasitic elements', 'dl.pod': 'parasitic Ø',
    'dl.radius': 'radius axis → element center', 'dl.tilt': 'tilt in element plane', 'dl.span': 'vertical {dz} · horizontal {dh}',
    'dl.lean': 'element plane lean (from vertical)', 'dl.leanNote': 'element {elev}° to horizon · radial {dr}',
    'dl.clear': 'clearance element ↔ driven tube',
    'dl.note': 'λ {lambda} mm · RHCP: looking toward the hub, left end of each element up (inverse of a classic Lindenblad)',
    'v.lb.legend': '■ aluminium <span style="color:#e8590c">■ parasitic</span> ■ PVC / 3D print · drag to rotate',
    's.lb.design': '{freq} MHz, N {n}, top {top} mm, sleeve {sleeve}, parasitic {pl} mm at r {r} mm, tilt {tilt}°',
    's.lb.live': 'Live nec2++ (WebAssembly) for the current parameters: {design}. Z includes feed stray C.',
    'p.p3': '3D radiation pattern at f0 (radius and color = gain, dB scale)',
    'p3.rhcp': 'RHCP', 'p3.lhcp': 'LHCP', 'p3.total': 'total',
    'p3.legend': '{f} MHz · {kind} · max {max} dBic · scale {range} dB · rings: horizon, 30°, 60° · drag to rotate',
    'p3.none': 'no 3D pattern data',
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

    'v.qfh.legend': '<span style="color:#e8590c">■ big loop</span> <span style="color:#1c7ed6">■ small loop</span> ■ PVC · drag to rotate',

    'g.free': 'free space', 'g.poor': 'poor ground, 4 m roof + mast',
    'p.swr': 'SWR (50&nbsp;Ω, no match)', 'p.z': 'Feed impedance, Ω',
    'p.gain': 'Gain vs elevation, dBic (φ = 0°)', 'p.ar': 'Axial ratio vs elevation, dB',
    'ax.mhz': 'MHz', 'ax.ohm': 'Ω', 'ax.swr': 'SWR', 'ax.elev': 'elevation °', 'ax.dbic': 'dBic', 'ax.ar': 'AR dB',
    'p.gainKey': 'solid RHCP, dashed LHCP',
    'p.mhz': '{f} MHz',

    's.qfh.design': '{freq} MHz, {cable}, {turns} turn, D/H {dh}, bend R {r} mm',
    's.qfh.live': 'Live nec2++ (WebAssembly) for the current parameters: {design}. Unoptimized Coppens dimensions: resonance is ~2.5 % low.',
    's.pre': 'Precomputed with nec2++ for the reference design: {design} ({seg} segments).',
    's.running': '⏳ nec2++ (WASM) running, {seg} segments…',
    's.done': '✓ {seg} segments, {sec} s in your browser',
    's.error': '⚠ WASM simulation unavailable ({msg}); showing precomputed results.',

    'sat.sat': 'sat', 'sat.mode': 'mode', 'sat.up': 'uplink MHz', 'sat.down': 'downlink MHz', 'sat.heard': 'heard / 30 d',
    'sat.linear': 'linear', 'sat.fm': 'FM',
    'sat.src': 'Sources: amsat.org live FM / linear satellites, AMSAT status API.'
  },
  ru: {
    title: 'Антенны Линденблада и QFH для любительских низкоорбитальных спутников — AI6YP',
    h1: 'Антенны Линденблада и QFH для любительских низкоорбитальных спутников',
    intro: 'Всенаправленные антенны круговой поляризации для низкоорбитальных спутников 2&nbsp;м и 70&nbsp;см, RHCP, полный дуплекс V/u и U/v, &lt;&nbsp;50&nbsp;Вт. Пассивный Линденблад (по AA2TX, по умолчанию) с высоким усилением на малых углах места, классический Линденблад (петлевые диполи + линия 300&nbsp;Ом); QFH оставлена как устаревшая. Калькулятор, 3D-модель, NEC2 в браузере и объёмная диаграмма направленности.',
    source: 'исходники',
    'theme.light': 'День', 'theme.dark': 'Ночь', 'theme.auto': 'Авто',
    'h.params': 'Параметры', 'share.copy': 'Копировать ссылку', 'share.done': '✓ ссылка со всеми параметрами скопирована', 'share.reset': 'сбросить', 'h.status': 'Состояние', 'h.calc': 'Калькулятор', 'h.sim': 'Моделирование NEC2', 'h.sats': 'Спутники',

    'a.lindenblad': 'Пассивный Линденблад', 'a.qfh': 'QFH', 'a.legacy': 'устар.',
    'ph.lb.calc': 'Калькулятор Линденблада + геометрия (опорная 70 см AA2TX)',
    'ph.lb.calc.n': 'верх / рукав / N пассивных, длина, радиус, наклон',
    'ph.lb.nec': 'Модель NEC Линденблада: рукав-дроссель, паразитная ёмкость, мачта / ПВХ, неравномерность по азимуту',
    'ph.lb.nec.n': 'направление наклона для RHCP проверено, AR ≤ 1,4 дБ на 0–30° (свободное пространство)',
    'ph.lb.web': 'Веб-страница: выбор антенны, ползунки, 3D-модель + объёмная диаграмма',
    'ph.lb.web.n': 'эта страница',
    'ph.lb.tune': 'Перенастройка версии 2 м (развёртки параметров)',
    'ph.lb.cad': 'Печатные детали (Replicad): втулка, регулируемые держатели пассивных, переходники мачты',
    'ph.lb.opt': 'Оптимизатор (длины, радиус, наклон, N)',
    'ph.lb.var': 'EZ-Линденблад (трубчатые диполи, линии из кабеля 75 Ом)',
    'ph.qfh': 'QFH (устаревшая): калькулятор, модель NEC, страница',
    'ph.qfh.n': 'слабое усиление у горизонта → заменена Линденбладом',

    'a.lindenblad-classic': 'Классический Линденблад',
    'f.element.n': 'N диполей', 'f.element.length': 'длина петлевого диполя, мм', 'f.element.od': 'Ø питаемого проводника, мм',
    'f.element.od2': 'Ø второго проводника, мм', 'f.element.spacing': 'расстояние между проводниками, мм', 'f.element.fold': 'плоскость петли',
    'f.element.radius': 'радиус (ось → диполь), мм', 'f.element.tilt': 'наклон, °', 'f.element.lean': 'завал плоскости, ° (+ верх наружу)',
    'f.line.z0': 'Z0 ленточной линии, Ом', 'f.line.vf': 'КУ ленточной линии', 'f.line.length': 'длина линии, мм',
    'f.match.type': 'согласование в центре', 'f.match.z0': 'Z0 трансформатора λ/4, Ом',
    'f.auto.od2': '= Ø питаемого', 'f.auto.half': 'авто (λ/2)',
    'dc.len': 'петлевые диполи', 'dc.od': 'Ø проводников: питаемый / второй', 'dc.stepUp': 'трансформация ≈ {k}',
    'dc.spacing': 'расстояние между проводниками (по осям)', 'dc.fold.plane': 'один над другим, в плоскости элемента', 'dc.fold.radial': 'внутренний / внешний (по радиусу)',
    'dc.cut': 'длина заготовки (из одного прутка)', 'dc.cutNote': 'радиус изгиба = расстояние / 2, до разреза питания', 'dc.cutNone': 'разные Ø: собирать из частей',
    'dc.opposite': 'между противоположными {v} λ (W6SHP 0,3)', 'dc.clear': 'зазор между соседними диполями',
    'dc.line': 'фазирующие линии', 'dc.auto': 'авто λ/2', 'dc.slack': 'запас линии (укладка / бухта)', 'dc.path': 'по прямой питание → центр {p}',
    'dc.match': 'согласование в центре', 'dc.qwt': 'линия λ/4 {z0} Ом, КУ {vf}', 'dc.none': 'нет: Z центра на кабель (коробка под антенной)',
    'dc.note': 'λ {lambda} мм · RHCP: если смотреть на центр, правый конец каждого диполя поднят · линии равной длины, все «верхние» выводы соединены в центре (синфазно) · симметрирование в центре считается идеальным',
    'v.lbc.legend': '■ алюминиевые петлевые диполи <span style="color:#fab005">■ питание</span> ■ ленточная линия ■ ПВХ / печать · вращайте мышью',
    's.lbc.design': '{freq} МГц, N {n} петлевых диполей {len} мм Ø{od}, расстояние {sp} мм на r {r} мм, наклон {tilt}°, линии {line} Ом КУ {vf}, согласование {match}',
    's.lbc.live': 'nec2++ (WebAssembly) в реальном времени для текущих параметров: {design}. Z в центре после фазирующих линий (без потерь) и согласования; линии и симметрирование в NEC не моделируются.',
    'ph.lb.classic': 'Классический Линденблад: 4 × петлевых диполя λ/2, линии 300 Ом λ/2 → центр → согласование',
    'ph.lb.classic.n': 'NEC совпадает с таблицами MININEC W6SHP / WD4ECK (265 Ом на диполь, 66 Ом в центре)',
    'f.auto': 'авто (λ/4)',
    'f.driven.top': 'верхняя половина, мм', 'f.driven.sleeve': 'рукав (нижняя половина), мм', 'f.driven.od': 'Ø трубки активного, мм',
    'f.parasitic.n': 'N пассивных', 'f.parasitic.length': 'длина пассивного, мм', 'f.parasitic.od': 'Ø пассивного, мм',
    'f.parasitic.radius': 'радиус (ось → элемент), мм', 'f.parasitic.tilt': 'наклон, °', 'f.parasitic.lean': 'завал плоскости, ° (+ верх наружу)', 'f.parasitic.z': 'высота пассивных, мм',
    'f.feed.choke': 'дроссель', 'f.feed.coax': 'кабель', 'f.feed.strayC': 'паразитная C питания, пФ', 'f.env.mast.pvc': 'вставка ПВХ, мм',

    'dl.top': 'верхняя половина активного', 'dl.sleeve': 'рукав (нижняя половина, кабель внутри)', 'dl.auto': 'авто = шлейф λ/4',
    'dl.gap': 'зазор питания', 'dl.length': 'активный целиком', 'dl.od': 'трубка Ø нар. / внутр.',
    'dl.stub': 'резонанс шлейфа рукава', 'dl.plen': 'пассивные элементы', 'dl.pod': 'Ø пассивных',
    'dl.radius': 'радиус ось → центр элемента', 'dl.tilt': 'наклон в плоскости элемента', 'dl.span': 'по вертикали {dz} · по горизонтали {dh}',
    'dl.lean': 'завал плоскости элемента (от вертикали)', 'dl.leanNote': 'элемент {elev}° к горизонту · по радиусу {dr}',
    'dl.clear': 'зазор элемент ↔ трубка активного',
    'dl.note': 'λ {lambda} мм · RHCP: если смотреть на втулку, левый конец каждого элемента поднят (обратно классическому Линденбладу)',
    'v.lb.legend': '■ алюминий <span style="color:#e8590c">■ пассивные</span> ■ ПВХ / печать · вращайте мышью',
    's.lb.design': '{freq} МГц, N {n}, верх {top} мм, рукав {sleeve}, пассивные {pl} мм на r {r} мм, наклон {tilt}°',
    's.lb.live': 'nec2++ (WebAssembly) в реальном времени для текущих параметров: {design}. Z с учётом паразитной ёмкости питания.',
    'p.p3': 'Объёмная диаграмма направленности на f0 (радиус и цвет = усиление, шкала дБ)',
    'p3.rhcp': 'RHCP', 'p3.lhcp': 'LHCP', 'p3.total': 'сумма',
    'p3.legend': '{f} МГц · {kind} · макс. {max} дБic · шкала {range} дБ · кольца: горизонт, 30°, 60° · вращайте мышью',
    'p3.none': 'нет данных объёмной диаграммы',
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

    'v.qfh.legend': '<span style="color:#e8590c">■ большая петля</span> <span style="color:#1c7ed6">■ малая петля</span> ■ ПВХ · вращайте мышью',

    'g.free': 'свободное пространство', 'g.poor': 'плохая почва, крыша 4 м + мачта',
    'p.swr': 'КСВ (50&nbsp;Ом, без согласования)', 'p.z': 'Входное сопротивление, Ом',
    'p.gain': 'Усиление от угла места, дБic (φ = 0°)', 'p.ar': 'Коэффициент эллиптичности (AR) от угла места, дБ',
    'ax.mhz': 'МГц', 'ax.ohm': 'Ом', 'ax.swr': 'КСВ', 'ax.elev': 'угол места °', 'ax.dbic': 'дБic', 'ax.ar': 'AR дБ',
    'p.gainKey': 'сплошная — RHCP, пунктир — LHCP',
    'p.mhz': '{f} МГц',

    's.qfh.design': '{freq} МГц, {cable}, {turns} витка, D/H {dh}, радиус изгиба {r} мм',
    's.qfh.live': 'nec2++ (WebAssembly) в реальном времени для текущих параметров: {design}. Размеры по Коппенсу без оптимизации: резонанс занижен на ~2,5 %.',
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
