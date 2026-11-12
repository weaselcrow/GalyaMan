// ---------- СЮЖЕТНЫЙ РЕЖИМ ----------
// Три этапа (Деревня → Заноза → NASRAL 2026), у каждого свой босс. Кролики здесь дают сдачи.
let story = null, sb = null, shots = [], warns = [], tik = null, sbgs = [], sChunks = [], menuI = 0, snow = [];
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const STAGES = [
  { name: 'ДЕРЕВНЯ МАЛЫЕ УШИ', sub: 'здесь Галя родилась и выросла', song: 'village', boss: 'ДЕД УШАН', bsub: 'председатель кроличьего колхоза', facts: ['ВИЛЫ: ЕСТЬ', 'ТЕРПЕНИЕ: КОНЧИЛОСЬ', 'ПОМНИТ ГАЛЮ МАЛЕНЬКОЙ'], hp: 16, h: 130, hw: 46 },
  { name: 'ЗАНОЗА', sub: 'бар, танцы, фейс-контроль', song: 'zanoza', boss: 'АПЕЛЬСИН', bsub: 'цитрусовый король танцпола', facts: ['ВИТАМИН C: 100%', 'КАТАЕТСЯ: БОЛЬНО', 'В СПИСКАХ ГАЛИ НЕТ'], hp: 20, h: 110, hw: 44 },
  { name: 'NASRAL 2026', sub: 'новогодняя ярмарка ведьмаков', song: 'nasral', boss: 'КОРОЛЬ НАСРАЛ I', bsub: 'толстый. карлик. в короне', facts: ['РОСТ: НЕТ', 'КОРОНА: ДА', 'БЕЗ КОРОНЫ — НИКТО'], hp: 26, h: 86, hw: 38 }
];
const TH = [
  { body: '#6b4a2e', d1: '#5a3c24', d2: '#7d5a38', top: '#5fae3c', hi: '#a6e06a', dark: '#2a1c12', box: '#a8763f', boxHi: '#d9a561', boxLo: '#7d5229' },
  { body: '#2a1846', d1: '#35205a', d2: '#1e1036', top: '#ff4fd8', hi: '#ffb0f0', dark: '#12081f', box: '#4a2d7a', boxHi: '#55e6ff', boxLo: '#2f1c52' },
  { body: '#3a4a66', d1: '#46587a', d2: '#2c3950', top: '#dfeeff', hi: '#ffffff', dark: '#141a2c', box: '#7a4a32', boxHi: '#eef6ff', boxLo: '#5a3422' }
];
const curSong = () => L.song || (L.boss ? 'boss' : 'level');

SONGS.village = { bpm: 138, loop: true, tr: [
  { w: 'square', v: .07, s: seq('E5:2 G5:2 A5:4 G5:2 E5:2 D5:4 E5:2 G5:2 A5:2 B5:2 A5:4 G5:4 C5:2 E5:2 G5:4 E5:2 C5:2 D5:4 B4:2 D5:2 G5:2 F#5:2 E5:8') },
  { w: 'triangle', v: .2, s: bassLine(['E2', 'C2', 'G2', 'D2', 'A2', 'C2', 'G2', 'B1']) }], dr: 'k.h.s.h.k.h.s.hh' };
SONGS.zanoza = { bpm: 126, loop: true, tr: [
  { w: 'sawtooth', v: .05, s: seq('B4:2 -:2 E5:2 -:2 G5:2 B5:2 -:2 A5:2 G5:2 E5:2 -:2 C5:2 E5:2 -:2 G5:4 F#5:2 -:2 A5:2 -:2 D6:2 A5:2 -:2 F#5:2 B5:2 A5:2 G5:2 F#5:2 E5:4 -:4') },
  { w: 'triangle', v: .22, s: seq(['E2', 'C2', 'D2', 'B1'].map(r => (r + ':2 -:2 ').repeat(8)).join(' ')) }], dr: 'k.hhs.h.k.hhs.hh' };
SONGS.nasral = { bpm: 144, loop: true, tr: [
  { w: 'square', v: .065, s: seq('E5:2 E5:2 E5:4 E5:2 E5:2 E5:4 E5:2 G5:2 C5:3 D5:1 E5:8 A4:2 C5:2 E5:4 D5:2 B4:2 G4:4 A4:2 B4:2 C5:2 D5:2 E5:2 D5:2 C5:2 B4:2 A4:8') },
  { w: 'sine', v: .12, dec: 1, s: seq('C6:4 G5:4 C6:4 G5:4 A5:4 E5:4 A5:4 E5:4 F5:4 C6:4 F5:4 C6:4 G5:4 D6:4 G5:4 B5:4') },
  { w: 'triangle', v: .2, s: bassLine(['C2', 'C2', 'A1', 'A1', 'F2', 'F2', 'G2', 'G2']) }], dr: 'k.h.s.h.' };
SONGS.sboss = { bpm: 180, loop: true, tr: [
  { w: 'square', v: .075, s: seq('A4:1 A4:1 C5:2 A4:1 A4:1 E5:2 D5:2 C5:2 B4:4 G4:1 G4:1 B4:2 G4:1 G4:1 D5:2 C5:2 B4:2 A4:4 F4:1 F4:1 A4:2 F4:1 F4:1 C5:2 B4:2 A4:2 G#4:4 E5:2 D5:2 C5:2 B4:2 A4:2 G#4:2 E4:4') },
  { w: 'sawtooth', v: .07, s: seq(['A2', 'G2', 'F2', 'E2'].map(r => (r + ':1 -:1 ' + r + ':1 ' + r + ':1 ').repeat(8)).join(' ')) }], dr: 'k.hhs.hhk.k.s.hh' };
sfx.dash = () => { nz(0, .16, .22, 'highpass', 1400, 4200); tn('sawtooth', 220, 520, .12, .07); };
sfx.ding = () => { tn('square', 1900, 1500, .05, .1); tn('square', 2500, 2500, .04, .07, .03); };
sfx.coins = () => { for (let i = 0; i < 10; i++) { tn('square', 988, 988, .05, .08, i * .07); tn('square', 1319, 1319, .08, .08, i * .07 + .035); } };

// ---------- загрузка: фоны, узоры, куски боссов ----------
function mkPat(th) {
  const [c, x] = mkCanvas(32, 32); x.fillStyle = th.body; x.fillRect(0, 0, 32, 32);
  let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? th.d1 : th.d2; x.fillRect((r() * 30) | 0, (r() * 30) | 0, 2 + ((r() * 3) | 0), 2); }
  return g.createPattern(c, 'repeat');
}
function storyInit() {
  TH.forEach(t => { t.pat = mkPat(t); });
  (A.sbg || []).forEach((pair, i) => {
    sbgs[i] = {};
    loadImg(pair[0]).then(im => { let c, x;[c, x] = mkCanvas(W, H); x.drawImage(im, 0, 0); x.fillStyle = 'rgba(8,8,24,.34)'; x.fillRect(0, 0, W, H); sbgs[i].a = c; let c2;[c2, x] = mkCanvas(W, H); x.translate(W, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); sbgs[i].b = c2; });
    loadImg(pair[1]).then(im => { const [c, x] = mkCanvas(W, H); x.drawImage(im, 0, 0); x.fillStyle = 'rgba(8,8,24,.3)'; x.fillRect(0, 0, W, H); sbgs[i].boss = c; });
  });
  for (let i = 0; i < 3; i++) sChunks[i] = F['sb' + i + '_1'] ? makeChunks('sb' + i + '_1', 3, 3) : bossChunks;
  for (let i = 0; i < 70; i++) snow.push({ x: rnd(W), y: rnd(H), v: rnd(20, 70), s: rint(1, 2), p: rnd(6) });
}
const has = n => !!F[n];
function sspr(name, x, y, flip, o, fb) { if (has(name)) spr(name, x, y, flip, o); else if (fb) spr(fb, x, y, flip, o); }

