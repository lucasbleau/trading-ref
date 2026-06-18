// ── Color Palette ──────────────────────────────────────────────────────────
const C = {
  INK:   '#10202E', MUTED: '#5C6B7A', LINE:  '#E3E9EF',
  BULL:  '#1F9D55', BEAR:  '#D64545', TEAL:  '#0E6E7D',
  AMBER: '#C8870A', PRICE: '#16384B', PAPER: '#FBFCFD',
  VIO:   '#6B4FA0', BLUE:  '#2C6FB5'
};

// ── Math helpers ────────────────────────────────────────────────────────────
function sma(a, n) {
  return a.map((_, i) =>
    i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n
  );
}

function ema(a, n) {
  const k = 2 / (n + 1);
  let e = null;
  return a.map((v, i) => {
    if (e === null) {
      if (i >= n - 1) { e = a.slice(i - n + 1, i + 1).reduce((s, x) => s + x, 0) / n; return e; }
      return null;
    }
    e = v * k + e * (1 - k);
    return e;
  });
}

function rstd(a, n) {
  return a.map((_, i) => {
    if (i < n - 1) return null;
    const w = a.slice(i - n + 1, i + 1);
    const m = w.reduce((s, v) => s + v, 0) / n;
    return Math.sqrt(w.reduce((s, v) => s + (v - m) ** 2, 0) / n);
  });
}

function rsi(a, n = 14) {
  const o = new Array(a.length).fill(null);
  let ag = null, al = null;
  const g = [], ls = [];
  for (let i = 1; i < a.length; i++) {
    const diff = a[i] - a[i - 1];
    const gg = Math.max(diff, 0), ll = Math.max(-diff, 0);
    if (i < n) {
      g.push(gg); ls.push(ll);
      if (i === n - 1) {
        ag = g.reduce((s, v) => s + v, 0) / n;
        al = ls.reduce((s, v) => s + v, 0) / n;
        o[i] = 100 - 100 / (1 + (al ? ag / al : 99));
      }
    } else {
      ag = (ag * (n - 1) + gg) / n;
      al = (al * (n - 1) + ll) / n;
      o[i] = 100 - 100 / (1 + (al ? ag / al : 99));
    }
  }
  return o;
}

function macdCalc(a, f = 12, s = 26, sig = 9) {
  const ef = ema(a, f), es = ema(a, s);
  const ln = a.map((_, i) => ef[i] !== null && es[i] !== null ? ef[i] - es[i] : null);
  const sg = new Array(a.length).fill(null);
  const k = 2 / (sig + 1);
  let e = null; const buf = [];
  for (let i = 0; i < ln.length; i++) {
    if (ln[i] === null) continue;
    buf.push(ln[i]);
    if (e === null) {
      if (buf.length >= sig) { e = buf.slice(-sig).reduce((s, v) => s + v, 0) / sig; sg[i] = e; }
    } else { e = ln[i] * k + e * (1 - k); sg[i] = e; }
  }
  const hs = a.map((_, i) => ln[i] !== null && sg[i] !== null ? ln[i] - sg[i] : null);
  return { ln, sg, hs };
}

function stochCalc(h, l, c, n = 14, d = 3) {
  const k = c.map((_, i) => {
    if (i < n - 1) return null;
    const hh = Math.max(...h.slice(i - n + 1, i + 1));
    const ll = Math.min(...l.slice(i - n + 1, i + 1));
    return hh !== ll ? 100 * (c[i] - ll) / (hh - ll) : 50;
  });
  const dd = c.map((_, i) => {
    const w = [];
    for (let j = Math.max(0, i - d + 1); j <= i; j++) if (k[j] !== null) w.push(k[j]);
    return w.length === d ? w.reduce((s, v) => s + v, 0) / d : null;
  });
  return { k, dd };
}

function atrCalc(h, l, c, n = 14) {
  const tr = h.map((_, i) =>
    i === 0 ? h[0] - l[0] : Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]))
  );
  let a = null;
  return tr.map((t, i) => {
    if (i >= n - 1 && a === null) { a = tr.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n; return a; }
    if (a !== null) { a = (a * (n - 1) + t) / n; return a; }
    return null;
  });
}

function adxCalc(h, l, c, n = 14) {
  const N = c.length;
  const pdm = new Array(N).fill(0), mdm = new Array(N).fill(0), tr = new Array(N).fill(0);
  for (let i = 1; i < N; i++) {
    const up = h[i] - h[i - 1], dn = l[i - 1] - l[i];
    pdm[i] = up > dn && up > 0 ? up : 0;
    mdm[i] = dn > up && dn > 0 ? dn : 0;
    tr[i] = Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1]));
  }
  const pdi = new Array(N).fill(null), mdi = new Array(N).fill(null), adxl = new Array(N).fill(null);
  let atr_ = null, pp = null, mm = null;
  const dxs = [];
  for (let i = 1; i < N; i++) {
    if (i === n) { atr_ = tr.slice(1, n + 1).reduce((s, v) => s + v, 0); pp = pdm.slice(1, n + 1).reduce((s, v) => s + v, 0); mm = mdm.slice(1, n + 1).reduce((s, v) => s + v, 0); }
    else if (i > n) { atr_ -= atr_ / n; atr_ += tr[i]; pp -= pp / n; pp += pdm[i]; mm -= mm / n; mm += mdm[i]; }
    if (atr_ && i >= n) {
      const p = 100 * pp / atr_, m = 100 * mm / atr_;
      pdi[i] = p; mdi[i] = m;
      const dx = (p + m) ? 100 * Math.abs(p - m) / (p + m) : 0;
      dxs.push([i, dx]);
    }
  }
  for (let k = 0; k < dxs.length; k++) {
    if (k >= n - 1) {
      const i = dxs[k][0];
      adxl[i] = dxs.slice(k - n + 1, k + 1).reduce((s, [, d]) => s + d, 0) / n;
    }
  }
  return { adxl, pdi, mdi };
}

function vwapCalc(h, l, c, v) {
  let cp = 0, cv = 0;
  return c.map((_, i) => { const tp = (h[i] + l[i] + c[i]) / 3; cp += tp * v[i]; cv += v[i]; return cp / cv; });
}

function dmid(h, l, n) {
  return h.map((_, i) =>
    i < n - 1 ? null : (Math.max(...h.slice(i - n + 1, i + 1)) + Math.min(...l.slice(i - n + 1, i + 1))) / 2
  );
}

function ichimokuCalc(h, l) {
  const t = dmid(h, l, 9), k = dmid(h, l, 26);
  const a = t.map((tv, i) => tv !== null && k[i] !== null ? (tv + k[i]) / 2 : null);
  const b = dmid(h, l, 52);
  return { t, k, a, b };
}

function psarCalc(h, l, af0 = 0.02, afm = 0.2) {
  const n = h.length;
  const s = new Array(n).fill(null);
  let bull = true, af = af0, ep = h[0];
  s[0] = l[0] - 0.5;
  for (let i = 1; i < n; i++) {
    let cur = s[i - 1] + af * (ep - s[i - 1]);
    if (bull) {
      cur = Math.min(cur, l[i - 1], i >= 2 ? l[i - 2] : l[0]);
      if (l[i] < cur) { bull = false; cur = ep; ep = l[i]; af = af0; }
      else if (h[i] > ep) { ep = h[i]; af = Math.min(af + af0, afm); }
    } else {
      cur = Math.max(cur, h[i - 1], i >= 2 ? h[i - 2] : h[0]);
      if (h[i] > cur) { bull = true; cur = ep; ep = h[i]; af = af0; }
      else if (l[i] < ep) { ep = l[i]; af = Math.min(af + af0, afm); }
    }
    s[i] = cur;
  }
  return s;
}

function supertrendCalc(h, l, c, period = 10, mult = 3.0) {
  const a = atrCalc(h, l, c, period);
  const n = c.length;
  const st = new Array(n).fill(null), d = new Array(n).fill(null);
  const fub = new Array(n).fill(null), flb = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (a[i] === null) continue;
    const hl = (h[i] + l[i]) / 2, ub = hl + mult * a[i], lb = hl - mult * a[i];
    if (i === 0 || fub[i - 1] === null) { fub[i] = ub; flb[i] = lb; d[i] = true; st[i] = lb; continue; }
    fub[i] = ub < fub[i - 1] || c[i - 1] > fub[i - 1] ? ub : fub[i - 1];
    flb[i] = lb > flb[i - 1] || c[i - 1] < flb[i - 1] ? lb : flb[i - 1];
    d[i] = c[i] > fub[i - 1] ? true : c[i] < flb[i - 1] ? false : d[i - 1];
    st[i] = d[i] ? flb[i] : fub[i];
  }
  return { st, d };
}

// ── SVG coordinate system ──────────────────────────────────────────────────
const PX0 = 58, PX1 = 556, PYT = 46, PYB = 238;

function bounds(...arrs) {
  const vals = arrs.flat().filter(v => v !== null && v !== undefined && isFinite(v));
  if (!vals.length) return [0, 1];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const r = (hi - lo) || 1;
  return [lo - r * 0.06, hi + r * 0.06];
}

// ── SVG element builders ───────────────────────────────────────────────────
function svgFrame() {
  let g = '<rect x="0" y="0" width="600" height="280" rx="6" fill="#FFFFFF"/>';
  for (const gy of [78, 140, 202])
    g += `<line x1="44" y1="${gy}" x2="568" y2="${gy}" stroke="#F2F5F8" stroke-width="1"/>`;
  g += '<line x1="44" y1="256" x2="568" y2="256" stroke="#DCE3EA" stroke-width="1.4"/>';
  g += '<line x1="44" y1="24" x2="44" y2="256" stroke="#DCE3EA" stroke-width="1.4"/>';
  return g;
}

function svgWrap(inner) {
  const defs = `<defs>
    <marker id="ag" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${C.BULL}"/></marker>
    <marker id="ar" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="${C.BEAR}"/></marker>
  </defs>`;
  return `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">${defs}${svgFrame()}${inner}</svg>`;
}

