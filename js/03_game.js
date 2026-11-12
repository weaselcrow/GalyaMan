// ---------- player ----------
function hurtPlayer(dir, pit) {
  if (mode !== 'play' || (P.inv > 0 && !pit)) return;
  P.hp--; stats.hits++; chain = 0; sfx.hurt(); shake = Math.max(shake, 7); flash = Math.max(flash, .25);
  if (P.hp <= 0) { mode = 'dead'; modeT = 0; P.vy = -420; P.vx = dir * 90; stats.deaths++; stopSong(); P.bub = null; return; }
  P.inv = 1.5; P.atk = 0;
  if (pit) { P.x = P.safeX; P.y = P.safeY; P.vx = P.vy = 0; say(P, pick(['ЯМА?!', 'КТО ТАК СТРОИТ', 'Р-Р-Р…']), 1.2); }
  else { P.hurtT = .34; P.vx = dir * 175; P.vy = -280; P.onGround = false; say(P, pick(['АЙ!', 'ЭЙ!', 'ОЙ!', 'МОКРО!']), .7); }
}
function attackHits() {
  const x0 = P.face > 0 ? P.x - 10 : P.x - 68, x1 = x0 + 78, y0 = P.y - 96, y1 = P.y + 8;
  for (const r of L.rabbits) {
    if (r.dead || r.ko > 0 || P.atkSet.has(r)) continue;
    const hw = 14 * r.scale;
    if (r.x + hw > x0 && r.x - hw < x1 && r.y > y0 && r.y - 36 * r.scale < y1) { P.atkSet.add(r); hitRabbit(r, P.face); }
  }
  for (const c of L.cases) {
    if (c.open || c.fall || P.atkSet.has(c)) continue;
    if (c.x + 14 > x0 && c.x - 14 < x1 && c.y > y0 && c.y - 30 < y1) { P.atkSet.add(c); openCase(c, P.face); sfx.bonk(); }
  }
  if (boss && L.boss && !boss.dead && !P.atkSet.has(boss) && boss.x + 54 > x0 && boss.x - 54 < x1 && boss.y > y0 && boss.y - 120 < y1) { if (hitBoss()) P.atkSet.add(boss); }
}
function updatePlayer(dt, ctrl) {
  if (P.bub) { P.bub.t -= dt; if (P.bub.t <= 0) P.bub = null; }
  P.inv = Math.max(0, P.inv - dt); P.emoteT = Math.max(0, P.emoteT - dt);
  if (P.hurtT > 0) { P.hurtT -= dt; ctrl = false; }
  P.crouch = ctrl && down('D') && P.onGround && P.atk <= 0; P.h = P.crouch ? 48 : 76;
  let ax = 0; if (ctrl) { if (down('L')) ax -= 1; if (down('R')) ax += 1; }
  const acc = P.onGround ? (P.slip ? 380 : 1900) : 1300;
  if (ax) { const mv = P.crouch ? 80 : 190; P.vx = clamp(P.vx + ax * acc * dt, -mv, mv); if (P.atk <= 0) P.face = ax; }
  else { const fr = (P.onGround ? (P.slip ? 200 : 2300) : 420) * dt; if (Math.abs(P.vx) <= fr) P.vx = 0; else P.vx -= sign(P.vx) * fr; }
  if (P.atk > 0 && P.onGround && !P.slip) P.vx *= Math.pow(0.002, dt);
  P.coyote = P.onGround ? .1 : Math.max(0, P.coyote - dt);
  if (ctrl && hit('J')) P.jbuf = .13; else P.jbuf = Math.max(0, P.jbuf - dt);
  if (P.jbuf > 0 && P.coyote > 0) { P.vy = -530; P.sq = -.14; P.jbuf = 0; P.coyote = 0; P.onGround = false; sfx.jump(); burst(P.x, P.y, 5, ['#cfd8e6', '#8fa3c7'], 70, .3); }
  if (ctrl && !down('J') && P.vy < -190 && P.hurtT <= 0) P.vy = -190;
  if (ctrl && hit('A') && P.atk <= 0) { P.atk = ATK_T; P.atkSet = new Set(); sfx.swing(); }
  if (P.atk > 0) {
    const e = ATK_T - P.atk; P.atk -= dt;
    if (e >= .06 && e < .2) attackHits();
    if (e < .08 && e + dt >= .08 && P.onGround) { burst(P.x + P.face * 40, P.y - 2, 6, ['#cfd8e6', '#ffe36b', '#fff'], 120, .25); shake = Math.max(shake, 2); }
  }
  P.vy = Math.min(900, P.vy + GRAV * dt);
  const wasG = P.onGround;
  collide(P, dt);
  P.sq = P.sq > 0 ? Math.max(0, P.sq - dt) : Math.min(0, P.sq + dt);
  if (!wasG && P.onGround) P.sq = .12;
  if (!wasG && P.onGround) burst(P.x, P.y, 4, ['#cfd8e6', '#8fa3c7'], 60, .25);
  // idle antics
  if (P.onGround && Math.abs(P.vx) < 6 && P.atk <= 0 && !ax && ctrl && !P.crouch) {
    P.idleT += dt;
    if (P.idleT > 3.5) {
      if (!P.idleAnim) { P.idleAnim = Math.random() < .5 ? 'shake' : 'vodka'; P.idleA = 0; P.idleF = ''; }
      P.idleA += dt;
      const fr = idleFrame(P.idleAnim, P.idleA)[0];
      if (fr !== P.idleF) { P.idleF = fr; idleSfx(fr); }
      if (P.idleA > (P.idleAnim === 'vodka' ? 5.85 : 4.2)) P.idleAnim = '';
      if (P.idleAnim === 'shake') P.wigT -= dt;
      if (P.wigT <= 0) { P.wigT = rnd(2.4, 3.8); if (Math.random() < .5) doBark(); else { say(P, pick(['ХИ-ХИ', 'АХАХА', 'ЛЯ-ЛЯ-ЛЯ', 'ХЕ-ХЕ']), 1); sfx.laugh(4, rnd(560, 680), .12); } }
    }
  } else { P.idleT = 0; P.wigT = 1.6; P.idleAnim = ''; }
  if (P.onGround && Math.abs(P.vx) > 30) { const st = P.runT * 4.5 | 0; P.runT += dt; if ((P.runT * 4.5 | 0) !== st && !P.crouch) parts.push({ k: 'p', x: P.x - P.face * 8, y: P.y - 2, vx: -P.face * rnd(20, 50), vy: -rnd(10, 40), s: 2, c: '#8fa3c7', life: .3, g: 0 }); } else P.runT = 0;
  // safe spot / pits
  const s = P.ground;
  if (P.onGround && s && s.k !== 'p') { const m = Math.min(26, s.w / 2); P.safeX = clamp(P.x, s.x + m, s.x + s.w - m); P.safeY = s.y; }
  if (P.y > H + 70) hurtPlayer(0, true);
  P.slip = false;
  if (P.onGround) for (const pd of puddles) if (Math.abs(P.x - pd.x) < pd.w / 2) P.slip = true;
}
function drawWiggle(img, name, x, y, flip, t) {
  const f = F[name]; x = Math.round(x); y = Math.round(y);
  for (let r = 0; r < f[3]; r++) {
    const rel = r / f[3], b = Math.exp(-Math.pow((rel - .62) / .15, 2));
    const dx = Math.round(Math.sin(t * 17) * 6 * b);
    if (flip) { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(img, f[0], f[1] + r, f[2], 1, -f[4] + dx, y - f[5] + r, f[2], 1); g.restore(); }
    else g.drawImage(img, f[0], f[1] + r, f[2], 1, x - f[4] + dx, y - f[5] + r, f[2], 1);
  }
}
// анимации простоя: 'shake' (танец) и 'vodka' (водка и сигарета). Возвращает [кадр, трясти ли бёдрами]
const VOD_T = [.7, .35, .5, .9, .7, .6, .8, 1.3];
function idleFrame(kind, t) {
  if (kind === 'vodka') { let a = t % 5.85; for (let i = 0; i < 8; i++) { if (a < VOD_T[i]) return ['g_vod' + i, false]; a -= VOD_T[i]; } return ['g_vod7', false]; }
  const a = t % 4.2; return (a < .5 || a > 3.8) ? ['g_shake1', false] : ['g_shake2', true];
}
function idleSfx(fr) {
  if (fr === 'g_vod2') sfx.gulp(); else if (fr === 'g_vod3') sfx.gulp();
  else if (fr === 'g_vod4') { sfx.aah(); say(P, pick(['ААХ…', 'ХОРОШО ПОШЛА', 'ЗА КРОЛИКОВ']), 1.1); }
  else if (fr === 'g_vod5') sfx.lighter();
  else if (fr === 'g_shake2') say(P, pick(['ЛЯ-ЛЯ-ЛЯ', 'ОП-ОП', 'ЭХ!']), 1);
}
function drawNotes(x, y, face) { for (let i = 0; i < 2; i++) { const ph = (gameT * .9 + i * .5) % 1, nx = x - face * (22 + i * 10) + Math.sin(ph * 9) * 4, ny = y - 50 - ph * 34; R(nx, ny, 2, 7, '#ffe36b'); R(nx - 3, ny + 5, 4, 3, '#ffe36b'); R(nx, ny, 5, 2, '#ffe36b'); } }
function drawPlayer() {
  let name = 'g_idle', oy = 0, flip = P.face < 0, wig = false;
  const laughFr = t => (t / .13 | 0) % 2 ? 'g_laugh2' : 'g_laugh1';
  if (P.masked) { name = 'g_mask' + ((gameT / .35 | 0) % 3); if (mode === 'celebrate') oy = -Math.abs(Math.sin(gameT * 9)) * 5; }
  else if (mode === 'celebrate') {
    const t = cele.t, k = cele.kind;
    if (k === 'howl') { if (t < .45) name = 'g_crouch'; else if (t < .9) name = 'g_crouch2'; else { name = (t / .32 | 0) % 2 ? 'g_howl2' : 'g_howl1'; oy = (t / .06 | 0) % 2 ? -1 : 0; } }
    else if (k === 'laugh') { name = laughFr(t); oy = (t / .065 | 0) % 2 ? -2 : 0; }
    else if (t < .5) name = laughFr(t);
    else { const q = ((t - .5) / .19 | 0); name = q % 2 ? 'g_dance2' : 'g_dance1'; if ((q / 2 | 0) % 2) flip = !flip; oy = -Math.abs(Math.sin((t - .5) * 16.5)) * 6; }
  }
  else if (mode === 'tikhon' && tk && tk.ph === 3) { name = laughFr(tk.t); oy = (tk.t / .065 | 0) % 2 ? -2 : 0; }
  else if (mode === 'dead' || P.hurtT > 0) name = 'g_hit';
  else if (P.atk > 0) name = (ATK_T - P.atk) < .06 ? 'g_wind' : 'g_smash';
  else if (!P.onGround) name = 'g_jump';
  else if (P.crouch) { if (Math.abs(P.vx) > 20) { name = (P.runT * 7 | 0) % 2 ? 'g_crouch2' : 'g_crouch'; oy = (P.runT * 14 | 0) % 2 ? -1 : 0; } else name = 'g_crouch'; }
  else if (Math.abs(P.vx) > 30) { if ((P.runT * 9 | 0) % 2) { name = 'g_jump'; oy = -8; } else name = 'g_run'; }
  else if (P.emoteT > 0 && P.emote === 'laugh') name = (P.emoteT / .1 | 0) % 2 ? 'g_laugh2' : 'g_laugh1';
  else if (P.emoteT > 0 && P.emote === 'bark') { name = 'g_idle'; oy = -3; }
  else if (P.idleAnim && mode === 'play') { const fr = idleFrame(P.idleAnim, P.idleA); name = fr[0]; wig = fr[1]; }
  if (P.inv > 0 && P.hurtT <= 0 && mode === 'play' && (P.inv * 18 | 0) % 2) return;
  const lv = stats.kills >= 18 ? 3 : stats.kills >= 9 ? 2 : stats.kills >= 3 ? 1 : 0, img = galB[lv];
  if (wig) { drawWiggle(img, name, P.x, P.y, flip, gameT); drawNotes(P.x, P.y, P.face); }
  else {
    if (name === 'g_idle' && mode === 'play') oy = (gameT * 1.6 | 0) % 2 ? -1 : 0;   // дышит
    // растяжение в прыжке и приплюснутость при приземлении
    const q = P.sq || 0, sx = q > 0 ? 1 + q * 1.4 : 1 + q * .8, sy = q > 0 ? 1 - q * 1.5 : 1 - q * 1.1;
    spr(name, P.x, P.y + oy, flip, { img, sx, sy });
    if (P.atk > 0) { const e = ATK_T - P.atk; if (e > .05 && e < .17) { g.globalAlpha = .75 * (1 - (e - .05) / .12); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); const cx = P.x + P.face * 8, cy = P.y - 44; if (P.face > 0) g.arc(cx, cy, 48, -1.9, .55); else g.arc(cx, cy, 48, Math.PI - .55, Math.PI + 1.9); g.stroke(); g.globalAlpha = 1; } }
  }
}