// ---------- тема уровня ----------
function drawSolidTh(s) {
  const t = L.th, x = Math.round(s.x), y = Math.round(s.y), w = Math.round(s.w);
  if (s.k === 'f') {
    g.fillStyle = t.pat; g.fillRect(x, y + 8, w, H - y);
    R(x, y, w, 3, t.hi); R(x, y + 3, w, 5, t.top); R(x, y + 8, w, 2, t.dark);
    for (let i = 4; i < w - 4; i += 14) { R(x + i, y - 2, 2, 2, t.hi); R(x + i + 6, y + 8, 3, 2 + (i % 3), t.top); }
    R(x, y, 3, H - y, t.dark); R(x + w - 3, y, 3, H - y, t.dark);
  } else if (s.k === 'b') {
    R(x, y, w, s.h, t.dark); R(x + 2, y + 2, w - 4, s.h - 2, t.box); R(x + 2, y + 2, w - 4, 3, t.boxHi);
    for (let i = 12; i < s.h - 2; i += 10) R(x + 2, y + i, w - 4, 1, t.boxLo);
    for (let i = 16; i < w - 6; i += 22) R(x + i, y + 5, 1, s.h - 5, t.boxLo);
  } else {
    R(x, y, w, 12, t.dark); R(x + 1, y, w - 2, 3, t.hi); R(x + 1, y + 3, w - 2, 4, t.top); R(x + 1, y + 7, w - 2, 4, t.box);
    R(x + 4, y + 12, 3, 5, t.dark); R(x + w - 7, y + 12, 3, 5, t.dark);
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, t.dark); R(x + w / 2 - 3, y + 13, 6, 2, (gameT * 6 | 0) % 2 ? '#ffe36b' : '#a8802c'); }
  }
}

// ---------- уровни ----------
const ENEMY = {
  bite: { spr: 'e_bite', hp: 1, lines: ['это НАША деревня!', 'кусь!', 'за Зефирку!', 'ты нам не хозяйка'] },
  throw: { spr: 'e_throw', hp: 1, lines: ['огонь по Гале!', 'лови морковку!', 'получай!'] },
  guard: { spr: 'e_guard', hp: 3, scale: 1.15, lines: ['вас нет в списках', 'фейс-контроль', 'со сковородками нельзя'] },
  santa: { spr: 'e_santa', hp: 1, lines: ['с новым годом!', 'хо-хо-хо!', 'подарочек!'] },
  witch: { spr: 'e_witch', hp: 2, lines: ['хм. чудовище', 'зараза…', 'контракт на Галю: 300 орен'] }
};
function mkEnemy(x, y, type, line) {
  const d = ENEMY[type], r = mkRabbit(x, y, 'sit', line === undefined ? pick(d.lines) : line, { scale: d.scale || 1 });
  return Object.assign(r, { hostile: type, spr: has(d.spr) ? d.spr : null, hp: d.hp, cd: rnd(.4, 1.4), stun: 0, tele: 0, lunge: 0 });
}
function buildStory(i) {
  const l = { fy: FY, solids: [], rabbits: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: false, gate: 0, story: true, si: i, th: TH[i], song: STAGES[i].song, dancers: [], neon: [], icy: [], lights: [], name: STAGES[i].name };
  if (sbgs[i] && sbgs[i].a) { l.bgA = sbgs[i].a; l.bgB = sbgs[i].b; }
  const floors = a => { for (let k = 0; k < a.length; k += 2) { l.solids.push({ x: a[k], y: FY, w: a[k + 1] - a[k], h: 120, k: 'f' }); if (k + 2 < a.length) l.pits.push([a[k + 1], a[k + 2]]); } };
  const bl = (x, y, w, h) => l.solids.push({ x, y, w, h, k: 'b' });
  const pl = (x, y, w) => l.solids.push({ x, y, w, h: 12, k: 'p' });
  const mv = (x0, x1, y, w, sp) => { const s = { x: x0, y, w, h: 12, k: 'p', mv: { x0, x1, sp, d: 1 } }; l.solids.push(s); l.movers.push(s); };
  const rb = (x, y, kind, line, o) => { const r = mkRabbit(x, y, kind, line, o); l.rabbits.push(r); return r; };
  const en = (x, y, type, line) => { const r = mkEnemy(x, y, type, line); l.rabbits.push(r); return r; };
  const cs = (x, y, content, ci) => l.cases.push(mkCase(x, y, content, ci, 1, true));
  const sg = (x, y, w, lines) => l.signs.push({ x, y, w, lines });
  const zap = (x, y0, ph) => l.zaps.push({ x, y0, y1: FY, per: 2.6, ph: ph || 0 });
  const chk = x => l.checks.push({ x, on: false });
  const sp = (x, w) => l.spikes.push({ x, y: FY - 12, w, h: 12 });
  if (i === 0) { // ДЕРЕВНЯ
    l.w = 5200; floors([-200, 1100, 1200, 2330, 2420, 3500, 3650, 5500]);
    sg(60, 222, 262, TOUCH ? ['◀ ▶  БЕГАТЬ', 'ПРЫГ  ПРЫГАТЬ', 'БИТЬ  СКОВОРОДКА', 'РЫВОК  НЕУЯЗВИМОСТЬ'] : ['СТРЕЛКИ    БЕГАТЬ', 'ПРОБЕЛ / Z  ПРЫЖОК', 'X      СКОВОРОДКА', 'C / SHIFT   РЫВОК']);
    rb(430, FY, 'sit', 'Галя?! ты же уехала!'); en(640, FY, 'bite', 'это НАША деревня!'); cs(800, FY, 'socks', 0);
    rb(915, FY, 'give', 'вот морковка. за проезд'); bl(1000, 346, 70, 40); en(1035, 346, 'throw', 'огонь по Гале!');
    en(1330, FY, 'bite'); sg(1400, 262, 232, ['МАЛЫЕ УШИ', 'РОДИНА ГАЛИ', '(кролики против)']);
    bl(1660, 346, 60, 40); bl(1720, 306, 90, 80); en(1765, 306, 'throw', 'с крыши виднее'); sp(1816, 50); rb(1930, FY, 'run', 'ОНА ВЕРНУЛАСЬ!');
    pl(2010, 330, 70); pl(2120, 276, 70); pl(2232, 222, 86); l.tik = { x: 2276, y: 222 };
    chk(2470); en(2580, FY, 'bite'); en(2660, FY, 'bite', 'нас двое!'); rb(2780, FY, 'sit', 'я просто сторож'); cs(2860, FY, 'heart', 1);
    l.iceX = 2960; en(3160, FY, 'throw'); pl(3250, 270, 170); zap(3336, 282, 0); en(3440, FY, 'bite');
    sg(3300, 200, 190, ['ЯМА ШИРОКАЯ', 'НУЖЕН РЫВОК']); pl(3552, 356, 44);
    chk(3710); en(3860, FY, 'bite'); en(3950, FY, 'throw'); bl(4060, 326, 70, 60); pl(4160, 262, 70); cs(4195, 262, 'hats', 1);
    rb(4310, FY, 'sit', 'дед Ушан тебя накажет'); en(4450, FY, 'bite'); en(4530, FY, 'bite'); en(4620, FY, 'throw'); sp(4700, 60);
    rb(4850, FY, 'sit', 'дальше дед. он злой'); sg(4880, 250, 150, ['ДЕД УШАН →', '(не добрый)']);
    [150, 720, 1260, 2330 + 150, 3020, 3780, 4380, 4980].forEach((x, k) => l.deco.push({ x, y: FY, ci: k % 5, s: .8 }));
  } else if (i === 1) { // ЗАНОЗА
    l.w = 5500; floors([-200, 900, 1010, 2000, 2140, 3300, 3450, 4310, 4410, 5800]);
    l.neon.push({ x: 150, y: 70, s: 'ЗАНОЗА', c: '#ff4fd8' }, { x: 2620, y: 70, s: 'ЗАНОЗА', c: '#55e6ff' }, { x: 4700, y: 70, s: 'VIP', c: '#ffe36b' });
    rb(330, FY, 'sit', 'вход по спискам'); en(520, FY, 'guard', 'вас нет в списках'); l.dancers.push({ x: 700, v: 0 });
    rb(820, FY, 'give', 'мне только сок. морковный');
    en(1130, FY, 'bite', 'танцпол занят!'); l.dancers.push({ x: 1290, v: 1 }); en(1440, FY, 'throw', 'лови шот!'); bl(1540, 346, 70, 40); bl(1610, 306, 80, 80); cs(1650, 306, 'carrots', 3);
    en(1790, FY, 'guard'); zap(1900, 252, 0); pl(1830, 240, 140);
    mv(2010, 2060, 344, 70, 40); chk(2190); l.dancers.push({ x: 2330, v: 0 }); en(2480, FY, 'bite'); en(2560, FY, 'bite');
    pl(2640, 330, 70); pl(2740, 276, 70); pl(2840, 222, 90); l.tik = { x: 2886, y: 222 }; rb(2700, FY, 'sit', 'наверху кто-то раздаёт деньги');
    l.iceX = 2980; en(3080, FY, 'guard', 'со сковородками нельзя'); en(3200, FY, 'throw');
    pl(3330, 350, 50); pl(3400, 320, 40);
    chk(3500); l.dancers.push({ x: 3640, v: 1 }); en(3780, FY, 'bite'); zap(3900, 252, .6); zap(4060, 252, 1.9); pl(3840, 240, 280); cs(3980, 240, 'heart', 1); en(4200, FY, 'guard');
    en(4520, FY, 'throw'); en(4620, FY, 'bite'); l.dancers.push({ x: 4780, v: 0 }, { x: 4900, v: 1 }); en(5040, FY, 'guard', 'к Апельсину нельзя');
    rb(5180, FY, 'sit', 'он катается. это больно'); sg(5200, 250, 150, ['АПЕЛЬСИН →', '(VIP-ЗАЛ)']);
    [240, 960 - 110, 1700 + 250, 2420, 3050 + 150, 4100, 4460, 5120].forEach((x, k) => l.deco.push({ x, y: FY, ci: (k + 2) % 5, s: .8 }));
  } else { // NASRAL 2026
    l.w = 5700; floors([-200, 1010, 1110, 2100, 2250, 3200, 3330, 4350, 4500, 6000]);
    l.neon.push({ x: 170, y: 76, s: 'NASRAL 2026', c: '#ff5b6b' }, { x: 2800, y: 76, s: 'NASRAL 2026', c: '#3ddc6a' }, { x: 5100, y: 76, s: 'С НОВЫМ ГОДОМ', c: '#ffe36b' });
    for (let x = 80; x < 5600; x += 260) l.lights.push(x);
    rb(360, FY, 'sit', 'ярмарка закрыта. для Гали'); en(560, FY, 'santa', 'с новым годом!'); l.icy.push([650, 900]); en(800, FY, 'bite');
    rb(930, FY, 'give', 'глинтвейн? морковный');
    en(1240, FY, 'witch', 'хм. чудовище'); bl(1380, 346, 70, 40); en(1415, 346, 'santa'); sp(1460, 50); en(1620, FY, 'bite'); l.icy.push([1680, 2000]); en(1880, FY, 'santa');
    mv(2110, 2170, 344, 70, 44); chk(2300); en(2430, FY, 'witch'); en(2520, FY, 'bite'); cs(2620, FY, 'matryoshka', 2);
    pl(2700, 326, 70); pl(2800, 268, 70); pl(2900, 210, 70); pl(3010, 160, 90); l.tik = { x: 3056, y: 160 };
    l.iceX = 2760; en(3080, FY, 'santa'); zap(3140, 282, .4); pl(3080, 270, 120);
    pl(3236, 352, 50); chk(3380); l.icy.push([3450, 3800]); en(3560, FY, 'bite'); en(3660, FY, 'witch', 'контракт на Галю: 300 орен'); en(3900, FY, 'santa');
    bl(4000, 326, 70, 60); pl(4100, 262, 70); cs(4135, 262, 'hats', 1); en(4240, FY, 'witch');
    pl(4390, 340, 60); en(4640, FY, 'santa'); en(4740, FY, 'bite'); en(4840, FY, 'witch'); sp(4950, 60); l.icy.push([5020, 5300]);
    rb(5380, FY, 'sit', 'король сегодня не в духе'); sg(5400, 250, 170, ['КОРОЛЬ →', '(кланяться)']);
    [220, 1050 - 120, 1560, 2350 + 150, 3420, 4480 + 80, 5200].forEach((x, k) => l.deco.push({ x, y: FY, ci: (k + 1) % 5, s: .8 }));
  }
  l.gateX = l.w - 100;
  l.solids.push({ x: -60, y: -300, w: 60, h: 800, k: 'b', hid: true }, { x: l.w, y: -300, w: 80, h: 800, k: 'b', hid: true });
  l.casesTotal = l.cases.length; l.rabTotal = l.rabbits.length;
  return l;
}
function buildStoryArena(i) {
  const l = { w: W, fy: FYB, solids: [], rabbits: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: true, story: true, si: i, th: TH[i], song: 'sboss', dancers: [], neon: [], icy: [], lights: [], name: STAGES[i].boss };
  l.bg2 = sbgs[i] && sbgs[i].boss;
  l.solids.push({ x: -200, y: FYB, w: W + 400, h: 120, k: 'f' }, { x: -60, y: -300, w: 68, h: 800, k: 'b', hid: true }, { x: W - 8, y: -300, w: 68, h: 800, k: 'b', hid: true });
  if (i === 1) l.neon.push({ x: W / 2, y: 92, s: 'ЗАНОЗА VIP', c: '#ff4fd8' });
  if (i === 2) { l.neon.push({ x: W / 2, y: 92, s: 'NASRAL 2026', c: '#ffe36b' }); for (let x = 60; x < W; x += 170) l.lights.push(x); }
  return l;
}

