// ---------- game state ----------
let scene = 'load', sceneT = 0;
let L = null, cam = 0, camR = 0, look = 0;
let mode = 'play', modeT = 0;
let hitstop = 0, shake = 0, slow = 1, flash = 0, fade = 0, fadeDir = 0, fadeCb = null;
let parts = [], gibs = [], stains = [], splats = [], lens = [], floats = [], pickups = [], fxs = [];
let stats = null, memorial = [];
let chain = 0, chainT = 0, pendingCele = false, cele = { t: 0, title: '', n: 3 };
let ice = null, iceSeen = false;
let boss = null, tears = [], puddles = [];
let banner = null, letterT = 0, walker = null, walkerT = 12, fallCase = false;
let paused = false, gameT = 0;
const P = { x: 90, y: FY, w: 24, h: 76, vx: 0, vy: 0, face: 1, onGround: true, ground: null, hp: 5, maxhp: 5, inv: 0, hurtT: 0, atk: 0, atkSet: null, coyote: 0, jbuf: 0, idleT: 0, runT: 0, emote: '', emoteT: 0, safeX: 90, safeY: FY, bub: null, bigHat: 0, wigT: 0, hitWall: false, slip: false };
const ATK_T = 0.3, CELE_T = 3.3, GRAV = 1500;

const NAMES = [
  ['Зефирка', 'любила одуванчики'], ['Пончик', 'копил на велосипед'], ['Снежок', 'боялся громких звуков'], ['Геннадий', 'платил ипотеку'],
  ['Ватрушка', 'пекла морковный пирог'], ['Облачко', 'верило в людей'], ['Кузя', 'хотел стать космонавтом'], ['Пельмешек', 'только вчера родился'],
  ['Виталий Сергеевич', 'почти вышел на пенсию'], ['Сахарок', 'никого не обижал'], ['Плюша', 'вязала шарфы'], ['Беляш', 'играл на гармошке'],
  ['Варежка', 'ждала весну'], ['Тополиный Пух', 'писал стихи'], ['Бусинка', 'мечтала о море'], ['Кефирчик', 'собирал марки'],
  ['Сырок', 'учил английский'], ['Ушастик', 'был хорошим слушателем'], ['Комочек', 'просто сидел'], ['Морковкин', 'агроном'],
  ['Пушинка', 'пела в хоре'], ['Хлопок', 'аплодировал всем'], ['Зайка Петрович', 'сторож, 40 лет стажа'], ['Малыш', 'ещё не умел прыгать'],
  ['Кнопка', 'ходила в садик'], ['Чих', 'болел, но пришёл'], ['Одуванчик', 'ничего не подозревал'], ['Бублик', 'занимал очередь'],
  ['Тихон', 'молчал'], ['Капустин', 'вёл собрание'], ['Лапка', 'принесла платочек'], ['Носик', 'бежал на помощь'], ['Пятнышко', 'верил в дружбу'], ['Мякиш', 'был мягким']
];
let nameI = 0;
const LAST = ['за что?..', 'ай', 'я же ничего…', 'мама…', 'скажите жене…', 'ой', 'а морковка?..', 'так нечестно', 'я думал, мы друзья', 'хнык'];
const BONK = ['БДЫЩ!', 'ХРЯСЬ!', 'ШМЯК!', 'БАМ!', 'ЧВЯК!', 'БОНЬК!', 'ХЛОП!', 'ТЫДЫЩ!'];
const AWE = ['…', 'мамочки', 'она смеётся…', 'она танцует?!', 'не шевелись', 'я домой хочу', 'это сон'];

function mkRabbit(x, y, kind, line, o) {
  o = o || {};
  const nm = NAMES[nameI++ % NAMES.length];
  return { x, y, w: 26, h: 30, vx: 0, vy: 0, kind, line, line2: o.line2, scale: o.scale || 1, name: nm[0], epi: nm[1], face: -1, state: 'idle', t: rnd(3), said: false, said2: false, ko: 0, koDir: 1, dead: false, bub: null, onGround: true, ground: null, sign: o.sign, tx: o.tx, awe: false, hitWall: false, born: 0 };
}
function mkCase(x, y, content, ci, scale, main) { return { x, y, content, ci: ci || 0, scale: scale || 1, main: !!main, open: false, vx: 0, vy: 0, fall: false, fallen: false, t: 0, bump: 0 }; }
function say(e, s, t) { e.bub = { s, t: t || 2.4 }; }