function Lline(vals, vmin, vmax, color, w = 2.5, dash = null, x0 = PX0, x1 = PX1, yt = PYT, yb = PYB) {
  const n = vals.length; const pts = [];
  for (let i = 0; i < n; i++) {
    if (vals[i] === null || !isFinite(vals[i])) continue;
    const x = x0 + (x1 - x0) * i / (n - 1);
    const y = yt + (vmax - vals[i]) / (vmax - vmin) * (yb - yt);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (pts.length < 2) return '';
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${w}"${d} stroke-linejoin="round" stroke-linecap="round"/>`;
}

function fillBand(top, bot, vmin, vmax, color, op = 0.11) {
  const n = top.length; const a = [], b = [];
  for (let i = 0; i < n; i++) {
    if (top[i] === null || bot[i] === null) continue;
    const x = PX0 + (PX1 - PX0) * i / (n - 1);
    a.push(`${x.toFixed(1)},${(PYT + (vmax - top[i]) / (vmax - vmin) * (PYB - PYT)).toFixed(1)}`);
    b.push(`${x.toFixed(1)},${(PYT + (vmax - bot[i]) / (vmax - vmin) * (PYB - PYT)).toFixed(1)}`);
  }
  if (a.length < 2) return '';
  return `<polygon points="${a.join(' ')} ${b.reverse().join(' ')}" fill="${color}" fill-opacity="${op}" stroke="none"/>`;
}

function hlev(val, vmin, vmax, color, label = null, x0 = PX0, x1 = PX1, yt = PYT, yb = PYB, dash = '6 5') {
  const y = yt + (vmax - val) / (vmax - vmin) * (yb - yt);
  let s = `<line x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="1.6" stroke-dasharray="${dash}" stroke-linecap="round"/>`;
  if (label) s += svgTxt(x1 - 3, y - 4, label, color, 10, 'end');
  return s;
}

function svgTxt(x, y, t, color = C.MUTED, size = 12, anchor = 'start', weight = 700, bg = true) {
  let out = '';
  if (bg) {
    const w = t.length * size * 0.58 + 10;
    const rx = anchor === 'middle' ? x - w / 2 : (anchor === 'end' ? x - w + 3 : x - 5);
    out += `<rect x="${rx.toFixed(1)}" y="${(y - size).toFixed(1)}" width="${w.toFixed(1)}" height="${(size + 5).toFixed(1)}" rx="3" fill="#FFFFFF" fill-opacity="0.88"/>`;
  }
  return out + `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="Arial,sans-serif" text-anchor="${anchor}">${t}</text>`;
}

function svgDot(x, y, color, r = 4) {
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#FFFFFF" stroke="${color}" stroke-width="2.4"/>`;
}

function atXY(i, vals, vmin, vmax) {
  const n = vals.length;
  return [PX0 + (PX1 - PX0) * i / (n - 1), PYT + (vmax - vals[i]) / (vmax - vmin) * (PYB - PYT)];
}

// Figure helpers
function svgZone(pts, color) {
  return `<polygon points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${color}" fill-opacity="0.09" stroke="none"/>`;
}
function svgDline(x1, y1, x2, y2, stroke, w = 2.2, dash = '8 6') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-dasharray="${dash}" stroke-linecap="round"/>`;
}
function svgSline(x1, y1, x2, y2, stroke, w = 3) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
}
function svgArrow(x1, y1, x2, y2, color, marker) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3.4" marker-end="url(#${marker})"/>`;
}
function svgPoly(pts, stroke = C.PRICE, w = 3) {
  return `<polyline points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

// SMC helpers
function svgCandle(cx, oy, cy, hy, ly, bull, w = 12) {
  const col = bull ? C.BULL : C.BEAR;
  const top = Math.min(oy, cy), h = Math.max(Math.abs(cy - oy), 3);
  return `<line x1="${cx}" y1="${hy}" x2="${cx}" y2="${ly}" stroke="${col}" stroke-width="1.8"/><rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="1.4" fill="${col}"/>`;
}
function svgBox(x1, y1, x2, y2, color, dash = '6 5', op = 0.13) {
  return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="3" fill="${color}" fill-opacity="${op}" stroke="${color}" stroke-width="1.8" stroke-dasharray="${dash}"/>`;
}
function svgBand(x1, y1, x2, y2, color, op = 0.10) {
  return `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="${color}" fill-opacity="${op}"/>`;
}

// ── Price series generators (deterministic, realistic noise) ─────────────────
function rnd(seed) {
  // Deterministic pseudo-random [0,1) using LCG
  let s = (seed * 1664525 + 1013904223) & 0xffffffff;
  return ((s >>> 0) / 4294967296);
}

// Brownian-like price series with trend
function mkSeries(n, trend, volatility, start = 100) {
  const c = [start];
  for (let i = 1; i < n; i++) {
    // Multi-frequency noise for realistic look
    const noise = Math.sin(i * 0.23 + 1.1) * 0.45
                + Math.sin(i * 0.61 + 2.3) * 0.28
                + Math.sin(i * 1.37 + 0.7) * 0.15
                + Math.sin(i * 3.14 + 1.9) * 0.12;
    c.push(c[i - 1] + trend(i, n) + noise * volatility);
  }
  return c;
}

function withHL(c, hl = 1.2) {
  const h = c.map((v, i) => v + hl * (0.3 + Math.abs(Math.sin(i * 1.31 + 0.5)) * 0.7));
  const l = c.map((v, i) => v - hl * (0.3 + Math.abs(Math.sin(i * 1.73 + 1.2)) * 0.7));
  const v = c.map((_, i) => 0.5 + Math.abs(Math.sin(i * 0.77)) * 1.5);
  return { c, h, l, v };
}

// Clamp values so nothing escapes the SVG frame
function clamp(arr, lo, hi) {
  return arr.map(v => v === null ? null : Math.max(lo, Math.min(hi, v)));
}

// ── Indicator schemas ─────────────────────────────────────────────────────────
function s_sma() {
  // Uptrend with realistic noise
  const c = mkSeries(70, (i, n) => 0.5, 3.2);
  const m = sma(c, 20);
  const [lo, hi] = bounds(c, m);
  let inner = Lline(c, lo, hi, C.PRICE, 1.8) + Lline(m, lo, hi, C.AMBER, 2.8);
  // Label at end of each line
  const lastM = m.map((v,i) => ({v,i})).filter(x => x.v !== null).pop();
  if (lastM) inner += svgTxt(130, 62, 'SMA 20', C.AMBER, 11) + svgTxt(500, 228, 'Prix', C.PRICE, 10, 'end');
  return svgWrap(inner);
}

function s_ema() {
  const c = mkSeries(70, (i, n) => 0.48, 3.5);
  const e = ema(c, 20), m = sma(c, 20);
  const [lo, hi] = bounds(c, e, m);
  let inner = Lline(c, lo, hi, C.PRICE, 1.6)
    + Lline(m, lo, hi, C.VIO, 2.2, '7 5')
    + Lline(e, lo, hi, C.AMBER, 2.8);
  inner += svgTxt(130, 62, 'EMA 20 (réactive)', C.AMBER, 10)
    + svgTxt(320, 228, 'SMA 20 (lente)', C.VIO, 10);
  return svgWrap(inner);
}

function s_cross() {
  // Downtrend then uptrend to show both crosses
  const c = mkSeries(80, (i, n) => i < n * 0.45 ? -0.55 : 0.75, 2.8);
  const f = ema(c, 9), s = ema(c, 26);
  const [lo, hi] = bounds(c, f, s);
  let inner = Lline(c, lo, hi, C.PRICE, 1.5)
    + Lline(s, lo, hi, C.VIO, 2.4)
    + Lline(f, lo, hi, C.AMBER, 2.4);
  for (let k = 1; k < c.length; k++) {
    if (!f[k] || !s[k] || !f[k-1] || !s[k-1]) continue;
    if (f[k-1] <= s[k-1] && f[k] > s[k]) {
      // Use midpoint between fast and slow at crossing
      const yMid = (PYT + (hi - f[k]) / (hi - lo) * (PYB - PYT) + PYT + (hi - s[k]) / (hi - lo) * (PYB - PYT)) / 2;
      const x = PX0 + (PX1 - PX0) * k / (c.length - 1);
      inner += `<circle cx="${x.toFixed(1)}" cy="${yMid.toFixed(1)}" r="5" fill="#fff" stroke="${C.BULL}" stroke-width="2.4"/>`;
      inner += svgTxt(x, yMid + 22, 'Golden', C.BULL, 10, 'middle');
    }
    if (f[k-1] >= s[k-1] && f[k] < s[k]) {
      const yMid = (PYT + (hi - f[k]) / (hi - lo) * (PYB - PYT) + PYT + (hi - s[k]) / (hi - lo) * (PYB - PYT)) / 2;
      const x = PX0 + (PX1 - PX0) * k / (c.length - 1);
      inner += `<circle cx="${x.toFixed(1)}" cy="${yMid.toFixed(1)}" r="5" fill="#fff" stroke="${C.BEAR}" stroke-width="2.4"/>`;
      inner += svgTxt(x, yMid - 14, 'Death', C.BEAR, 10, 'middle');
    }
  }
  inner += svgTxt(80, 56, 'EMA rapide', C.AMBER, 10)
    + svgTxt(80, 230, 'EMA lente', C.VIO, 10);
  return svgWrap(inner);
}

