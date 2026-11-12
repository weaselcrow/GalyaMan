// ---------- СЮЖЕТ, ЧАСТЬ 2: второй герой, механики уровней, карта мира ----------
const HEROES = [
  { name: 'ГАЛЯ', sub: 'сковородка, 5 сердец', sp: 190, jmp: 530, h: 76, hp: 5, dcd: .8, reach: 78, top: 96, dj: false, lunge: 0 },
  { name: 'ДВОРНЯГА', sub: 'быстрая, двойной прыжок, лай', sp: 238, jmp: 500, h: 44, hp: 4, dcd: .5, reach: 66, top: 62, dj: true, lunge: 250, spName: 'ЛАЙ', sc: .8,
    fr: { idle: 'k_idle', run: ['k_run1', 'k_run2'], jump: 'k_jump', wind: 'k_bite', atk: 'k_bite', hurt: 'k_hurt', spec: 'k_howl' } },
  { name: 'МАМОЧКА', sub: 'шуба, сумочка, каблук вдаль', sp: 168, jmp: 520, h: 78, hp: 6, dcd: 1, reach: 96, top: 100, dj: false, lunge: 0, pow: 2, acd: .22, spName: 'КАБЛУК', sc: .55,
    fr: { idle: 'm_idle', run: ['m_run', 'm_idle'], jump: 'm_jump', wind: 'm_wind', atk: 'm_atk', hurt: 'm_hurt', spec: 'm_spec' } }
];
const heroOpen = i => i === 0 || (i === 1 && story && story.dog) || (i === 2 && story && story.mama);
function nextHero() { let n = story.ch; for (let k = 0; k < 3; k++) { n = (n + 1) % 3; if (heroOpen(n)) return n; } return story.ch; }
// смена героя на ходу (Q / E / Tab), как смена оружия
function swapHero(quiet) {
  if (!story) return false; const n = nextHero(); if (n === story.ch) { if (!quiet) sfx.buzz(); return false; }
  story.ch = n; if (scene === 'play' && L && L.story) { const hp = P.hp; applyHero(); P.hp = Math.min(hp, P.maxhp); P.swapCd = .45; burst(P.x, P.y - 34, 16, ['#fff', '#ffe36b', '#39e0d0'], 190, .4, 0); fxs.push({ k: 'star', x: P.x, y: P.y - 34, t: 0, max: .16 }); floater(HEROES[n].name, P.x, P.y - 104, { color: '#ffe36b', size: 11, t: .9 }); }
  if (n === 1) sfx.bark(); else if (n === 2) { tn('square', 880, 1320, .08, .1); tn('square', 1320, 1760, .1, .1, .08); } else sfx.laugh(3, 620, .1); return true;
}
const hero = () => (story && L && L.story ? story.ch : 0);
const HR = () => HEROES[hero()];
function applyHero() { const h = HR(); P.h = h.h; P.maxhp = h.hp; P.hp = h.hp; P.djUsed = false; P.boost = 0; P.barkCd = 0; }
function resetHero() { P.h = 76; P.maxhp = 5; }

// ---------- сохранение ----------
const SAVE_KEY = 'galyamen_story_v1';
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return { beaten: (s.beaten || [0, 0, 0]).slice(0, 3), dog: !!s.dog, mama: !!s.mama, best: s.best || 0 }; } catch (e) { return { beaten: [0, 0, 0], dog: false, mama: false, best: 0 }; } }
function saveStory() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ beaten: story.beaten, dog: story.dog, mama: story.mama, best: Math.max(story.best || 0, story.score) })); } catch (e) { } }