function buildLevel1() {
  const l = { w: 6960, fy: FY, solids: [], rabbits: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: false, gateX: 6860, gate: 0, name: 'ЭТАП 1' };
  const fl = (a, b) => l.solids.push({ x: a, y: FY, w: b - a, h: 120, k: 'f' });
  const bl = (x, y, w, h) => l.solids.push({ x, y, w, h, k: 'b' });
  const pl = (x, y, w) => l.solids.push({ x, y, w, h: 12, k: 'p' });
  const mv = (x0, x1, y, w, sp) => { const s = { x: x0, y, w, h: 12, k: 'p', mv: { x0, x1, sp, d: 1 } }; l.solids.push(s); l.movers.push(s); };
  const rb = (x, y, kind, line, o) => { const r = mkRabbit(x, y, kind, line, o); l.rabbits.push(r); return r; };
  const cs = (x, y, content, ci) => l.cases.push(mkCase(x, y, content, ci, 1, true));
  fl(-200, 1300); fl(1390, 1900); fl(2260, 4600); fl(5230, 7200);
  l.pits = [[1300, 1390], [1900, 2260], [4600, 5230]];
  l.solids.push({ x: -60, y: -300, w: 60, h: 800, k: 'b', hid: true }, { x: 6960, y: -300, w: 80, h: 800, k: 'b', hid: true });
  // A: знакомство
  l.signs.push({ x: 60, y: 236, w: 250, lines: TOUCH ? ['◀ ▶  БЕГАТЬ', 'ПРЫГ  ПРЫГАТЬ', 'БИТЬ  СКОВОРОДКА'] : ['СТРЕЛКИ    БЕГАТЬ', 'ПРОБЕЛ / Z  ПРЫЖОК', 'X      СКОВОРОДКА'] });
  cs(360, FY, 'socks', 0);
  rb(580, FY, 'sit', 'привет! ты новенькая?');
  rb(830, FY, 'give', 'это тебе! морковка!');
  bl(990, 346, 70, 40); rb(1025, 346, 'sit', 'я на ящике. я в домике');
  rb(1190, FY, 'run', 'А-А-А-А-А!');
  // B
  rb(1470, FY, 'sit', 'только не толкайся');
  bl(1560, 346, 60, 40); bl(1620, 306, 90, 80); rb(1668, 306, 'give', 'возьми две!');
  l.spikes.push({ x: 1716, y: FY - 12, w: 50, h: 12 });
  rb(1850, FY, 'sit', 'дальше страшно');
  // C: яма
  pl(1950, 346, 70); pl(2075, 322, 70); pl(2195, 346, 62); pl(1988, 250, 66);
  rb(2112, 322, 'sit', 'я боюсь высоты');
  cs(2021, 250, 'heart', 1);
  // D: собрание, мороженщик
  l.signs.push({ x: 2290, y: 262, w: 216, lines: ['ПЛАН:', '1. НЕ ВСТРЕЧАТЬ ГАЛЮ', '2. ???'] });
  rb(2560, FY, 'sit', 'это она…'); rb(2618, FY, 'sit', 'план провалился'); rb(2676, FY, 'sit', 'было приятно с вами работать');
  l.checks.push({ x: 2790, on: false });
  rb(2960, FY, 'run', 'МАМА!');
  l.iceX = 3120;
  rb(3400, FY, 'sit', 'я уже уезжаю, честно!'); cs(3438, FY, 'carrots', 3);
  rb(3610, FY, 'give', 'у меня есть ещё капуста!');
  // E: мостик и разряды
  bl(3740, 346, 60, 40); bl(3800, 306, 90, 80); pl(3920, 270, 340);
  l.zaps.push({ x: 3992, y0: 282, y1: FY, per: 2.6, ph: 0 }, { x: 4196, y0: 282, y1: FY, per: 2.6, ph: 1.3 });
  rb(4070, FY, 'sit', 'тут тупик… да?'); cs(4126, FY, 'matryoshka', 2);
  rb(4010, 270, 'sit', 'у меня дети!', { scale: 1.12 });
  rb(4052, 270, 'sit', 'мама, кто эта тётя?', { scale: .6 }); rb(4078, 270, 'sit', 'я ещё маленький', { scale: .6 }); rb(4104, 270, 'sit', 'а нас-то за что?', { scale: .6 });
  l.pot = { x: 4226, y: 270 };
  l.checks.push({ x: 4340, on: false });
  rb(4450, FY, 'sit', 'я вегетарианец!');
  // F: движущиеся платформы
  pl(4650, 350, 72); mv(4760, 4850, 340, 84, 46); pl(4975, 326, 84); mv(5092, 5138, 340, 84, 40);
  rb(5018, 326, 'sit', 'сюда она не допрыгнет');
  // G: деревня
  l.fallX = 5330;
  rb(5560, FY, 'give', 'мир? дружба? морковка?');
  bl(5680, 346, 80, 40); bl(5760, 306, 84, 80); cs(5718, 346, 'letter', 4);
  rb(5802, 306, 'sit', 'мы за мир!', { sign: 'МИР' });
  rb(5950, FY, 'sit', 'я занимал!'); rb(6004, FY, 'sit', 'нет, я!');
  rb(6110, FY, 'sit', 'я слишком стар для этого');
  rb(6230, FY, 'run', 'я предупрежу остальных!');
  bl(6300, 326, 70, 60); pl(6400, 262, 70); pl(6500, 200, 72); cs(6536, 200, 'hats', 1);
  rb(6690, FY, 'sit', 'дальше нельзя… пожалуйста?');
  l.signs.push({ x: 6716, y: 250, w: 136, lines: ['ПУШИСТИК →', '(он добрый)'] });
  // чемоданы для красоты
  [140, 700, 905, 1432, 2300, 2330, 2315, 2850, 3230, 3550, 4300, 4560, 5290, 5480, 5505, 5492, 5900, 6160, 6620, 6800].forEach((x, i) => {
    const pile = (i === 6 || i === 15); l.deco.push({ x, y: pile ? FY - 17 : FY, ci: i % 5, s: .8 });
  });
  l.casesTotal = l.cases.length + 1; // + падающий
  l.rabTotal = l.rabbits.length;
  return l;
}
function buildBossLevel() {
  const l = { w: W, fy: FYB, solids: [], rabbits: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: true, name: 'ЛОГОВО' };
  l.solids.push({ x: -200, y: FYB, w: W + 400, h: 120, k: 'f', hid: true }, { x: -60, y: -300, w: 68, h: 800, k: 'b', hid: true }, { x: W - 8, y: -300, w: 68, h: 800, k: 'b', hid: true });
  return l;
}