function s_boll() {
  // Low volatility then high volatility
  const c = mkSeries(70, (i, n) => 0.1, i => i < 35 ? 1.2 : 4.5);
  // Rebuild with variable vol
  const cc = [100];
  for (let i = 1; i < 70; i++) {
    const vol = i < 35 ? 1.2 : 4.5;
    const noise = Math.sin(i * 0.23 + 1.1) * 0.45 + Math.sin(i * 0.61 + 2.3) * 0.28 + Math.sin(i * 1.37 + 0.7) * 0.15;
    cc.push(cc[i-1] + 0.1 + noise * vol);
  }
  const m = sma(cc, 20), sd = rstd(cc, 20);
  const up = m.map((v, i) => v !== null && sd[i] !== null ? v + 2 * sd[i] : null);
  const dn = m.map((v, i) => v !== null && sd[i] !== null ? v - 2 * sd[i] : null);
  const [lo, hi] = bounds(cc, up, dn);
  let inner = fillBand(up, dn, lo, hi, C.TEAL, 0.09)
    + Lline(up, lo, hi, C.TEAL, 1.8)
    + Lline(dn, lo, hi, C.TEAL, 1.8)
    + Lline(m,  lo, hi, C.TEAL, 1.6, '5 4')
    + Lline(cc, lo, hi, C.PRICE, 2);
  inner += svgTxt(140, 228, 'squeeze', C.MUTED, 10)
    + svgTxt(490, 60, 'expansion', C.MUTED, 10, 'end');
  return svgWrap(inner);
}

function s_keltner() {
  const base = mkSeries(70, (i) => 0.35, 3.2);
  const { c, h, l } = withHL(base, 1.4);
  const e = ema(c, 20), a = atrCalc(h, l, c, 14);
  const up = e.map((v, i) => v !== null && a[i] !== null ? v + 2 * a[i] : null);
  const dn = e.map((v, i) => v !== null && a[i] !== null ? v - 2 * a[i] : null);
  const [lo, hi] = bounds(c, up, dn);
  let inner = fillBand(up, dn, lo, hi, C.VIO, 0.09)
    + Lline(up, lo, hi, C.VIO, 1.8)
    + Lline(dn, lo, hi, C.VIO, 1.8)
    + Lline(e,  lo, hi, C.VIO, 1.6, '5 4')
    + Lline(c,  lo, hi, C.PRICE, 2);
  inner += svgTxt(130, 62, 'EMA ± 2×ATR', C.VIO, 11);
  return svgWrap(inner);
}

function s_vwap() {
  const base = mkSeries(70, (i) => 0.35, 3.5);
  const { c, h, l, v } = withHL(base, 1.3);
  const w = vwapCalc(h, l, c, v);
  const [lo, hi] = bounds(c, w);
  let inner = Lline(c, lo, hi, C.PRICE, 2)
    + Lline(w, lo, hi, C.BLUE, 2.8);
  inner += svgTxt(130, 60, 'VWAP', C.BLUE, 12);
  return svgWrap(inner);
}

function s_rsi() {
  // Oscillating series to show RSI going through zones
  const c = mkSeries(90, (i) => 0, 4.2);
  // Add oscillation to make RSI cycle through overbought/oversold
  const cc = c.map((v, i) => v + 12 * Math.sin(i * 0.18));
  const r = rsi(cc, 14).map(v => v === null ? null : Math.max(5, Math.min(95, v)));
  const vmin = 0, vmax = 100;
  let inner = hlev(70, vmin, vmax, C.BEAR, '70');
  inner += hlev(50, vmin, vmax, C.MUTED, null);
  inner += hlev(30, vmin, vmax, C.BULL, '30');
  inner += Lline(r, vmin, vmax, C.TEAL, 2.6);
  // Color background zones
  inner += `<rect x="${PX0}" y="${PYT}" width="${PX1-PX0}" height="${(PYB-PYT)*0.23}" fill="${C.BEAR}" fill-opacity="0.04"/>`;
  inner += `<rect x="${PX0}" y="${PYT+(PYB-PYT)*0.77}" width="${PX1-PX0}" height="${(PYB-PYT)*0.23}" fill="${C.BULL}" fill-opacity="0.04"/>`;
  inner += svgTxt(70, 58, 'RSI 14', C.TEAL, 11)
    + svgTxt(540, 82, 'surachat', C.BEAR, 9, 'end')
    + svgTxt(540, 232, 'survente', C.BULL, 9, 'end');
  return svgWrap(inner);
}

function s_macd() {
  // Trend reversal mid-series so MACD crosses zero
  const c = mkSeries(90, (i, n) => i < n * 0.5 ? 0.55 : -0.55, 2.5);
  const { ln, sg, hs } = macdCalc(c);
  const validVals = [...ln, ...sg].filter(v => v !== null && isFinite(v));
  if (!validVals.length) return svgWrap('');
  const m = Math.max(...validVals.map(Math.abs));
  const vmin = -m * 1.25, vmax = m * 1.25;
  const nn = hs.length;
  const zero = PYT + (vmax - 0) / (vmax - vmin) * (PYB - PYT);
  const bw = Math.max(2, (PX1 - PX0) / nn * 0.55);
  let inner = hlev(0, vmin, vmax, C.MUTED, null);
  for (let k = 0; k < nn; k++) {
    if (hs[k] === null) continue;
    const x = PX0 + (PX1 - PX0) * k / (nn - 1);
    const y = PYT + (vmax - hs[k]) / (vmax - vmin) * (PYB - PYT);
    const col = hs[k] >= 0 ? C.BULL : C.BEAR;
    const top = Math.min(y, zero);
    inner += `<rect x="${(x-bw/2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(Math.abs(y-zero),0.5).toFixed(1)}" fill="${col}" fill-opacity="0.5"/>`;
  }
  inner += Lline(ln, vmin, vmax, C.TEAL, 2.4)
    + Lline(sg, vmin, vmax, C.AMBER, 2.2);
  inner += svgTxt(80, 60, 'MACD', C.TEAL, 11)
    + svgTxt(220, 60, 'Signal', C.AMBER, 11);
  return svgWrap(inner);
}

function s_stoch() {
  // Series that creates clear overbought/oversold cycles
  const base = mkSeries(90, (i) => 0, 3.0);
  const c = base.map((v, i) => v + 10 * Math.sin(i * 0.16));
  const h = c.map((v, i) => v + 1.2 + Math.abs(Math.sin(i * 0.9)) * 0.8);
  const l = c.map((v, i) => v - 1.2 - Math.abs(Math.sin(i * 1.1)) * 0.8);
  const { k, dd } = stochCalc(h, l, c, 14, 3);
  const vmin = 0, vmax = 100;
  let inner = hlev(80, vmin, vmax, C.BEAR, '80') + hlev(20, vmin, vmax, C.BULL, '20');
  inner += `<rect x="${PX0}" y="${PYT}" width="${PX1-PX0}" height="${(PYB-PYT)*0.17}" fill="${C.BEAR}" fill-opacity="0.05"/>`;
  inner += `<rect x="${PX0}" y="${PYT+(PYB-PYT)*0.83}" width="${PX1-PX0}" height="${(PYB-PYT)*0.17}" fill="${C.BULL}" fill-opacity="0.05"/>`;
  inner += Lline(k, vmin, vmax, C.TEAL, 2.4) + Lline(dd, vmin, vmax, C.AMBER, 2, '6 4');
  inner += svgTxt(80, 60, '%K', C.TEAL, 11) + svgTxt(220, 60, '%D', C.AMBER, 11);
  return svgWrap(inner);
}

function s_atr() {
  // Low vol then shock
  const cc = [100];
  for (let i = 1; i < 70; i++) {
    const vol = i < 42 ? 1.0 : 4.8;
    const noise = Math.sin(i * 0.31 + 1.1) * 0.5 + Math.sin(i * 0.73 + 2.3) * 0.3;
    cc.push(cc[i-1] + 0.05 + noise * vol);
  }
  const { h, l } = withHL(cc, 1.5);
  const a = atrCalc(h, l, cc, 14);
  const valid = a.filter(v => v !== null);
  if (!valid.length) return svgWrap('');
  const [lo, hi] = bounds(valid);
  // Shade the two zones
  const splitIdx = 42;
  const splitX = PX0 + (PX1 - PX0) * splitIdx / (cc.length - 1);
  let inner = `<rect x="${PX0}" y="${PYT}" width="${splitX-PX0}" height="${PYB-PYT}" fill="${C.MUTED}" fill-opacity="0.04"/>`;
  inner += `<rect x="${splitX}" y="${PYT}" width="${PX1-splitX}" height="${PYB-PYT}" fill="${C.BEAR}" fill-opacity="0.04"/>`;
  inner += Lline(a, lo, hi, C.VIO, 2.8);
  inner += svgTxt(100, 228, 'faible volatilité', C.MUTED, 10)
    + svgTxt(490, 72, 'volatilité ↑', C.BEAR, 10, 'end');
  return svgWrap(inner);
}

function s_adx() {
  // Strong trend then range
  const base = mkSeries(90, (i, n) => i < n * 0.55 ? 0.9 : 0.05, 2.0);
  const { c, h, l } = withHL(base, 1.3);
  const { adxl, pdi, mdi } = adxCalc(h, l, c, 14);
  const vals = [...(adxl||[]), ...(pdi||[]), ...(mdi||[])].filter(v => v !== null && isFinite(v) && v >= 0);
  if (!vals.length) return svgWrap('<text x="300" y="140" text-anchor="middle" fill="#aaa">Chargement...</text>');
  const vmin = 0, vmax = Math.min(Math.max(...vals) * 1.15, 100);
  let inner = hlev(25, vmin, vmax, C.MUTED, '25 — seuil tendance');
  inner += Lline(pdi,  vmin, vmax, C.BULL, 2.0)
    + Lline(mdi,  vmin, vmax, C.BEAR, 2.0)
    + Lline(adxl, vmin, vmax, C.INK, 2.8);
  inner += svgTxt(80, 60, 'ADX (force)', C.INK, 11)
    + svgTxt(220, 60, '+DI', C.BULL, 10)
    + svgTxt(320, 60, '−DI', C.BEAR, 10);
  return svgWrap(inner);
}

