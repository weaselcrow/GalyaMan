'use strict';
// ГАЛЯ МЕН — шуточный платформер. Один файл, без зависимостей.
const A = window.__ASSETS, F = A.frames;
const W = 800, H = 450, FY = 386, FYB = 398;
const TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (TOUCH) document.body.classList.add('touch');

// ---------- utils ----------
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sign = v => v < 0 ? -1 : 1;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- canvases ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const g = buf.getContext('2d'); g.imageSmoothingEnabled = false;
let K = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const portrait = innerHeight > innerWidth;
  const availH = portrait ? innerHeight * 0.6 : innerHeight;
  const s = Math.min(innerWidth / W, availH / H);
  const cw = Math.max(160, Math.floor(W * s)), ch = Math.max(90, Math.floor(H * s));
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  K = cv.width / W;
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }

// ---------- input ----------
const held = {}, pressed = {};
let anyPress = false;
const KEYMAP = {
  ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R',
  ArrowUp: 'J', KeyW: 'J', Space: 'J', KeyZ: 'J',
  KeyX: 'A', KeyJ: 'A', KeyK: 'A', KeyF: 'A', ControlLeft: 'A', ControlRight: 'A',
  ArrowDown: 'D', KeyS: 'D', Enter: 'S', NumpadEnter: 'S', KeyM: 'M', KeyP: 'P', Escape: 'P'
};
function press(k) { if (!held[k]) pressed[k] = true; held[k] = true; if (k !== 'M' && k !== 'P') anyPress = true; audioInit(); }
function release(k) { held[k] = false; }
addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) press(k); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); release(k); } });
addEventListener('blur', () => { for (const k in held) held[k] = false; });
const hit = k => !!pressed[k];
const down = k => !!held[k];

// touch buttons
function bindBtn(el, k) {
  const on = e => { e.preventDefault(); el.classList.add('on'); press(k); };
  const off = e => { e.preventDefault(); el.classList.remove('on'); release(k); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
}
bindBtn(document.getElementById('bj'), 'J');
bindBtn(document.getElementById('ba'), 'A');
bindBtn(document.getElementById('bd'), 'D');
(function () {
  const el = document.getElementById('dpad'); let pid = null;
  const set = e => {
    const r = el.getBoundingClientRect(); const left = (e.clientX - r.left) < r.width / 2;
    if (left) { if (!held.L) press('L'); release('R'); } else { if (!held.R) press('R'); release('L'); }
    el.classList.add('on');
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { el.setPointerCapture(pid); } catch (_) { } set(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
  const end = e => { if (e.pointerId === pid) { pid = null; release('L'); release('R'); el.classList.remove('on'); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
document.getElementById('bm').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); toggleMute(); });
// tap / click on the game itself
let tapX = -1, tapY = -1;
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit();
  const r = cv.getBoundingClientRect();
  tapX = (e.clientX - r.left) / r.width * W; tapY = (e.clientY - r.top) / r.height * H;
  pressed.T = true; anyPress = true;
  if (e.pointerType === 'mouse') press('A');
});
cv.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') release('A'); });
addEventListener('contextmenu', e => e.preventDefault());

// ---------- audio ----------
let AC = null, master, musG, sfxG, noiseBuf, muted = false, song = null, wantSong = null;
const N2F = {};
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n, i) => { for (let o = 1; o <= 7; o++) N2F[n + o] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12); });
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return; }
  master = AC.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(AC.destination);
  musG = AC.createGain(); musG.gain.value = 0.5; musG.connect(master);
  sfxG = AC.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (wantSong) { const s = wantSong; wantSong = null; playSong(s); }
}
function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.55; document.getElementById('bm').style.opacity = muted ? .4 : 1; }
function tn(type, f0, f1, dur, vol, when, dest) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(gn); gn.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
}
function nz(when, dur, vol, type, f0, f1, q, dest) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, t);
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q || 0.7;
  const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(fl); fl.connect(gn); gn.connect(dest || sfxG); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.03);
}
function wail(dur, f0, f1, vol, vibHz, vibDepth, when) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(), bp = AC.createBiquadFilter();
  o.type = 'sawtooth'; o2.type = 'square';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o2.frequency.setValueAtTime(f0 * 1.01, t); o2.frequency.exponentialRampToValueAtTime(f1 * 1.01, t + dur);
  lfo.frequency.value = vibHz; lg.gain.value = vibDepth; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8;
  gn.gain.setValueAtTime(0.0008, t); gn.gain.linearRampToValueAtTime(vol, t + 0.03);
  gn.gain.setValueAtTime(vol, t + dur * 0.75); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(bp); o2.connect(bp); bp.connect(gn); gn.connect(sfxG);
  o.start(t); o2.start(t); lfo.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