// ---------- physics ----------
function collide(e, dt) {
  const hw = e.w / 2;
  e.hitWall = false;
  e.x += e.vx * dt;
  for (const s of L.solids) {
    if (s.k === 'p') continue;
    if (e.x + hw > s.x && e.x - hw < s.x + s.w && e.y > s.y + 0.01 && e.y - e.h < s.y + s.h) {
      if (e.vx > 0) e.x = s.x - hw; else if (e.vx < 0) e.x = s.x + s.w + hw;
      else e.x = (e.x < s.x + s.w / 2) ? s.x - hw : s.x + s.w + hw;
      e.vx = 0; e.hitWall = true;
    }
  }
  const prev = e.y; e.y += e.vy * dt; e.onGround = false; e.ground = null;
  for (const s of L.solids) {
    if (!(e.x + hw > s.x + 0.01 && e.x - hw < s.x + s.w - 0.01)) continue;
    if (s.k === 'p') { if (e.vy >= 0 && prev <= s.y + 3 && e.y >= s.y) { e.y = s.y; e.vy = 0; e.onGround = true; e.ground = s; } }
    else if (e.y > s.y && e.y - e.h < s.y + s.h) {
      if (e.vy >= 0 && prev <= s.y + 10) { e.y = s.y; e.vy = 0; e.onGround = true; e.ground = s; }
      else if (e.vy < 0) { e.y = s.y + s.h + e.h; e.vy = 0; }
    }
  }
}
function solidAt(x, y) { for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s; return null; }
function groundBelow(x, y) { for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && s.y >= y - 4 && s.y <= y + 10) return s; return null; }
const inView = (x, m) => x > cam - (m || 60) && x < cam + W + (m || 60);