// ---------- hazards, cases, triggers ----------
function updateWorld(dt) {
  for (const s of L.movers) {
    const dx = s.mv.sp * s.mv.d * dt; s.x += dx;
    if (s.x > s.mv.x1) { s.x = s.mv.x1; s.mv.d = -1; } if (s.x < s.mv.x0) { s.x = s.mv.x0; s.mv.d = 1; }
    if (P.ground === s && P.onGround) P.x += dx;
  }
  for (const c of L.cases) {
    c.bump = Math.max(0, c.bump - dt);
    if (c.fall) {
      c.vy += 1100 * dt; c.x += (c.vx || 0) * dt; c.y += c.vy * dt;
      const s = solidAt(c.x, c.y);
      if (s && c.vy > 0) {
        c.y = s.y; c.fall = false; c.vy = 0; c.vx = 0;
        if (c.fallen) { sfx.thud(); shake = Math.max(shake, 9); burst(c.x, c.y, 14, ['#cfd8e6', '#8fa3c7'], 150, .5); say(P, '?!', 1.1); floater('ЧЕМОДАН. С НЕБА.', c.x, c.y - 70, { size: 8, t: 1.8 }); }
      }
    }
  }
  if (!L.boss) {
    for (const sp of L.spikes) if (P.x + 9 > sp.x && P.x - 9 < sp.x + sp.w && P.y > sp.y + 2 && P.y - P.h < sp.y + sp.h) hurtPlayer(P.x < sp.x + sp.w / 2 ? -1 : 1);
    for (const z of L.zaps) {
      const on = zapOn(z);
      if (on && !z.was && inView(z.x)) sfx.zap(); z.was = on;
      if (on && Math.abs(P.x - z.x) < 15 && P.y > z.y0 && P.y - P.h < z.y1) hurtPlayer(P.x < z.x ? -1 : 1);
    }
    for (const c of L.checks) if (!c.on && P.x > c.x) { c.on = true; L.lastCheck = c; sfx.ok(); floater('СОХРАНЕНО', c.x, FY - 90, { color: '#3ddc6a', size: 9, t: 1.4 }); if (P.hp < P.maxhp) P.hp++; }
    if (!iceSeen && L.iceX && P.x > L.iceX && P.onGround && !pendingCele) startIce();
    if (!fallCase && L.fallX && P.x > L.fallX) { fallCase = true; const c = mkCase(P.x + 170, -40, 'rabbit', 2, 1, true); c.fall = true; c.fallen = true; L.cases.push(c); }
    if (P.x > L.gateX - 50 && P.onGround) { mode = 'gate'; modeT = 0; sfx.gate(); P.atk = 0; }
    // чемодан на ножках
    walkerT -= dt;
    if (!walker && walkerT <= 0) { const d = Math.random() < .5 ? 1 : -1; walker = { x: d > 0 ? cam - 30 : cam + W + 30, d, ci: rint(0, 4) }; }
    if (walker) { walker.x += walker.d * 105 * dt; if (walker.x < cam - 60 || walker.x > cam + W + 60) { walker = null; walkerT = rnd(14, 26); } }
  }
  if (chainT > 0) { chainT -= dt; if (chainT <= 0) chain = 0; }
  if (pendingCele && P.onGround && !L.rabbits.some(r => r.ko > 0)) startCelebrate();
  if (letterT > 0) letterT -= dt;
  // camera
  if (!L.boss) {
    look += (P.face * 60 - look) * Math.min(1, dt * 2.5);
    const tx = clamp(P.x - W * .45 + look, 0, L.w - W); cam += (tx - cam) * Math.min(1, dt * 7);
  } else cam = 0;
}

// ---------- мороженщик ----------
function startIce() {
  iceSeen = true; mode = 'ice'; modeT = 0; ice = { x: cam - 160, t: 0, waved: false, waveT: 0, cone: false, end: 0, bub: null };
  P.vx = 0; P.atk = 0; P.idleT = 0; P.bub = null; playSong('ice'); chainT = Math.max(chainT, 0);
  for (const r of L.rabbits) { r.vx = 0; r.bub = null; }
}
function updateIce(dt) {
  ice.t += dt; P.vx = 0; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  if (ice.bub) { ice.bub.t -= dt; if (ice.bub.t <= 0) ice.bub = null; }
  if (ice.t > 1.1) { ice.x += 150 * dt; if ((ice.t * 12 | 0) % 3 === 0) parts.push({ k: 'p', x: ice.x - 50, y: L.fy - 2, vx: rnd(-40, -10), vy: rnd(-30, -5), s: 2, c: '#8fa3c7', life: .4, g: 0 }); }
  const sx = ice.x - cam;
  if (sx > -60) P.face = ice.x < P.x ? -1 : 1;
  if (ice.t > .5 && ice.t < .6 && !P.bub) say(P, '?', 1.4);
  if (!ice.waved && sx > W * .4) { ice.waved = true; ice.waveT = 1.9; say(ice, 'ДОБРЫЙ ДЕНЬ!', 1.7); }
  ice.waveT -= dt;
  if (!ice.cone && sx > W * .58) { ice.cone = true; pickups.push({ k: 'cone', x: ice.x - 44, y: L.fy - 70, vx: -70, vy: -240, t: 0 }); sfx.pop(); }
  if (sx > W + 150) {
    ice.end += dt;
    if (ice.end > 1.1) {
      ice = null; mode = 'play'; playSong(L.boss ? 'boss' : 'level');
      if (L.boss && boss && boss.state === 'p3') { boss.state = 'offer'; boss.t = 0; boss.waveT = 3.2; boss.card = 4; say(boss, '…МОЖНО МНЕ ТОЖЕ ПЛОМБИР?', 2.6); }
      else { say(P, pick(['…', 'ЧТО ЭТО БЫЛО', 'ГАВ?']), 1.4); const rs = L.rabbits.filter(r => inView(r.x, -20)); if (rs.length) say(pick(rs), pick(['это кто был?', 'мне эскимо…', 'он нас не спас']), 2); }
    }
  }
}
function drawIce() {
  if (!ice) return;
  const bob = (ice.t * 9 | 0) % 2;
  drawCase({ x: ice.x - 49, y: L.fy - 44 - bob, ci: 1, scale: .62, open: false, bump: 0 });
  spr(ice.waveT > 0 ? 'ice2' : 'ice1', ice.x, L.fy + 1 - bob, false);
  if (ice.bub) bubble(ice.bub.s, ice.x - 24 - camR, L.fy - 128, { size: 9 });
}

