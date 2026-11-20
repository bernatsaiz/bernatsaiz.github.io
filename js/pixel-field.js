(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var PX = 7, SPEED = 0.5, BAND = 160, ANGLE = 0.471, WAVE = 0.8, JITTER = 0.229;
  var COLS = [[0, 12, 110], [0, 20, 160], [18, 40, 182], [0, 16, 136]];
  var CALM = 0.5;
  var FEATHER = 150;
  var STEP = 3;
  var FPS = 20;

  var perm = new Uint8Array(512), vals = new Float32Array(256);
  (function () { var p = []; for (var i = 0; i < 256; i++) { p.push(i); vals[i] = Math.random() * 2 - 1; }
    for (i = 255; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = p[i]; p[i] = p[j]; p[j] = x; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    xi &= 255; yi &= 255;
    var a = vals[perm[xi + perm[yi]]], b = vals[perm[xi + 1 + perm[yi]]];
    var c = vals[perm[xi + perm[yi + 1]]], d = vals[perm[xi + 1 + perm[yi + 1]]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function hash(c, r) { var h = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453; return h - Math.floor(h); }
  var LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  function pack(r, g, b) { r = Math.round(r); g = Math.round(g); b = Math.round(b); return LE ? (255 << 24 | b << 16 | g << 8 | r) >>> 0 : (r << 24 | g << 16 | b << 8 | 255) >>> 0; }

  var fields = [], tt = 0, raf = 0;
  var paused = false; try { paused = sessionStorage.getItem("motion") === "off"; } catch (e) {}

  function makeField(host, seed) {
    var cv = document.createElement("canvas"), small = document.createElement("canvas");
    var f = { visible: false, seed: seed, host: host, cv: cv, ctx: cv.getContext("2d"), small: small, sctx: small.getContext("2d") };
    if (!f.ctx || !f.sctx) return;
    cv.className = "pixel-field"; cv.setAttribute("aria-hidden", "true");
    host.insertBefore(cv, host.firstChild);
    var setup = function () { if (prepare(f)) draw(f); };
    setup();
    if (document.fonts) document.fonts.ready.then(setup);
    var tm;
    if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(tm); tm = setTimeout(setup, 100); }).observe(cv);
    fields.push(f);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { f.visible = e[e.length - 1].isIntersecting; if (f.visible) start(); }).observe(cv);
    else { f.visible = true; start(); }
  }

  function textRects(f) {
    var cb = f.cv.getBoundingClientRect(), rects = [], walker = document.createTreeWalker(f.host, NodeFilter.SHOW_TEXT);
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.nodeValue.trim() || n.parentNode.closest(".sr-only")) continue;
      var rg = document.createRange(); rg.selectNodeContents(n);
      Array.prototype.forEach.call(rg.getClientRects(), function (r) {
        if (r.width && r.height) rects.push([r.left - cb.left, r.top - cb.top, r.right - cb.left, r.bottom - cb.top]);
      });
    }
    return rects;
  }

  function prepare(f) {
    var W = f.cv.clientWidth, H = f.cv.clientHeight, rects = textRects(f);
    var sig = [W, H].concat(rects.map(function (q) { return q.map(Math.round).join(); })).join();
    if (sig === f.sig) return false;
    f.sig = sig;
    f.cv.width = W; f.cv.height = H; f.ctx.imageSmoothingEnabled = false;
    var C = f.nc = Math.ceil(W / PX), R = f.nr = Math.ceil(H / PX);
    if (!C || !R) { f.img = null; return false; }
    f.small.width = C; f.small.height = R; f.img = f.sctx.createImageData(C, R); f.px32 = new Uint32Array(f.img.data.buffer);
    var n = C * R, base = f.base = new Float32Array(n), pal = f.pal = new Uint32Array(n * 4), calm = calmMap(C, R, rects), avg = [0, 0, 0];
    COLS.forEach(function (c) { avg[0] += c[0] / 4; avg[1] += c[1] / 4; avg[2] += c[2] / 4; });
    var plain = COLS.map(function (c) { return pack(c[0], c[1], c[2]); });
    for (var r = 0, i = 0; r < R; r++) for (var c = 0; c < C; c++, i++) {
      base[i] = (c * PX * ANGLE - r * PX) / BAND + (hash(c, r) - 0.5) * JITTER * 2;
      var m = calm[i];
      for (var k = 0; k < 4; k++) {
        var col = COLS[k];
        pal[i * 4 + k] = m ? pack(col[0] + (avg[0] - col[0]) * m, col[1] + (avg[1] - col[1]) * m, col[2] + (avg[2] - col[2]) * m) : plain[k];
      }
    }
    f.gc = Math.ceil(C / STEP) + 2; f.gr = Math.ceil(R / STEP) + 2; f.grid = new Float32Array(f.gc * f.gr);
    return true;
  }

  function calmMap(C, R, rects) {
    var m = new Float32Array(C * R), F2 = FEATHER * FEATHER;
    for (var r = 0, i = 0; r < R; r++) for (var c = 0; c < C; c++, i++) {
      var x = c * PX + PX / 2, y = r * PX + PX / 2, best = F2;
      for (var k = 0; k < rects.length; k++) {
        var q = rects[k], dx = Math.max(q[0] - x, 0, x - q[2]), dy = Math.max(q[1] - y, 0, y - q[3]), dd = dx * dx + dy * dy;
        if (dd < best) best = dd;
      }
      var t = 1 - Math.sqrt(best) / FEATHER;
      m[i] = t > 0 ? CALM * t * t * (3 - 2 * t) : 0;
    }
    return m;
  }

  function draw(f) {
    if (!f.img) return;
    var C = f.nc, R = f.nr, gc = f.gc, grid = f.grid, amp = 0.9 * WAVE, shift = tt * 0.12;
    for (var gy = 0, g = 0; gy < f.gr; gy++) for (var gx = 0; gx < gc; gx++, g++)
      grid[g] = amp * noise(gx * STEP * PX / 216 - tt * 0.05 + f.seed, gy * STEP * PX / 108 + tt * 0.04);
    var px32 = f.px32, base = f.base, pal = f.pal;
    for (var r = 0, i = 0; r < R; r++) {
      var gyf = r / STEP, gy0 = gyf | 0, fy = gyf - gy0, row0 = gy0 * gc, row1 = row0 + gc;
      for (var c = 0; c < C; c++, i++) {
        var gxf = c / STEP, gx0 = gxf | 0, fx = gxf - gx0;
        var a = grid[row0 + gx0], b = grid[row0 + gx0 + 1], cq = grid[row1 + gx0], dq = grid[row1 + gx0 + 1];
        var nz = a + (b - a) * fx + (cq - a) * fy + (a - b - cq + dq) * fx * fy;
        var k = Math.floor(base[i] + nz - shift) % 4; if (k < 0) k += 4;
        px32[i] = pal[i * 4 + k];
      }
    }
    f.sctx.putImageData(f.img, 0, 0);
    f.ctx.drawImage(f.small, 0, 0, C * PX, R * PX);
  }

  var last = 0, acc = 0;
  function loop(now) {
    var any = false;
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    if (acc >= 1 / FPS) {
      tt += acc * SPEED; acc = 0;
      fields.forEach(function (f) { if (f.visible) { any = true; draw(f); } });
    } else any = fields.some(function (f) { return f.visible; });
    raf = any && !reduce.matches && !paused ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!reduce.matches && !paused && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  var links = document.querySelector(".foot__links"), toggle = document.createElement("button");
  function label() { toggle.textContent = paused ? "Resume motion" : "Pause motion"; toggle.hidden = reduce.matches; }
  toggle.type = "button"; toggle.className = "foot__motion"; label();
  toggle.addEventListener("click", function () {
    paused = !paused; label();
    try { sessionStorage.setItem("motion", paused ? "off" : "on"); } catch (e) {}
    start();
  });
  if (links) links.appendChild(toggle);
  if (reduce.addEventListener) reduce.addEventListener("change", function () { label(); start(); });

  var hero = document.querySelector(".hero"), foot = document.querySelector(".foot");
  if (hero) makeField(hero, 0);
  if (foot) makeField(foot, 37.3);
  if (!fields.length) toggle.remove();
})();