// ---------- fx ----------
function floater(s, x, y, o) { o = o || {}; floats.push({ s, x, y, vy: o.vy === undefined ? -34 : o.vy, t: 0, max: o.t || 1.1, color: o.color || '#fff', size: o.size || 10, rot: o.rot || 0, scr: !!o.scr, stroke: o.stroke || '#16161d' }); }
function addStain(x, y, w, h, c) { stains.push({ x: Math.round(x), y: Math.round(y), w, h, c: c || pick(BLOOD) }); if (stains.length > 1400) stains.splice(0, 200); }
function wallSplat(x, y, big) {
  const rs = [], n = big ? 60 : rint(14, 22), rad = big ? 90 : 26;
  for (let i = 0; i < n; i++) { const a = rnd(6.28), d = rnd(rad) * rnd(.3, 1), s = rint(2, big ? 9 : 6); rs.push([Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d * .8), s, Math.max(2, s - rint(0, 2)), pick(['#8e0f1c', '#a3111f', '#7a0c18'])]); }
  const dr = []; for (let i = 0; i < (big ? 9 : rint(2, 4)); i++) dr.push({ x: Math.round(rnd(-rad * .7, rad * .7)), y: Math.round(rnd(-6, 8)), len: 0, max: rnd(14, big ? 90 : 46), sp: rnd(10, 30) });
  splats.push({ x, y, rs, dr }); if (splats.length > 70) splats.shift();
}
function lensSplat(n, big) {
  for (let i = 0; i < n; i++) lens.push({ x: rnd(30, W - 30), y: rnd(20, H * .7), r: rnd(big ? 14 : 5, big ? 40 : 16), t: 0, max: rnd(2.2, big ? 6 : 3.6), drip: rnd(20, 90), n: rint(2, 4), sd: rnd(100) });
  if (lens.length > 40) lens.splice(0, lens.length - 40);
}
function gore(x, y, dir, scale, big) {
  scale = scale || 1;
  const n = big ? 300 : Math.round(34 * scale + 22);
  for (let i = 0; i < n; i++) {
    const a = rnd(-Math.PI, 0), sp = rnd(50, big ? 720 : 380);
    parts.push({ k: 'b', x: x + rnd(-8, 8) * scale, y: y + rnd(-10, 8) * scale, vx: Math.cos(a) * sp + dir * rnd(30, 170), vy: Math.sin(a) * sp - rnd(0, 110), s: rint(2, big ? 5 : 3), c: pick(BLOOD), life: rnd(1.6, 3.2) });
  }
  const set = big ? bossChunks : rabChunks;
  set.forEach(cv => gibs.push({ k: 'c', cv, x: x + rnd(-10, 10) * scale, y: y + rnd(-14, 4) * scale, vx: dir * rnd(30, 250) + rnd(-190, 190) * (big ? 1.8 : 1), vy: -rnd(190, big ? 640 : 430), rot: rnd(6.28), vr: rnd(-13, 13), sc: scale, rest: false, life: big ? 60 : 22, tr: 0 }));
  for (let i = 0; i < 2; i++) gibs.push({ k: 'e', r: big ? 10 : Math.max(3, Math.round(4.4 * scale)), x: x + (i ? 5 : -5), y: y - 8 * scale, vx: dir * rnd(50, 230) + rnd(-170, 170), vy: -rnd(280, big ? 640 : 470), rot: 0, vr: 0, rest: false, life: big ? 60 : 16, tr: 0 });
  for (let i = 0; i < 2; i++) gibs.push({ k: 'ear', x, y: y - 16 * scale, vx: rnd(-200, 200) + dir * 80, vy: -rnd(260, big ? 600 : 460), rot: rnd(6.28), vr: rnd(-16, 16), sc: scale * (big ? 3 : 1), rest: false, life: big ? 60 : 16, tr: 0 });
  for (let i = 0; i < (big ? 26 : 5); i++) gibs.push({ k: 'm', x, y, vx: rnd(-240, 240) * (big ? 2 : 1) + dir * 60, vy: -rnd(140, big ? 620 : 400), rot: rnd(6.28), vr: rnd(-10, 10), sc: rnd(.8, 1.5) * (big ? 1.8 : 1), c: pick(['#e0525c', '#c2121f', '#f08a94']), rest: false, life: big ? 40 : 12, tr: 0 });
  if (gibs.length > 150) gibs.splice(0, gibs.length - 150);
}
function burst(x, y, n, cols, sp, life, grav) { for (let i = 0; i < n; i++) { const a = rnd(6.28), v = rnd(sp * .3, sp); parts.push({ k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, s: rint(1, 3), c: pick(cols), life: rnd(life * .5, life), g: grav === undefined ? 600 : grav }); } }
function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; p.vy += (p.k === 'b' ? 980 : p.g) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    let kill = p.life <= 0 || p.y > H + 30;
    if (!kill && p.k === 'b') {
      const s = solidAt(p.x, p.y);
      if (s && !(s.k === 'p' && p.vy < 0)) {
        kill = true;
        if (!s.hid) { if (p.y - p.vy * dt <= s.y + 4) addStain(p.x - 1, s.y, rint(2, 5), rint(2, 3), p.c); else if (s.k !== 'p') addStain(p.x < s.x + s.w / 2 ? s.x : s.x + s.w - 2, p.y, 2, rint(3, 8), p.c); }
        else if (L.boss && p.y >= L.fy - 2) addStain(p.x - 1, L.fy + rint(-10, 6), rint(3, 6), 2, p.c);
      }
    }
    if (kill) { parts[i] = parts[parts.length - 1]; parts.pop(); }
  }
  for (let i = gibs.length - 1; i >= 0; i--) {
    const q = gibs[i]; q.life -= dt;
    if (q.life <= 0 || q.y > H + 60) { gibs.splice(i, 1); continue; }
    if (q.rest) { if (!groundBelow(q.x, q.y + 1)) q.rest = false; continue; }
    q.vy += 1100 * dt; q.x += q.vx * dt;
    let s = solidAt(q.x, q.y - 3); if (s && s.k !== 'p') { q.x -= q.vx * dt; q.vx *= -0.5; }
    q.y += q.vy * dt; q.rot += q.vr * dt;
    q.tr -= dt; if (q.tr <= 0 && !q.rest && q.k !== 'sock') { q.tr = .03; parts.push({ k: 'b', x: q.x, y: q.y, vx: rnd(-20, 20), vy: rnd(-20, 30), s: 2, c: pick(BLOOD), life: .8 }); }
    s = solidAt(q.x, q.y);
    if (s && q.vy > 0 && q.y - q.vy * dt <= s.y + 6) {
      q.y = s.y; if (!s.hid && q.k !== 'sock') addStain(q.x - 3, s.y, rint(4, 8), 3);
      if (Math.abs(q.vy) < 120) { q.rest = true; q.vy = 0; q.vx = 0; q.vr = 0; if (q.k === 'c' || q.k === 'ear' || q.k === 'sock') q.rot = Math.round(q.rot / (Math.PI / 2)) * (Math.PI / 2); }
      else { q.vy *= -(q.k === 'e' ? .62 : .4); q.vx *= .7; q.vr *= .6; }
    }
    if (L.boss) { if (q.x < 14) { q.x = 14; q.vx = Math.abs(q.vx) * .6; } if (q.x > W - 14) { q.x = W - 14; q.vx = -Math.abs(q.vx) * .6; } }
  }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.t += dt; f.y += f.vy * dt; if (f.t > f.max) floats.splice(i, 1); }
  for (let i = lens.length - 1; i >= 0; i--) { const l = lens[i]; l.t += dt; if (l.t > l.max) lens.splice(i, 1); }
  for (const s of splats) for (const d of s.dr) if (d.len < d.max) d.len += d.sp * dt;
  for (let i = fxs.length - 1; i >= 0; i--) { fxs[i].t += dt; if (fxs[i].t > fxs[i].max) fxs.splice(i, 1); }
  // pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t += dt;
    if (p.k === 'hat' && p.t > .55) {
      const dx = P.x - p.x, dy = (P.y - 50) - p.y, d = Math.hypot(dx, dy) || 1, sp = 300 + p.t * 500;
      p.x += dx / d * sp * dt; p.y += dy / d * sp * dt;
      if (d < 22) { pickups.splice(i, 1); stats.hats += p.n || 1; sfx.hat(); floater('+' + (p.n || 1), P.x, P.y - 96, { color: '#ffe36b', size: 9, t: .7 }); }
      continue;
    }
    if (!p.rest) {
      p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const s = solidAt(p.x, p.y);
      if (s && p.vy > 0) { p.y = s.y; if (p.vy < 130) { p.rest = true; p.vx = 0; } else { p.vy *= -.4; p.vx *= .6; } }
      if (L.boss) p.x = clamp(p.x, 24, W - 24);
      if (p.y > H + 40) { pickups.splice(i, 1); continue; }
    }
    if (p.k !== 'hat' && p.t > .35 && Math.abs(p.x - P.x) < 26 && p.y > P.y - 84 && p.y - 20 < P.y && mode === 'play') {
      pickups.splice(i, 1);
      if (p.k === 'heart') { P.hp = Math.min(P.maxhp, P.hp + 1); sfx.heal(); floater('+1', P.x, P.y - 90, { color: '#ff5b6b' }); }
      else if (p.k === 'cone') { P.hp = Math.min(P.maxhp, P.hp + 2); sfx.heal(); floater('ПЛОМБИР!', P.x, P.y - 92, { color: '#ffd0e8' }); }
      else if (p.k === 'pot') { P.hp = P.maxhp; sfx.heal(); floater('РАГУ. ИЗ КОГО — НЕВАЖНО', P.x, P.y - 96, { color: '#ffb35b', t: 2.2, size: 9 }); }
      else if (p.k === 'carrot') { stats.carrots++; sfx.ok(); floater('ОТОБРАНА', P.x, P.y - 90, { color: '#ffa033', size: 8 }); }
    }
  }
}