// ---------- поток ----------
function clearWorld() { parts = []; gibs = []; stains = []; splats = []; pickups = []; floats = []; fxs = []; tears = []; puddles = []; shots = []; warns = []; chain = 0; chainT = 0; pendingCele = false; ice = null; boss = null; sb = null; tik = null; walker = null; walkerT = 12; letterT = 0; hitstop = 0; slow = 1; }
function startStory() { newGame(); story = { i: 0, score: 0, tikGot: 0 }; scene = 'sintro'; sceneT = 0; stopSong(); }
function storyStartLevel() {
  const i = story.i; clearWorld(); iceSeen = false; fallCase = true;
  L = buildStory(i); stats.cases = 0; stats.casesTotal = L.casesTotal;
  if (L.tik) tik = { x: L.tik.x, y: L.tik.y, st: 0, t: 0, bub: null };
  Object.assign(P, { x: 90, y: FY, vx: 0, vy: 0, face: 1, hp: P.maxhp, inv: 0, hurtT: 0, atk: 0, onGround: true, ground: null, idleT: 0, bub: null, bigHat: 0, safeX: 90, safeY: FY, emoteT: 0, dash: 0, dashCd: 0 });
  cam = 0; look = 0; mode = 'play'; modeT = 0; scene = 'play'; sceneT = 0; playSong(L.song);
  banner = { s: 'ЭТАП ' + (i + 1) + ': ' + STAGES[i].name, sub: STAGES[i].sub.toUpperCase(), t: 2.8 };
}
function storyBossIntro() { stats.l1left += L.rabbits.filter(r => !r.dead).length; scene = 'sboss'; sceneT = 0; stopSong(); tn('sawtooth', 82, 78, 1.4, .2); tn('sawtooth', 62, 58, 1.6, .2, .5); }
function storyStartBoss() {
  const i = story.i, S = STAGES[i]; clearWorld(); iceSeen = true;
  L = buildStoryArena(i); cam = 0; look = 0;
  Object.assign(P, { x: 70, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, safeX: 70, safeY: FYB, dash: 0, dashCd: 0 });
  sb = { i, x: 620, y: FYB, hp: S.hp, max: S.hp, st: 'intro', t: 0, face: -1, inv: 0, fl: 0, bub: null, dead: false, n: 0, cnt: 0, vx: 0, crown: null, ph2: false, tired: false, armored: false, hot: false, h: S.h, hw: S.hw };
  mode = 'play'; modeT = 0; scene = 'play'; playSong('sboss');
  banner = { s: S.boss, sub: S.bsub.toUpperCase(), t: 2.2 };
}
function storyRespawn() {
  if (L.boss) { storyStartBoss(); return; }
  const c = L.lastCheck; P.x = c ? c.x + 20 : 90; P.y = FY; P.vx = P.vy = 0; P.hp = P.maxhp; P.inv = 1.5; P.hurtT = 0; P.onGround = true; P.dash = 0;
  shots = []; mode = 'play'; modeT = 0; cam = clamp(P.x - W * .45, 0, L.w - W); playSong(L.song); chain = 0;
}
function addScore(n, x, y) { if (!story) return; story.score += n; if (x !== undefined) floater('+' + fmt(n), x, y, { color: '#ffe36b', size: 8, t: .9 }); }
function storyKill(r) { addScore(1000 * Math.max(1, chain + 1) * (r.hostile ? 2 : 1), r.x, r.y - 70); }