const sfx = {
  jump() { tn('square', 280, 640, .13, .1); },
  swing() { nz(0, .13, .22, 'bandpass', 500, 2800, 1.2); },
  bonk() { [523, 1318, 2217].forEach((f, i) => tn('sine', f, f * .985, .34 - i * .08, .2 / (i + 1))); tn('triangle', 190, 90, .1, .3); },
  splat() { nz(0, .3, .5, 'lowpass', 2800, 160); tn('sine', 150, 38, .22, .45); nz(.03, .2, .22, 'bandpass', 900, 280, 3); },
  squeak() { tn('sine', 1700, 2700, .06, .16); tn('sine', 2700, 1250, .11, .16, .06); },
  hat() { tn('square', 988, 988, .07, .09); tn('square', 1319, 1319, .15, .09, .07); },
  hurt() { tn('sawtooth', 430, 100, .3, .2); nz(0, .1, .2, 'lowpass', 1200, 300); },
  blip() { tn('square', 720, 720, .035, .05); },
  blip2() { tn('square', 1100, 1100, .03, .04); },
  click() { nz(0, .03, .3, 'highpass', 3000); tn('square', 620, 930, .09, .1, .02); },
  laugh(n, base, vol) { n = n || 5; base = base || 600; for (let i = 0; i < n; i++) { const f = base - i * 24 + (i % 2) * 40; tn('sawtooth', f, f * .72, .085, vol || .15, i * .105); tn('square', f * 2, f * 1.5, .05, .04, i * .105); } },
  maniac() { for (let i = 0; i < 13; i++) { const f = 420 + Math.sin(i * .9) * 160 + i * 18; tn('sawtooth', f, f * .7, .08, .17, i * .09); tn('square', f * 2.01, f * 1.4, .05, .05, i * .09); } },
  bark() { for (let i = 0; i < 2; i++) { const t = i * .19; tn('sawtooth', 360, 110, .12, .32, t); tn('square', 180, 70, .1, .2, t); nz(t, .1, .3, 'bandpass', 1000, 420, 2); } },
  scream(d) { d = d || .8; wail(d, 1250, 760, .2, 13, 70); },
  tear() { tn('sine', 1300, 480, .09, .07); },
  splash() { nz(0, .12, .12, 'bandpass', 2400, 900, 1.5); },
  thud() { tn('sine', 115, 38, .26, .55); nz(0, .16, .3, 'lowpass', 420, 90); },
  gate() { nz(0, 1.0, .32, 'lowpass', 320, 110); tn('square', 64, 58, 1.0, .07); },
  heal() { [523, 659, 784, 1047].forEach((f, i) => tn('triangle', f, f, .11, .18, i * .07)); },
  buzz() { tn('square', 112, 100, .32, .16); tn('square', 119, 105, .32, .16); },
  select() { tn('square', 660, 660, .05, .08); },
  ok() { tn('square', 660, 660, .07, .09); tn('square', 990, 990, .14, .09, .07); },
  boom() { nz(0, 1.1, .8, 'lowpass', 2000, 50); tn('sine', 95, 22, .9, .7); nz(.05, .5, .4, 'bandpass', 700, 200, 2); },
  zap() { nz(0, .12, .12, 'highpass', 5000); tn('sawtooth', 1800, 300, .1, .06); },
  pop() { tn('sine', 500, 1400, .06, .14); },
  howl() { wail(.55, 250, 560, .22, 5, 12); wail(1.7, 560, 430, .24, 6, 26, .5); },
  moto() { tn('sawtooth', 62, 84, .1, .16); tn('square', 44, 52, .1, .1); },
  gulp() { for (let i = 0; i < 3; i++) tn('sine', 240, 130, .09, .2, i * .22); },
  aah() { nz(0, .5, .12, 'bandpass', 1400, 700, 1.2); },
  lighter() { nz(0, .03, .25, 'highpass', 4000); nz(.12, .03, .25, 'highpass', 4000); }
};