// ---------- kills ----------
function killRabbit(r, dir) {
  r.dead = true; stats.kills++; if (L.story) storyKill(r);
  const cx = r.x, cy = r.y - 20 * r.scale;
  gore(cx, cy, dir, r.scale);
  wallSplat(cx, cy - 6);
  if (Math.random() < .45) lensSplat(rint(1, 2));
  shake = Math.max(shake, 7); sfx.splat();
  pickups.push({ k: 'hat', x: cx, y: cy, vx: rnd(-40, 40), vy: -330, t: 0, rest: false });
  if (r.kind === 'give') pickups.push({ k: 'carrot', x: cx, y: cy, vx: dir * 90, vy: -260, t: 0, rest: false });
  memorial.push([r.name, r.epi]);
  floater('ПРОЩАЙ, ' + r.name.toUpperCase(), cx, cy - 46, { color: '#ff8a94', size: 8, t: 1.6, vy: -22 });
  if (boss && !boss.dead && L.boss) { boss.grief = 1.6; say(boss, (r.name + '!!! НЕЕЕТ!').toUpperCase(), 1.6); sfx.scream(.6); }
  chain++; chainT = 3.6; stats.best = Math.max(stats.best, chain);
  if (chain % 3 === 0) { pendingCele = true; cele.n = chain; }
  else if (!P.bub) {
    const z = Math.random();
    if (z < .3) { P.emote = 'laugh'; P.emoteT = .75; say(P, pick(['АХАХАХА!', 'ХЕ-ХЕ-ХЕ', 'ХА! ХА!', 'ЫХЫХЫ']), 1); sfx.laugh(5, rnd(520, 640)); }
    else if (z < .55) doBark();
  }
}
function doBark() {
  say(P, pick(['ГАВ! ГАВ!', 'ГАВ!', 'Р-Р-ГАВ!', 'ВУФ!']), .9); sfx.bark(); P.emote = 'bark'; P.emoteT = .4;
  for (const r of L.rabbits) if (!r.dead && r.onGround && Math.abs(r.x - P.x) < 330) { r.vy = -240; r.onGround = false; if (!r.bub && Math.random() < .5) say(r, pick(['!!!', 'она лает?!', 'собака!', 'ой']), 1); }
}
function startCelebrate() {
  pendingCele = false; mode = 'celebrate'; cele.t = 0;
  const lvl = Math.floor(cele.n / 3);
  cele.title = lvl <= 1 ? pick(['ШАПОЧНЫЙ ХЕТ-ТРИК', 'ТРОЙНОЙ УДАР', 'ГАЛЯ В УДАРЕ']) : lvl === 2 ? pick(['ШЕСТЬ ШАПОК ПОДРЯД', 'ГАЛЮ НЕ ОСТАНОВИТЬ']) : pick(['КРОЛИЧИЙ АПОКАЛИПСИС', 'ЗОВИТЕ ЗООЗАЩИТУ']);
  P.vx = 0; P.atk = 0; sfx.maniac(); playSong('dance');
  for (const r of L.rabbits) if (!r.dead && inView(r.x)) { r.awe = true; r.vx = 0; if (Math.random() < .75) say(r, pick(AWE), 2.4); }
  if (boss && L.boss && !boss.dead) say(boss, pick(['ПОЧЕМУ ОНА ТАНЦУЕТ?!', 'ЭТО НЕ СМЕШНО!', 'ОНИ БЫЛИ МОИМИ ДРУЗЬЯМИ…']), 2.4);
}
function endCelebrate() {
  mode = 'play'; for (const r of L.rabbits) r.awe = false;
  playSong(curSong()); P.idleT = 0;
  if (Math.random() < .6) doBark();
}