// ---------- дворняга ----------
function drawDog(name, oy, flip) { // общий рисовальщик для героев со своими кадрами
  const fr = HR().fr; let n = fr.idle, y = P.y + oy;
  if (mode === 'celebrate') n = (cele.t * 6 | 0) % 2 ? fr.spec : fr.idle;
  else if (name === 'g_hit') n = fr.hurt;
  else if (P.specT > 0) n = fr.spec;
  else if (name === 'g_wind') n = fr.wind;
  else if (name === 'g_smash') n = fr.atk;
  else if (P.dash > 0) n = fr.run[0];
  else if (!P.onGround) n = fr.jump;
  else if (Math.abs(P.vx) > 30) { const k = (P.runT * (hero() === 1 ? 11 : 7) | 0) % 2; n = fr.run[k]; y = P.y - (hero() === 2 && k ? 3 : 0); }
  else if (P.emoteT > 0) n = fr.spec;
  else if (P.idleT > 3.5) n = (gameT * 3 | 0) % 2 ? fr.spec : fr.idle;
  else y = P.y - ((gameT * 2.5 | 0) % 2);
  if (!has(n)) n = has(fr.idle) ? fr.idle : null;
  if (n) spr(n, P.x, y, flip); else { R(P.x - 16, P.y - P.h, 32, P.h, '#16161d'); R(P.x - 14, P.y - P.h + 2, 28, P.h - 4, '#c9a06a'); }
  if (P.bigHat && has('hat')) spr('hat', P.x + (flip ? -8 : 8), P.y - P.h + 18, flip, { sx: 1.2 });
}
// Мамочка: каблук летит по прямой, бьёт кроликов и босса, сбивает снаряды
let pshots = [];
function throwShoe() { P.barkCd = 1.1; P.specT = .28; pshots.push({ x: P.x + P.face * 22, y: P.y - 52, vx: P.face * 430, rot: 0, life: 1.5, d: P.face }); sfx.swing(); tn('square', 900, 1400, .06, .08); }
function updatePshots(dt) {
  P.specT = Math.max(0, (P.specT || 0) - dt);
  for (let i = pshots.length - 1; i >= 0; i--) {
    const s = pshots[i]; s.life -= dt; s.x += s.vx * dt; s.rot += dt * 16 * s.d; let dead = s.life <= 0 || s.x < cam - 40 || s.x > cam + W + 40;
    const q = solidAt(s.x, s.y); if (q && q.k !== 'p') dead = true;
    if (!dead) for (const r of L.rabbits) { if (r.dead || r.ko > 0) continue; const hw = 14 * r.scale; if (Math.abs(r.x - s.x) < hw + 8 && s.y < r.y && s.y > r.y - 40 * r.scale) { hitRabbit(r, s.d); dead = true; break; } }
    if (!dead) { const n0 = shots.length, old = P.atkSet, b = sb, hp0 = b ? b.hp : 0; P.atkSet = new Set(); storyAttack(s.x - 10, s.x + 10, s.y - 10, s.y + 10); P.atkSet = old; if (shots.length < n0 || (b && (b.hp < hp0 || (b.armored && Math.abs(b.x - s.x) < b.hw + 10 && s.y > b.y - b.h)))) dead = true; }
    if (dead) { burst(s.x, s.y, 5, ['#d81b2a', '#fff'], 110, .3); pshots.splice(i, 1); }
  }
}
function dogBark() {
  P.barkCd = 3.5; doBark(); shake = Math.max(shake, 5); fxs.push({ k: 'star', x: P.x + P.face * 20, y: P.y - 30, t: 0, max: .18 });
  for (const r of L.rabbits) if (!r.dead && r.hostile && Math.abs(r.x - P.x) < 250 && Math.abs(r.y - P.y) < 140) { r.stun = 1.5; r.lunge = 0; r.tele = 0; say(r, pick(['собака!!!', 'мамочки', 'ой-ой']), 1.2); }
  for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; if (s.k !== 'crown' && s.k !== 'beam' && s.k !== 'wave' && Math.hypot(s.x - P.x, s.y - (P.y - 30)) < 170) { burst(s.x, s.y, 5, ['#fff', '#ffe36b'], 120, .3); shots.splice(i, 1); addScore(100); } }
  floater('ГАВ!', P.x, P.y - 70, { color: '#ffe36b', size: 16, t: .6, vy: -50 });
}