// music: tiny step sequencer. note format "A4:2" (len in 16ths), "-" = rest
const seq = s => s.trim().split(/\s+/).map(t => { const p = t.split(':'); return [p[0], +p[1] || 2]; });
const bassLine = roots => seq(roots.map(r => { const up = r[0] + (r.length === 3 ? r[1] : '') + (+r[r.length - 1] + 1); return (r + ':2 ' + up + ':2 ').repeat(4); }).join(' '));
const SONGS = {
  level: {
    bpm: 150, loop: true, tr: [
      { w: 'square', v: .075, s: seq('A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 F5:6 E5:2 D5:2 C5:2 D5:4 G4:2 B4:2 D5:2 G5:2 F5:2 D5:2 B4:2 D5:2 E5:6 D5:2 C5:2 B4:2 G#4:4 A5:4 E5:4 A5:2 G5:2 E5:4 F5:4 D5:4 F5:2 E5:2 D5:4 C5:2 F5:2 A5:2 C6:2 A5:2 F5:2 C5:2 F5:2 E5:2 G#5:2 B5:2 E6:6 -:4') },
      { w: 'triangle', v: .2, s: bassLine(['A2', 'F2', 'G2', 'E2', 'A2', 'D2', 'F2', 'E2']) }
    ], dr: 'k.h.s.h.k.k.s.h.'
  },
  boss: {
    bpm: 172, loop: true, tr: [
      { w: 'square', v: .075, s: seq('B4:4 E5:4 G5:4 F#5:2 E5:2 C5:4 E5:4 G5:4 E5:2 C5:2 D5:4 F#5:4 A5:4 G5:2 F#5:2 B4:2 D#5:2 F#5:2 B5:6 -:4 E5:2 E5:2 G5:2 E5:2 B5:4 G5:4 C5:2 C5:2 E5:2 C5:2 G5:4 E5:4 D5:2 D5:2 F#5:2 D5:2 A5:4 F#5:4 B5:2 A5:2 G5:2 F#5:2 D#5:4 B4:4') },
      { w: 'sawtooth', v: .07, s: seq(['E2', 'C2', 'D2', 'B1', 'E2', 'C2', 'D2', 'B1'].map(r => (r + ':1 -:1 ' + r + ':1 ' + r + ':1 ').repeat(4)).join(' ')) }
    ], dr: 'k.hhs.h.kkh.s.hh'
  },
  ice: {
    bpm: 76, loop: true, tr: [
      { w: 'sine', v: .2, dec: 1, s: seq('C6:2 E6:2 G6:2 E6:2 G6:2 C7:2 B6:2 G6:2 E6:2 D6:6 F6:2 A6:2 C7:2 A6:2 F6:2 D6:2 G6:2 B6:2 D7:2 C7:6') },
      { w: 'triangle', v: .1, dec: 1, s: seq('C5:6 C5:6 G4:6 G4:6 F4:6 F4:6 G4:6 C5:6') }
    ]
  },
  dance: {
    bpm: 168, loop: true, tr: [
      { w: 'square', v: .09, s: seq('A4:1 C5:1 E5:1 C5:1 A4:1 C5:1 E5:2 D5:1 F5:1 A5:1 F5:1 D5:1 F5:1 A5:2 E5:1 G#5:1 B5:1 G#5:1 E5:1 G#5:1 B5:2 A5:2 E5:2 A5:2 -:2') },
      { w: 'triangle', v: .22, s: seq('A2:2 E3:2 A2:2 E3:2 D3:2 A3:2 D3:2 A3:2 E3:2 B3:2 E3:2 B3:2 A2:2 E3:2 A2:2 E3:2') }
    ], dr: 'k.s.k.s.'
  },
  win: {
    bpm: 132, loop: false, tr: [
      { w: 'square', v: .1, s: seq('C5:2 E5:2 G5:2 C6:4 G5:2 C6:2 E6:8') },
      { w: 'triangle', v: .2, s: seq('C3:6 G3:4 C3:2 C4:10') }
    ]
  },
  sad: {
    bpm: 62, loop: true, tr: [
      { w: 'sine', v: .16, dec: 1, s: seq('E5:4 C5:4 A4:4 C5:4 D5:4 B4:4 G4:8 F5:4 D5:4 B4:4 D5:4 C5:4 A4:4 E4:8') },
      { w: 'triangle', v: .12, s: seq('A2:16 G2:16 F2:16 E2:16') }
    ]
  }
};
function playSong(name) {
  if (!AC) { wantSong = name; return; }
  if (song && song.name === name) return;
  stopSong(); if (!name) return;
  const d = SONGS[name], gn = AC.createGain(); gn.connect(musG);
  const t0 = AC.currentTime + 0.06;
  song = { name, d, g: gn, step: 60 / d.bpm / 4, tr: d.tr.map(t => ({ t, i: 0, time: t0 })), dr: d.dr ? { i: 0, time: t0 } : null };
}
function stopSong() {
  wantSong = null;
  if (song && AC) { const o = song; o.g.gain.setTargetAtTime(0, AC.currentTime, 0.03); setTimeout(() => { try { o.g.disconnect(); } catch (e) { } }, 400); }
  song = null;
}
function mnote(type, f, t, dur, v, dest, dec) {
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.value = f;
  gn.gain.setValueAtTime(0.0008, t); gn.gain.linearRampToValueAtTime(v, t + 0.008);
  if (dec) gn.gain.exponentialRampToValueAtTime(0.0008, t + dur * 1.6);
  else { gn.gain.setValueAtTime(v, t + Math.max(0.012, dur - 0.025)); gn.gain.linearRampToValueAtTime(0.0008, t + dur); }
  o.connect(gn); gn.connect(dest); o.start(t); o.stop(t + dur * (dec ? 1.7 : 1) + 0.03);
}
function musicTick() {
  if (!AC || !song) return;
  const now = AC.currentTime, ahead = now + 0.22;
  const lag = now - song.tr[0].time;
  if (lag > 0.25) { for (const tr of song.tr) tr.time += lag + 0.05; if (song.dr) song.dr.time += lag + 0.05; }
  for (const tr of song.tr) {
    while (tr.time < ahead) {
      if (tr.i >= tr.t.s.length) { if (song.d.loop) tr.i = 0; else { tr.time = Infinity; break; } }
      const n = tr.t.s[tr.i++], dur = n[1] * song.step;
      if (n[0] !== '-') mnote(tr.t.w, N2F[n[0]], tr.time, dur * 0.92, tr.t.v, song.g, tr.t.dec);
      tr.time += dur;
    }
  }
  const dr = song.dr;
  if (dr) while (dr.time < ahead) {
    const c = song.d.dr[dr.i++ % song.d.dr.length], t = dr.time - now;
    if (c === 'k') tn('sine', 150, 42, .11, .5, t, song.g);
    else if (c === 's') nz(t, .08, .22, 'highpass', 1800, 0, .7, song.g);
    else if (c === 'h') nz(t, .025, .1, 'highpass', 7000, 0, .7, song.g);
    dr.time += song.step;
  }
}