// ---------- suitcases ----------
function openCase(c, dir) {
  if (c.open) return; c.open = true; c.bump = .2; sfx.click(); shake = Math.max(shake, 3);
  if (c.main) { stats.cases++; floater('ЧЕМОДАН ' + stats.cases + '/' + stats.casesTotal, c.x, c.y - 64, { color: '#ffe36b', size: 8, t: 1.5 }); }
  const x = c.x, y = c.y - 20 * c.scale;
  burst(x, y, 10, ['#fff', '#ffe36b', '#d9d2b0'], 160, .5);
  switch (c.content) {
    case 'socks':
      for (let i = 0; i < 7; i++) gibs.push({ k: 'sock', x, y, vx: rnd(-170, 170), vy: -rnd(240, 440), rot: rnd(6.28), vr: rnd(-12, 12), sc: 1, c: pick(['#e84a5f', '#4ab0e8', '#f3c93a', '#7fbf6d', '#fff']), rest: false, life: 14, tr: 9 });
      floater('НОСКИ. ОДНИ НОСКИ.', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'heart': pickups.push({ k: 'heart', x, y, vx: dir * 40, vy: -300, t: 0 }); break;
    case 'carrots': for (let i = 0; i < 3; i++) pickups.push({ k: 'carrot', x, y, vx: rnd(-90, 90), vy: -rnd(240, 360), t: 0 }); floater('ВЕСЬ ЕГО БАГАЖ', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'hats': for (let i = 0; i < 3; i++) pickups.push({ k: 'hat', x: x + i * 8 - 8, y, vx: rnd(-60, 60), vy: -rnd(260, 380), t: -i * .12 }); floater('ШАПКИ ПРО ЗАПАС', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'matryoshka':
      if (c.scale > .42) { const n = mkCase(x + dir * 6, y, 'matryoshka', (c.ci + 1) % 5, c.scale * .7, false); n.fall = true; n.vy = -330; n.vx = dir * 70; L.cases.push(n); floater(c.scale === 1 ? 'ЧЕМОДАН В ЧЕМОДАНЕ' : '…В ЧЕМОДАНЕ', x, y - 26, { size: 8, t: 1.5 }); }
      else { pickups.push({ k: 'hat', x, y, vx: 0, vy: -300, t: 0 }); floater('ШАПКА ДЛЯ МИЗИНЦА', x, y - 26, { size: 8, t: 1.8 }); }
      break;
    case 'rabbit': {
      const r = mkRabbit(x, y, 'sit', c.fallen ? 'десант не удался' : 'занято!'); r.vy = -340; r.onGround = false; r.said = true; say(r, r.line, 2.2); L.rabbits.push(r); L.rabTotal++; sfx.squeak(); break;
    }
    case 'letter': letterT = 4.2; sfx.blip2(); break;
    default: floater('ПУСТО. КАК В ДУШЕ У ГАЛИ', x, y - 26, { size: 8, t: 2 });
  }
}

// ---------- rabbits ----------
function updateRabbits(dt) {
  for (let i = L.rabbits.length - 1; i >= 0; i--) {
    const r = L.rabbits[i];
    if (r.dead) { L.rabbits.splice(i, 1); continue; }
    r.t += dt; r.born += dt;
    if (r.bub) { r.bub.t -= dt; if (r.bub.t <= 0) r.bub = null; }
    if (r.ko > 0) {
      r.ko -= dt; r.x += r.koDir * 130 * dt; r.y -= 150 * dt * (r.ko > .06 ? 1 : -.4);
      if (r.ko <= 0) killRabbit(r, r.koDir);
      continue;
    }
    if (!inView(r.x, 260)) continue;
    const dx = P.x - r.x, dist = Math.abs(dx), near = Math.abs(P.y - r.y) < 130;
    if (!r.said && dist < 215 && near && r.line && mode === 'play') { r.said = true; say(r, r.line, 2.8); sfx.blip(); }
    if (r.hostile) storyRabbit(r, dt, dx, dist, near);
    else if (r.kind === 'run') {
      if (r.state !== 'flee' && dist < 205 && near) { r.state = 'flee'; sfx.squeak(); }
      if (r.state === 'flee') {
        const dir = dx > 0 ? -1 : 1; r.face = dir;
        const ahead = r.x + dir * 22;
        const blocked = (r.onGround && !groundBelow(ahead, r.y)) || r.hitWall || L.zaps.some(z => Math.abs(z.x - ahead) < 14);
        if (blocked) { r.state = 'corner'; r.vx = 0; if (!r.said2) { r.said2 = true; say(r, pick(['тупик!', 'ой-ой', 'я передумал бежать']), 1.6); } }
        else r.vx = dir * 150;
        if (dist > 360) { r.state = 'idle'; r.vx = 0; }
      } else { r.vx = 0; if (r.state === 'corner') { r.face = sign(dx); if (dist > 300) r.state = 'idle'; } else r.face = sign(dx); }
    } else if (r.kind === 'support') {
      if (Math.abs(r.x - r.tx) > 8) { r.state = 'flee'; r.face = sign(r.tx - r.x); r.vx = r.face * 170; }
      else { r.state = 'offer'; r.vx = 0; r.face = sign(boss.x - r.x); }
    } else {
      r.face = sign(dx); r.vx = 0;
      if (r.kind === 'give') r.state = (dist < 240 && near) ? 'offer' : 'idle';
      else r.state = (dist < 150 && near) ? 'scared' : 'idle';
      if (!r.said2 && r.said && dist < 70 && near && !r.bub) { r.said2 = true; say(r, pick(['не надо…', 'пожалуйста', 'я хороший', 'давай обсудим']), 1.4); }
    }
    r.vy += GRAV * dt; collide(r, dt);
    if (r.y > H + 80) { r.dead = true; }
  }
}
function hitRabbit(r, dir) {
  if (r.ko > 0 || r.dead) return;
  const pw = HR().pow || 1; if (r.hp > pw) { r.hp -= pw - 1; armorHit(r, dir); return; }
  r.ko = .13; r.koDir = dir; r.bub = null; hitstop = .055; sfx.bonk(); sfx.squeak();
  say(r, pick(LAST), .5);
  floater(pick(BONK), r.x + dir * 10, r.y - 56, { color: '#ffe36b', size: 14, t: .5, rot: rnd(-.3, .3), vy: -60 });
  fxs.push({ k: 'star', x: r.x, y: r.y - 22, t: 0, max: .12 });
}

// ---------- drawing: world pieces ----------
function drawSolid(s) {
  if (s.hid) return;
  if (L.th) return drawSolidTh(s);
  const x = Math.round(s.x), y = Math.round(s.y), w = Math.round(s.w);
  if (s.k === 'f') {
    g.fillStyle = pats.panel; g.fillRect(x, y + 8, w, H - y);
    R(x, y, w, 2, '#a9bddb'); g.fillStyle = pats.hz; g.fillRect(x, y + 2, w, 6); R(x, y + 8, w, 2, '#141a2c');
    R(x, y, 3, H - y, '#141a2c'); R(x + w - 3, y, 3, H - y, '#141a2c');
  } else if (s.k === 'b') {
    R(x, y, w, s.h, '#141a2c'); R(x + 2, y + 2, w - 4, s.h - 2, '#3d4d6e'); R(x + 2, y + 2, w - 4, 2, '#8fa3c7');
    R(x + 6, y + 8, w - 12, s.h - 12, '#33415e'); g.strokeStyle = '#27324c'; g.lineWidth = 2; g.beginPath();
    g.moveTo(x + 7, y + 9); g.lineTo(x + w - 7, y + s.h - 5); g.moveTo(x + w - 7, y + 9); g.lineTo(x + 7, y + s.h - 5); g.stroke();
    [[5, 6], [w - 7, 6], [5, s.h - 5], [w - 7, s.h - 5]].forEach(p => R(x + p[0], y + p[1], 2, 2, '#a9bddb'));
  } else {
    R(x, y, w, 12, '#141a2c'); R(x + 1, y, w - 2, 2, '#a9bddb'); g.fillStyle = pats.hz; g.fillRect(x + 1, y + 2, w - 2, 5);
    R(x + 1, y + 7, w - 2, 4, '#3d4d6e'); for (let i = 6; i < w - 4; i += 12) R(x + i, y + 8, 2, 2, '#8fa3c7');
    R(x + 4, y + 12, 3, 5, '#141a2c'); R(x + w - 7, y + 12, 3, 5, '#141a2c');
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, '#141a2c'); R(x + w / 2 - 3, y + 13, 6, 2, (gameT * 6 | 0) % 2 ? '#39e0d0' : '#1a7f78'); }
  }
}
function drawSpikes(x, y, w) { for (let i = 0; i < w; i += 10) { g.fillStyle = '#141a2c'; g.beginPath(); g.moveTo(x + i - 1, y + 13); g.lineTo(x + i + 5, y - 2); g.lineTo(x + i + 11, y + 13); g.fill(); g.fillStyle = '#cfd8e6'; g.beginPath(); g.moveTo(x + i + 1, y + 12); g.lineTo(x + i + 5, y + 2); g.lineTo(x + i + 9, y + 12); g.fill(); R(x + i + 4, y + 4, 1, 6, '#fff'); } }
const zapOn = z => ((gameT + z.ph) % z.per) < 1.05;
const zapWarn = z => { const t = (gameT + z.ph) % z.per; return t > z.per - .45; };
function drawZap(z) {
  R(z.x - 9, z.y0 - 2, 18, 10, '#141a2c'); R(z.x - 7, z.y0, 14, 6, '#566a92'); R(z.x - 9, z.y1 - 8, 18, 8, '#141a2c'); R(z.x - 7, z.y1 - 6, 14, 5, '#566a92');
  if (zapOn(z)) {
    for (let y = z.y0 + 8; y < z.y1 - 8; y += 6) { const o = rint(-3, 3); R(z.x - 4 + o, y, 8, 6, 'rgba(60,220,255,.45)'); R(z.x - 1 + o, y, 3, 6, '#eaffff'); }
    R(z.x - 3, z.y0 + 4, 6, 4, '#eaffff'); R(z.x - 3, z.y1 - 10, 6, 4, '#eaffff');
  } else if (zapWarn(z) && (gameT * 20 | 0) % 2) R(z.x, z.y0 + 8, 1, z.y1 - z.y0 - 16, '#39e0d0');
  R(z.x - 2, z.y0 + 2, 4, 2, zapOn(z) || zapWarn(z) ? '#ff4d4d' : '#39e0d0');
}
function drawCase(c, dim) {
  const img = caseSpr[c.ci][c.open ? 1 : 0], s = c.scale || c.s || 1;
  const w = Math.round(32 * s), h = Math.round(36 * s), by = c.bump > 0 ? Math.round(Math.sin(c.bump / .2 * Math.PI) * -6) : 0;
  if (dim) g.globalAlpha = .5;
  g.drawImage(img, Math.round(c.x - w / 2), Math.round(c.y - h + by), w, h);
  if (dim) { g.globalAlpha = 1; }
}
function drawSign(s) {
  const h = s.lines.length * 15 + 12;
  R(s.x + s.w / 2 - 3, s.y + h, 6, L.fy - s.y - h, '#141a2c'); R(s.x + s.w / 2 - 1, s.y + h, 2, L.fy - s.y - h, '#566a92');
  R(s.x - 2, s.y - 2, s.w + 4, h + 4, '#141a2c'); R(s.x, s.y, s.w, h, '#10243a'); R(s.x, s.y, s.w, 2, '#39e0d0'); R(s.x, s.y + h - 2, s.w, 2, '#1a7f78');
  s.lines.forEach((ln, i) => T(ln, s.x - camR + s.w / 2, s.y + 14 + i * 15, { size: 8, color: i === 0 && s.lines.length > 2 && ln.endsWith(':') ? '#ffe36b' : '#bff7ee' }));
}
function drawCheck(c) {
  R(c.x - 2, L.fy - 58, 4, 58, '#141a2c'); R(c.x - 1, L.fy - 58, 2, 58, '#8fa3c7');
  R(c.x - 9, L.fy - 72, 18, 16, '#141a2c'); R(c.x - 7, L.fy - 70, 14, 12, c.on ? '#3ddc6a' : '#7a1c28'); R(c.x - 5, L.fy - 68, 4, 3, c.on ? '#c9ffd6' : '#c2444f');
}
function drawGate() {
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 12, FY - 150, 94, 150, '#141a2c'); R(x - 8, FY - 146, 86, 146, '#3d2a5c'); R(x - 8, FY - 146, 86, 3, '#8f6fc7');
  R(x, FY - 122, 70, 122, '#0b0712');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, '#5a4486'); R(x, FY - 122 + y, 70, 2, '#7d63b3'); }
  g.fillStyle = pats.hz; g.fillRect(x - 8, FY - 134, 86, 6);
  const on = (gameT * 4 | 0) % 2;
  R(x + 10, FY - 144, 12, 6, on ? '#ff4d4d' : '#6a1420'); R(x + 48, FY - 144, 12, 6, on ? '#6a1420' : '#ff4d4d');
  T('БОСС', x + 35 - camR, FY - 160, { size: 9, color: '#ff6b6b', stroke: '#16161d' });
}
function drawEye(x, y, r, look) {
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = '#16161d'; g.beginPath(); g.arc(x, y, r + 1, 0, 6.3); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
  const px = Math.round(Math.cos(look) * r * .4), py = Math.round(Math.sin(look) * r * .4), pr = Math.max(1, r * .5);
  g.fillStyle = '#16161d'; g.beginPath(); g.arc(x + px, y + py, pr, 0, 6.3); g.fill();
  if (r > 3) R(x + px - 1, y + py - 1, Math.max(1, r / 4), Math.max(1, r / 4), '#fff');
  R(x - r, y + r - 1, 2, 1, '#d81b2a');
}
function drawGib(q) {
  const x = Math.round(q.x), y = Math.round(q.y);
  if (q.k === 'e') { drawEye(x, y - q.r, q.r, q.rest ? Math.atan2((P.y - 50) - q.y, P.x - q.x) : gameT * 20); return; }
  g.save(); g.translate(x, y - 4); g.rotate(q.rot); g.scale(q.sc || 1, q.sc || 1);
  if (q.k === 'c') g.drawImage(q.cv, -q.cv.width / 2, -q.cv.height / 2);
  else if (q.k === 'ear') { g.fillStyle = '#16161d'; g.fillRect(-4, -9, 8, 18); g.fillStyle = '#fff'; g.fillRect(-3, -8, 6, 16); g.fillStyle = '#ff9ec4'; g.fillRect(-1, -6, 3, 11); g.fillStyle = '#d81b2a'; g.fillRect(-3, 6, 6, 3); }
  else if (q.k === 'm') { g.fillStyle = '#8e0f1c'; g.fillRect(-3, -3, 6, 6); g.fillStyle = q.c; g.fillRect(-2, -2, 4, 4); }
  else if (q.k === 'sock') { g.fillStyle = '#16161d'; g.fillRect(-3, -7, 7, 12); g.fillRect(-3, 1, 10, 6); g.fillStyle = q.c; g.fillRect(-2, -6, 5, 10); g.fillRect(-2, 2, 8, 4); g.fillStyle = '#fff'; g.fillRect(-2, -6, 5, 2); }
  g.restore();
}
function drawRabbit(r) {
  if (r.dead || !inView(r.x, 90)) return;
  let name = 'r_sit', ox = 0, oy = 0, flip = r.face < 0;
  if (r.ko > 0) {
    const k = 1 - r.ko / .13;
    spr('r_ko', r.x, r.y, r.koDir < 0, { sx: r.scale });
    // глаза вылезают
    const hx = r.x + r.koDir * 8 * r.scale, hy = r.y - 30 * r.scale, d = (6 + k * 16) * r.scale;
    for (const s of [-1, 1]) { const ex = hx + r.koDir * d * .7 + s * 3, ey = hy - d * .5 + s * 5 * r.scale; g.strokeStyle = '#d81b2a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx, hy); g.lineTo(ex, ey); g.stroke(); drawEye(ex, ey, Math.max(3, 4 * r.scale), gameT * 30); }
    return;
  }
  if (r.awe) { name = 'r_tremble'; ox = (gameT * 40 | 0) % 2 ? 1 : -1; }
  else if (r.state === 'flee') { name = 'r_run'; oy = -Math.abs(Math.sin(r.t * 15)) * 6; }
  else if (r.state === 'scared' || r.state === 'corner') { name = 'r_tremble'; ox = (gameT * 40 | 0) % 2 ? 1 : -1; }
  else if (r.state === 'offer') { name = 'r_give'; oy = -Math.abs(Math.sin(r.t * 5)) * 2; }
  else { const ph = r.t % 2.6; if (ph < .3) oy = -Math.sin(ph / .3 * Math.PI) * 5; }
  if (mode === 'ice' && ice) flip = ice.x < r.x;
  if (r.spr) { name = r.spr; if (r.hostile) { flip = r.face < 0; if (r.tele > 0) ox = (gameT * 40 | 0) % 2 ? 2 : -2; } }
  spr(name, r.x + ox, r.y + oy, flip, { sx: r.scale });
  if (r.sign) {
    const sx = r.x + (flip ? 12 : -12);
    R(sx - 1, r.y - 78, 2, 44, '#6e3d1c'); R(sx - 19, r.y - 96, 38, 20, '#16161d'); R(sx - 17, r.y - 94, 34, 16, '#fff');
    T(r.sign, sx - camR, r.y - 85, { size: 9, color: '#d81b2a' });
  }
}
function drawBubbles() {
  for (const r of L.rabbits) if (r.bub && !r.dead && inView(r.x, 20)) bubble(r.bub.s, r.x - camR, r.y - 52 * r.scale - 4, { size: 8, max: 17 });
  if (P.bub) bubble(P.bub.s, P.x - camR, P.y - 96, { size: 10, max: 14, bg: '#ffe9ec', color: '#a3111f' });
}
function drawIceCone(x, y) { spr('cone', x, y, false); }