function s_supertrend() {
  const base = mkSeries(80, (i, n) => i < n * 0.55 ? 0.75 : -0.85, 2.5);
  const { c, h, l } = withHL(base, 1.3);
  const { st, d } = supertrendCalc(h, l, c, 10, 3);
  const stValid = st.filter(v => v !== null);
  if (!stValid.length) return svgWrap('');
  const [lo, hi] = bounds(c, stValid);

  let inner = Lline(c, lo, hi, C.PRICE, 2);

  // Split SuperTrend into contiguous runs per direction — avoids crossing lines
  let segments = [], cur = null;
  for (let k = 0; k < st.length; k++) {
    if (st[k] === null) continue;
    if (!cur || d[k] !== cur.dir) {
      if (cur) segments.push(cur);
      cur = { dir: d[k], pts: [] };
    }
    const x = PX0 + (PX1 - PX0) * k / (st.length - 1);
    const y = PYT + (hi - st[k]) / (hi - lo) * (PYB - PYT);
    cur.pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  if (cur) segments.push(cur);

  for (const seg of segments) {
    const col = seg.dir ? C.BULL : C.BEAR;
    inner += `<polyline points="${seg.pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;
  }

  inner += svgTxt(90, 228, 'support dynamique', C.BULL, 10)
    + svgTxt(490, 68, 'résistance', C.BEAR, 10, 'end');
  return svgWrap(inner);
}

function s_ichimoku() {
  const base = mkSeries(90, (i, n) => i < n * 0.6 ? 0.65 : -0.6, 2.8);
  const { c, h, l } = withHL(base, 1.4);
  const { t, k, a, b } = ichimokuCalc(h, l);
  const allVals = [...(a||[]), ...(b||[])].filter(v => v !== null);
  if (!allVals.length) return svgWrap('');
  const [lo, hi] = bounds(c, allVals);
  let inner = fillBand(a, b, lo, hi, C.TEAL, 0.12);
  inner += Lline(a, lo, hi, C.BULL, 1.4)
    + Lline(b, lo, hi, C.BEAR, 1.4)
    + Lline(t, lo, hi, C.BLUE, 2.2)
    + Lline(k, lo, hi, C.AMBER, 2.2)
    + Lline(c, lo, hi, C.PRICE, 2);
  inner += svgTxt(310, 155, 'Nuage (Kumo)', C.TEAL, 10, 'middle')
    + svgTxt(80, 60, 'Tenkan', C.BLUE, 10)
    + svgTxt(80, 228, 'Kijun', C.AMBER, 10);
  return svgWrap(inner);
}

function s_sar() {
  const base = mkSeries(80, (i, n) => i < n * 0.52 ? 0.75 : -0.8, 2.5);
  const { c, h, l } = withHL(base, 1.3);
  const s = psarCalc(h, l);
  const [lo, hi] = bounds(c, h, l, s.filter(v => v !== null));
  let inner = Lline(c, lo, hi, C.PRICE, 2);
  for (let k = 0; k < c.length; k++) {
    if (s[k] === null) continue;
    const x = PX0 + (PX1 - PX0) * k / (c.length - 1);
    const ys = PYT + (hi - s[k]) / (hi - lo) * (PYB - PYT);
    // Only draw if SAR is clearly above or below price (avoid overlap)
    const yc = PYT + (hi - c[k]) / (hi - lo) * (PYB - PYT);
    if (Math.abs(ys - yc) < 3) continue;
    const col = s[k] < c[k] ? C.BULL : C.BEAR;
    inner += `<circle cx="${x.toFixed(1)}" cy="${ys.toFixed(1)}" r="2.8" fill="${col}"/>`;
  }
  inner += svgTxt(80, 228, 'SAR sous le prix (hausse)', C.BULL, 9)
    + svgTxt(490, 68, 'flip', C.BEAR, 10, 'end');
  return svgWrap(inner);
}

function s_combine() {
  const c = mkSeries(85, (i) => 0.42, 3.0);
  const e = ema(c, 20);
  const [lo, hi] = bounds(c, e);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  let inner = Lline(c, lo, hi, C.PRICE, 1.8, null, PX0, PX1, yt1, yb1)
    + Lline(e, lo, hi, C.AMBER, 2.4, null, PX0, PX1, yt1, yb1);
  // Background fill: price above EMA = green
  inner += svgTxt(80, 57, 'Tendance : EMA', C.AMBER, 10);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  const r = rsi(c, 14);
  inner += hlev(70, 2, 98, C.BEAR, null, PX0, PX1, yt2, yb2)
    + hlev(30, 2, 98, C.BULL, null, PX0, PX1, yt2, yb2)
    + Lline(r, 2, 98, C.TEAL, 2.4, null, PX0, PX1, yt2, yb2);
  inner += svgTxt(80, 182, 'Momentum : RSI', C.TEAL, 10);
  return svgWrap(inner);
}

// ── Figure chartiste schemas ──────────────────────────────────────────────
function s_triangle_asc() {
  const p = [[60,205],[105,72],[150,165],[205,72],[255,128],[320,72],[360,105],[388,73],[420,52],[470,32],[545,16]];
  let i = svgZone([[120,72],[388,72],[388,90],[150,166]], C.BULL);
  i += svgDline(90,72,388,72,C.BEAR) + svgDline(135,172,388,90,C.BULL);
  i += svgPoly(p) + svgArrow(388,72,438,44,C.BULL,'ag');
  return svgWrap(i);
}

function s_triangle_desc() {
  const p = [[60,72],[105,205],[150,108],[205,205],[255,135],[320,205],[360,160],[388,205],[420,228],[470,248],[545,264]];
  let i = svgZone([[135,100],[388,168],[388,205],[105,205]], C.BEAR);
  i += svgDline(90,205,388,205,C.BULL) + svgDline(135,100,388,168,C.BEAR);
  i += svgPoly(p) + svgArrow(388,205,438,232,C.BEAR,'ar');
  return svgWrap(i);
}

function s_triangle_sym() {
  const p = [[60,80],[105,210],[150,100],[205,185],[255,125],[320,160],[355,140],[385,150],[415,110],[460,70],[545,30]];
  let i = svgZone([[130,96],[385,145],[385,152],[90,214]], C.TEAL);
  i += svgDline(130,96,385,145,C.BEAR) + svgDline(90,214,385,152,C.BULL);
  i += svgPoly(p) + svgArrow(385,148,438,92,C.BULL,'ag');
  return svgWrap(i);
}

function s_canal_haussier() {
  const p = [[60,224],[110,142],[160,208],[210,125],[260,192],[310,108],[360,175],[410,92],[460,158]];
  let i = svgZone([[60,150],[540,70],[540,145],[60,225]], C.BULL);
  i += svgDline(60,150,540,70,C.BEAR) + svgDline(60,225,540,145,C.BULL);
  i += svgPoly(p) + svgArrow(460,158,506,80,C.BULL,'ag');
  return svgWrap(i);
}

function s_canal_baissier() {
  const p = [[60,72],[110,153],[160,87],[210,170],[260,103],[310,187],[360,120],[410,203],[460,137]];
  let i = svgZone([[60,70],[540,150],[540,225],[60,145]], C.BEAR);
  i += svgDline(60,70,540,150,C.BEAR) + svgDline(60,145,540,225,C.BULL);
  i += svgPoly(p) + svgArrow(460,137,506,205,C.BEAR,'ar');
  return svgWrap(i);
}

function s_range() {
  const p = [[60,205],[120,75],[190,205],[260,75],[330,205],[400,75],[450,140],[475,80],[510,45],[560,26]];
  let i = svgZone([[60,70],[470,70],[470,210],[60,210]], C.TEAL);
  i += svgDline(60,70,470,70,C.BEAR) + svgDline(60,210,470,210,C.BULL);
  i += svgPoly(p) + svgArrow(475,80,525,42,C.BULL,'ag');
  return svgWrap(i);
}

function s_hs() {
  const p = [[55,182],[95,112],[140,176],[195,60],[250,176],[300,108],[345,180],[375,212],[420,240],[480,256],[545,266]];
  let i = svgDline(110,177,355,180,C.MUTED);
  i += svgPoly(p) + svgArrow(352,179,402,232,C.BEAR,'ar');
  return svgWrap(i);
}

function s_hs_inv() {
  const p = [[55,98],[95,168],[140,104],[195,220],[250,104],[300,172],[345,100],[375,68],[420,40],[480,24],[545,14]];
  let i = svgDline(110,103,355,100,C.MUTED);
  i += svgPoly(p) + svgArrow(352,101,402,48,C.BULL,'ag');
  return svgWrap(i);
}

function s_double_top() {
  const p = [[50,200],[115,78],[185,172],[255,80],[320,172],[355,202],[410,236],[480,254],[545,264]];
  let i = svgDline(95,79,280,80,C.BEAR) + svgDline(160,172,335,172,C.MUTED);
  i += svgPoly(p) + svgArrow(332,172,382,224,C.BEAR,'ar');
  return svgWrap(i);
}

function s_double_bottom() {
  const p = [[50,80],[115,202],[185,108],[255,200],[320,108],[355,78],[410,44],[480,26],[545,16]];
  let i = svgDline(95,201,280,200,C.BULL) + svgDline(160,108,335,108,C.MUTED);
  i += svgPoly(p) + svgArrow(332,108,382,56,C.BULL,'ag');
  return svgWrap(i);
}

function s_rising_wedge() {
  const p = [[60,228],[105,128],[155,205],[210,108],[265,180],[320,92],[370,160],[400,102],[428,156],[470,192],[545,222]];
  let i = svgZone([[90,132],[410,84],[410,150],[130,210]], C.AMBER);
  i += svgDline(90,132,410,84,C.BEAR) + svgDline(130,210,410,150,C.BULL);
  i += svgPoly(p) + svgArrow(405,150,452,190,C.BEAR,'ar');
  return svgWrap(i);
}

function s_falling_wedge() {
  const p = [[60,52],[105,152],[155,75],[210,172],[265,100],[320,188],[370,120],[400,178],[428,124],[470,88],[545,58]];
  let i = svgZone([[90,148],[410,196],[410,130],[130,70]], C.AMBER);
  i += svgDline(90,148,410,196,C.BULL) + svgDline(130,70,410,130,C.BEAR);
  i += svgPoly(p) + svgArrow(405,130,452,90,C.BULL,'ag');
  return svgWrap(i);
}

function s_bull_flag() {
  const p = [[150,68],[188,110],[226,89],[264,131],[300,98],[340,60],[400,40],[480,24],[545,14]];
  let i = svgZone([[150,68],[290,106],[290,138],[150,100]], C.BULL);
  i += svgSline(55,250,150,68,C.BULL) + svgDline(150,68,302,109,C.BEAR) + svgDline(170,105,290,138,C.BULL);
  i += svgPoly(p) + svgArrow(300,98,345,56,C.BULL,'ag');
  return svgWrap(i);
}

function s_bear_flag() {
  const p = [[150,222],[188,180],[226,202],[264,159],[300,194],[340,232],[400,252],[480,268],[545,278]];
  let i = svgZone([[150,190],[290,152],[290,184],[150,222]], C.BEAR);
  i += svgSline(55,42,150,222,C.BEAR) + svgDline(150,190,302,149,C.BEAR) + svgDline(170,217,290,184,C.BULL);
  i += svgPoly(p) + svgArrow(300,194,345,236,C.BEAR,'ar');
  return svgWrap(i);
}

function s_pennant() {
  const p = [[150,72],[180,145],[212,95],[245,135],[278,112],[305,122],[330,98],[380,58],[450,32],[545,14]];
  let i = svgZone([[150,72],[312,120],[150,150]], C.TEAL);
  i += svgSline(55,250,150,72,C.BULL) + svgDline(150,72,312,120,C.BEAR) + svgDline(150,150,312,116,C.BULL);
  i += svgPoly(p) + svgArrow(312,118,365,62,C.BULL,'ag');
  return svgWrap(i);
}

// ── SMC schemas ──────────────────────────────────────────────────────────────
function s_structure() {
  const p = [[55,225],[110,150],[155,188],[215,112],[262,150],[325,76],[372,118],[435,46],[490,82],[545,52]];
  let i = svgPoly(p);
  for (const [x,y] of [[110,150],[215,112],[325,76],[435,46]])
    i += svgTxt(x, y-10, 'HH', C.BULL, 10, 'middle');
  for (const [x,y] of [[155,188],[262,150],[372,118]])
    i += svgTxt(x, y+18, 'HL', C.TEAL, 10, 'middle');
  i += svgArrow(490,82,540,52,C.BULL,'ag',3);
  return svgWrap(i);
}

function s_bos() {
  const cs = [[72,210,188,186,214,1],[100,188,156,152,190,1],[128,156,126,120,158,1],[156,126,150,122,156,0],[184,150,172,146,178,0],[212,172,156,150,176,1],[240,156,124,120,160,1],[268,124,96,90,128,1],[296,96,78,72,100,1],[324,78,96,74,100,0],[352,96,70,64,100,1],[380,70,52,46,74,1],[408,52,64,48,70,0],[436,64,84,60,90,0],[464,84,60,54,88,1],[492,60,46,40,64,1],[520,46,38,32,50,1]];
  let i = svgDline(122,120,300,120,C.MUTED);
  i += cs.map(c => svgCandle(...c)).join('');
  i += svgArrow(283,128,283,102,C.BULL,'ag',2.6);
  i += svgTxt(124,114,'ancien sommet',C.MUTED,10) + svgTxt(300,98,'BOS',C.BULL,12,'start');
  return svgWrap(i);
}

function s_choch() {
  const cs = [[72,215,195,192,218,1],[100,195,168,164,198,1],[128,168,140,134,172,1],[156,140,160,136,166,0],[184,160,178,156,186,0],[212,178,150,146,182,1],[240,150,128,122,154,1],[268,128,156,124,160,0],[296,156,182,152,188,0],[324,182,206,178,212,0],[352,206,224,202,230,0],[380,224,208,202,228,1],[408,208,230,204,236,0],[436,230,218,214,236,1],[464,218,236,214,242,0],[492,236,224,220,240,1],[520,224,240,220,246,0]];
  let i = svgDline(182,184,346,184,C.MUTED);
  i += cs.map(c => svgCandle(...c)).join('');
  i += svgArrow(338,178,338,206,C.BEAR,'ar',2.6);
  i += svgTxt(184,178,'dernier HL',C.MUTED,10) + svgTxt(296,174,'CHoCH',C.BEAR,12,'start');
  return svgWrap(i);
}

function s_liquidity() {
  const p = [[55,150],[100,90],[160,198],[220,90],[280,200],[340,90],[400,198],[450,140],[500,98]];
  let i = svgDline(90,90,410,90,C.BEAR) + svgDline(150,200,410,200,C.BULL);
  i += svgPoly(p);
  i += svgTxt(415,86,'BSL',C.BEAR,11) + svgTxt(415,205,'SSL',C.BULL,11);
  i += svgTxt(415,98,'liquidité',C.MUTED,9) + svgTxt(415,217,'liquidité',C.MUTED,9);
  return svgWrap(i);
}

function s_sweep() {
  const p = [[55,170],[110,102],[170,158],[232,100],[300,98],[322,58],[345,118],[385,180],[445,222],[545,252]];
  let i = svgDline(90,100,322,100,C.BEAR);
  i += `<ellipse cx="322" cy="60" rx="20" ry="14" fill="none" stroke="${C.AMBER}" stroke-width="1.8" stroke-dasharray="3 3"/>`;
  i += svgPoly(p) + svgArrow(360,150,392,190,C.BEAR,'ar',3);
  i += svgTxt(322,40,'sweep',C.AMBER,12,'middle');
  return svgWrap(i);
}

function s_inducement() {
  const p = [[55,88],[108,150],[160,108],[215,176],[265,120],[320,210],[360,150],[410,100],[470,70],[545,46]];
  let i = svgBox(298,196,346,222,C.BULL);
  i += svgDline(200,176,332,176,C.VIO) + svgPoly(p) + svgArrow(345,150,392,108,C.BULL,'ag',3);
  i += svgTxt(205,170,'IDM',C.VIO,11) + svgTxt(310,214,'OB',C.BULL,10);
  return svgWrap(i);
}

function s_ob_bull() {
  const cs = [[72,150,168,146,172,0],[100,168,186,164,190,0],[128,186,200,182,206,0],[156,200,188,184,206,0],[184,188,204,184,210,0],[212,204,150,144,208,1],[240,150,104,98,154,1],[268,104,84,78,108,1],[296,84,96,80,102,0],[324,96,140,92,146,0],[352,140,186,136,192,0],[380,186,150,144,190,1],[408,150,108,102,154,1],[436,108,88,82,112,1],[464,88,104,84,110,0],[492,104,72,66,108,1],[520,72,54,48,76,1]];
  let i = svgBox(178,188,404,204,C.BULL);
  i += cs.map(c => svgCandle(...c)).join('') + svgTxt(182,182,'OB · achat',C.BULL,11);
  return svgWrap(i);
}

function s_ob_bear() {
  const cs = [[72,130,112,108,134,1],[100,112,94,90,116,1],[128,94,80,76,98,1],[156,80,92,76,96,1],[184,92,76,72,96,1],[212,76,130,72,136,0],[240,130,176,126,182,0],[268,176,196,172,202,0],[296,196,184,180,200,1],[324,184,140,136,188,1],[352,140,94,90,144,1],[380,94,130,90,136,0],[408,130,172,126,178,0],[436,172,192,168,198,0],[464,192,176,172,198,1],[492,176,206,172,212,0],[520,206,224,202,230,0]];
  let i = svgBox(178,76,404,92,C.BEAR);
  i += cs.map(c => svgCandle(...c)).join('') + svgTxt(182,70,'OB · vente',C.BEAR,11);
  return svgWrap(i);
}

function s_breaker() {
  const p = [[55,80],[108,138],[150,104],[200,138],[235,176],[275,196],[310,150],[348,200],[405,232],[545,256]];
  let i = svgBox(96,130,372,154,C.AMBER);
  i += svgPoly(p) + svgArrow(322,158,352,196,C.BEAR,'ar',3);
  i += svgTxt(100,124,'Breaker (flip)',C.AMBER,11);
  return svgWrap(i);
}

function s_mitigation() {
  const p = [[55,205],[110,152],[155,96],[205,70],[250,118],[285,154],[320,98],[380,62],[440,42],[545,26]];
  let i = svgBox(90,142,302,166,C.BULL);
  i += svgPoly(p) + svgArrow(300,150,332,104,C.BULL,'ag',3);
  i += svgTxt(95,136,'Mitigation',C.BULL,11);
  return svgWrap(i);
}

function s_fvg() {
  const cs = [[72,200,186,182,204,1],[100,186,198,182,204,0],[128,198,182,176,202,1],[156,182,108,102,186,1],[184,108,92,86,116,1],[212,92,78,72,96,1],[240,78,104,74,108,0],[268,104,140,100,146,0],[296,140,168,136,174,0],[324,168,130,124,172,1],[352,130,96,90,134,1],[380,96,70,64,100,1],[408,70,80,64,96,0],[436,80,64,58,86,1],[464,64,44,38,68,1],[492,44,34,28,50,1],[520,34,40,28,52,0]];
  let i = svgBox(116,116,332,176,C.AMBER);
  i += cs.map(c => svgCandle(...c)).join('');
  i += svgTxt(150,150,'FVG',C.AMBER,13,'middle') + svgTxt(300,196,'comblé',C.MUTED,10,'middle');
  return svgWrap(i);
}

function s_displacement() {
  const cs = [[72,180,194,176,198,0],[100,194,178,174,198,1],[128,178,192,174,196,0],[156,192,176,172,196,1],[184,176,150,144,180,1],[212,150,108,102,154,1],[240,108,70,64,112,1],[268,70,48,42,74,1],[296,48,58,44,64,0],[324,58,72,54,78,0],[352,72,54,48,78,1],[380,54,66,50,72,0],[408,66,80,62,86,0],[436,80,60,54,86,1],[464,60,46,40,66,1],[492,46,52,40,60,0],[520,52,64,48,70,0]];
  let i = svgDline(60,172,210,172,C.MUTED);
  i += cs.map(c => svgCandle(...c)).join('');
  i += svgTxt(60,166,'structure',C.MUTED,10) + svgTxt(300,150,'Displacement',C.BULL,11,'middle');
  return svgWrap(i);
}

function s_void() {
  const p = [[55,228],[105,205],[138,108],[172,70],[216,108],[258,156],[300,120],[356,82],[420,60],[545,40]];
  let i = svgBand(128,86,196,205,C.AMBER,0.14);
  i += svgPoly(p) + svgArrow(258,156,300,120,C.MUTED,'ar',2);
  i += svgTxt(162,72,'void',C.AMBER,11,'middle') + svgTxt(248,178,'rééquilibrage',C.MUTED,10,'start');
  return svgWrap(i);
}

function s_premium() {
  let i = svgBand(64,70,548,140,C.BEAR,0.10) + svgBand(64,140,548,210,C.BULL,0.10);
  i += svgBand(64,166,548,186,C.AMBER,0.16);
  i += svgDline(64,70,548,70,C.BEAR) + svgDline(64,210,548,210,C.BULL) + svgDline(64,140,548,140,C.MUTED);
  const p = [[80,210],[150,140],[205,70],[260,120],[305,182],[350,120],[420,90],[480,72],[545,58]];
  i += svgPoly(p) + svgArrow(305,182,348,128,C.BULL,'ag',3);
  i += svgTxt(540,86,'Premium · vente',C.BEAR,11,'end') + svgTxt(72,204,'Discount · achat',C.BULL,11,'start');
  i += svgTxt(540,134,'50% · équilibre',C.MUTED,10,'end') + svgTxt(360,180,'OTE',C.AMBER,11,'start');
  return svgWrap(i);
}

function s_model() {
  let i = svgDline(80,200,250,200,C.BULL) + svgDline(300,128,545,128,C.MUTED) + svgDline(300,80,545,80,C.BEAR);
  i += svgBox(340,154,392,178,C.BULL);
  const p = [[55,150],[100,200],[150,158],[205,202],[245,222],[285,150],[322,108],[365,166],[410,108],[470,86],[545,78]];
  i += svgPoly(p);
  i += `<ellipse cx="245" cy="222" rx="16" ry="12" fill="none" stroke="${C.AMBER}" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  i += svgArrow(366,166,418,104,C.BULL,'ag',3);
  i += svgTxt(84,213,'SSL · sweep',C.BULL,10) + svgTxt(304,122,'CHoCH',C.MUTED,10);
  i += svgTxt(540,74,'BSL · cible',C.BEAR,10,'end') + svgTxt(396,170,'OB/FVG',C.BULL,10);
  return svgWrap(i);
}

// ── Volume helpers ────────────────────────────────────────────────────────────
function genVol(n, seed = 1) {
  return Array.from({length: n}, (_, i) =>
    0.4 + Math.abs(Math.sin(i * 0.71 + seed)) * 1.4 + Math.abs(Math.sin(i * 1.37 + seed * 2)) * 0.6
  );
}

function volBars(c, v, yt = 168, yb = 236) {
  const n = c.length, vmax = Math.max(...v);
  const bw = Math.max(2.5, (PX1 - PX0) / n * 0.55);
  let s = '';
  for (let k = 0; k < n; k++) {
    const x = PX0 + (PX1 - PX0) * k / (n - 1);
    const hb = (v[k] / vmax) * (yb - yt);
    const col = k === 0 || c[k] >= c[k - 1] ? C.BULL : C.BEAR;
    s += `<rect x="${(x-bw/2).toFixed(1)}" y="${(yb-hb).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(hb,1).toFixed(1)}" fill="${col}" fill-opacity="0.55"/>`;
  }
  return s;
}

// Vertical separator between price pane and VP bars
function vpSep(x = 335) {
  return `<line x1="${x}" y1="${PYT}" x2="${x}" y2="${PYB}" stroke="#DCE3EA" stroke-width="1.2"/>`;
}

function calcVP(h, l, v, nB = 20) {
  const pMin = Math.min(...l), pMax = Math.max(...h);
  const bSize = (pMax - pMin) / nB;
  const buckets = new Array(nB).fill(0);
  for (let k = 0; k < v.length; k++) {
    const idx = Math.min(Math.floor(((h[k]+l[k])/2 - pMin) / bSize), nB-1);
    buckets[Math.max(0,idx)] += v[k];
  }
  const pocIdx = buckets.indexOf(Math.max(...buckets));
  const total = buckets.reduce((s,x) => s+x, 0);
  let acc = buckets[pocIdx], loP = pocIdx, hiP = pocIdx;
  while (acc < total * 0.70 && (loP > 0 || hiP < nB-1)) {
    const aL = loP > 0 ? buckets[loP-1] : 0;
    const aH = hiP < nB-1 ? buckets[hiP+1] : 0;
    if (aH >= aL && hiP < nB-1) { hiP++; acc += aH; }
    else if (loP > 0) { loP--; acc += aL; }
    else break;
  }
  return { buckets, pocIdx, vahIdx: hiP, valIdx: loP, pMin, pMax, bSize, nB };
}

function drawVP(vp, plo, phi, prX1 = 330, barX0 = 342, barX1 = 550, labels = true) {
  const { buckets, pocIdx, vahIdx, valIdx, pMin, bSize, nB } = vp;
  const maxB = Math.max(...buckets); let s = '';
  // VA band
  const y1va = PYT + (phi - (pMin + (vahIdx+1)*bSize)) / (phi-plo) * (PYB-PYT);
  const y2va = PYT + (phi - (pMin + valIdx*bSize))     / (phi-plo) * (PYB-PYT);
  s += `<rect x="${barX0}" y="${Math.min(y1va,y2va).toFixed(1)}" width="${barX1-barX0}" height="${Math.abs(y2va-y1va).toFixed(1)}" fill="${C.TEAL}" fill-opacity="0.07"/>`;
  // Bars
  const bH = Math.max(1, (PYB - PYT) / nB * 0.82);
  for (let idx = 0; idx < nB; idx++) {
    const midP = pMin + (idx + 0.5) * bSize;
    const y = PYT + (phi - midP) / (phi-plo) * (PYB-PYT);
    const bW = (buckets[idx] / maxB) * (barX1 - barX0);
    const inVA = idx >= valIdx && idx <= vahIdx;
    const isPOC = idx === pocIdx;
    const col = isPOC ? C.BEAR : inVA ? C.TEAL : '#8CA0B3';
    s += `<rect x="${barX0}" y="${(y-bH/2).toFixed(1)}" width="${bW.toFixed(1)}" height="${bH.toFixed(1)}" fill="${col}" fill-opacity="${isPOC ? 0.9 : inVA ? 0.55 : 0.35}"/>`;
  }
  // POC line
  const yPOC = PYT + (phi - (pMin + (pocIdx+0.5)*bSize)) / (phi-plo) * (PYB-PYT);
  s += `<line x1="${prX1-22}" y1="${yPOC.toFixed(1)}" x2="${barX1}" y2="${yPOC.toFixed(1)}" stroke="${C.BEAR}" stroke-width="2" stroke-linecap="round"/>`;
  if (labels) s += svgTxt(barX1-2, yPOC-4, 'POC', C.BEAR, 10, 'end');
  // VAH
  const yVAH = PYT + (phi - (pMin + (vahIdx+1)*bSize)) / (phi-plo) * (PYB-PYT);
  s += `<line x1="${prX1-12}" y1="${yVAH.toFixed(1)}" x2="${barX1}" y2="${yVAH.toFixed(1)}" stroke="${C.TEAL}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  if (labels) s += svgTxt(barX1-2, yVAH-4, 'VAH', C.TEAL, 9, 'end');
  // VAL
  const yVAL = PYT + (phi - (pMin + valIdx*bSize)) / (phi-plo) * (PYB-PYT);
  s += `<line x1="${prX1-12}" y1="${yVAL.toFixed(1)}" x2="${barX1}" y2="${yVAL.toFixed(1)}" stroke="${C.TEAL}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  if (labels) s += svgTxt(barX1-2, yVAL+12, 'VAL', C.TEAL, 9, 'end');
  return s;
}

// ── Volume schemas ────────────────────────────────────────────────────────────
function s_vol_base() {
  const c = mkSeries(60, () => 0.32, 3.2);
  const v = genVol(60, 1.7);
  const [lo, hi] = bounds(c);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, PX1, yt1, yb1);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  inner += volBars(c, v, yt2, yb2);
  inner += svgTxt(80, 57, 'Prix', C.PRICE, 10) + svgTxt(80, 182, 'Volume', C.MUTED, 10);
  return svgWrap(inner);
}

function s_rvol() {
  const c = mkSeries(60, () => 0.28, 3.0);
  const v = genVol(60, 2.1);
  // Spike at ~index 45
  const vs = v.map((x, i) => i === 44 ? x * 3.8 : i === 43 ? x * 2.1 : x);
  const avgV = v.slice(0, 40).reduce((s, x) => s + x, 0) / 40;
  const [lo, hi] = bounds(c);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  const vmax = Math.max(...vs);
  const avgY = yb2 - (avgV / vmax) * (yb2 - yt2);
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, PX1, yt1, yb1);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  inner += volBars(c, vs, yt2, yb2);
  // Average volume line
  inner += `<line x1="${PX0}" y1="${avgY.toFixed(1)}" x2="${PX1}" y2="${avgY.toFixed(1)}" stroke="${C.AMBER}" stroke-width="1.8" stroke-dasharray="6 4"/>`;
  inner += svgTxt(500, avgY - 5, 'Moy.', C.AMBER, 9, 'end');
  // RVOL label on spike
  const spikeX = PX0 + (PX1 - PX0) * 44 / 59;
  inner += svgTxt(spikeX, yt2 + 12, 'RVOL ↑', C.BEAR, 9, 'middle');
  return svgWrap(inner);
}