// ---------- механики уровней ----------
function storyExtras(l, i) {
  l.springs = []; l.crumbles = []; l.rollers = []; l.tiles = []; l.icicles = []; l.winds = []; l.lifts = [];
  const spring = (x, y) => l.springs.push({ x, y: y || FY, t: 0 });
  const crumble = (x, y, w) => { const s = { x, y, w, h: 12, k: 'p', cr: { st: 0, t: 0, y0: y } }; l.solids.push(s); l.crumbles.push(s); };
  const roller = (x0, x1, per) => l.rollers.push({ x0, x1, per, t: per * .4 });
  const tile = (x, w, ph) => l.tiles.push({ x, w, ph: ph || 0 });
  const ici = (x, y) => l.icicles.push({ x, y: y || 84, st: 0, t: 0 });
  const wind = (x0, x1) => l.winds.push({ x0, x1 });
  const lift = (x, y0, y1, w, sp) => { const s = { x, y: y0, w, h: 12, k: 'p', lf: { y0: Math.min(y0, y1), y1: Math.max(y0, y1), sp, d: -1 } }; l.solids.push(s); l.lifts.push(s); };
  if (i === 0) { // деревня: батут из сена, тюки катятся под горку, гнилые мостки
    spring(1975); roller(2480, 3230, 3.6); roller(4250, 5000, 4);
    crumble(1118, 344, 64); crumble(3508, 300, 46); crumble(3580, 290, 46);
    l.signs.push({ x: 2480, y: 250, w: 190, lines: ['ОСТОРОЖНО:', 'СЕНО КАТИТСЯ', '(бей сковородой)'] });
  } else if (i === 1) { // Заноза: плитки танцпола бьют током в такт, колонки-батуты, лифт
    tile(1140, 230, 0); tile(2380, 190, 1.2); tile(3690, 170, .6); tile(4520, 200, 1.8);
    spring(1500); spring(2610); spring(5000);
    lift(3360, 362, 250, 60, 70); crumble(4332, 344, 56); roller(4460, 5080, 4.2);
    l.signs.push({ x: 1130, y: 250, w: 200, lines: ['ТАНЦПОЛ:', 'КРАСНОЕ = БОЛЬНО', '(слушай бит)'] });
  } else if (i === 2) { // NASRAL: сосульки, метель сдувает назад, лёд крошится, снежные комья
    [700, 1300, 1560, 1760, 1900, 2450, 3500, 3640, 3760, 4700, 4800].forEach(x => ici(x));
    wind(1640, 2060); wind(3460, 3850);
    crumble(1028, 344, 62); lift(2150, 362, 262, 60, 72); crumble(3236 + 60, 320, 40); crumble(4440, 320, 50); roller(4560, 5300, 3.6);
    spring(2660);
    l.signs.push({ x: 1620, y: 250, w: 170, lines: ['МЕТЕЛЬ!', 'СДУВАЕТ НАЗАД'] });
  }
}
function updateExtras(dt) {
  const live = mode === 'play';
  P.boost = Math.max(0, (P.boost || 0) - dt); P.barkCd = Math.max(0, (P.barkCd || 0) - dt);
  P.atkCd = Math.max(0, (P.atkCd || 0) - dt); P.swapCd = Math.max(0, (P.swapCd || 0) - dt);
  if (live && hit('D') && P.barkCd <= 0 && P.hurtT <= 0) { if (hero() === 1) dogBark(); else if (hero() === 2) throwShoe(); }
  if (live && hit('SW') && P.swapCd <= 0 && P.hurtT <= 0 && !(P.dash > 0)) swapHero();
  updatePshots(dt);
  for (const s of L.springs) { s.t = Math.max(0, s.t - dt); if (live && P.vy >= 0 && Math.abs(P.x - s.x) < 20 && P.y >= s.y - 8 && P.y <= s.y + 6) { P.vy = -810; P.onGround = false; P.airDash = true; P.djUsed = false; P.boost = .7; P.jbuf = 0; s.t = .25; tn('square', 220, 880, .16, .12); burst(s.x, s.y, 8, ['#fff', '#ffe36b'], 150, .35); } }
  for (const s of L.crumbles) { const c = s.cr; if (c.st === 0) { if (P.ground === s && P.onGround) { c.st = 1; c.t = .5; sfx.click(); } } else if (c.st === 1) { c.t -= dt; if (c.t <= 0) { c.st = 2; c.t = 2.8; burst(s.x + s.w / 2, s.y + 6, 12, [L.th.box, L.th.boxLo, L.th.hi], 140, .5); s.y = 9999; sfx.thud(); } } else { c.t -= dt; if (c.t <= 0) { c.st = 0; s.y = c.y0; } } }
  for (const s of L.lifts) { const f = s.lf, dy = f.sp * f.d * dt; s.y += dy; if (s.y < f.y0) { s.y = f.y0; f.d = 1; } if (s.y > f.y1) { s.y = f.y1; f.d = -1; } if (P.ground === s && P.onGround) P.y = s.y; }
  for (const r of L.rollers) { r.t -= dt; if (r.t <= 0 && P.x > r.x0 - 260 && P.x < r.x1 + 420) { r.t = r.per; shoot({ k: 'roll', x: r.x1, y: FY - 18, vx: -178, r: 16, life: (r.x1 - r.x0) / 178, rot: .01 }); } }
  for (const t of L.tiles) { const ph = (gameT + t.ph) % 2.6, hot = ph > 2; if (hot && !t.was && inView(t.x + t.w / 2, 100)) sfx.zap(); t.was = hot; if (live && hot && P.onGround && Math.abs(P.y - FY) < 3 && P.x > t.x && P.x < t.x + t.w) hurtPlayer(P.face > 0 ? -1 : 1); }
  for (const c of L.icicles) { if (c.st === 0) { if (live && Math.abs(P.x - c.x) < 64 && P.y > c.y + 30) { c.st = 1; c.t = .45; sfx.tear(); } } else if (c.st === 1) { c.t -= dt; if (c.t <= 0) { c.st = 2; c.t = 3.6; shoot({ k: 'ici', x: c.x, y: c.y + 14, vy: 80, g: 950, r: 6, life: 3 }); } } else { c.t -= dt; if (c.t <= 0) c.st = 0; } }
  const gust = (gameT % 3.4) < 1.7;
  for (const w of L.winds) { if (!gust) continue; if (live && P.x > w.x0 && P.x < w.x1 && !(P.dash > 0)) P.vx -= (P.onGround ? 520 : 760) * dt; if (inView((w.x0 + w.x1) / 2, 500) && Math.random() < .6) parts.push({ k: 'p', x: rnd(w.x0, w.x1 + 80), y: rnd(120, FY - 6), vx: -rnd(380, 560), vy: rnd(-10, 20), s: rint(1, 2), c: '#fff', life: .5, g: 0 }); }
}
function drawExtras() {
  const t = gameT, th = L.th;
  for (const s of L.springs) { if (!inView(s.x)) continue; const c = s.t > 0 ? 9 : 0; R(s.x - 16, s.y - 4, 32, 4, '#16161d'); for (let k = 0; k < 3; k++) R(s.x - 9 + k * 2 * (k % 2 ? 1 : -1) - 3, s.y - 8 - k * 4 - c * k / 3, 18, 3, k % 2 ? '#8fa3c7' : '#cfd8e6'); R(s.x - 17, s.y - 20 - c, 34, 7, '#16161d'); R(s.x - 15, s.y - 19 - c, 30, 5, L.si === 0 ? '#f3c93a' : L.si === 1 ? '#ff4fd8' : '#ff5b6b'); R(s.x - 15, s.y - 19 - c, 30, 1, '#fff'); }
  for (const s of L.crumbles) { const c = s.cr; if (c.st === 2) { if (inView(s.x) && (t * 6 | 0) % 2) { g.globalAlpha = .25; R(s.x, c.y0, s.w, 4, th.hi); g.globalAlpha = 1; } continue; } if (!inView(s.x)) continue; const ox = c.st === 1 ? ((t * 40 | 0) % 2 ? 1 : -1) : 0; for (let k = 8; k < s.w - 4; k += 12) { R(s.x + k + ox, s.y + 2, 1, 8, th.dark); R(s.x + k + 1 + ox, s.y + 6, 3, 1, th.dark); } }
  for (const s of L.lifts) { if (!inView(s.x)) continue; R(s.x + s.w / 2 - 1, s.lf.y0 - 20, 2, s.y - s.lf.y0 + 20, '#16161d'); R(s.x + s.w / 2 - 4, s.y + 12, 8, 4, '#16161d'); R(s.x + s.w / 2 - 2, s.y + 13, 4, 2, (t * 6 | 0) % 2 ? '#3ddc6a' : '#1f6f38'); }
  for (const q of L.tiles) { if (q.x + q.w < camR || q.x > camR + W) continue; const ph = (t + q.ph) % 2.6, hot = ph > 2, warn = ph > 1.5 && !hot; for (let x = q.x, k = 0; x < q.x + q.w; x += 20, k++) { const w = Math.min(19, q.x + q.w - x); R(x, FY, w, 8, hot ? (k % 2 ? '#ff3b4b' : '#ffe36b') : warn ? ((t * 14 | 0) % 2 ? '#ff8a94' : '#5a2a4a') : (k + (t * 2 | 0)) % 2 ? '#3a2a6a' : '#55e6ff'); R(x, FY, w, 1, '#fff'); if (hot) { R(x + 6 + rint(-3, 3), FY - rint(4, 22), 2, 8, '#fff'); } } }
  for (const c of L.icicles) { if (c.st === 2 || !inView(c.x)) continue; const ox = c.st === 1 ? ((t * 40 | 0) % 2 ? 1 : -1) : 0, x = c.x + ox; g.fillStyle = '#16161d'; g.beginPath(); g.moveTo(x - 7, c.y - 1); g.lineTo(x + 7, c.y - 1); g.lineTo(x, c.y + 24); g.fill(); g.fillStyle = '#bfe9ff'; g.beginPath(); g.moveTo(x - 5, c.y); g.lineTo(x + 5, c.y); g.lineTo(x, c.y + 20); g.fill(); R(x - 3, c.y + 1, 2, 9, '#fff'); }
  if ((t % 3.4) < 1.7) for (const w of L.winds) { if (w.x1 < camR || w.x0 > camR + W) continue; T('≪≪≪', (w.x0 + w.x1) / 2 - camR, 110, { size: 14, color: '#fff', a: .5 + .3 * Math.sin(t * 20) }); }
  for (const s of pshots) { g.save(); g.translate(Math.round(s.x), Math.round(s.y)); g.rotate(s.rot); R(-9, -5, 18, 9, '#16161d'); R(-8, -4, 13, 6, '#d81b2a'); R(-8, -4, 13, 2, '#ff6b7a'); R(4, -4, 4, 3, '#d81b2a'); R(5, -1, 2, 8, '#16161d'); R(-8, 2, 6, 2, '#16161d'); g.restore(); }
  for (const s of shots) { if (s.k === 'roll') { const x = Math.round(s.x), y = Math.round(s.y), c = L.si === 2 ? ['#eef6ff', '#bcd4ea'] : L.si === 1 ? ['#8a5a3a', '#5a3422'] : ['#e9c04a', '#b88a22']; g.save(); g.translate(x, y); g.rotate(s.rot); g.fillStyle = '#16161d'; g.beginPath(); g.arc(0, 0, 19, 0, 6.3); g.fill(); g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 17, 0, 6.3); g.fill(); g.fillStyle = c[1]; g.fillRect(-15, -2, 30, 4); g.fillRect(-2, -15, 4, 30); g.fillRect(-9, -11, 5, 3); g.fillRect(6, 7, 5, 3); g.restore(); }
    else if (s.k === 'ici') { const x = Math.round(s.x), y = Math.round(s.y); g.fillStyle = '#16161d'; g.beginPath(); g.moveTo(x - 7, y - 14); g.lineTo(x + 7, y - 14); g.lineTo(x, y + 10); g.fill(); g.fillStyle = '#bfe9ff'; g.beginPath(); g.moveTo(x - 5, y - 13); g.lineTo(x + 5, y - 13); g.lineTo(x, y + 7); g.fill(); } }
}