// ---------- Тихон на мотоцикле ----------
function startTikhon() {
  const dir = P.x > 280 ? 1 : -1;
  tk = { dir, x: dir > 0 ? -90 : W + 90, stop: P.x - dir * 135, ph: 0, t: 0, bub: null, money: null, eng: 0, out: 0, sob: 0 };
  mode = 'tikhon'; modeT = 0; P.vx = 0; P.atk = 0; P.bub = null; P.idleAnim = ''; P.crouch = false; P.h = 76; stopSong(); tears = [];
}
function updateTikhon(dt) {
  const k = tk; k.t += dt; P.vx = 0; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  P.face = k.x < P.x ? -1 : 1; if (boss) boss.face = k.x < boss.x ? -1 : 1;
  if (k.bub) { k.bub.t -= dt; if (k.bub.t <= 0) k.bub = null; }
  if (k.ph === 0 || k.ph === 4) { k.eng -= dt; if (k.eng <= 0) { k.eng = .09; sfx.moto(); parts.push({ k: 'p', x: k.x - k.dir * 44, y: L.fy - 6, vx: -k.dir * rnd(20, 70), vy: -rnd(5, 40), s: 3, c: pick(['#cfd8e6', '#8f7fb0']), life: .5, g: 0 }); } }
  switch (k.ph) {
    case 0: k.x += k.dir * 250 * dt; if ((k.stop - k.x) * k.dir <= 0) { k.x = k.stop; k.ph = 1; k.t = 0; sfx.thud(); say(P, '?', 1); } break;
    case 1:
      if (k.t > .7 && !k.money) { k.money = { t: 0, x0: k.x + k.dir * 20, done: false }; sfx.swing(); say(k, 'ДЕРЖИ. НА МЕЛКИЕ РАСХОДЫ', 1.5); }
      if (k.money && !k.money.done) { k.money.t += dt; if (k.money.t >= .6) { k.money.done = true; P.hp = Math.min(P.maxhp, P.hp + 3); sfx.heal(); floater('ДЕНЬГИ ЛЕЧАТ', P.x, P.y - 100, { color: '#7fe08a', t: 1.6 }); burst(P.x, P.y - 50, 16, ['#7fe08a', '#2f8a3a', '#f3c93a'], 170, .6); } }
      if (k.t > 2.4) { k.ph = 2; k.t = 0; say(k, 'ГАЛЯ, ПОЛЕТИШЬ СО МНОЙ В ЯПОНИЮ?', 2.7); sfx.blip2(); }
      break;
    case 2: if (k.t > 3) { k.ph = 3; k.t = 0; k.bub = null; sfx.maniac(); say(P, 'АХАХАХАХАХА', 2.8); } break;
    case 3:
      if (k.t > 1.3 && k.t - dt <= 1.3) sfx.maniac();
      if (k.t > 1.5 && !k.sob) { k.sob = 1; say(k, '…ПОНЯЛ', 1.3); if (boss && !boss.bub) say(boss, 'ой…', 1.5); }
      if (k.t > 3.1) { k.ph = 4; k.t = 0; say(k, 'Я НЕ КУКОЛД!!!', 3.5); sfx.scream(.9); playSong('sad'); }
      break;
    case 4:
      k.x += k.dir * (110 + k.t * 280) * dt;
      if (k.x < -130 || k.x > W + 130) {
        k.out += dt;
        if (k.out > 1) { tk = null; mode = 'play'; playSong('boss'); if (boss) { boss.state = 'offer'; boss.t = 0; boss.waveT = 3.2; boss.card = 4; say(boss, '…А МЕНЯ В ЯПОНИЮ НИКТО НЕ ЗОВЁТ', 2.8); } }
      }
      break;
  }
}
function drawTikhon() {
  const k = tk; if (!k) return;
  let name = 't_sit', oy = 0;
  if (k.ph === 0) oy = (k.t * 14 | 0) % 2;
  else if (k.ph === 1 || k.ph === 2) name = 't_stand';
  else if (k.ph === 3) name = k.t < 1.5 ? 't_stand' : k.t < 2.4 ? 't_mount' : 't_ride';
  else { name = k.t < .4 ? 't_ride' : (k.t / .2 | 0) % 2 ? 't_cry1' : 't_cry2'; oy = (k.t * 14 | 0) % 2; }
  spr(name, k.x, L.fy + 2 - oy, k.dir < 0);
  if (k.money && !k.money.done) { const q = k.money.t / .6; spr('money', k.money.x0 + (P.x - k.money.x0) * q, L.fy - 70 - Math.sin(q * Math.PI) * 60, false, { rot: q * 9 }); }
  if (k.bub) bubble(k.bub.s, k.x - camR, L.fy - 112, { size: k.ph === 4 ? 12 : 9, max: 16, shake: k.ph === 4 ? 2 : 0 });
}