function s_vol_tend() {
  // 4 mini panels: Hausse+Vol fort / Hausse+Vol faible / Baisse+Vol fort / Baisse+Vol faible
  // Split into 4 columns of ~125px each, 2 rows of ~120px
  const labels = [
    ['Hausse', 'fort',    C.BULL, C.BULL, 1],
    ['Hausse', 'faible',  C.BULL, C.MUTED, 0],
    ['Baisse', 'fort',    C.BEAR, C.BEAR, 1],
    ['Baisse', 'faible',  C.BEAR, C.MUTED, 0],
  ];
  const cols = [60, 195, 330, 465];
  const w = 115, prH = 100, volH = 48;
  const yt = 48, yb_p = 148, yt_v = 160, yb_v = 208;
  let inner = '';

  labels.forEach(([trend, vol, col, vcol, strong], qi) => {
    const cx = cols[qi];
    // Mini price line
    const pts = [];
    const dir = trend === 'Hausse' ? 1 : -1;
    for (let i = 0; i < 8; i++) {
      const noise = Math.sin(i * 0.9 + qi) * 3;
      const y = yb_p - 10 - (i / 7) * 65 * dir + noise;
      pts.push(`${(cx + i * (w / 7)).toFixed(1)},${y.toFixed(1)}`);
    }
    inner += `<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Volume bar
    const bH = strong ? 42 : 18;
    inner += `<rect x="${(cx + w/2 - 16).toFixed(1)}" y="${(yb_v - bH).toFixed(1)}" width="32" height="${bH}" fill="${vcol}" fill-opacity="0.5" rx="2"/>`;
    // Labels
    inner += svgTxt(cx + w/2, yt - 4, `${trend} + vol ${vol}`, col, 9, 'middle', 600, false);
    // Separator lines
    if (qi < 3) inner += `<line x1="${(cx + w + 5).toFixed(1)}" y1="${yt}" x2="${(cx + w + 5).toFixed(1)}" y2="${yb_v}" stroke="#E3E9EF" stroke-width="1"/>`;
  });
  inner += `<line x1="44" y1="152" x2="568" y2="152" stroke="#E3E9EF" stroke-width="1"/>`;
  inner += `<line x1="44" y1="212" x2="568" y2="212" stroke="#E3E9EF" stroke-width="1"/>`;
  return svgWrap(inner);
}

function _makeVPChart(trendFn, volFn) {
  const c = mkSeries(60, trendFn, 3.0);
  const { h, l } = withHL(c, 1.3);
  const v = Array.from({length: 60}, (_, i) => volFn(i));
  const vp = calcVP(h, l, v, 20);
  const [lo, hi] = bounds(c, h, l);
  return { c, h, l, v, vp, lo, hi };
}

function s_vpvr() {
  const { c, h, l, v, vp, lo, hi } = _makeVPChart(
    () => 0.3,
    i => 0.5 + Math.abs(Math.sin(i * 0.71 + 1.7)) * 1.4
  );
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += vpSep() + drawVP(vp, lo, hi);
  inner += svgTxt(80, 60, 'Prix', C.PRICE, 10) + svgTxt(358, 60, 'Volume Profile', C.MUTED, 9);
  return svgWrap(inner);
}

function s_poc() {
  const { c, h, l, v, vp, lo, hi } = _makeVPChart(
    (i, n) => i < n*0.5 ? 0.4 : -0.2,
    i => 0.5 + Math.abs(Math.sin(i * 0.61 + 2.3)) * 1.6
  );
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += vpSep() + drawVP(vp, lo, hi);
  // Extra bold POC explanation arrow
  const pocP = vp.pMin + (vp.pocIdx + 0.5) * vp.bSize;
  const yPOC = PYT + (hi - pocP) / (hi - lo) * (PYB - PYT);
  inner += svgTxt(120, yPOC - 8, 'Niveau le plus échangé', C.BEAR, 9);
  return svgWrap(inner);
}

function s_va() {
  const { c, h, l, v, vp, lo, hi } = _makeVPChart(
    () => 0.1,
    i => 0.5 + Math.abs(Math.sin(i * 0.73 + 1.1)) * 1.5
  );
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += vpSep() + drawVP(vp, lo, hi);
  // Shade VA on price side
  const y1va = PYT + (hi - (vp.pMin + (vp.vahIdx+1)*vp.bSize)) / (hi-lo) * (PYB-PYT);
  const y2va = PYT + (hi - (vp.pMin + vp.valIdx*vp.bSize)) / (hi-lo) * (PYB-PYT);
  inner += `<rect x="${PX0}" y="${Math.min(y1va,y2va).toFixed(1)}" width="${330-PX0}" height="${Math.abs(y2va-y1va).toFixed(1)}" fill="${C.TEAL}" fill-opacity="0.07"/>`;
  inner += svgTxt(100, 58, 'Value Area 70%', C.TEAL, 9);
  return svgWrap(inner);
}

function s_hvn() {
  const { c, h, l, v, vp, lo, hi } = _makeVPChart(
    (i, n) => i < n*0.55 ? 0.5 : -0.1,
    i => {
      // Create a big cluster mid-range
      const base = 0.4 + Math.abs(Math.sin(i * 0.71)) * 0.8;
      const midCluster = Math.exp(-0.5 * ((i - 30) / 8) ** 2) * 2.5;
      return base + midCluster;
    }
  );
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += vpSep() + drawVP(vp, lo, hi, 330, 342, 550, false);
  // Label HVN = POC area
  const pocP = vp.pMin + (vp.pocIdx + 0.5) * vp.bSize;
  const yPOC = PYT + (hi - pocP) / (hi - lo) * (PYB - PYT);
  inner += svgTxt(348, yPOC - 5, 'HVN', C.BULL, 10, 'start');
  inner += svgTxt(80, yPOC, 'Support/Résistance fort', C.BULL, 9);
  // Draw the POC line on price side too
  inner += `<line x1="${PX0}" y1="${yPOC.toFixed(1)}" x2="330" y2="${yPOC.toFixed(1)}" stroke="${C.BULL}" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  return svgWrap(inner);
}

function s_lvn() {
  const { c, h, l, v, vp, lo, hi } = _makeVPChart(
    () => 0.35,
    i => {
      // Bimodal distribution with thin middle = LVN
      const bot = Math.exp(-0.5 * ((i - 15) / 8) ** 2) * 2.5;
      const top = Math.exp(-0.5 * ((i - 45) / 8) ** 2) * 2.5;
      return 0.2 + bot + top;
    }
  );
  // Find LVN = bucket with lowest volume that's NOT at extremes
  const midBuckets = vp.buckets.slice(4, vp.nB - 4);
  const lvnRaw = midBuckets.indexOf(Math.min(...midBuckets)) + 4;
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += vpSep() + drawVP(vp, lo, hi, 330, 342, 550, false);
  // Label LVN
  const lvnP = vp.pMin + (lvnRaw + 0.5) * vp.bSize;
  const yLVN = PYT + (hi - lvnP) / (hi - lo) * (PYB - PYT);
  inner += svgTxt(348, yLVN - 5, 'LVN', C.AMBER, 10);
  inner += `<line x1="${PX0}" y1="${yLVN.toFixed(1)}" x2="330" y2="${yLVN.toFixed(1)}" stroke="${C.AMBER}" stroke-width="1.6" stroke-dasharray="6 4"/>`;
  inner += svgTxt(80, yLVN - 8, 'Traversée rapide', C.AMBER, 9);
  return svgWrap(inner);
}

function s_frvp_base() {
  const c = mkSeries(80, () => 0.22, 3.5);
  const { h, l } = withHL(c, 1.3);
  const v = genVol(80, 1.9);
  // Selected range: bars 25..55
  const start = 24, end = 54;
  const subH = h.slice(start, end+1), subL = l.slice(start, end+1), subV = v.slice(start, end+1);
  const vp = calcVP(subH, subL, subV, 16);
  const [lo, hi] = bounds(c, h, l);
  const xS = PX0 + (PX1 - PX0) * start / 79;
  const xE = PX0 + (PX1 - PX0) * end / 79;
  // Full price on left, FRVP bars on right
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  // Highlighted range
  inner += `<rect x="${xS.toFixed(1)}" y="${PYT}" width="${(xE-xS).toFixed(1)}" height="${PYB-PYT}" fill="${C.AMBER}" fill-opacity="0.08"/>`;
  inner += vpSep() + drawVP(vp, lo, hi, 330, 342, 550, false);
  inner += svgTxt(barXmid(xS,xE), PYT + 14, 'FRVP', C.AMBER, 9, 'middle');
  return svgWrap(inner);
}

function barXmid(x1, x2) { return ((x1 + x2) / 2).toFixed(1); }

function s_frvp_swing() {
  const c = mkSeries(80, (i, n) => i < n*0.45 ? 0.7 : -0.4, 3.0);
  const { h, l } = withHL(c, 1.3);
  const v = genVol(80, 2.3);
  // Swing = upleg: bars 5..35
  const start = 4, end = 35;
  const subH = h.slice(start, end+1), subL = l.slice(start, end+1), subV = v.slice(start, end+1);
  const vp = calcVP(subH, subL, subV, 16);
  const [lo, hi] = bounds(c, h, l);
  const xS = PX0 + (PX1 - PX0) * start / 79;
  const xE = PX0 + (PX1 - PX0) * end / 79;
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += `<rect x="${xS.toFixed(1)}" y="${PYT}" width="${(xE-xS).toFixed(1)}" height="${PYB-PYT}" fill="${C.BULL}" fill-opacity="0.07"/>`;
  inner += vpSep() + drawVP(vp, lo, hi);
  inner += svgTxt(barXmid(xS,xE), PYT + 14, 'Swing analysé', C.BULL, 9, 'middle');
  return svgWrap(inner);
}

function s_frvp_smc() {
  const c = mkSeries(80, (i, n) => i < n*0.5 ? 0.6 : -0.5, 3.2);
  const { h, l } = withHL(c, 1.3);
  const v = genVol(80, 1.4);
  // OB zone around bar 20-24
  const obStart = 18, obEnd = 24;
  const subH = h.slice(obStart, obEnd+1), subL = l.slice(obStart, obEnd+1), subV = v.slice(obStart, obEnd+1);
  const vp = calcVP(subH, subL, subV, 12);
  const [lo, hi] = bounds(c, h, l);
  const xS = PX0 + (PX1 - PX0) * obStart / 79;
  const xE = PX0 + (PX1 - PX0) * obEnd / 79;
  // OB price bounds
  const obLo = Math.min(...subL), obHi = Math.max(...subH);
  const yOBT = PYT + (hi - obHi) / (hi - lo) * (PYB - PYT);
  const yOBB = PYT + (hi - obLo) / (hi - lo) * (PYB - PYT);
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  inner += `<rect x="${xS.toFixed(1)}" y="${yOBT.toFixed(1)}" width="${(xE-xS).toFixed(1)}" height="${(yOBB-yOBT).toFixed(1)}" fill="${C.VIO}" fill-opacity="0.15" rx="2"/>`;
  inner += svgTxt(xS + 4, yOBT - 4, 'OB', C.VIO, 9);
  inner += vpSep() + drawVP(vp, lo, hi, 330, 342, 550, false);
  // Label HVN / LVN on profile
  const pocP = vp.pMin + (vp.pocIdx + 0.5) * vp.bSize;
  const yPOC = PYT + (hi - pocP) / (hi - lo) * (PYB - PYT);
  inner += svgTxt(348, yPOC - 5, 'HVN → OB solide', C.BULL, 9);
  return svgWrap(inner);
}

function s_delta() {
  const c = mkSeries(70, (i, n) => i < n*0.5 ? 0.5 : -0.4, 3.0);
  const v = genVol(70, 1.2);
  const opens = [c[0], ...c.slice(0, -1)];
  // Delta = +v if bullish candle, -v if bearish
  const delta = c.map((cl, i) => cl >= opens[i] ? v[i] : -v[i]);
  // Cumulative delta
  let cumDelta = [], acc = 0;
  for (const d of delta) { acc += d; cumDelta.push(acc); }
  const [lo, hi] = bounds(c);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  const [dlo, dhi] = bounds(cumDelta);
  const zero = yt2 + (dhi - 0) / (dhi - dlo) * (yb2 - yt2);
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, PX1, yt1, yb1);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  // Delta histogram
  const bw = Math.max(2.5, (PX1 - PX0) / 70 * 0.55);
  for (let k = 0; k < 70; k++) {
    const x = PX0 + (PX1 - PX0) * k / 69;
    const y = yt2 + (dhi - cumDelta[k]) / (dhi - dlo) * (yb2 - yt2);
    const top = Math.min(y, zero), hb = Math.abs(y - zero);
    const col = cumDelta[k] >= 0 ? C.BULL : C.BEAR;
    inner += `<rect x="${(x-bw/2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(hb,0.5).toFixed(1)}" fill="${col}" fill-opacity="0.5"/>`;
  }
  inner += `<line x1="${PX0}" y1="${zero.toFixed(1)}" x2="${PX1}" y2="${zero.toFixed(1)}" stroke="${C.MUTED}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
  inner += svgTxt(80, 57, 'Prix', C.PRICE, 10) + svgTxt(80, 182, 'Delta cumulé', C.MUTED, 10);
  return svgWrap(inner);
}

function s_absorption() {
  const c = mkSeries(55, () => 0.25, 2.8);
  const v = genVol(55, 1.5);
  // Absorption event at bar ~35: big volume, tiny candle (price barely moves)
  const vsAbsorb = v.map((x, i) => i === 34 ? x * 4.5 : i === 33 ? x * 2.2 : x);
  // Patch price to show tiny move on bar 34
  const cAbsorb = [...c];
  cAbsorb[35] = cAbsorb[34] + 0.1;
  const [lo, hi] = bounds(cAbsorb);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  let inner = Lline(cAbsorb, lo, hi, C.PRICE, 2, null, PX0, PX1, yt1, yb1);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  inner += volBars(cAbsorb, vsAbsorb, yt2, yb2);
  // Arrow + label on big bar
  const absX = PX0 + (PX1 - PX0) * 34 / 54;
  const vmax = Math.max(...vsAbsorb);
  const barH = (vsAbsorb[34] / vmax) * (yb2 - yt2);
  inner += svgTxt(absX, yt2 + 14, 'Absorption', C.VIO, 9, 'middle');
  inner += svgTxt(absX, yb1 - 8, 'Pinbar', C.VIO, 9, 'middle');
  return svgWrap(inner);
}

function s_div_vol() {
  // Price makes HH while volume decreases → divergence baissière
  const c = mkSeries(65, (i, n) => i < n*0.7 ? 0.6 : 0.1, 2.5);
  // Artificially create higher highs with decreasing peaks
  const cc = c.map((v, i) => {
    if (i < 15) return v;
    return v + Math.sin((i - 15) * 0.25) * 6 * (1 - (i - 15) / 55);
  });
  const v = genVol(65, 1.8);
  // Volume decreases in second half
  const vDiv = v.map((x, i) => i < 32 ? x : x * (1 - (i - 32) / 60));
  const [lo, hi] = bounds(cc);
  const yt1 = 42, yb1 = 148, yt2 = 168, yb2 = 236;
  let inner = Lline(cc, lo, hi, C.PRICE, 2, null, PX0, PX1, yt1, yb1);
  inner += `<line x1="44" y1="158" x2="568" y2="158" stroke="#DCE3EA" stroke-width="1.4"/>`;
  inner += volBars(cc, vDiv, yt2, yb2);
  // Trend line on price (rising) and trend line on volume (falling) — visual arrows
  inner += svgDline(100, 115, 500, 75, C.PRICE, 1.4);
  inner += svgDline(100, 220, 500, 215, C.BEAR, 1.4, '5 4');
  inner += svgTxt(320, 68, 'Prix ↑', C.PRICE, 9);
  inner += svgTxt(320, 210, 'Volume ↓', C.BEAR, 9);
  return svgWrap(inner);
}

function s_vol_smc() {
  const c = mkSeries(60, (i, n) => i < n*0.5 ? 0.7 : -0.3, 3.0);
  const { h, l } = withHL(c, 1.3);
  const v = genVol(60, 2.0);
  const vp = calcVP(h, l, v, 20);
  const [lo, hi] = bounds(c, h, l);
  let inner = Lline(c, lo, hi, C.PRICE, 2, null, PX0, 330, PYT, PYB);
  // OB zone (around bars 8-12, near low prices before impulse)
  const obLo = lo + (hi - lo) * 0.12, obHi = lo + (hi - lo) * 0.30;
  const yOBT = PYT + (hi - obHi) / (hi - lo) * (PYB - PYT);
  const yOBB = PYT + (hi - obLo) / (hi - lo) * (PYB - PYT);
  inner += `<rect x="${PX0}" y="${yOBT.toFixed(1)}" width="${270-PX0}" height="${(yOBB-yOBT).toFixed(1)}" fill="${C.VIO}" fill-opacity="0.10" rx="2"/>`;
  inner += svgTxt(PX0+6, yOBT-4, 'OB', C.VIO, 9);
  inner += vpSep() + drawVP(vp, lo, hi, 330, 342, 550, false);
  const pocP = vp.pMin + (vp.pocIdx + 0.5) * vp.bSize;
  const yPOC = PYT + (hi - pocP) / (hi - lo) * (PYB - PYT);
  inner += svgTxt(348, yPOC - 5, 'POC', C.BEAR, 10);
  inner += svgTxt(348, yOBT - 4, 'HVN?', C.VIO, 9);
  return svgWrap(inner);
}

// ── Export ───────────────────────────────────────────────────────────────────
const SCHEMAS = {
  // Indicateurs
  sma: s_sma, ema: s_ema, cross: s_cross, boll: s_boll, keltner: s_keltner,
  vwap: s_vwap, rsi: s_rsi, macd: s_macd, stoch: s_stoch, atr: s_atr,
  adx: s_adx, supertrend: s_supertrend, ichimoku: s_ichimoku, sar: s_sar, combine: s_combine,
  // Figures
  tri_asc: s_triangle_asc, tri_desc: s_triangle_desc, tri_sym: s_triangle_sym,
  canal_h: s_canal_haussier, canal_b: s_canal_baissier, range: s_range,
  hs: s_hs, hs_inv: s_hs_inv, double_top: s_double_top, double_bot: s_double_bottom,
  wedge_r: s_rising_wedge, wedge_f: s_falling_wedge,
  bull_flag: s_bull_flag, bear_flag: s_bear_flag, pennant: s_pennant,
  // SMC
  structure: s_structure, bos: s_bos, choch: s_choch,
  liquidity: s_liquidity, sweep: s_sweep, inducement: s_inducement,
  ob_bull: s_ob_bull, ob_bear: s_ob_bear, breaker: s_breaker, mitigation: s_mitigation,
  fvg: s_fvg, displacement: s_displacement, void_: s_void, premium: s_premium, model: s_model,
  // Volume
  vol_base: s_vol_base, rvol: s_rvol, vol_tend: s_vol_tend,
  vpvr: s_vpvr, poc: s_poc, va: s_va, hvn: s_hvn, lvn: s_lvn,
  frvp_base: s_frvp_base, frvp_swing: s_frvp_swing, frvp_smc: s_frvp_smc,
  delta: s_delta, absorption: s_absorption, div_vol: s_div_vol, vol_smc: s_vol_smc
};

function getSchema(id) {
  try { return (SCHEMAS[id] || (() => '<svg viewBox="0 0 600 280"></svg>'))(); }
  catch (e) { console.warn('Schema error for', id, e); return '<svg viewBox="0 0 600 280"></svg>'; }
}