// ---------- карта мира ----------
let mapImg = null, mapT = 0, mapFrom = 0;
const NODES = [[200, 352], [415, 246], [690, 106]];
SONGS.map = { bpm: 112, loop: true, tr: [
  { w: 'square', v: .06, s: seq('C5:2 E5:2 G5:2 E5:2 A5:4 G5:4 F5:2 A5:2 C6:2 A5:2 G5:8 E5:2 G5:2 C6:2 G5:2 B5:4 A5:4 F5:2 E5:2 D5:2 B4:2 C5:8') },
  { w: 'triangle', v: .18, s: bassLine(['C2', 'A1', 'F2', 'G2', 'C2', 'E2', 'F2', 'G2']) }], dr: 'k...s...k.k.s...' };
function nodeOpen(i) { return i === 0 || story.beaten[i - 1]; }
function gotoMap(pos) { scene = 'smap'; sceneT = 0; mapT = 1; if (pos !== undefined) story.pos = clamp(pos, 0, 2); mapFrom = story.pos; playSong('map'); }
function storyWin() {
  const i = story.i, first = !story.beaten[i]; story.beaten[i] = 1;
  if (i === 0 && !story.dog) { story.dog = true; story.unlock = 6; story.who = 1; }
  if (i === 1 && !story.mama) { story.mama = true; story.unlock = 6; story.who = 2; }
  saveStory();
  if (i === 2 && first) fadeTo(startEnding); else fadeTo(() => gotoMap(first ? i + 1 : i));
}
function drawMapHero(x, y, moving) {
  const bob = moving ? -Math.abs(Math.sin(sceneT * 14)) * 4 : -((sceneT * 2 | 0) % 2);
  g.globalAlpha = .35; R(x - 12, y - 2, 24, 5, '#000'); g.globalAlpha = 1;
  const fr = HEROES[story.ch].fr;
  if (fr && has(fr.idle)) spr(moving ? fr.run[(sceneT * 10 | 0) % 2] : fr.idle, x, y + bob, mapFrom > story.pos, { sx: HEROES[story.ch].sc });
  else spr(moving ? 'g_run' : 'g_idle', x, y + bob, mapFrom > story.pos, { sx: .55 });
}
function drawMap() {
  const t = sceneT;
  if (mapImg) g.drawImage(mapImg, 0, 0); else { R(0, 0, W, H, '#1d4a2a'); }
  R(0, 0, W, 40, 'rgba(10,8,24,.78)'); R(0, H - 64, W, 64, 'rgba(10,8,24,.82)'); R(0, 40, W, 2, '#ffe36b'); R(0, H - 66, W, 2, '#ffe36b');
  T('КАРТА ПОХОДА', 18, 21, { size: 14, color: '#ffe36b', align: 'left', stroke: '#16161d', sw: 4 });
  T('ОЧКИ ' + fmt(story.score) + '   РЕКОРД ' + fmt(Math.max(story.best || 0, story.score)), W - 16, 21, { size: 8, color: '#fff', align: 'right' });
  // дорога пунктиром
  for (let i = 0; i < 2; i++) { const a = NODES[i], b = NODES[i + 1], open = nodeOpen(i + 1); for (let k = 1; k < 12; k++) { const x = a[0] + (b[0] - a[0]) * k / 12, y = a[1] + (b[1] - a[1]) * k / 12 + Math.sin(k / 12 * Math.PI) * 14; R(x - 3, y - 3, 6, 6, '#16161d'); R(x - 2, y - 2, 4, 4, open ? ((t * 4 | 0) + k) % 3 ? '#ffe36b' : '#fff' : '#5a5a6a'); } }
  NODES.forEach((n, i) => {
    const open = nodeOpen(i), done = story.beaten[i], sel = i === story.pos, S = STAGES[i], x = n[0], y = n[1];
    R(x - 13, y - 9, 26, 18, '#16161d'); R(x - 11, y - 7, 22, 14, done ? '#3ddc6a' : open ? (sel && (t * 5 | 0) % 2 ? '#fff' : '#ff5b6b') : '#3a3a4a'); R(x - 11, y - 7, 22, 3, 'rgba(255,255,255,.5)');
    const bn = 'sb' + i + '_' + (done ? '4' : '1');
    if (open && has(bn)) { g.globalAlpha = done ? .75 : 1; spr(bn, x + 40, y - 6 - (done ? 0 : Math.abs(Math.sin(t * 3 + i)) * 3), true, { sx: .42 }); g.globalAlpha = 1; }
    const lw = S.name.length * 8 + 14, lx = clamp(x - lw / 2, 6, W - lw - 6);
    OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(lx - 2, y + 14, lw + 4, 18); c.fillStyle = sel ? '#ffe36b' : open ? '#10243a' : '#22222c'; c.fillRect(lx, y + 16, lw, 14); });
    T(open ? S.name : '? ? ?', lx + lw / 2, y + 23.5, { size: 8, color: sel ? '#16161d' : open ? '#bff7ee' : '#6a6a7a' });
    if (done) T('✔', x, y + 1, { size: 10, color: '#0b2a14' }); else if (!open) T('×', x, y + 1, { size: 10, color: '#8a8a9a' }); else T(String(i + 1), x, y + 1, { size: 9, color: '#16161d' });
  });
  const a = NODES[mapFrom], b = NODES[story.pos], k = 1 - Math.pow(1 - clamp(mapT, 0, 1), 2), hx = a[0] + (b[0] - a[0]) * k, hy = a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 14 * (a === b ? 0 : 1);
  drawMapHero(hx, hy - 10, mapT < 1);
  // панель героя и этапа
  const h = HEROES[story.ch], S = STAGES[story.pos];
  R(12, H - 58, 50, 50, '#16161d'); R(14, H - 56, 46, 46, story.ch ? '#3a2a14' : '#5a1420');
  if (h.fr && has(h.fr.idle)) { g.save(); g.beginPath(); g.rect(14, H - 56, 46, 46); g.clip(); spr(h.fr.idle, 37, story.ch === 2 ? H + 22 : H - 14, false, { sx: story.ch === 2 ? .9 : .8 }); g.restore(); } else { const fg = F.g_idle; g.drawImage(atlas, fg[0] + 6, fg[1], 42, 42, 16, H - 54, 42, 42); }
  T(h.name, 72, H - 46, { size: 11, color: '#ffe36b', align: 'left', stroke: '#16161d' }); T(h.sub, 72, H - 30, { size: 7, color: '#bff7ee', align: 'left' });
  T(story.dog ? (TOUCH ? 'тапни по портрету — сменить' : '↓ / Q — сменить героя') : 'второй герой: пройди Деревню', 72, H - 16, { size: 7, color: story.dog ? '#fff' : '#8f9ad0', align: 'left' });
  T(S.name, W - 16, H - 46, { size: 12, color: '#fff', align: 'right', stroke: '#16161d' }); T('босс: ' + S.boss, W - 16, H - 30, { size: 8, color: '#ffd0e8', align: 'right' });
  if ((t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ ПО ЭТАПУ' : '← →  ЭТАП     ENTER  В БОЙ', W - 16, H - 14, { size: 8, color: '#ffe36b', align: 'right' });
  if (story.unlock > 0) { const p = Math.min(1, (6 - story.unlock) * 4); OV.push(c => { c.fillStyle = 'rgba(10,8,24,.86)'; c.fillRect(W / 2 - 230, 150, 460, 130); c.fillStyle = '#ffe36b'; c.fillRect(W / 2 - 230, 150, 460, 3); c.fillRect(W / 2 - 230, 277, 460, 3); }); const wh = story.who || 1, hf = HEROES[wh].fr; if (has(hf.spec)) spr((t * 4 | 0) % 2 ? hf.spec : hf.idle, W / 2 - 150, 268, false, { sx: wh === 1 ? 1.5 : 1.1 }); T('НОВЫЙ ГЕРОЙ!', W / 2 + 50, 182, { size: 20 * p, color: '#ffe36b', stroke: '#16161d', sw: 6 }); T(HEROES[wh].name, W / 2 + 50, 214, { size: 16, color: '#fff', stroke: '#16161d', sw: 5 }); T(wh === 1 ? 'сидела в сарае у деда.' : 'хозяйка Занозы и девочек.', W / 2 + 50, 240, { size: 8, color: '#bff7ee' }); T(wh === 1 ? 'теперь она с Галей' : 'Апельсин ей задолжал', W / 2 + 50, 256, { size: 8, color: '#bff7ee' }); }
}
function stepMap(dt, go) {
  if (story.unlock > 0) { story.unlock -= dt; if (story.unlock < 5 && go) story.unlock = 0; if (story.unlock > 5.9 && story.unlock + dt >= 5.9) { sfx.heal(); sfx.bark(); } return; }
  if (mapT < 1) mapT += dt * 2.2;
  const move = d => { const n = story.pos + d; if (n < 0 || n > 2) return; if (!nodeOpen(n)) { sfx.buzz(); return; } mapFrom = story.pos; story.pos = n; mapT = 0; sfx.select(); };
  const swap = () => swapHero();
  if (hit('L')) move(-1); if (hit('R')) move(1); if (hit('D') || hit('SW')) swap();
  let ok = sceneT > .3 && (hit('S') || hit('A') || hit('J')) && mapT >= 1;
  if (hit('T') && sceneT > .3) { if (tapY > H - 64 && tapX < 300) swap(); else NODES.forEach((n, i) => { if (Math.abs(tapX - n[0]) < 60 && Math.abs(tapY - n[1]) < 50) { if (i === story.pos) ok = mapT >= 1; else if (nodeOpen(i)) { mapFrom = story.pos; story.pos = i; mapT = 0; sfx.select(); } else sfx.buzz(); } }); }
  if (ok && !fadeDir) { sfx.ok(); story.i = story.pos; fadeTo(() => { scene = 'sintro'; sceneT = 0; stopSong(); }); }
}

// ---------- меню паузы: статистика, управление, герои, враги ----------
let pmI = 0;
function pauseItems() { return ['ПРОДОЛЖИТЬ', 'СТАТИСТИКА', 'УПРАВЛЕНИЕ', story && story.dog ? 'ГЕРОЙ: ' + HEROES[story.ch].name : 'ГЕРОИ', 'ВРАГИ', 'ЗВУК: ' + (muted ? 'ВЫКЛ' : 'ВКЛ'), story && scene === 'play' ? 'НА КАРТУ' : 'В ГЛАВНОЕ МЕНЮ']; }
function pauseOpen() { paused = true; pmI = 0; sfx.select(); }
function pauseStep() {
  const items = pauseItems(), n = items.length;
  if (hit('J')) { pmI = (pmI + n - 1) % n; sfx.select(); } if (hit('D')) { pmI = (pmI + 1) % n; sfx.select(); }
  let ok = hit('S') || hit('A');
  if (hit('T')) { for (let i = 0; i < n; i++) if (tapX > 40 && tapX < 300 && Math.abs(tapY - (128 + i * 34)) < 16) { if (pmI === i) ok = true; pmI = i; sfx.select(); } }
  if (!ok) return;
  if (pmI === 0) { paused = false; sfx.ok(); }
  else if (pmI === 3) { // сменить героя прямо из паузы
    swapHero();
  }
  else if (pmI === 5) toggleMute();
  else if (pmI === 6) {
    paused = false; sfx.ok();
    if (story && scene === 'play') { saveStory(); fadeTo(() => { stopSong(); gotoMap(story.i); }); }
    else fadeTo(() => { if (story) saveStory(); credits = null; story = null; resetHero(); stopSong(); scene = 'title'; sceneT = 0; newGame(); });
  } else sfx.blip();
}
function pauseRows() {
  const st = stats || {}, mm = ((st.time || 0) / 60 | 0) + ':' + String((st.time || 0) % 60 | 0).padStart(2, '0'), inStory = !!story;
  switch (pmI) {
    case 0: return { title: inStory ? (scene === 'smap' ? 'КАРТА ПОХОДА' : STAGES[story.i].name) : 'КЛАССИКА: СЕЗОН ШАПОК', rows: [['ГЕРОЙ', inStory ? HEROES[story.ch].name : 'ГАЛЯ'], ['СЕРДЦА', P.hp + ' / ' + P.maxhp]].concat(inStory ? [['ОЧКИ', fmt(story.score)], ['ЭТАПОВ ПРОЙДЕНО', story.beaten.filter(Boolean).length + ' / 3']] : [['ШАПОК', st.hats || 0]]), note: 'игра на паузе' };
    case 1: return { title: 'СТАТИСТИКА', rows: (inStory ? [['ОЧКИ', fmt(story.score)], ['РЕКОРД', fmt(Math.max(story.best || 0, story.score))], ['ЭТАПЫ', story.beaten.filter(Boolean).length + ' / 3'], ['ТИХОН НАЙДЕН', story.tikGot + ' раз (+' + fmt(story.tikGot * 3000) + ')']] : []).concat([['ШАПОК', st.hats || 0], ['КРОЛИКОВ', st.kills || 0], ['ЛУЧШЕЕ КОМБО', 'x' + (st.best || 0)], ['ЧЕМОДАНОВ', (st.cases || 0) + ' / ' + (st.casesTotal || 0)], ['ПРОПУЩЕНО УДАРОВ', st.hits || 0], ['ГАЛЯ ПАЛА', (st.deaths || 0) + ' раз'], ['ВРЕМЯ', mm], ['РАНГ', stats ? rankOf() : '—']]) };
    case 2: return { title: 'УПРАВЛЕНИЕ', rows: TOUCH ? [['◀ ▶', 'бег'], ['ПРЫГ', 'прыжок'], ['БИТЬ', 'удар'], ['РЫВОК', 'неуязвимость'], ['ГЕРОЙ', 'сменить героя'], ['ЗВУК', 'вкл / выкл']] : [['← →  /  A D', 'бег'], ['ПРОБЕЛ / Z / ↑', 'прыжок'], ['X / J', 'удар'], ['C / SHIFT / L', 'рывок'], ['↓ / S', 'лай / каблук'], ['Q / E / TAB', 'сменить героя'], ['P / ESC', 'это меню'], ['M', 'звук']], note: 'держи прыжок дольше — прыгнешь выше' };
    case 3: return { title: 'ГЕРОИ', rows: [['ГАЛЯ', '5 сердец. сковородка, рывок 0,8 с']].concat(inStory && story.dog ? [['ДВОРНЯГА', '4 сердца. быстрая, двойной прыжок'], ['', '↓ лай: оглушает, сбивает снаряды']] : [['? ? ?', 'пройди Деревню']], inStory && story.mama ? [['МАМОЧКА', '6 сердец. медленная, бьёт сильно'], ['', 'сумочка: 2 урона, далеко достаёт'], ['', '↓ каблук: летит через весь экран']] : [['? ? ?', 'пройди Занозу']]), note: !inStory ? 'другие герои есть только в сюжете' : story.dog ? 'ENTER или Q в игре — сменить (сейчас: ' + HEROES[story.ch].name + ')' : 'герои открываются за боссов' };
    case 4: return { title: 'ВРАГИ', rows: [['КУСАКА', '1 удар. прыгает на тебя'], ['МЕТАТЕЛЬ', '1 удар. морковку можно отбить'], ['ВЫШИБАЛА', '3 удара. медленный'], ['САНТА', '1 удар. снежки летят прямо'], ['ВЕДЬМАК', '2 удара. дрожит — будет выпад'], ['БОСС', 'выдохся — урон x2'], ['ТИХОН', 'не враг. +3 000 очков']], note: 'рывок проходит сквозь всё' };
    case 5: return { title: 'ЗВУК', rows: [['СЕЙЧАС', muted ? 'выключен' : 'включён']], note: 'ENTER — переключить' };
    default: return { title: story && scene === 'play' ? 'ВЫЙТИ НА КАРТУ' : 'ВЫЙТИ В МЕНЮ', rows: story && scene === 'play' ? [['ЭТАП', 'начнётся заново'], ['ОЧКИ', 'сохранятся']] : [['ПРОГРЕСС СЮЖЕТА', 'сохранён']], note: 'ENTER — выйти' };
  }
}
function drawPause() {
  const items = pauseItems(), d = pauseRows(), t = gameT;
  OV.push(c => {
    c.fillStyle = 'rgba(6,6,20,.8)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#16161d'; c.fillRect(28, 96, 284, 262); c.fillStyle = '#10243a'; c.fillRect(32, 100, 276, 254); c.fillStyle = '#39e0d0'; c.fillRect(32, 100, 276, 3);
    c.fillStyle = '#16161d'; c.fillRect(324, 96, 448, 300); c.fillStyle = '#1b1430'; c.fillRect(328, 100, 440, 292); c.fillStyle = '#ffe36b'; c.fillRect(328, 100, 440, 3);
    c.fillStyle = '#ffe36b'; c.fillRect(40, 114 + pmI * 34, 260, 28);
  });
  T('ПАУЗА', W / 2, 52, { size: 26, color: '#ffe36b', stroke: '#16161d', sw: 7 });
  items.forEach((s, i) => T((i === pmI && (performance.now() / 300 | 0) % 2 ? '▶ ' : '  ') + s, 52, 129 + i * 34, { size: 10, align: 'left', color: i === pmI ? '#16161d' : '#bff7ee' }));
  T(d.title, 548, 124, { size: 13, color: '#ffe36b', stroke: '#16161d', sw: 4 });
  const step = d.rows.length > 9 ? 19 : 22;
  // колонка подписей по самой длинной подписи, чтобы значения не вылезали за рамку
  const lab = Math.max.apply(null, d.rows.map(r => String(r[0]).length)), split = 344 + lab * 8, room = Math.floor((760 - split - 12) / 8);
  d.rows.forEach((r, i) => { const y = 156 + i * step; T(String(r[0]), split, y, { size: 8, align: 'right', color: '#8fdcff' }); T(String(r[1]).slice(0, room), split + 12, y, { size: 8, align: 'left', color: '#fff' }); });
  if (d.note) T(d.note, 548, 378, { size: 7, color: '#8f9ad0' });
  T(TOUCH ? 'тап — выбрать' : '↑ ↓  выбор    ENTER  ок    P  назад', W / 2, H - 24, { size: 8, color: '#8f9ad0' });
}

if (document.getElementById('bp')) document.getElementById('bp').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); press('P'); release('P'); });
if (document.getElementById('bh')) document.getElementById('bh').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); press('SW'); release('SW'); });