// ---------- босс: Пушистик ----------
const GREET = ['ОЙ! ПРИВЕТ! Я ПУШИСТИК!', 'ТЫ ПРИШЛА ПОИГРАТЬ?', 'ДАВАЙ ДРУЖИТЬ!', 'У ТЕБЯ КРАСИВАЯ СКОВОРОДКА!', 'А Я ТЕБЕ МЕСТО ЗАНЯЛ!', 'ХОЧЕШЬ МОРКОВКУ?'];
const SCREAMS = [
  ['АЙ! ЗА ЧТО?!', 'НЕ НАДО!', 'МНЕ ЖЕ БОЛЬНО!', 'ГАЛЯ, ТЫ ЧЕГО?!', 'Я ЖЕ ПОЗДОРОВАЛСЯ!', 'МЫ ЖЕ ДРУЗЬЯ?', 'ОЙ-ОЙ-ОЙ!'],
  ['НЕЕЕТ ГАААЛЯЯЯ!', 'НЕ НАДООО!', 'ЗА ЧТООО?!', 'ПОЖАЛУЙСТААА!', 'Я ТЕБЕ НЕ СТЕПАШКА! …ХОТЯ ДА', 'МАМАААА!', 'ХВАТИИИТ!'],
  ['Я ЖЕ ТЕБЕ ЦВЕТЫ ПРИНЁС!', 'ГАЛЯ, У МЕНЯ ИПОТЕКА!', 'Я САМ ИХ СОБИРАЛ!', 'Я ЖЕ ТЕБЕ МОРКОВКУ ПРИНЁС!', 'НЕЕЕЕТ ГААААЛЯЯЯЯ!', 'МЫ МОГЛИ ДРУЖИТЬ!']
];
const BEG = ['пожалуйста, не надо…', 'я хороший, честно', 'давай просто поговорим?', 'я никому не скажу', 'хочешь, я уйду?', 'у меня есть печенье…'];
const OFFER = ['ЭТО ТЕБЕ…', 'РОМАШКИ. ТВОИ ЛЮБИМЫЕ?', 'Я УЕДУ. ВОТ ЧЕМОДАН.', 'Я НАПИСАЛ ТЕБЕ ОТКРЫТКУ', 'МЫ ЕЩЁ МОЖЕМ ДРУЖИТЬ'];
const MERCY = ['ГАЛЯ НЕ ЗНАЕТ ЭТОГО СЛОВА', 'КНОПКА ДЛЯ КРАСОТЫ', 'ХА. НЕТ.', 'ПОЩАДА ЗАКОНЧИЛАСЬ', 'КНОПКА СЛОМАЛАСЬ'];
function startBoss() {
  L = buildBossLevel(); cam = 0; look = 0;
  parts = []; gibs = []; stains = []; splats = []; pickups = []; tears = []; puddles = []; floats = []; fxs = [];
  Object.assign(P, { x: 70, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, masked: 0, crouch: false, h: 76, idleAnim: '', safeX: 70, safeY: FYB });
  boss = { x: 610, y: FYB, hp: 20, max: 20, state: 'greet', t: 0, phase: 1, face: -1, inv: 0, fl: 0, bub: null, line: 0, sline: 0, hopFrom: 0, hopTo: 0, hopT: 0, hops: 0, dead: false, rainT: 0, grief: 0, started: false, mercy: 0, mercyGone: 0, waveT: 0, card: 0, scale: 1 };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; ice = null; iceSeen = true; stopSong();
  banner = { s: 'ЛОГОВО ПУШИСТИКА', sub: 'он тебя ждал', t: 2.4 };
}
function spawnTear(x, o) { tears.push(Object.assign({ x: x === undefined ? (Math.random() < .7 ? clamp(P.x + rnd(-170, 170), 26, W - 26) : rnd(26, W - 26)) : x, y: -16, vx: 0, vy: rnd(250, 330), g: 0 }, o || {})); }
function startHop() {
  const b = boss; b.state = 'hop'; b.hopT = 0; b.hopFrom = b.x;
  b.hopTo = P.x < W / 2 ? rnd(560, 660) : rnd(140, 240);
  if (Math.abs(b.hopTo - b.x) < 120) b.hopTo = b.x < W / 2 ? rnd(560, 660) : rnd(140, 240);
  sfx.jump(); b.bub = null;
}
function spawnSupport() {
  if (L.rabbits.length >= 3) return;
  const side = Math.random() < .5 ? -1 : 1;
  const r = mkRabbit(side < 0 ? 40 : W - 40, -10, 'support', pick(['Пушистик, держись!', 'я принёс платочек!', 'мы с тобой!', 'не плачь!']), { tx: 0 });
  r.side = side; r.onGround = false; r.said = true; say(r, r.line, 2.4); L.rabbits.push(r);
}
function hitBoss() {
  const b = boss; if (b.dead || b.inv > 0 || b.state === 'hop' || b.state === 'p3' || mode !== 'play') return false;
  b.hp--; b.inv = .5; b.fl = .2; hitstop = .07; shake = Math.max(shake, 9); sfx.bonk(); sfx.splat();
  const hx = b.x + sign(P.x - b.x) * 40, hy = b.y - 60, dir = sign(b.x - P.x);
  for (let i = 0; i < 30; i++) { const a = rnd(-Math.PI, 0), sp = rnd(60, 380); parts.push({ k: 'b', x: hx, y: hy + rnd(-20, 20), vx: Math.cos(a) * sp + dir * 60, vy: Math.sin(a) * sp - 60, s: rint(2, 4), c: pick(BLOOD), life: rnd(1.5, 3) }); }
  if (Math.random() < .4) lensSplat(1);
  if (b.hp % 4 === 0) gibs.push({ k: 'm', x: hx, y: hy, vx: dir * rnd(60, 200), vy: -rnd(200, 380), rot: 0, vr: 8, sc: 1.6, c: '#fff', rest: false, life: 20, tr: 0 });
  floater(pick(BONK), hx, hy - 50, { color: '#ffe36b', size: 16, t: .55, rot: rnd(-.3, .3), vy: -60 });
  if (!b.started) { b.started = true; playSong('boss'); banner = null; }
  if (b.hp <= 0) { startBossDeath(); return true; }
  const np = b.hp <= 6 ? 3 : b.hp <= 13 ? 2 : 1;
  if (np !== b.phase) {
    b.phase = np; b.sline = 0;
    if (np === 3) { b.state = 'p3'; b.t = 0; tears = []; say(b, 'ПОДОЖДИ… ЭТО МОТОЦИКЛ?', 1.7); stopSong(); for (const r of L.rabbits) r.vx = 0; return true; }
  }
  b.state = 'hurt'; b.t = 0; b.hops = 0; b.sq = -.2;
  const arr = SCREAMS[b.phase - 1]; say(b, arr[b.sline++ % arr.length], 1.5); sfx.scream(.45 + b.phase * .22);
  if (b.phase >= 2 && Math.random() < .75) spawnSupport();
  return true;
}
function updateBoss(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.inv = Math.max(0, b.inv - dt); b.fl = Math.max(0, b.fl - dt); b.grief = Math.max(0, b.grief - dt); b.card = Math.max(0, b.card - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  if (b.state !== 'hop') b.face = P.x < b.x ? -1 : 1;
  const ph = b.phase;
  for (const r of L.rabbits) if (r.kind === 'support') r.tx = clamp(b.x + r.side * 100, 30, W - 30);
  switch (b.state) {
    case 'greet': if (b.t > 1.1 && !b.bub) { say(b, GREET[b.line++ % GREET.length], 2.6); b.t = -2.4; sfx.blip2(); } break;
    case 'hurt': if (b.t > .5) { b.state = 'cry'; b.t = 0; b.rainT = 0; } break;
    case 'cry': {
      b.rainT -= dt;
      if (b.rainT <= 0) { b.rainT = ph === 1 ? .3 : ph === 2 ? .17 : .24; spawnTear(); sfx.tear(); }
      if ((b.t * 20 | 0) % 2) for (const sd of [-1, 1]) parts.push({ k: 'p', x: b.x + sd * rnd(44, 60), y: b.y - 6, vx: sd * rnd(20, 150), vy: -rnd(60, 220), s: 2, c: pick(['#8fdcff', '#c8f0ff', '#4ab0e8']), life: .5, g: 700 });
      if (b.t > .32 && Math.abs(P.x - b.x) < 86 && P.y > b.y - 74) hurtPlayer(sign(P.x - b.x));
      if (b.t > (ph === 1 ? 1.7 : ph === 2 ? 2.4 : 1.8)) { if (ph === 3) { b.state = 'offer'; b.t = 0; } else startHop(); }
      break;
    }
    case 'hop': {
      b.hopT += dt; const k = Math.min(1, b.hopT / .85);
      b.x = b.hopFrom + (b.hopTo - b.hopFrom) * k; b.y = FYB - Math.sin(k * Math.PI) * 150;
      if (k >= 1) {
        b.y = FYB; b.sq = .25; shake = Math.max(shake, 8); sfx.thud(); burst(b.x, b.y, 16, ['#b9a8d8', '#8f7fb0'], 170, .5);
        for (let i = 0; i < (ph === 2 ? 4 : 2); i++) { const sd = i % 2 ? 1 : -1; tears.push({ x: b.x + sd * 50, y: b.y - 30, vx: sd * rnd(120, 230), vy: -rnd(250, 360), g: 700 }); }
        if (Math.abs(P.x - b.x) < 72 && P.onGround) { P.vx = sign(P.x - b.x) * 250; P.vy = -210; P.onGround = false; say(b, 'ОЙ! ПРОСТИ!', 1.2); }
        if (ph === 2 && b.hops < 1 && Math.random() < .5) { b.hops++; startHop(); }
        else { b.state = 'beg'; b.t = 0; if (!b.bub) say(b, pick(BEG), 2.2); }
      }
      break;
    }
    case 'beg': if (b.t > (ph === 1 ? 3.3 : 2.3)) { b.state = 'cry'; b.t = 0; b.rainT = 0; say(b, pick(['У-А-А-А-А!', 'ХНЫЫЫК!', 'ЗА ЧТОООО!']), 1.2); sfx.scream(.7); } break;
    case 'p3': if (b.t > 1.9 && P.onGround && mode === 'play') startTikhon(); break;
    case 'offer': {
      b.waveT -= dt;
      if (b.waveT <= 0) { b.waveT = 3.3; const gx = rnd(90, W - 90); for (let x = 24; x < W - 20; x += 36) if (Math.abs(x - gx) > 66 && Math.abs(x - b.x) > 50) spawnTear(x + rnd(-5, 5), { y: -20 - rnd(50), vy: 215 }); sfx.scream(.4); }
      if (b.t > 1.3 && !b.bub) { say(b, OFFER[b.line++ % OFFER.length], 2.3); b.t = 0; }
      break;
    }
  }
  if (b.state !== 'hop' && b.state !== 'dying' && Math.abs(P.x - b.x) < 50 && P.y > b.y - 112) { P.x = clamp(b.x + (P.x < b.x ? -50 : 50), 22, W - 22); if (sign(P.vx) === sign(b.x - P.x)) P.vx = 0; }
  // слёзы
  for (let i = tears.length - 1; i >= 0; i--) {
    const t = tears[i]; t.vy += t.g * dt; t.x += t.vx * dt; t.y += t.vy * dt;
    if (Math.abs(t.x - P.x) < 17 && t.y > P.y - P.h - 2 && t.y < P.y + 4) { hurtPlayer(sign(P.x - t.x || 1)); t.y = 9999; }
    if (t.y >= FYB - 3) {
      if (t.y < 9000) { burst(t.x, FYB - 2, 7, ['#8fdcff', '#c8f0ff', '#4ab0e8'], 130, .4); if (Math.random() < .5) sfx.splash(); if (ph >= 2 && puddles.length < 9 && t.x > 20 && t.x < W - 20) puddles.push({ x: t.x, w: 56, t: 5.5 }); }
      tears.splice(i, 1);
    }
  }
  for (let i = puddles.length - 1; i >= 0; i--) { puddles[i].t -= dt; if (puddles[i].t <= 0) puddles.splice(i, 1); }
  // кнопка «пощадить»
  if (b.started && !b.mercyGone && mode === 'play') {
    const tap = hit('T') && Math.abs(tapX - W / 2) < 90 && tapY > H - 40;
    if (hit('S') || tap) { sfx.buzz(); shake = Math.max(shake, 5); floater(MERCY[Math.min(b.mercy, MERCY.length - 1)], W / 2, H - 62, { scr: true, color: '#ff6b6b', size: 10, t: 1.6, vy: -14 }); b.mercy++; if (b.mercy >= MERCY.length) { b.mercyGone = .01; sfx.thud(); } }
  }
  if (b.mercyGone) b.mercyGone += dt;
}
function startBossDeath() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'dying'; b.bub = null; stopSong(); tears = []; puddles = []; P.atk = 0;
  wail(2.5, 1500, 420, .26, 10, 110);
  for (const r of L.rabbits) { r.awe = true; r.vx = 0; }
  b.hatY = null; b.won = 0;
}
function updateBossDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  if (!b.dead) {
    if (modeT < 2.5) { shake = Math.max(shake, 3 + modeT * 3); if ((modeT * 14 | 0) !== ((modeT - dt) * 14 | 0)) { parts.push({ k: 'b', x: b.x + rnd(-40, 40), y: b.y - rnd(20, 100), vx: rnd(-200, 200), vy: -rnd(100, 300), s: 3, c: pick(BLOOD), life: 2 }); flash = Math.max(flash, .12); } }
    else {
      b.dead = true; const dir = sign(b.x - P.x);
      gore(b.x, b.y - 62, dir, 1, true); wallSplat(b.x, b.y - 90, true); lensSplat(16, true); shake = 22; flash = 1; sfx.boom(); sfx.splat();
      for (let i = 0; i < 26; i++) gibs.push({ k: 'm', x: b.x, y: b.y - 60, vx: rnd(-300, 300), vy: -rnd(200, 600), rot: 0, vr: rnd(-9, 9), sc: 1.1, c: pick(['#fff', '#ffe36b', '#ff9ec4']), rest: false, life: 30, tr: 9 });
      for (const r of L.rabbits) say(r, pick(['ПУШИСТИК!!!', 'нет…', '…']), 2.5);
      memorial.push(['Пушистик', 'просто хотел дружить']); stats.kills++;
    }
  } else if (b.hatY === null) { if (modeT > 5) { b.hatY = -70; b.hatV = 0; } }
  else if (!b.won) {
    b.hatV += 900 * dt; b.hatY += b.hatV * dt;
    if (b.hatY >= P.y - 60) { b.won = .001; P.masked = 1; sfx.thud(); shake = 8; playSong('win'); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  } else {
    b.won += dt;
    if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ГАЛЯ МЕН'; L.after = true; }
  }
}
function drawBoss() {
  const b = boss; if (!b || !L.boss) return;
  // лужи и метки слёз
  for (const p of puddles) { const a = Math.min(1, p.t); g.globalAlpha = .55 * a; R(p.x - p.w / 2, FYB - 1, p.w, 5, '#8fdcff'); R(p.x - p.w / 2 + 6, FYB, p.w - 12, 2, '#e6f8ff'); g.globalAlpha = 1; }
  for (const t of tears) if (!t.g) { const k = clamp(t.y / FYB, 0, 1), w = 4 + k * 12; R(t.x - w / 2, FYB + 1, w, 2, (gameT * 16 | 0) % 2 ? '#ff5b6b' : '#ffd0d6'); }
  if (!b.dead) {
    let name = 'b_wave', ox = 0, oy = 0;
    if (b.state === 'dying') { name = 'b_cry'; ox = rnd(-4, 4) * Math.min(1, modeT); oy = rnd(-3, 3) * Math.min(1, modeT); }
    else if (b.fl > 0 || b.state === 'hurt' || b.state === 'cry' || b.grief > 0) { name = 'b_cry'; if (b.state === 'hurt') ox = (gameT * 40 | 0) % 2 ? 3 : -3; }
    else if (b.state === 'hop' || b.state === 'beg' || b.state === 'p3') { name = 'b_beg'; ox = (gameT * 36 | 0) % 2 ? 1 : -1; }
    else if (b.state === 'offer') { name = 'b_flowers'; oy = -Math.abs(Math.sin(gameT * 3)) * 2; }
    else oy = -Math.abs(Math.sin(gameT * 4)) * 3;
    if (ice && mode === 'ice') b.face = ice.x < b.x ? -1 : 1;
    const flip = b.face < 0;
    if (b.phase === 3 && b.state !== 'dying') drawCase({ x: b.x - b.face * 92, y: FYB, ci: 4, scale: 1, open: false, bump: 0 });
    // тень
    g.globalAlpha = .3; R(b.x - 50, FYB - 2, 100, 5, '#000'); g.globalAlpha = 1;
    b.sq = b.sq > 0 ? Math.max(0, b.sq - .016) : Math.min(0, (b.sq || 0) + .016);
    const bq = b.sq, br = Math.sin(gameT * 3) * .012, hop = b.state === 'hop' ? .08 : 0;
    const bsx = 1 + (bq > 0 ? bq * .7 : bq * .35) - hop, bsy = 1 - (bq > 0 ? bq * .8 : bq * .5) + br + hop;
    spr(name, b.x + ox, b.y + oy, flip, { sx: bsx, sy: bsy });
    if (b.fl > 0.08) spr(name, b.x + ox, b.y + oy, flip, { img: atlasW, a: .8 });
    if (b.state === 'dying' && (modeT * 12 | 0) % 2) spr(name, b.x + ox, b.y + oy, flip, { img: atlasW, a: Math.min(.9, modeT * .35) });
    if (b.bub) bubble(b.bub.s, b.x, b.y - 150, { size: b.state === 'hurt' || b.grief > 0 ? 12 : 10, max: 16, shake: b.state === 'hurt' || b.state === 'cry' ? 2 : 0, color: b.state === 'hurt' ? '#a3111f' : '#16161d' });
    if (b.card > 0) { const cx = b.x + b.face * 84, cy = b.y - 120 + Math.sin(gameT * 3) * 3; R(cx - 44, cy - 22, 88, 44, '#16161d'); R(cx - 42, cy - 20, 84, 40, '#fff6e0'); spr('heart_s', cx, cy - 2, false); T('ГАЛЕ ОТ', cx, cy + 5, { size: 7, color: '#a3111f' }); T('ПУШИСТИКА', cx, cy + 14, { size: 7, color: '#a3111f' }); }
  }
  for (const t of tears) { const x = Math.round(t.x), y = Math.round(t.y); g.fillStyle = '#16161d'; g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x + 7, y - 2); g.arc(x, y - 2, 7, 0, Math.PI); g.lineTo(x, y - 13); g.fill(); g.fillStyle = '#6fc8ff'; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 5, y - 2); g.arc(x, y - 2, 5, 0, Math.PI); g.lineTo(x, y - 10); g.fill(); R(x - 2, y - 4, 2, 3, '#e6f8ff'); }
  if (b.hatY !== null && b.hatY !== undefined && !b.won) spr('mask', P.x, b.hatY, false, { rot: Math.sin(gameT * 5) * .25 });
  if (b.state === 'dying' && !b.dead) {
    const s = 'НЕЕЕЕЕЕЕТ ГААААЛЯЯЯЯЯ', n = Math.min(s.length, (modeT * 11 | 0));
    T(s.slice(0, n), W / 2 + rnd(-3, 3), 120 + rnd(-3, 3), { size: 22 + modeT * 5, color: '#fff', stroke: '#a3111f', sw: 6 });
  }
}
function drawBossHud() {
  const b = boss; if (!b || !L.boss || !b.started) return;
  if (!b.dead) {
    T('ПУШИСТИК', W / 2, 16, { size: 9, color: '#ffd0e8', stroke: '#16161d' });
    OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(W / 2 - 152, 26, 304, 12); for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ffb35b' : '#ff9ec4') : '#3a2a44'; c.fillRect(W / 2 - 150 + i * 15, 28, 13, 8); } });
    if (!b.mercyGone || b.mercyGone < 1.2) {
      const dy = b.mercyGone ? b.mercyGone * b.mercyGone * 400 : 0, rot = b.mercyGone ? b.mercyGone * 1.4 : 0, cr = b.mercy;
      OV.push(c => { c.save(); c.translate(W / 2, H - 22 + dy); c.rotate(rot); c.fillStyle = '#16161d'; c.fillRect(-84, -13, 168, 26); c.fillStyle = '#2d6a3a'; c.fillRect(-82, -11, 164, 22); c.fillStyle = '#3ddc6a'; c.fillRect(-82, -11, 164, 2); c.font = '9px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eaffef'; c.fillText((TOUCH ? '' : 'ENTER: ') + 'ПОЩАДИТЬ', 0, 1); c.strokeStyle = '#16161d'; c.lineWidth = 1.5; for (let i = 0; i < cr; i++) { c.beginPath(); c.moveTo(-70 + i * 34, -11); c.lineTo(-62 + i * 34, -2); c.lineTo(-68 + i * 34, 4); c.lineTo(-58 + i * 34, 11); c.stroke(); } c.restore(); });
    }
  }
}