// ---------- враждебные кролики ----------
function shoot(o) { shots.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, r: 8, life: 4, k: 'carrot', rot: 0 }, o)); }
function storyRabbit(r, dt, dx, dist, near) {
  const dir = sign(dx), type = r.hostile, live = mode === 'play';
  r.cd -= dt; if (r.stun > 0) { r.stun -= dt; return; }
  if (r.onGround && r.lunge <= 0) r.vx *= Math.pow(.001, dt);
  r.state = 'idle';
  if (type === 'bite') {
    r.face = dir;
    if (r.onGround && r.cd <= 0 && dist < 290 && near && live) { r.vy = -330; r.vx = dir * 165; r.onGround = false; r.cd = rnd(.8, 1.3); sfx.squeak(); }
    if (!r.onGround) r.state = 'flee';
  } else if (type === 'throw' || type === 'santa') {
    r.face = dir;
    if (r.cd <= 0 && dist < 360 && dist > 40 && near && live && inView(r.x)) {
      r.cd = type === 'santa' ? rnd(1.3, 1.8) : rnd(1.7, 2.3); r.tele = .18;
      if (type === 'santa') shoot({ k: 'snow', x: r.x + dir * 14, y: r.y - 30, vx: dir * 250, vy: -60, g: 260 });
      else shoot({ k: 'carrot', x: r.x + dir * 12, y: r.y - 40, vx: dir * clamp(dist * 1.05, 120, 300), vy: -330, g: 800, rot: 1 });
      sfx.swing();
    }
    r.tele = Math.max(0, r.tele - dt);
  } else if (type === 'guard') {
    r.face = dir; if (dist < 330 && dist > 18 && near && r.onGround && live) { const ahead = r.x + dir * 20; if (groundBelow(ahead, r.y)) { r.vx = dir * 58; r.state = 'flee'; } }
  } else if (type === 'witch') {
    if (r.lunge > 0) { r.lunge -= dt; r.vx = r.face * 340; r.state = 'flee'; if (r.onGround && !groundBelow(r.x + r.face * 18, r.y)) { r.vx = 0; r.lunge = 0; } if (r.lunge <= 0) r.cd = rnd(1.1, 1.6); }
    else if (r.tele > 0) { r.tele -= dt; if (r.tele <= 0) { r.lunge = .34; sfx.dash(); } }
    else { r.face = dir; if (r.cd <= 0 && dist < 250 && near && r.onGround && live) { r.tele = .42; say(r, '!', .4); sfx.blip2(); } }
  }
  // контакт
  if (live && r.ko <= 0 && Math.abs(P.x - r.x) < 17 * r.scale + 8 && P.y > r.y - 34 * r.scale && P.y - P.h < r.y - 2) hurtPlayer(sign(P.x - r.x || 1));
}
function armorHit(r, dir) {
  r.hp--; r.vx = dir * 170; r.vy = -150; r.onGround = false; r.stun = .32; r.lunge = 0; r.tele = 0; hitstop = .05; sfx.bonk(); shake = Math.max(shake, 4);
  floater(pick(BONK), r.x + dir * 10, r.y - 56, { color: '#fff', size: 12, t: .45, rot: rnd(-.3, .3), vy: -60 });
  fxs.push({ k: 'star', x: r.x, y: r.y - 22, t: 0, max: .12 });
  for (let i = 0; i < 8; i++) parts.push({ k: 'b', x: r.x, y: r.y - 24, vx: dir * rnd(40, 200) + rnd(-60, 60), vy: -rnd(60, 260), s: rint(2, 3), c: pick(BLOOD), life: rnd(1, 2) });
  say(r, pick(r.hostile === 'guard' ? ['костюм помял!', 'ай!', 'охрана!'] : ['ух!', 'зараза!', 'ай!']), .6);
}

// ---------- снаряды ----------
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]; s.life -= dt; s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.rot) s.rot += dt * 12 * sign(s.vx || 1);
    let dead = s.life <= 0 || s.y > H + 40 || s.x < cam - 80 || s.x > cam + W + 80;
    if (s.k === 'crown') { // бумеранг
      s.t += dt; if (!s.back && (s.t > .85 || s.x < 30 || s.x > W - 30)) { s.back = true; s.vx = 0; }
      if (s.back) { const dx = sb.x - s.x, dy = (sb.y - sb.h - 20) - s.y, d = Math.hypot(dx, dy) || 1; s.vx += dx / d * 900 * dt; s.vy += dy / d * 900 * dt; const v = Math.hypot(s.vx, s.vy), mx = sb.ph2 ? 380 : 320; if (v > mx) { s.vx *= mx / v; s.vy *= mx / v; } if (d < 30 && s.t > 1) { dead = true; sb.crown = null; if (!sb.dead) { sfx.ding(); if (sb.st === 'bare') bset('idle'); } } }
      dead = dead && s.back;
    } else if (s.k !== 'wave' && s.k !== 'beam') { const q = solidAt(s.x, s.y); if (q && !(q.k === 'p')) { dead = true; burst(s.x, s.y, 6, s.k === 'snow' ? ['#fff', '#cfe8ff'] : s.k === 'fire' ? ['#ffb347', '#ff5b3b'] : ['#ffa033', '#7fbf6d'], 110, .35); if (s.k === 'gift') { sfx.thud(); shake = Math.max(shake, 3); } } }
    if (!dead && mode === 'play' && Math.abs(s.x - P.x) < s.r + 9 && s.y > P.y - P.h + 6 && s.y - s.r < P.y) { hurtPlayer(sign(P.x - s.x || 1)); if (s.k !== 'wave' && s.k !== 'crown' && P.inv > 0 && !(P.dash > 0)) dead = true; }
    if (dead) shots.splice(i, 1);
  }
  for (let i = warns.length - 1; i >= 0; i--) { const w = warns[i]; w.t -= dt; if (w.t <= 0) { warns.splice(i, 1); if (w.fn) w.fn(w); } }
}
function drawShots() {
  for (const w of warns) { if ((gameT * 14 | 0) % 2) R(w.x - (w.w || 8), L.fy - 3, (w.w || 8) * 2, 3, '#ff5b6b'); g.globalAlpha = .18; R(w.x - (w.w || 8), 0, (w.w || 8) * 2, L.fy, w.c || '#ff5b6b'); g.globalAlpha = 1; }
  for (const s of shots) {
    const x = Math.round(s.x), y = Math.round(s.y);
    if (s.k === 'carrot') spr('carrot_s', x, y + 8, s.vx < 0, { rot: s.rot });
    else if (s.k === 'snow') { if (has('s_snow')) spr('s_snow', x, y + 9, false); else { R(x - 6, y - 6, 12, 12, '#16161d'); R(x - 5, y - 5, 10, 10, '#fff'); } }
    else if (s.k === 'seed') { R(x - 4, y - 4, 8, 8, '#16161d'); R(x - 3, y - 3, 6, 6, '#ff9a2e'); R(x - 2, y - 2, 2, 2, '#ffe0a0'); }
    else if (s.k === 'crown') sspr('s_crown', x, y + 12, false, { rot: gameT * 14 }, 'hat_s');
    else if (s.k === 'gift') sspr('s_gift', x, y + 12, false, null, 'heart_s');
    else if (s.k === 'fire') { const fl = (gameT * 16 | 0) % 2; if (has('s_fire')) spr('s_fire', x, y + 12, fl); else { R(x - 7, y - 12, 14, 24, '#ff5b3b'); R(x - 4, y - 6, 8, 16, '#ffe36b'); } }
    else if (s.k === 'wave') { const k = clamp(s.life / .9, 0, 1), hh = 26 * k + 6; R(x - 9, L.fy - hh, 18, hh, '#16161d'); R(x - 7, L.fy - hh + 2, 14, hh - 2, s.c || '#d9c9a0'); R(x - 3, L.fy - hh + 4, 5, hh - 6, '#fff'); }
    else if (s.k === 'beam') { R(x - s.r, 0, s.r * 2, L.fy, 'rgba(255,79,216,.5)'); R(x - s.r / 2, 0, s.r, L.fy, '#fff'); }
  }
}