// ---------- hi-res overlay (text, bubbles) ----------
const OV = [];
function T(s, x, y, o) {
  o = o || {};
  OV.push(c => {
    c.save();
    if (o.rot) { c.translate(x, y); c.rotate(o.rot); c.translate(-x, -y); }
    if (o.a !== undefined) c.globalAlpha = clamp(o.a, 0, 1);
    c.font = (o.size || 10) + 'px PS2P,monospace'; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.sw || 3; c.strokeStyle = o.stroke; c.strokeText(s, x, y); }
    if (o.shadow) { c.fillStyle = o.shadow; c.fillText(s, x + (o.sd || 2), y + (o.sd || 2)); }
    c.fillStyle = o.color || '#fff'; c.fillText(s, x, y);
    c.restore();
  });
}
function wrap(s, max) {
  const out = []; let cur = '';
  for (const w of String(s).split(' ')) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur); return out;
}
// Реплики сначала копятся, потом раскладываются разом: важные первыми, остальные сдвигаются
// вверх, чтобы не перекрывать друг друга. Если места нет, реплика кролика просто не показывается.
const BUBS = [];
function bubble(s, x, y, o) { BUBS.push({ s, x, y, o: o || {} }); }
function flushBubbles(px) {
  BUBS.sort((a, b) => ((b.o.prio || 0) - (a.o.prio || 0)) || (Math.abs(a.x - px) - Math.abs(b.x - px)));
  const placed = []; let small = 0;
  for (const B of BUBS) {
    const o = B.o, size = o.size || 9, lines = wrap(B.s, o.max || 18), low = (o.prio || 0) <= 1;
    const wdt = Math.max.apply(null, lines.map(l => l.length)) * size + 14, hgt = lines.length * (size + 4) + 8;
    let bx = clamp(B.x - wdt / 2, 4, W - wdt - 4), by = Math.max(4, B.y - hgt - 9), ok = false;
    if (low && small >= 3) continue;
    for (let k = 0; k < 7; k++) {
      const hit = placed.find(p => bx < p[0] + p[2] + 6 && bx + wdt + 6 > p[0] && by < p[1] + p[3] + 6 && by + hgt + 6 > p[1]);
      if (!hit) { ok = true; break; }
      by = hit[1] - hgt - 12;
      if (by < 40) break;
    }
    if (!ok) { if (low || (o.prio || 0) < 4) continue; by = Math.max(4, B.y - hgt - 9); }
    placed.push([bx, by, wdt, hgt]); if (low) small++;
    const tipY = Math.max(by + hgt + 10, B.y + 1);
    if (o.shake) { bx += rnd(-o.shake, o.shake); by += rnd(-o.shake, o.shake); }
    const tx = clamp(B.x, bx + 9, bx + wdt - 9), bg = o.bg || '#fff', fg = o.color || '#16161d';
    OV.push(c => {
      c.fillStyle = '#16161d'; c.fillRect(bx - 2, by - 2, wdt + 4, hgt + 4);
      c.beginPath(); c.moveTo(tx - 7, by + hgt + 1); c.lineTo(tx + 7, by + hgt + 1); c.lineTo(tx, tipY); c.fill();
      c.fillStyle = bg; c.fillRect(bx, by, wdt, hgt);
      c.beginPath(); c.moveTo(tx - 4, by + hgt - 1); c.lineTo(tx + 4, by + hgt - 1); c.lineTo(tx, tipY - 5); c.fill();
      c.font = size + 'px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg;
      lines.forEach((l, i) => c.fillText(l, bx + wdt / 2, by + 5 + (size + 4) * (i + .5)));
    });
  }
  BUBS.length = 0;
}