// ---------- scene flow ----------
function fadeTo(cb) { if (fadeDir === 1) return; fadeDir = 1; fadeCb = cb; }
// какие уровни открыты, запоминается в браузере
let unlocked = 1, curLevel = 0;
try { unlocked = Math.max(1, +localStorage.getItem('galyamen_unlocked') || 1); } catch (e) { }
function unlockNext() { unlocked = Math.max(unlocked, curLevel + 2); try { localStorage.setItem('galyamen_unlocked', String(unlocked)); } catch (e) { } }
function newGame() {
  nameI = 0; NAMES.sort(() => Math.random() - .5);
  stats = { hats: 0, kills: 0, cases: 0, casesTotal: 0, carrots: 0, best: 0, hits: 0, deaths: 0, time: 0, l1left: 0 };
  memorial = []; parts = []; gibs = []; stains = []; splats = []; lens = []; floats = []; pickups = []; fxs = []; tears = []; puddles = [];
  chain = 0; chainT = 0; pendingCele = false; ice = null; iceSeen = false; boss = null; banner = null; letterT = 0; walker = null; walkerT = 10; fallCase = false;
  hitstop = 0; shake = 0; slow = 1; paused = false;
  L = LEVELS[curLevel].build(); stats.casesTotal = L.casesTotal || 0; souls = []; tk = null;
  if (L.pot) pickups.push({ k: 'pot', x: L.pot.x, y: L.pot.y, vx: 0, vy: 0, t: 1, rest: true });
  Object.assign(P, { x: 90, y: FY, vx: 0, vy: 0, face: 1, hp: 5, inv: 0, hurtT: 0, atk: 0, onGround: true, ground: null, idleT: 0, bub: null, masked: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FY, emoteT: 0 });
  cam = 0; look = 0; mode = 'play'; modeT = 0;
}
function startLevel(i) { curLevel = i || 0; newGame(); scene = 'play'; sceneT = 0; playSong('level'); banner = { s: 'ЭТАП ' + (curLevel + 1) + ': ' + LEVELS[curLevel].name, sub: 'ГАЛЯ, ФАС!', t: 2.6 }; }
function respawn() {
  if (L.boss) { startBoss(); return; }
  const c = L.lastCheck; P.x = c ? c.x + 20 : 90; P.y = FY; P.vx = P.vy = 0; P.hp = P.maxhp; P.inv = 1.5; P.hurtT = 0; P.onGround = true;
  mode = 'play'; modeT = 0; cam = clamp(P.x - W * .45, 0, L.w - W); playSong('level'); chain = 0;
}
function tickBubbles(dt) { for (const r of L.rabbits) if (r.bub) { r.bub.t -= dt; if (r.bub.t <= 0) r.bub = null; } if (P.bub) { P.bub.t -= dt; if (P.bub.t <= 0) P.bub = null; } if (boss && boss.bub) { boss.bub.t -= dt; if (boss.bub.t <= 0) boss.bub = null; } }
function updatePlay(dt) {
  if (hitstop > 0) { hitstop -= dt; return; }
  stats.time += dt; modeT += dt;
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  updateFx(dt);
  switch (mode) {
    case 'play':
      updateWorld(dt); if (mode !== 'play') break;
      updatePlayer(dt, true); updateRabbits(dt); if (L.boss) updateBoss(dt);
      break;
    case 'celebrate':
      cele.t += dt; tickBubbles(dt);
      if (cele.t > CELE_T || (cele.t > 1 && (hit('A') || hit('J')) && !L.after)) {
        if (L.after) { if (fadeDir !== 1) fadeTo(startEnding); } else endCelebrate();
      }
      break;
    case 'ice': tickBubbles(dt); updateIce(dt); break;
    case 'tikhon': tickBubbles(dt); updateTikhon(dt); break;
    case 'gate':
      L.gate = Math.min(1, modeT / .9);
      if (modeT > .7) { P.vx = 120; P.face = 1; P.runT += dt; P.vy += GRAV * dt; collide(P, dt); if (P.x > L.gateX + 30) fadeTo(LEVELS[curLevel].boss ? startBossIntro : () => { stats.l1left = L.rabbits.filter(r => !r.dead).length; startEnding(); }); }
      else { P.vx = 0; P.vy += GRAV * dt; collide(P, dt); }
      break;
    case 'dead':
      P.vy += GRAV * .7 * dt; P.y += P.vy * dt; P.x += P.vx * dt; tickBubbles(dt);
      for (const r of L.rabbits) r.t += dt * 3;
      if (modeT > 1.5 && anyPress) fadeTo(respawn);
      break;
    case 'bossdeath': tickBubbles(dt); updateBossDeath(dt); break;
  }
}
function startBossIntro() { stats.l1left = L.rabbits.filter(r => !r.dead).length; scene = 'bossintro'; sceneT = 0; stopSong(); tn('sawtooth', 82, 78, 1.4, .2); tn('sawtooth', 62, 58, 1.6, .2, .5); }
function startEnding() { scene = 'ending'; sceneT = 0; playSong('sad'); unlockNext(); }