// ---------- Тихон: +3 000 000 ----------
function updateTikhon(dt) {
  const t = tik; if (!t || t.st === 3) return; t.t += dt; if (t.bub) { t.bub.t -= dt; if (t.bub.t <= 0) t.bub = null; }
  if (t.st === 0) {
    if (Math.abs(P.x - t.x) < 150 && Math.abs(P.y - t.y) < 120 && !t.hi) { t.hi = true; say(t, 'Я ТИХОН.', 1.6); sfx.blip2(); }
    if (Math.abs(P.x - t.x) < 30 && Math.abs(P.y - t.y) < 60 && mode === 'play') {
      t.st = 1; t.t = 0; story.tikGot++; story.score += 3000000; sfx.coins(); sfx.heal(); shake = Math.max(shake, 6); flash = Math.max(flash, .12);
      say(t, 'Я ТИХОН. ДЕРЖИ ДЕНЕГ!', 2.2);
      floater('+3 000 000', t.x, t.y - 110, { color: '#ffe36b', size: 20, t: 2.4, vy: -16, stroke: '#16161d' });
      floater('ТИХОН ДАЛ ДЕНЕГ', t.x, t.y - 84, { color: '#fff', size: 9, t: 2.4, vy: -16 });
      for (let i = 0; i < 46; i++) parts.push({ k: 'p', x: t.x + rnd(-8, 8), y: t.y - 50, vx: rnd(-220, 220), vy: -rnd(120, 460), s: rint(2, 4), c: pick(['#ffe36b', '#f3c93a', '#fff7c2']), life: rnd(.8, 1.8), g: 700 });
    }
  } else if (t.st === 1) { if (t.t > 2.4) { t.st = 2; t.t = 0; say(t, 'Я В ЯПОНИЮ!', 1.6); sfx.dash(); } }
  else if (t.st === 2) { t.x += (150 + t.t * 260) * dt; t.y -= (70 + t.t * 200) * dt; if ((t.t * 30 | 0) % 2) parts.push({ k: 'p', x: t.x - 20, y: t.y - 30, vx: -60, vy: rnd(-10, 30), s: 3, c: '#fff', life: .5, g: 0 }); if (t.y < -140) t.st = 3; }
}
function drawTikhon() {
  const t = tik; if (!t || t.st === 3 || !inView(t.x, 200)) return;
  const bob = t.st === 0 ? Math.round(Math.abs(Math.sin(t.t * 3)) * -2) : 0, name = t.st === 0 ? 't_stand' : 't_give', flip = P.x > t.x;
  if (t.st === 2) { R(t.x - 46, t.y - 46, 92, 12, '#16161d'); R(t.x - 44, t.y - 44, 88, 8, '#e8ecf4'); R(t.x - 10, t.y - 60, 26, 16, '#b4c8d8'); T('→ ЯПОНИЯ', t.x - camR - 96, t.y - 40, { size: 8, color: '#ff6b6b', stroke: '#16161d' }); }
  if (has(name)) spr(name, t.x, t.y + bob - (t.st === 2 ? 44 : 0), flip); else { R(t.x - 9, t.y - 60, 18, 60, '#16161d'); R(t.x - 7, t.y - 58, 14, 56, '#f3c93a'); }
  if (t.st === 0 && (gameT * 3 | 0) % 2) T('₽', t.x - camR, t.y - 104, { size: 12, color: '#ffe36b', stroke: '#16161d' });
  if (t.bub) bubble(t.bub.s, t.x - camR, t.y - 98, { size: 9, max: 12, bg: '#eaffea' });
}