// ---------- sprites ----------
let atlas, atlasW, bg1, bg2, bgA, bgB, galB = [];
function spr(name, x, y, flip, o) {
  const f = F[name], img = (o && o.img) || atlas;
  x = Math.round(x); y = Math.round(y);
  const sx = (o && o.sx) || 1, sy = (o && o.sy) || sx, rot = (o && o.rot) || 0;
  if (o && o.a !== undefined) g.globalAlpha = o.a;
  if (!flip && sx === 1 && sy === 1 && !rot) g.drawImage(img, f[0], f[1], f[2], f[3], x - f[4], y - f[5], f[2], f[3]);
  else {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(flip ? -sx : sx, sy);
    g.drawImage(img, f[0], f[1], f[2], f[3], -f[4], -f[5], f[2], f[3]); g.restore();
  }
  if (o && o.a !== undefined) g.globalAlpha = 1;
}
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// generated art -------------------------------------------------------
const BLOOD = ['#d81b2a', '#b3101f', '#8e0f1c', '#ff3b4b', '#c2121f'];
const CASE_COL = [['#9a5a2c', '#6e3d1c', '#c98445'], ['#b02a35', '#7c1a25', '#e0525c'], ['#2f6fa8', '#1f4a74', '#58a0d8'], ['#4d8a4a', '#2f5c30', '#7fbf6d'], ['#7a4fa0', '#50306e', '#a67fd0']];
let rabHalves = [];
let caseSpr = [], rabChunks = [], bossChunks = [], pats = {};
function makeCase(ci, open) {
  const [c, x] = mkCanvas(32, 36), col = CASE_COL[ci], O = '#1a1016';
  const r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); };
  if (!open) {
    r(11, 8, 10, 2, O); r(11, 8, 2, 5, O); r(19, 8, 2, 5, O);
    r(0, 12, 32, 24, O); r(2, 14, 28, 20, col[0]); r(2, 26, 28, 8, col[1]); r(2, 14, 28, 2, col[2]);
    r(6, 14, 3, 20, col[1]); r(23, 14, 3, 20, col[1]); r(6, 14, 3, 2, O); r(23, 14, 3, 2, O);
    r(2, 14, 3, 3, '#d9d2b0'); r(27, 14, 3, 3, '#d9d2b0'); r(2, 31, 3, 3, '#d9d2b0'); r(27, 31, 3, 3, '#d9d2b0');
    r(14, 21, 4, 4, '#f3c93a'); r(15, 22, 2, 2, O);
    if (ci % 2 === 0) { r(11, 28, 5, 4, '#e8e4d0'); r(12, 29, 3, 2, '#d84a4a'); }
    if (ci % 3 === 1) { r(18, 17, 4, 3, '#f0e060'); }
  } else {
    r(0, 0, 32, 14, O); r(2, 2, 28, 10, col[1]); r(4, 4, 24, 6, '#2a1c22'); r(2, 2, 28, 2, col[2]);
    r(0, 20, 32, 16, O); r(2, 22, 28, 12, col[0]); r(2, 28, 28, 6, col[1]); r(4, 20, 24, 4, '#2a1c22');
    r(2, 12, 2, 10, O); r(28, 12, 2, 10, O);
    r(2, 31, 3, 3, '#d9d2b0'); r(27, 31, 3, 3, '#d9d2b0');
  }
  return c;
}
function makeChunks(name, nx, ny) {
  const f = F[name], out = [], cw = Math.ceil(f[2] / nx), ch = Math.ceil(f[3] / ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const [c, x] = mkCanvas(cw, ch);
    x.drawImage(atlas, f[0] + i * cw, f[1] + j * ch, cw, ch, 0, 0, cw, ch);
    x.globalCompositeOperation = 'source-atop';
    const edge = (ex, ey, ew, eh) => { for (let k = 0; k < (ew + eh) * 1.3; k++) { x.fillStyle = pick(BLOOD); const t = Math.max(2, Math.round(Math.min(cw, ch) / 7)); x.fillRect(ex + rnd(ew) - (ew < eh ? rnd(t) : 0), ey + rnd(eh) - (eh < ew ? rnd(t) : 0), rint(1, t), rint(1, t)); } };
    if (i > 0) edge(0, 0, 2, ch); if (i < nx - 1) edge(cw - 2, 0, 2, ch);
    if (j > 0) edge(0, 0, cw, 2); if (j < ny - 1) edge(0, ch - 2, cw, 2);
    const id = x.getImageData(0, 0, cw, ch).data; let n = 0; for (let k = 3; k < id.length; k += 4) if (id[k]) n++;
    if (n > cw * ch * 0.12) out.push(c);
  }
  return out;
}
function buildArt() {
  // white silhouette atlas for hit flashes
  let c, x;
  [c, x] = mkCanvas(atlas.width, atlas.height); x.drawImage(atlas, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); atlasW = c;
  // Galya gets bloodier with every hat
  const names = Object.keys(F).filter(n => n[0] === 'g' && n[1] === '_');
  let seed = 7; const sr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const spots = []; for (let i = 0; i < 34; i++) spots.push([Math.round(sr() * 30 - 15), Math.round(-(14 + sr() * 62)), 1 + Math.floor(sr() * 3), Math.floor(sr() * 5)]);
  galB = [atlas];
  [8, 18, 34].forEach(n => {
    [c, x] = mkCanvas(atlas.width, atlas.height); x.drawImage(atlas, 0, 0); x.globalCompositeOperation = 'source-atop';
    for (const nm of names) {
      const f = F[nm]; x.save(); x.beginPath(); x.rect(f[0], f[1], f[2], f[3]); x.clip();
      for (let i = 0; i < n; i++) { const s = spots[i]; x.fillStyle = BLOOD[s[3]]; x.fillRect(f[0] + f[4] + s[0], f[1] + f[5] + s[1], s[2] + (n > 20 && i % 4 === 0 ? 2 : 0), s[2]); }
      x.restore();
    }
    galB.push(c);
  });
  // parallax background (dimmed + mirrored twin so it tiles without a seam)
  [bgA, x] = mkCanvas(W, H); x.drawImage(bg1, 0, 0); x.fillStyle = 'rgba(6,8,26,.5)'; x.fillRect(0, 0, W, H);
  [bgB, x] = mkCanvas(W, H); x.translate(W, 0); x.scale(-1, 1); x.drawImage(bgA, 0, 0);
  for (let i = 0; i < CASE_COL.length; i++) caseSpr.push([makeCase(i, false), makeCase(i, true)]);
  rabChunks = makeChunks('r_sit', 2, 2); rabHalves = makeChunks('r_sit', 1, 2);
  // tiling patterns
  [c, x] = mkCanvas(16, 6); x.fillStyle = '#e9b616'; x.fillRect(0, 0, 16, 6); x.fillStyle = '#17171f';
  for (let i = -6; i < 16; i += 8) for (let r = 0; r < 6; r++) x.fillRect(i + r, 5 - r, 4, 1);
  pats.hz = g.createPattern(c, 'repeat');
  [c, x] = mkCanvas(48, 48); x.fillStyle = '#33415e'; x.fillRect(0, 0, 48, 48); x.fillStyle = '#28344e'; x.fillRect(0, 0, 48, 2); x.fillRect(0, 0, 2, 48);
  x.fillStyle = '#3f5073'; x.fillRect(2, 2, 46, 1); x.fillRect(2, 2, 1, 46); x.fillStyle = '#1a2238';
  [[6, 6], [42, 6], [6, 42], [42, 42]].forEach(p => x.fillRect(p[0] - 1, p[1] - 1, 3, 3)); x.fillStyle = '#566a92'; [[6, 6], [42, 6], [6, 42], [42, 42]].forEach(p => x.fillRect(p[0] - 1, p[1] - 1, 2, 2));
  x.fillStyle = '#28344e'; x.fillRect(14, 20, 20, 2); x.fillRect(14, 25, 20, 2); x.fillRect(14, 30, 20, 2);
  pats.panel = g.createPattern(c, 'repeat');
}