// ---------- render ----------
function drawHud() {
  for (let i = 0; i < P.maxhp; i++) spr('heart_s', 20 + i * 20, 28, false, { a: i < P.hp ? 1 : .22 });
  spr('hat_s', 138, 29, false); T('×' + stats.hats, 153, 20, { size: 10, align: 'left', stroke: '#16161d' });
  if (!L.boss) { drawCase({ x: 222, y: 30, ci: 0, scale: .55, open: false, bump: 0 }); T(stats.cases + '/' + stats.casesTotal, 236, 20, { size: 10, align: 'left', stroke: '#16161d' }); }
  if (chain >= 2 && chainT > 0 && mode === 'play') { T('КОМБО x' + chain, W - 14, 20, { size: 11, align: 'right', color: '#ffe36b', stroke: '#16161d' }); OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(W - 116, 30, 102, 6); c.fillStyle = '#ffe36b'; c.fillRect(W - 115, 31, 100 * clamp(chainT / 3.6, 0, 1), 4); }); }
  drawBossHud();
  if (banner) { const a = Math.min(1, banner.t * 2); T(banner.s, W / 2, 120, { size: 18, color: '#fff', stroke: '#1b2a6b', sw: 6, a }); if (banner.sub && (banner.t * 5 | 0) % 2) T(banner.sub, W / 2, 152, { size: 12, color: '#ffe36b', stroke: '#16161d', a }); }
  if (letterT > 0) OV.push(c => { const a = Math.min(1, letterT * 2); c.globalAlpha = a; c.fillStyle = '#16161d'; c.fillRect(W / 2 - 172, 78, 344, 104); c.fillStyle = '#fff6e0'; c.fillRect(W / 2 - 168, 82, 336, 96); c.font = '9px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#5a4a3a'; c.fillText('ПИСЬМО ИЗ ЧЕМОДАНА:', W / 2, 100); c.fillStyle = '#16161d'; c.font = '11px PS2P,monospace'; c.fillText('«ГАЛЯ, ОСТАНОВИСЬ.', W / 2, 126); c.fillText('ПОЖАЛУЙСТА.»', W / 2, 144); c.font = '8px PS2P,monospace'; c.fillStyle = '#5a4a3a'; c.fillText('— кролики', W / 2 + 90, 164); c.globalAlpha = 1; });
  if (mode === 'celebrate' && cele.kind === 'howl' && cele.t > .9) OV.push(c => { const a = Math.min(1, (cele.t - .9) * 2.5) * Math.min(1, (CELE_T - cele.t) * 3); c.globalAlpha = a * .92; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(W - 130, 150, 40, 0, 6.3); c.fill(); c.fillStyle = '#e3d79a'; [[-14, -8, 8], [10, 12, 6], [12, -16, 4]].forEach(m => { c.beginPath(); c.arc(W - 130 + m[0], 150 + m[1], m[2], 0, 6.3); c.fill(); }); c.globalAlpha = 1; });
  if (mode === 'celebrate') {
    const t = cele.t, pop = Math.min(1, t * 6);
    if (!L.after) T('КОМБО x' + cele.n + '!', W / 2, 84, { size: 26 * pop, color: '#ffe36b', stroke: '#a3111f', sw: 7, rot: Math.sin(t * 9) * .05 });
    T(cele.title, W / 2, L.after ? 100 : 122, { size: L.after ? 30 : 12, color: '#fff', stroke: '#16161d', sw: L.after ? 8 : 4 });
    const word = cele.kind === 'howl' ? (t > .9 ? 'АУУУ' : '') : (cele.kind === 'laugh' || t < .5) ? 'ХА' : '';
    if (word && !L.after) for (let i = 0; i < 3; i++) T(word, P.x - camR + Math.sin(t * 7 + i * 2) * 50, P.y - 110 - ((t * 60 + i * 26) % 70), { size: 11, color: '#ff8a94', stroke: '#16161d', rot: Math.sin(t * 5 + i) * .3 });
  }
  if (mode === 'dead' && modeT > 1) { T('ГАЛЯ ПАЛА', W / 2, 150, { size: 30, color: '#ff5b6b', stroke: '#16161d', sw: 8 }); T('кролики празднуют (недолго)', W / 2, 190, { size: 10, color: '#fff', stroke: '#16161d' }); if (modeT > 1.5 && (gameT * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ' : 'ЛЮБАЯ КНОПКА', W / 2, 226, { size: 10, color: '#ffe36b', stroke: '#16161d' }); }
  if (boss && L.boss && boss.won && mode === 'bossdeath') { T('ПОЛУЧЕНО: МАСКА КРОЛИКА', W / 2, 96, { size: 22, color: '#ffe36b', stroke: '#16161d', sw: 7 }); T('(ещё тёплая)', W / 2, 128, { size: 14, color: '#fff', stroke: '#16161d', sw: 5 }); }
}
function drawPlay() {
  const cx = Math.round(cam); camR = cx;
  if (L.boss) g.drawImage(bg2, 0, 0);
  else { const off = -(Math.floor(cx * .45) % 1600); for (let x = off, i = 0; x < W; x += W, i++) if (x > -W) g.drawImage(i % 2 ? bgB : bgA, x, 0); }
  g.save(); g.translate(-cx, 0);
  for (const s of splats) { if (!inView(s.x, 120)) continue; for (const r of s.rs) R(s.x + r[0], s.y + r[1], r[2], r[3], r[4]); for (const d of s.dr) R(s.x + d.x, s.y + d.y, 2, d.len, '#8e0f1c'); }
  if (!L.boss) {
    for (const d of L.deco) if (inView(d.x)) drawCase(d, true);
    if (walker) { g.globalAlpha = .6; const st = (gameT * 14 | 0) % 2; R(walker.x - 6, FY - 6 - (st ? 2 : 0), 3, 6 + (st ? 2 : 0), '#16161d'); R(walker.x + 4, FY - 6 - (st ? 0 : 2), 3, 6 + (st ? 0 : 2), '#16161d'); g.globalAlpha = 1; drawCase({ x: walker.x, y: FY - 6 - st, ci: walker.ci, s: .8, open: false, bump: 0 }, true); }
    for (const s of L.signs) if (inView(s.x + s.w / 2, 200)) drawSign(s);
    for (const c of L.checks) if (inView(c.x)) drawCheck(c);
    if (inView(L.gateX, 140)) drawGate();
    for (const p of L.pits) if (p[1] > cx && p[0] < cx + W) drawSpikes(p[0] + 4, H - 13, p[1] - p[0] - 8);
  }
  for (const s of L.solids) if (s.x + s.w > cx - 4 && s.x < cx + W + 4) drawSolid(s);
  if (!L.boss) { for (const sp of L.spikes) drawSpikes(sp.x, sp.y, sp.w); for (const z of L.zaps) if (inView(z.x)) drawZap(z); }
  for (const s of stains) if (s.x > cx - 10 && s.x < cx + W + 10) R(s.x, s.y, s.w, s.h, s.c);
  for (const c of L.cases) if (inView(c.x)) drawCase(c);
  for (const p of pickups) {
    if (!inView(p.x)) continue; const bob = p.rest ? Math.round(Math.sin(gameT * 5 + p.x) * 2) - 3 : 0;
    spr(p.k, p.x, p.y + bob, false);
  }
  for (const q of gibs) if (q.rest && inView(q.x)) drawGib(q);
  for (const r of L.rabbits) drawRabbit(r);
  drawBoss();
  if (!(mode === 'dead' && P.y > H + 120)) drawPlayer();
  for (const q of gibs) if (!q.rest && inView(q.x)) drawGib(q);
  for (const p of parts) R(p.x, p.y, p.s, p.s, p.c);
  for (const f of fxs) { const k = f.t / f.max, r = 8 + k * 26; g.strokeStyle = k < .5 ? '#fff' : '#ffe36b'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .3; g.moveTo(f.x + Math.cos(a) * r * .5, f.y + Math.sin(a) * r * .5); g.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); } g.stroke(); }
  drawIce(); drawTikhon(); drawSouls();
  g.restore();
  drawBubbles();
  for (const f of floats) { const a = clamp((f.max - f.t) * 4, 0, 1); T(f.s, f.scr ? f.x : f.x - camR, f.y, { size: f.size, color: f.color, stroke: f.stroke, rot: f.rot, a, sw: 3 }); }
  drawHud();
}
let titleAnim = Math.random() < .5 ? 'shake' : 'vodka';
function drawTitle() {
  g.drawImage(bgA, 0, 0); g.fillStyle = 'rgba(6,6,24,.45)'; g.fillRect(0, 0, W, H);
  R(0, FY, W, H - FY, '#141a2c'); g.fillStyle = pats.panel; g.fillRect(0, FY + 8, W, H); g.fillStyle = pats.hz; g.fillRect(0, FY + 2, W, 6); R(0, FY, W, 2, '#a9bddb');
  const t = sceneT;
  { const fr = idleFrame(titleAnim, t); if (fr[1]) { drawWiggle(atlas, fr[0], 170, FY, false, t); drawNotes(170, FY, 1); } else spr(fr[0], 170, FY, false); }
  ['r_sit', 'r_give', 'r_sit', 'r_tremble', 'r_sit'].forEach((n, i) => { const x = 430 + i * 62, hop = ((t + i * .37) % 2.2) < .3 ? -Math.sin(((t + i * .37) % 2.2) / .3 * Math.PI) * 6 : 0; spr(n, x, FY + hop, true); });
  drawCase({ x: 300, y: FY, ci: 1, scale: 1, open: false, bump: 0 }); drawCase({ x: 760, y: FY, ci: 2, scale: 1, open: false, bump: 0 }); drawCase({ x: 752, y: FY - 34, ci: 0, scale: .8, open: false, bump: 0 });
  bubble('привет! :)', 492, FY - 54, { size: 8 });
  const y = 112 + Math.sin(t * 2) * 4;
  T('ГАЛЯ МЕН', W / 2 + 5, y + 6, { size: 64, color: '#0a1a4a' });
  T('ГАЛЯ МЕН', W / 2, y, { size: 64, color: '#ffe36b', stroke: '#16161d', sw: 12 });
  T('ГАЛЯ МЕН', W / 2, y - 3, { size: 64, color: '#fff7c2', a: .55 });
  T('СЕЗОН ШАПОК', W / 2, 168, { size: 16, color: '#ff6b7a', stroke: '#16161d', sw: 5 });
  T('Кролики никому не мешали. Но Галя узнала, где они живут.', W / 2, 198, { size: 8, color: '#bff7ee', stroke: '#16161d' });
  if ((t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ, ЧТОБЫ НАЧАТЬ' : 'НАЖМИ ENTER ИЛИ ПРОБЕЛ', W / 2, 238, { size: 12, color: '#fff', stroke: '#16161d', sw: 4 });
  T(TOUCH ? '' : 'M — звук   P — пауза', W - 10, H - 10, { size: 7, color: '#8f9ad0', align: 'right' });
}
let selI = 0;
const slotCount = () => Math.max(6, Math.ceil((LEVELS.length + 1) / 3) * 3);
const slotRect = i => [70 + (i % 3) * 226, 86 + (i / 3 | 0) * 150, 208, 130];
function drawSelect() {
  R(0, 0, W, H, '#0a1030'); for (let y = 0; y < H; y += 6) R(0, y, W, 2, '#0d1640');
  T('ВЫБЕРИ УРОВЕНЬ', W / 2, 44, { size: 20, color: '#ffe36b', stroke: '#16161d', sw: 6 });
  const n = slotCount(), row0 = Math.max(0, Math.min((selI / 3 | 0) - 1, Math.ceil(n / 3) - 2));
  for (let i = row0 * 3; i < Math.min(n, row0 * 3 + 6); i++) {
    const r = slotRect(i - row0 * 3), x = r[0], y = r[1], w = r[2], h = r[3], lv = LEVELS[i], open = lv && i < unlocked;
    R(x - 4, y - 4, w + 8, h + 8, i === selI ? ((sceneT * 6 | 0) % 2 ? '#ffe36b' : '#fff') : open ? '#39e0d0' : '#2a3350');
    R(x, y, w, h, open ? '#1b2a6b' : '#11162a');
    T('ЭТАП ' + (i + 1), x + w / 2, y + 18, { size: 9, color: open ? '#39e0d0' : '#566a92' });
    if (lv) {
      wrap(lv.name, 15).forEach((ln, j) => T(ln, x + w / 2, y + 44 + j * 16, { size: 10, color: open ? '#fff' : '#566a92' }));
      if (open) { spr('r_sit', x + 26, y + h - 6, false); T(i < unlocked - 1 ? 'ПРОЙДЕН' : (lv.sub || ''), x + w / 2 + 14, y + h - 22, { size: 7, color: i < unlocked - 1 ? '#3ddc6a' : '#ffd0e8' }); if (lv.author) T('автор: ' + lv.author, x + w / 2 + 14, y + h - 10, { size: 6, color: '#8f9ad0' }); }
      else { drawCase({ x: x + 26, y: y + h - 8, ci: 4, scale: .8, open: false, bump: 0 }); T('ЗАКРЫТ', x + w / 2 + 14, y + h - 26, { size: 8, color: '#ff6b6b' }); T('пройди этап ' + i, x + w / 2 + 14, y + h - 12, { size: 6, color: '#566a92' }); }
    } else { T('СКОРО', x + w / 2, y + 58, { size: 12, color: '#566a92' }); T('место для', x + w / 2, y + 86, { size: 7, color: '#3d4d6e' }); T('твоего уровня', x + w / 2, y + 100, { size: 7, color: '#3d4d6e' }); }
  }
  T(TOUCH ? 'тапни по уровню' : 'стрелки — выбрать, ENTER — играть', W / 2, H - 20, { size: 8, color: '#8f9ad0' });
}
function drawBossIntro() {
  const t = sceneT;
  R(0, 0, W, H, '#12061e'); for (let i = 0; i < 12; i++) { const y = ((i * 44 + t * 240) % (H + 44)) - 44; R(0, y, W, 16, i % 2 ? '#2a0f44' : '#1d0a33'); }
  R(0, 150, W, 150, '#07030d'); R(0, 150, W, 3, '#ff5b6b'); R(0, 297, W, 3, '#ff5b6b');
  const x = t < .7 ? W + 100 - (W - 150) * (t / .7) : 250;
  spr('b_wave', x, 296 - (t > .7 ? Math.abs(Math.sin(t * 5)) * 4 : 0), false);
  const nm = 'ПУШИСТИК', n = clamp(((t - .9) * 9 | 0), 0, nm.length);
  T(nm.slice(0, n), 380, 196, { size: 30, color: '#fff', align: 'left', stroke: '#16161d', sw: 6 });
  if (t > 2) T('он просто хотел дружить', 382, 234, { size: 9, color: '#ffd0e8', align: 'left' });
  if (t > 2.5) T('ОПАСНОСТЬ: 0/10', 382, 256, { size: 8, color: '#8fdcff', align: 'left' });
  if (t > 2.9) T('МИЛОТА: 10/10', 382, 270, { size: 8, color: '#8fdcff', align: 'left' });
  if (t > 3.3) T('ВИНА ГАЛИ: БЕСКОНЕЧНА', 382, 284, { size: 8, color: '#ff8a94', align: 'left' });
}
function rankOf() { const k = stats.kills; return k >= 30 ? 'КРОЛИЧИЙ АПОКАЛИПСИС' : k >= 22 ? 'МЯСНИК ИЗ ДЕРЕВНИ' : k >= 12 ? 'ЛЮБИТЕЛЬНИЦА РАГУ' : 'ПОЧТИ ВЕГАН (ПОДОЗРИТЕЛЬНО)'; }
let credits = null;
function drawEnding() {
  const t = sceneT; R(0, 0, W, H, '#07060d');
  if (!credits) {
    if (t > .6) T('ГАЛЯ ПОБЕДИЛА.', W / 2, 70, { size: 26, color: '#fff' });
    if (t > 2.6) T('Довольна?', W / 2, 108, { size: 14, color: '#ff8a94' });
    const mm = (stats.time / 60 | 0) + ':' + String(stats.time % 60 | 0).padStart(2, '0');
    const rows = [['ШАПОК', stats.hats], ['ЧЕМОДАНОВ', stats.cases + '/' + stats.casesTotal], ['МОРКОВОК ОТОБРАНО', stats.carrots], ['ЛУЧШЕЕ КОМБО', 'x' + stats.best], ['КРОЛИКОВ ВЫЖИЛО', stats.l1left ? stats.l1left + ' (ОНИ ВСЁ ВИДЕЛИ)' : 'НИ ОДНОГО'], ['ВРЕМЯ', mm]];
    rows.forEach((r, i) => { if (t > 4.4 + i * .5) { T(r[0], W / 2 - 14, 152 + i * 24, { size: 10, color: '#8f9ad0', align: 'right' }); T(String(r[1]), W / 2 + 14, 152 + i * 24, { size: 10, color: '#ffe36b', align: 'left' }); } });
    if (t > 8) T('РАНГ: ' + rankOf(), W / 2, 316, { size: 14, color: '#3ddc6a', stroke: '#16161d', sw: 5 });
    if (t > 9 && (t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ — ТИТРЫ' : 'ENTER — ТИТРЫ', W / 2, 360, { size: 10, color: '#fff' });
    if (P.masked) spr('g_mask' + ((t / .35 | 0) % 3), 90, 430 - Math.abs(Math.sin(t * 6)) * 4, false, { img: galB[3] });
    else spr((t / .19 | 0) % 2 ? 'g_dance2' : 'g_dance1', 90, 430 - Math.abs(Math.sin(t * 16)) * 5, (t / .76 | 0) % 2 === 1, { img: galB[2] });
  } else {
    const y0 = H + 20 - (t - credits.t0) * 30;
    credits.rows.forEach((r, i) => { const y = y0 + r.y; if (y > -20 && y < H + 20) { if (r.b) T(r.a, W / 2 - 12, y, { size: 9, color: '#fff', align: 'right' }), T(r.b, W / 2 + 12, y, { size: 8, color: '#8f9ad0', align: 'left' }); else T(r.a, W / 2, y, { size: r.size || 10, color: r.color || '#ffe36b' }); } });
    const endY = y0 + credits.h;
    if (endY < H / 2) { T('КОНЕЦ', W / 2, H / 2 - 20, { size: 30, color: '#fff' }); if ((t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ — ЕЩЁ РАЗ, ЧУДОВИЩЕ' : 'ENTER — ЕЩЁ РАЗ, ЧУДОВИЩЕ', W / 2, H / 2 + 24, { size: 10, color: '#ff8a94' }); credits.done = true; }
    const wx = ((t * 70) % (W + 120)) - 60, st = (t * 14 | 0) % 2;
    R(wx - 6, H - 12 - (st ? 2 : 0), 3, 8, '#cfd8e6'); R(wx + 4, H - 12 - (st ? 0 : 2), 3, 8, '#cfd8e6'); drawCase({ x: wx, y: H - 10 - st, ci: 3, scale: .8, open: false, bump: 0 });
  }
}
function makeCredits() {
  const rows = []; let y = 0; const add = (a, b, o) => { rows.push(Object.assign({ a, b, y }, o || {})); y += (o && o.gap) || 22; };
  add('ПОМНИМ. СКОРБИМ.', null, { size: 16, gap: 40 });
  memorial.forEach(m => add(m[0].toUpperCase(), m[1]));
  y += 30; add('В РОЛЯХ', null, { size: 14, gap: 34 });
  add('ГАЛЯ', 'Галя'); add('КРОЛИКИ', 'кролики'); add('МОРОЖЕНЩИК', 'никто не знает, кто это'); add('ЧЕМОДАНЫ', 'чемоданы'); add('СКОВОРОДКА', 'чугун, 3 кг');
  y += 30; add('ПРИ СОЗДАНИИ ИГРЫ', null, { size: 9, color: '#bff7ee', gap: 18 }); add('НИ ОДИН КРОЛИК НЕ ПОСТРАДАЛ', null, { size: 9, color: '#bff7ee', gap: 26 }); add('(пострадали все)', null, { size: 8, color: '#ff8a94', gap: 60 });
  add('ДЛЯ ГАЛИ, С ЛЮБОВЬЮ', null, { size: 10, color: '#ffd0e8', gap: 40 });
  return { rows, h: y, t0: sceneT, done: false };
}
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  OV.length = 0;
  if (scene === 'load') T('ЗАГРУЗКА…', W / 2, H / 2, { size: 12 });
  else if (scene === 'title') drawTitle();
  else if (scene === 'select') drawSelect();
  else if (scene === 'play') drawPlay();
  else if (scene === 'bossintro') drawBossIntro();
  else if (scene === 'ending') drawEnding();
  if (paused) { OV.push(c => { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H); }); T('ПАУЗА', W / 2, H / 2, { size: 24 }); }
  // blit low-res world, then crisp overlay
  const sx = shake > .3 ? rnd(-shake, shake) : 0, sy = shake > .3 ? rnd(-shake, shake) * .7 : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(buf, 0, 0, W, H, Math.round(sx * K), Math.round(sy * K), cv.width, cv.height);
  ctx.setTransform(K, 0, 0, K, sx * K, sy * K);
  for (const f of OV) f(ctx);
  ctx.setTransform(K, 0, 0, K, 0, 0);
  for (const l of lens) {
    const k = l.t / l.max, a = .8 * (1 - k * k); ctx.fillStyle = 'rgba(176,14,30,' + a.toFixed(3) + ')';
    for (let i = 0; i < l.n; i++) { const ox = Math.sin(l.sd + i * 2.4) * l.r * .7, oy = Math.cos(l.sd + i * 1.7) * l.r * .5, rr = l.r * (1 - i * .18); ctx.beginPath(); ctx.arc(l.x + ox, l.y + oy, rr, 0, 6.3); ctx.fill(); }
    const dl = Math.min(l.drip, l.t * 40); ctx.fillRect(l.x - l.r * .18, l.y, l.r * .36, dl + l.r * .5); ctx.beginPath(); ctx.arc(l.x, l.y + dl + l.r * .5, l.r * .24, 0, 6.3); ctx.fill();
  }
  if (flash > 0) { ctx.fillStyle = (scene === 'play' && boss && boss.dead ? 'rgba(255,255,255,' : 'rgba(255,60,70,') + clamp(flash, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + clamp(fade, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
}

// ---------- main loop ----------
function step(dt) {
  gameT += dt; sceneT += dt;
  if (fadeDir) { fade += fadeDir * dt * 2.6; if (fade >= 1 && fadeDir === 1) { fade = 1; fadeDir = -1; const cb = fadeCb; fadeCb = null; if (cb) cb(); } else if (fade <= 0) { fade = 0; fadeDir = 0; } }
  shake = Math.max(0, shake - dt * 34); flash = Math.max(0, flash - dt * 1.8);
  const go = hit('S') || hit('J') || hit('A') || hit('T');
  switch (scene) {
    case 'title': if (sceneT > .4 && go && !fadeDir) { sfx.ok(); fadeTo(() => { scene = 'select'; sceneT = 0; selI = Math.min(unlocked, LEVELS.length) - 1; }); } break;
    case 'select': {
      const n = slotCount(); let ok = hit('S') || hit('A');
      if (hit('L')) { selI = (selI + n - 1) % n; sfx.select(); } if (hit('R')) { selI = (selI + 1) % n; sfx.select(); }
      if (hit('D')) { selI = (selI + 3) % n; sfx.select(); } if (hit('J')) { selI = (selI + n - 3) % n; sfx.select(); }
      if (hit('T')) { const row0 = Math.max(0, Math.min((selI / 3 | 0) - 1, Math.ceil(n / 3) - 2)); for (let i = 0; i < 6; i++) { const r = slotRect(i); if (tapX > r[0] && tapX < r[0] + r[2] && tapY > r[1] && tapY < r[1] + r[3]) { selI = row0 * 3 + i; ok = true; } } }
      if (sceneT > .4 && ok && !fadeDir) { if (LEVELS[selI] && selI < unlocked) { sfx.ok(); const i = selI; fadeTo(() => startLevel(i)); } else sfx.buzz(); }
      break;
    }
    case 'play': updatePlay(dt * slow); break;
    case 'bossintro':
      if (sceneT > .9 && sceneT < 1.8 && ((sceneT - .9) * 9 | 0) !== ((sceneT - dt - .9) * 9 | 0)) sfx.blip();
      if (sceneT > 2 && sceneT - dt <= 2) { [1047, 1319, 1568, 2093].forEach((f, i) => tn('sine', f, f, .3, .15, i * .08)); }
      if ((sceneT > 4.4 || (sceneT > 1.2 && go)) && !fadeDir) fadeTo(startBoss);
      break;
    case 'ending':
      if (!credits) { if (sceneT > 9 && go) { credits = makeCredits(); sfx.ok(); } }
      else if ((credits.done || sceneT - credits.t0 > 8) && go && !fadeDir) fadeTo(() => { credits = null; stopSong(); curLevel = 0; newGame(); scene = 'select'; sceneT = 0; selI = Math.min(unlocked, LEVELS.length) - 1; });
      break;
  }
}
let lastTs = 0, acc = 0;
const STEP = 1 / 60;
function frame(ts) {
  requestAnimationFrame(frame);
  const now = ts / 1000; let dt = Math.min(.1, now - lastTs); lastTs = now; if (!(dt > 0)) dt = STEP;
  if (hit('M')) { toggleMute(); pressed.M = false; }
  if (hit('P')) { if (scene === 'play') paused = !paused; pressed.P = false; }
  if (!paused) {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 5) { step(STEP); acc -= STEP; n++; for (const k in pressed) pressed[k] = false; anyPress = false; }
    if (n === 5) acc = 0;
  } else { for (const k in pressed) pressed[k] = false; anyPress = false; }
  render(); musicTick();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && scene === 'play' && mode === 'play') paused = true; });

Promise.all([loadImg(A.atlas), loadImg(A.bg1), loadImg(A.bg2), (document.fonts && document.fonts.load ? Promise.race([document.fonts.load('10px PS2P', 'Галя Men 123'), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve())])
  .then(r => { atlas = r[0]; bg1 = r[1]; bg2 = r[2]; buildArt(); newGame(); scene = 'title'; sceneT = 0; })
  .catch(e => { console.error(e); });
requestAnimationFrame(frame);

window.__dbg = {
  get s() { return { scene, mode, x: P.x, y: P.y, hp: P.hp, kills: stats && stats.kills, hats: stats && stats.hats, boss: boss && { hp: boss.hp, state: boss.state, phase: boss.phase, x: boss.x }, cam, rabbits: L && L.rabbits.length, chain, fade }; },
  warp(x, y) { P.x = x; P.y = y === undefined ? FY : y; P.vx = P.vy = 0; cam = clamp(x - 360, 0, L.w - W); },
  god(v) { P.maxhp = v ? 99 : 5; P.hp = P.maxhp; },
  start() { startLevel(0); }, tikhon() { startTikhon(); }, soul() { souls.push({ x: P.x + 60, y: P.y - 20, t: 0, sc: 1, s: 'я тебя прощаю, Галина…' }); }, cele(k) { cele.n = 4; startCelebrate(); if (k) cele.kind = k; }, idle(k) { P.idleT = 4; P.idleAnim = k; P.idleA = 0; }, boss() { startBoss(); }, bosshp(n) { boss.hp = n; }, ending() { startEnding(); },
  skip() { iceSeen = true; fallCase = true; }, L: () => L, P, songs: SONGS, n2f: N2F, audio: () => AC && { state: AC.state, song: song && song.name }
};