// ---------- боссы ----------
function bset(st) { sb.st = st; sb.t = 0; sb.cnt = 0; }
function bossSay(s, t) { sb.bub = { s, t: t || 1.6 }; }
function storyAttack(x0, x1, y0, y1) {
  for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; if (s.k === 'wave' || s.k === 'beam' || s.k === 'crown' || s.k === 'fire') continue; if (s.x > x0 - 6 && s.x < x1 + 6 && s.y > y0 && s.y < y1) { shots.splice(i, 1); sfx.ding(); addScore(100, s.x, s.y - 14); burst(s.x, s.y, 6, ['#fff', '#ffe36b'], 140, .3); fxs.push({ k: 'star', x: s.x, y: s.y, t: 0, max: .1 }); } }
  const b = sb; if (!b || b.dead || P.atkSet.has(b) || b.st === 'intro' || b.st === 'dying') return;
  if (!(b.x + b.hw > x0 && b.x - b.hw < x1 && b.y > y0 && b.y - b.h < y1)) return;
  P.atkSet.add(b);
  if (b.armored || b.inv > 0) { if (b.armored) { sfx.ding(); floater('ДЗЫНЬ', b.x, b.y - b.h - 10, { color: '#cfd8e6', size: 10, t: .5 }); P.vx = -P.face * 220; } return; }
  const dmg = b.tired ? 2 : 1; b.hp -= dmg; b.inv = .5; b.fl = .2; hitstop = .07; shake = Math.max(shake, 9); sfx.bonk(); sfx.splat();
  const hx = b.x + sign(P.x - b.x) * (b.hw - 6), hy = b.y - b.h * .55, dir = sign(b.x - P.x);
  for (let i = 0; i < 26; i++) { const a = rnd(-Math.PI, 0), sp = rnd(60, 380); parts.push({ k: 'b', x: hx, y: hy + rnd(-20, 20), vx: Math.cos(a) * sp + dir * 60, vy: Math.sin(a) * sp - 60, s: rint(2, 4), c: b.i === 1 ? pick(['#ff9a2e', '#ffb347', '#ffe0a0', '#d81b2a']) : pick(BLOOD), life: rnd(1.5, 3) }); }
  if (Math.random() < .35) lensSplat(1);
  floater(pick(BONK) + (dmg > 1 ? ' x2' : ''), hx, hy - 46, { color: '#ffe36b', size: dmg > 1 ? 18 : 15, t: .55, rot: rnd(-.3, .3), vy: -60 });
  addScore(2500 * dmg);
  if (b.hp <= 0) { b.hp = 0; storyBossDeath(); return; }
  if (!b.ph2 && b.hp <= b.max / 2) { b.ph2 = true; shake = 16; flash = Math.max(flash, .3); sfx.scream(.7); bossSay(['ВСЁ. ДЕД РАЗОЗЛИЛСЯ', 'ВЫЖМУ ИЗ ТЕБЯ СОК!', 'КАЗНИТЬ! НЕМЕДЛЕННО!'][b.i], 1.8); }
  else if (Math.random() < .5) { bossSay(pick([['АЙ! ВНУЧКА!', 'ПО ШАПКЕ НЕ БЕЙ!', 'В МОЁ ВРЕМЯ НЕ ДРАЛИСЬ!'], ['МОЯ КОЖУРА!', 'НЕ МНИ!', 'ОХРАНА!!!'], ['НЕ ПО КОРОНЕ!', 'Я КОРОЛЬ!', 'СТРАЖА!']][b.i]), 1.1); sfx.scream(.3); }
}
function storyBossDeath() { const b = sb; mode = 'swin'; modeT = 0; b.st = 'dying'; b.bub = null; stopSong(); shots = []; warns = []; P.atk = 0; wail(2.3, 1400, 380, .26, 10, 110); for (const r of L.rabbits) { r.awe = true; r.vx = 0; } addScore(100000); }
function updateStoryBoss(dt) {
  const b = sb; if (!b || b.dead || b.st === 'dying') return;
  b.t += dt; b.inv = Math.max(0, b.inv - dt); b.fl = Math.max(0, b.fl - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const dir = sign(P.x - b.x || 1), fy = FYB, q = b.ph2 ? .72 : 1;
  b.armored = false; b.tired = false; b.hot = false;
  const hopTo = tx => { b.hopFrom = b.x; b.hopTo = clamp(tx, 70, W - 70); b.hopT = 0; bset('hop'); sfx.jump(); };
  const next = list => { const m = list[b.n++ % list.length]; bset(m); return m; };
  if (b.st === 'intro') { b.face = dir; if (b.t > .5 && !b.said) { b.said = true; bossSay(['ГАЛЬКА! ОПЯТЬ ТЫ?!', 'ТЕБЯ НЕТ В СПИСКАХ, ДЕТКА', 'НА КОЛЕНИ ПЕРЕД КОРОЛЁМ!'][b.i], 1.8); sfx.blip2(); } if (b.t > 1.9) bset('idle'); }
  else if (b.st === 'idle') { b.face = dir; if (b.t > .75 * q) { const m = next([['hop', 'throw', 'tired'], ['roll', 'spit', 'lasers', 'tired'], ['crown', 'igni', 'gifts', 'summon', 'tired']][b.i]); if (m === 'hop') hopTo(P.x); if (m === 'lasers' && !b.ph2) bset('spit'); if (m === 'summon' && (!b.ph2 || L.rabbits.length >= 2)) bset('igni'); } }
  else if (b.st === 'tired') { b.tired = true; if (b.t < .1 && !b.bub) bossSay(['ОХ… СПИНА…', 'ФУХ… ВЫДОХСЯ…', 'ПОДОЖДИ… ОТДЫШУСЬ…'][b.i], 1.3); if (b.t > (b.ph2 ? 1.5 : 2.1)) bset('idle'); }
  // --- общий прыжок
  else if (b.st === 'hop') {
    b.hopT += dt; const k = Math.min(1, b.hopT / (.8 * (b.ph2 ? .82 : 1))); b.x = b.hopFrom + (b.hopTo - b.hopFrom) * k; b.y = fy - Math.sin(k * Math.PI) * 150; b.hot = k > .4; b.face = sign(b.hopTo - b.hopFrom || 1);
    if (k >= 1) { b.y = fy; shake = Math.max(shake, 9); sfx.thud(); burst(b.x, b.y, 16, ['#d9c9a0', '#a8763f'], 170, .5); for (const d of [-1, 1]) shoot({ k: 'wave', x: b.x + d * 30, y: fy - 8, vx: d * 270, r: 9, life: .9 });
      b.cnt2 = (b.cnt2 || 0) + 1; if (b.cnt2 < (b.ph2 ? 3 : 2)) hopTo(P.x); else { b.cnt2 = 0; bset('idle'); } }
  }
  // --- ДЕД УШАН
  else if (b.st === 'throw') { b.face = dir; const n = b.ph2 ? 5 : 3; if (b.cnt < n && b.t > .25 + b.cnt * .32) { b.cnt++; const d = Math.abs(P.x - b.x); shoot({ k: 'carrot', x: b.x + b.face * 30, y: b.y - 90, vx: b.face * clamp(d * rnd(.85, 1.2), 110, 420), vy: -rnd(330, 420), g: 800, rot: 1 }); sfx.swing(); } if (b.t > .5 + n * .32) bset('idle'); }
  // --- АПЕЛЬСИН
  else if (b.st === 'roll') {
    if (b.t < .55) { b.face = b.t < .1 ? dir : b.face; b.vx = 0; if (b.t < .05 && !b.bub) bossSay('КАЧУСЬ!', .6); }
    else { b.armored = true; b.hot = true; if (!b.vx) { b.vx = b.face * (b.ph2 ? 520 : 430); sfx.dash(); } b.x += b.vx * dt; if ((b.t * 30 | 0) % 2) parts.push({ k: 'p', x: b.x - sign(b.vx) * 30, y: fy - 4, vx: -sign(b.vx) * 60, vy: -rnd(20, 90), s: 2, c: '#ff9a2e', life: .4, g: 300 });
      if (b.x < 60 || b.x > W - 60) { b.x = clamp(b.x, 60, W - 60); shake = Math.max(shake, 10); sfx.thud(); burst(b.x, fy - 40, 14, ['#ff9a2e', '#ffe0a0'], 200, .5); b.cnt++; if (b.cnt >= (b.ph2 ? 3 : 2)) { b.vx = 0; b.st = 'dizzy'; b.t = 0; } else b.vx = -b.vx; } }
  }
  else if (b.st === 'dizzy') { b.tired = true; if (b.t > (b.ph2 ? 1.5 : 2)) bset('idle'); }
  else if (b.st === 'spit') { b.face = dir; const n = b.ph2 ? 4 : 3; if (b.cnt < n && b.t > .3 + b.cnt * .42) { b.cnt++; for (const a of [-.22, 0, .22]) { const an = Math.atan2((P.y - 40) - (b.y - 70), P.x - b.x) + a; shoot({ k: 'seed', x: b.x + b.face * 34, y: b.y - 70, vx: Math.cos(an) * 290, vy: Math.sin(an) * 290, r: 5 }); } sfx.pop(); } if (b.t > .6 + n * .42) bset('idle'); }
  else if (b.st === 'lasers') { if (b.t < .05 && !b.cnt) { b.cnt = 1; bossSay('СВЕТОМУЗЫКА!', 1); for (let i = 0; i < 5; i++) { const x = i === 0 ? P.x : rnd(40, W - 40); warns.push({ x, w: 16, t: .8 + i * .16, c: '#ff4fd8', fn: w => { shoot({ k: 'beam', x: w.x, y: FYB - 30, r: 15, life: .34 }); sfx.zap(); shake = Math.max(shake, 3); } }); } } if (b.t > 2.2) bset('idle'); }
  // --- КОРОЛЬ НАСРАЛ I
  else if (b.st === 'crown') { b.face = b.t < .1 ? dir : b.face; if (b.t > .45 && !b.cnt) { b.cnt = 1; b.crown = { k: 'crown', x: b.x + b.face * 30, y: b.y - 34, vx: b.face * (b.ph2 ? 460 : 380), vy: 0, g: 0, r: 13, life: 9, t: 0, back: false }; shots.push(b.crown); sfx.swing(); bossSay('ЛОВИ КОРОНУ!', .8); b.st = 'bare'; b.t = 0; } }
  else if (b.st === 'bare') { b.tired = true; if (b.t > .9 && !b.bub && b.crown) bossSay(pick(['КОРОНА! ГДЕ КОРОНА?!', 'Я БЕЗ НЕЁ НИКТО…', 'НЕ СМОТРИ НА ЛЫСИНУ!']), 1.2); if (!b.crown || b.t > 4) { if (b.crown) { const k = shots.indexOf(b.crown); if (k >= 0) shots.splice(k, 1); b.crown = null; } bset('idle'); } }
  else if (b.st === 'igni') { b.face = dir; const n = b.ph2 ? 3 : 2; if (b.t < .05 && !b.bub) bossSay(pick(['У МЕНЯ ПРИГОРЕЛО!', 'БОМБИТ!', 'ГОРИТ! ВСЁ ГОРИТ!']), .9); if (b.cnt < n && b.t > .45 + b.cnt * .62) { b.cnt++; shoot({ k: 'fire', x: b.x + b.face * 36, y: fy - 14, vx: b.face * (b.ph2 ? 330 : 280), r: 9, life: 3.2 }); sfx.zap(); nz(0, .3, .3, 'lowpass', 900, 200); } if (b.t > .7 + n * .62) bset('idle'); }
  else if (b.st === 'gifts') { if (!b.cnt) { b.cnt = 1; bossSay('ПОДАРОЧКИ!', 1); const n = b.ph2 ? 9 : 6; for (let i = 0; i < n; i++) { const x = i % 3 === 0 ? clamp(P.x + rnd(-40, 40), 30, W - 30) : rnd(30, W - 30); warns.push({ x, w: 12, t: .7 + i * .22, c: '#ffe36b', fn: w => shoot({ k: 'gift', x: w.x, y: -20, vy: 250, g: 500, r: 11, life: 4 }) }); } } if (b.t > 2.6) bset('idle'); }
  else if (b.st === 'summon') { if (!b.cnt) { b.cnt = 1; bossSay('СТРАЖА! КО МНЕ!', 1.2); sfx.scream(.4); for (const sd of [-1, 1]) { const r = mkEnemy(sd < 0 ? 60 : W - 60, -20, sd < 0 ? 'santa' : 'witch'); r.onGround = false; r.said = true; L.rabbits.push(r); } } if (b.t > 1.2) bset('idle'); }
  b.x = clamp(b.x, 50, W - 50);
  // тело босса
  if (mode === 'play' && Math.abs(P.x - b.x) < b.hw + 6 && P.y > b.y - b.h + 8 && P.y - P.h < b.y) {
    if (b.hot) hurtPlayer(sign(P.x - b.x || 1));
    else if (b.st !== 'hop') { P.x = clamp(b.x + (P.x < b.x ? -(b.hw + 6) : b.hw + 6), 22, W - 22); if (sign(P.vx) === sign(b.x - P.x)) P.vx = 0; }
  }
}
function drawStoryBoss() {
  const b = sb; if (!b || !L.boss || b.dead) return;
  const pre = 'sb' + b.i + '_'; let name = pre + '1', ox = 0, oy = 0, rot = 0;
  if (b.st === 'dying') { name = pre + '4'; ox = rnd(-4, 4) * Math.min(1, modeT); oy = rnd(-3, 3) * Math.min(1, modeT); }
  else if (b.st === 'tired' || b.st === 'dizzy' || b.st === 'bare') { name = pre + (b.st === 'bare' && b.t < .35 ? '2' : '4'); ox = (gameT * 20 | 0) % 2 ? 1 : -1; }
  else if (b.st === 'hop') name = pre + (b.i === 0 ? '2' : '1');
  else if (b.st === 'throw' || b.st === 'spit' || b.st === 'igni' || b.st === 'lasers' || b.st === 'gifts' || b.st === 'summon') { name = pre + '3'; oy = -Math.abs(Math.sin(b.t * 10)) * 3; }
  else if (b.st === 'roll') { name = pre + '2'; if (b.t >= .55) { rot = b.t * 16 * sign(b.vx || 1); } else ox = (gameT * 40 | 0) % 2 ? 2 : -2; }
  else if (b.st === 'crown') { name = pre + '2'; ox = (gameT * 40 | 0) % 2 ? 1 : -1; }
  else oy = -Math.abs(Math.sin(gameT * 4)) * 3;
  if (!has(name)) name = has(pre + '1') ? pre + '1' : 'b_wave';
  const flip = b.face < 0, f = F[name];
  g.globalAlpha = .3; R(b.x - b.hw, FYB - 2, b.hw * 2, 5, '#000'); g.globalAlpha = 1;
  const o = rot ? { rot } : null, yy = b.y + oy - (rot ? 0 : 0);
  if (rot) { g.save(); g.translate(Math.round(b.x), Math.round(b.y - f[3] / 2)); g.rotate(rot); g.drawImage(f[6] ? atlas2 : atlas, f[0], f[1], f[2], f[3], -f[2] / 2, -f[3] / 2, f[2], f[3]); g.restore(); }
  else { spr(name, b.x + ox, yy, flip); if (b.fl > .08) spr(name, b.x + ox, yy, flip, { img: atlasW, a: .8 }); if (b.st === 'dying' && (modeT * 12 | 0) % 2) spr(name, b.x + ox, yy, flip, { img: atlasW, a: Math.min(.9, modeT * .35) }); }
  if (b.tired && (gameT * 4 | 0) % 2) T('БЕЙ!', b.x, b.y - b.h - 34, { size: 10, color: '#3ddc6a', stroke: '#16161d' });
  if (b.bub) bubble(b.bub.s, b.x, b.y - b.h - 20, { size: 10, max: 16, shake: b.ph2 ? 1 : 0 });
  if (b.st === 'dying') { const s = ['ВНУЧЕНЬКА, ЗА ЧТООО', 'МЕНЯ ВЫЖАААЛИ', 'КОРОНААА МОЯЯЯ'][b.i], n = Math.min(s.length, (modeT * 11 | 0)); T(s.slice(0, n), W / 2 + rnd(-3, 3), 120 + rnd(-3, 3), { size: 20 + modeT * 5, color: '#fff', stroke: '#a3111f', sw: 6 }); }
}

// ---------- обновление и отрисовка ----------
function storyUpdate(dt) {
  updateShots(dt); updateTikhon(dt); if (L.boss) updateStoryBoss(dt);
  for (const z of L.icy) if (P.onGround && P.x > z[0] && P.x < z[1]) P.slip = true;
}
function storyMode(dt) { // режимы, которых нет в классике: победа над боссом
  if (mode !== 'swin') return;
  const b = sb; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt); tickBubbles(dt);
  if (!b.dead) {
    if (modeT < 2.3) { shake = Math.max(shake, 3 + modeT * 3); if ((modeT * 14 | 0) !== ((modeT - dt) * 14 | 0)) { parts.push({ k: 'b', x: b.x + rnd(-40, 40), y: b.y - rnd(20, 100), vx: rnd(-200, 200), vy: -rnd(100, 300), s: 3, c: pick(BLOOD), life: 2 }); flash = Math.max(flash, .12); } }
    else {
      b.dead = true; const dir = sign(b.x - P.x), old = bossChunks; bossChunks = sChunks[b.i] || old;
      gore(b.x, b.y - b.h * .5, dir, 1, true); bossChunks = old; wallSplat(b.x, b.y - 70, true); lensSplat(14, true); shake = 22; flash = 1; sfx.boom(); sfx.splat();
      memorial.push([STAGES[b.i].boss[0] + STAGES[b.i].boss.slice(1).toLowerCase(), STAGES[b.i].bsub]); stats.kills++; stats.hats += 10;
      pickups.push({ k: 'hat', x: b.x, y: b.y - 60, vx: 0, vy: -360, t: 0, n: 10 });
      for (const r of L.rabbits) say(r, pick(['…', 'мамочки', 'нам конец']), 2.5);
    }
  } else if (modeT > 4.4 && !b.won) { b.won = true; playSong('win'); }
  if (b.won && modeT > 7.6 && !fadeDir) { if (story.i < 2) fadeTo(() => { story.i++; scene = 'sintro'; sceneT = 0; stopSong(); }); else fadeTo(startEnding); }
}
function storyDrawBack() {
  const t = gameT;
  for (const n of L.neon) { if (!inView(n.x, 260) && !L.boss) continue; const on = Math.sin(t * 7 + n.x) > -.9, w = n.s.length * 15 + 24; R(n.x - w / 2 - 3, n.y - 17, w + 6, 34, '#16161d'); R(n.x - w / 2, n.y - 14, w, 28, '#0d0820'); R(n.x - w / 2, n.y - 14, w, 2, on ? n.c : '#3a2a44'); R(n.x - w / 2, n.y + 12, w, 2, on ? n.c : '#3a2a44'); T(n.s, n.x - camR, n.y + 1, { size: 13, color: on ? '#fff' : '#5a4a6a', stroke: on ? n.c : '#2a1c3a', sw: 4 }); }
  for (const x of L.lights) { if (!inView(x, 300) && !L.boss) continue; const cols = ['#ff5b6b', '#ffe36b', '#3ddc6a', '#55e6ff', '#ff9ec4']; for (let k = 0; k < 9; k++) { const lx = x + k * 28, ly = 56 + Math.sin(k / 8 * Math.PI) * 22; R(lx, ly - 4, 1, 4, '#16161d'); R(lx - 2, ly, 5, 6, ((t * 3 | 0) + k) % 3 ? cols[k % 5] : '#3a3a4a'); } }
  for (const z of L.icy) { if (z[1] < camR || z[0] > camR + W) continue; R(z[0], FY, z[1] - z[0], 4, '#bfe9ff'); for (let x = z[0] + 6; x < z[1] - 8; x += 22) R(x, FY + 1, 8, 1, '#fff'); }
  for (const d of L.dancers) { if (!inView(d.x, 120)) continue; const beat = (t * 4 | 0), col = d.v ? '#55e6ff' : '#ff4fd8', nm = (d.v ? 'd_b' : 'd_a') + (1 + (beat + d.v) % 2);
    g.globalAlpha = .16; g.fillStyle = col; g.beginPath(); g.moveTo(d.x - 8, FY - 230); g.lineTo(d.x + 8, FY - 230); g.lineTo(d.x + 44, FY - 22); g.lineTo(d.x - 44, FY - 22); g.fill(); g.globalAlpha = 1;
    R(d.x - 34, FY - 24, 68, 24, '#16161d'); R(d.x - 32, FY - 22, 64, 20, '#2a1846'); R(d.x - 32, FY - 22, 64, 2, col); for (let k = 0; k < 5; k++) R(d.x - 27 + k * 12, FY - 15, 7, 6, (beat + k) % 2 ? col : '#fff');
    if (has(nm)) spr(nm, d.x, FY - 24 - Math.abs(Math.sin(t * 8 + d.x)) * 3, (beat / 2 | 0) % 2 === 1); }
  drawTikhon();
}
function storyDraw() { drawStoryBoss(); drawShots(); if (L.si === 2) for (const s of snow) { const x = ((s.x - camR * .3 + Math.sin(gameT + s.p) * 12) % W + W) % W + camR, y = (s.y + gameT * s.v) % H; R(x, y, s.s, s.s, '#fff'); } }
function storyHud() {
  T('ОЧКИ ' + fmt(story.score), W / 2, L.boss ? 52 : 20, { size: 10, color: '#ffe36b', stroke: '#16161d' });
  const cd = P.dashCd || 0; OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(14, 40, 104, 8); c.fillStyle = cd > 0 ? '#566a92' : '#39e0d0'; c.fillRect(16, 42, 100 * (1 - clamp(cd / .8, 0, 1)), 4); });
  T('РЫВОК', 122, 45, { size: 6, color: cd > 0 ? '#566a92' : '#39e0d0', align: 'left' });
  const b = sb;
  if (b && L.boss && !b.dead && b.st !== 'intro') { T(STAGES[b.i].boss, W / 2, 16, { size: 9, color: '#ffd0e8', stroke: '#16161d' }); OV.push(c => { const w = 300 / b.max; c.fillStyle = '#16161d'; c.fillRect(W / 2 - 152, 26, 304, 12); for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.ph2 ? '#ff5b6b' : '#ffb35b') : '#3a2a44'; c.fillRect(W / 2 - 150 + i * w, 28, w - 2, 8); } }); }
  if (mode === 'swin' && b && b.dead && modeT > 4.4) { T('ЭТАП ПРОЙДЕН', W / 2, 96, { size: 26, color: '#ffe36b', stroke: '#16161d', sw: 7 }); T(STAGES[b.i].boss + ' — ВСЁ', W / 2, 130, { size: 11, color: '#fff', stroke: '#16161d', sw: 4 }); T('+10 ШАПОК   +100 000', W / 2, 154, { size: 10, color: '#3ddc6a', stroke: '#16161d' }); }
}

// ---------- сцены: меню режима, карточки этапа и босса ----------
function storyScene() {
  const t = sceneT;
  if (scene === 'smenu') {
    R(0, 0, W, H, '#0a1030'); for (let y = 0; y < H; y += 6) R(0, y, W, 2, '#0d1640');
    T('ВЫБЕРИ РЕЖИМ', W / 2, 54, { size: 22, color: '#ffe36b', stroke: '#16161d', sw: 6 });
    const cards = [['СЮЖЕТ', ['3 этапа и 3 босса', 'Деревня · Заноза', 'NASRAL 2026', 'кролики дают сдачи']], ['КЛАССИКА', ['Сезон шапок', 'кролики безобидны', 'Пушистик ждёт', '(он добрый)']]];
    cards.forEach((c, i) => { const x = 140 + i * 280, y = 104, sel = i === menuI; R(x - 5, y - 5, 250, 250, sel && (t * 6 | 0) % 2 ? '#ffe36b' : '#39e0d0'); R(x, y, 240, 240, i ? '#1b2a6b' : '#5a1420');
      if (i === 0) { ['sb0_1', 'sb1_1', 'sb2_1'].forEach((n, k) => { if (has(n)) spr(n, x + 54 + k * 66, y + 150, false, { sx: .55 }); }); } else spr('b_wave', x + 120, y + 150, false, { sx: .8 });
      T(c[0], x + 120, y + 26, { size: 18, color: sel ? '#ffe36b' : '#fff', stroke: '#16161d', sw: 5 }); c[1].forEach((s, k) => T(s, x + 120, y + 172 + k * 16, { size: 8, color: '#bff7ee' })); });
    T(TOUCH ? 'тапни по карточке' : '← →  выбор    ENTER  начать', W / 2, H - 30, { size: 9, color: '#8f9ad0' });
  } else if (scene === 'sintro') {
    const i = story.i, S = STAGES[i]; R(0, 0, W, H, ['#12240e', '#1a0a2e', '#0c1830'][i]); for (let k = 0; k < 12; k++) { const y = ((k * 44 + t * 120) % (H + 44)) - 44; R(0, y, W, 16, ['#18301a', '#26103f', '#142544'][i]); }
    if (sbgs[i] && sbgs[i].a) { g.globalAlpha = Math.min(.55, t * .5); g.drawImage(sbgs[i].a, 0, 0); g.globalAlpha = 1; R(0, 150, W, 150, 'rgba(7,3,13,.82)'); } else R(0, 150, W, 150, '#07030d');
    R(0, 150, W, 3, '#ffe36b'); R(0, 297, W, 3, '#ffe36b');
    T('ЭТАП ' + (i + 1) + ' / 3', W / 2, 184, { size: 12, color: '#8fdcff' });
    const n = clamp((t - .3) * 16 | 0, 0, S.name.length); T(S.name.slice(0, n), W / 2, 222, { size: 30, color: '#fff', stroke: '#16161d', sw: 7 });
    if (t > 1.3) T(S.sub, W / 2, 262, { size: 10, color: '#ffd0e8' });
    if (t > 1.6) T('ОЧКИ: ' + fmt(story.score), W / 2, 330, { size: 10, color: '#ffe36b' });
    spr('g_run', 60 + ((t * 170) % (W + 100)) - 50, 296, false);
  } else if (scene === 'sboss') {
    const i = story.i, S = STAGES[i];
    R(0, 0, W, H, '#12061e'); for (let k = 0; k < 12; k++) { const y = ((k * 44 + t * 240) % (H + 44)) - 44; R(0, y, W, 16, k % 2 ? '#2a0f44' : '#1d0a33'); }
    R(0, 150, W, 150, '#07030d'); R(0, 150, W, 3, '#ff5b6b'); R(0, 297, W, 3, '#ff5b6b');
    const x = t < .7 ? W + 100 - (W - 150) * (t / .7) : 250, nm = 'sb' + i + '_1';
    sspr(nm, x, 296 - (t > .7 ? Math.abs(Math.sin(t * 5)) * 4 : 0), false, null, 'b_wave');
    const n = clamp(((t - .9) * 12 | 0), 0, S.boss.length);
    T(S.boss.slice(0, n), 380, 196, { size: S.boss.length > 10 ? 22 : 30, color: '#fff', align: 'left', stroke: '#16161d', sw: 6 });
    if (t > 2) T(S.bsub, 382, 234, { size: 9, color: '#ffd0e8', align: 'left' });
    S.facts.forEach((f, k) => { if (t > 2.4 + k * .4) T(f, 382, 256 + k * 14, { size: 8, color: k === 2 ? '#ff8a94' : '#8fdcff', align: 'left' }); });
  }
}
function storyStep(dt, go) {
  if (scene === 'smenu') {
    if (hit('L') || hit('R')) { menuI = 1 - menuI; sfx.select(); }
    let ok = sceneT > .3 && (hit('S') || hit('A') || hit('J'));
    if (hit('T') && sceneT > .3 && tapY > 100 && tapY < 350) { const k = tapX < W / 2 ? 0 : 1; if (k === menuI) ok = true; else { menuI = k; sfx.select(); } }
    if (ok && !fadeDir) { sfx.ok(); if (menuI === 0) fadeTo(startStory); else fadeTo(() => { scene = 'select'; sceneT = 0; selI = 4; }); }
  } else if (scene === 'sintro') {
    if (sceneT > .3 && sceneT < 1.4 && ((sceneT - .3) * 16 | 0) !== ((sceneT - dt - .3) * 16 | 0)) sfx.blip();
    if ((sceneT > 3.4 || (sceneT > 1 && go)) && !fadeDir) fadeTo(storyStartLevel);
  } else if (scene === 'sboss') {
    if (sceneT > .9 && sceneT < 1.8 && ((sceneT - .9) * 12 | 0) !== ((sceneT - dt - .9) * 12 | 0)) sfx.blip();
    if (sceneT > 2 && sceneT - dt <= 2) [1047, 1319, 1568, 2093].forEach((f, i) => tn('sine', f, f, .3, .15, i * .08));
    if ((sceneT > 4.6 || (sceneT > 1.2 && go)) && !fadeDir) fadeTo(storyStartBoss);
  }
}
