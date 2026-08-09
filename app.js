/* ════════════════════════════════════════════════════════════════════════
   Brú Guesthouse — "The Row"

   ONE device: twelve marks on a hairline. It is the identity, the navigation
   and the booking product, so it is built once here and reused three times
   (loader, rail, booking strip) rather than reimplemented.

   The palette arc is theirs, earned by their own photographs: day under an
   overcast sky, the plain, dusk, windows lit, aurora.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── the film's frames ────────────────────────────────────────────────
     Module scope, started from a plain timer. Deliberately depends on NOTHING:
     not gsap, not ScrollTrigger, not scroll position, not a media query. Every
     gated version finds a browser where it never fires and leaves the canvas
     empty over the section, and someone opening this link once does not get a
     second chance. */
  var FRAME_COUNT = 121;
  var smallScreen = window.innerWidth < 768;
  var shots = new Array(FRAME_COUNT).fill(null);
  var framesStarted = false;
  function frameSrc(i) {
    var n = String(i + 1); while (n.length < 3) n = '0' + n;
    return 'assets/img/' + (smallScreen ? 'frames-sm' : 'frames') + '/f' + n + '.jpg';
  }
  function loadFrames(onFirst) {
    if (framesStarted) return; framesStarted = true;
    var next = 0;
    function pump() {
      if (next >= FRAME_COUNT) return;
      var idx = next++;
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        // onload only means the bytes arrived. The pixels can still decode
        // lazily on the FIRST drawImage, which is a synchronous stall in the
        // middle of a scrub gesture on iOS. decode() front-loads that cost.
        var commit = function () { shots[idx] = im; if (idx === 0 && onFirst) onFirst(); pump(); };
        im.decode ? im.decode().then(commit, commit) : commit();
      };
      im.onerror = pump;
      im.src = frameSrc(idx);
    }
    for (var l = 0; l < 14; l++) pump();   // wide pump: HTTP/2, not per-origin limited
  }
  setTimeout(function () { loadFrames(null); }, 700);

  var root = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COTTAGES = 12;

  /* ── the palette arc ──────────────────────────────────────────────────
     Canvas and ink cross through mid-tone together, so anywhere the crossover
     is SLOW the two meet in the middle and contrast collapses. Hold the light
     palette late, then cross fast, so no body copy sits inside the crossover. */
  var STOPS = [
    { at: 0.00, c: '#CFD2DB', ink: '#242017', soft: '#E4E6EA' }, // overcast day
    { at: 0.16, c: '#DDDCD5', ink: '#242017', soft: '#EFEEE9' }, // the plain, light
    { at: 0.56, c: '#DDDCD5', ink: '#242017', soft: '#EFEEE9' }, // held
    { at: 0.64, c: '#8A8577', ink: '#F2F0EA', soft: '#6F6B60' }, // cross fast
    { at: 0.74, c: '#2A2733', ink: '#EDEBE6', soft: '#1B1A26' }, // dusk
    { at: 1.00, c: '#11101E', ink: '#EDEBE6', soft: '#0A0916' }  // night
  ];
  function hex2rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function mixHex(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return 'rgb(' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(',') + ')';
  }
  function paletteAt(p) {
    var i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1].at) i++;
    var a = STOPS[i], b = STOPS[i + 1];
    var t = Math.max(0, Math.min(1, (p - a.at) / ((b.at - a.at) || 1)));
    return { c: mixHex(a.c, b.c, t), ink: mixHex(a.ink, b.ink, t), soft: mixHex(a.soft, b.soft, t) };
  }
  var themeMeta = document.getElementById('themeColor');
  var lastC = '', lastInk = '', lastSoft = '';
  function applyPalette(p) {
    var v = paletteAt(p);
    // writing a custom property on the root restyles every descendant, and the
    // palette is FLAT across most of the document — skipping identical writes
    // removes that recalc entirely there
    if (v.c !== lastC) { root.style.setProperty('--c', v.c); lastC = v.c; }
    if (v.ink !== lastInk) { root.style.setProperty('--ink', v.ink); lastInk = v.ink; }
    if (v.soft !== lastSoft) { root.style.setProperty('--soft', v.soft); lastSoft = v.soft; }
    // derive "is it night" from the canvas LUMINANCE, never a progress
    // threshold: a threshold drifts out of sync the moment a stop moves
    var rgb = v.c.match(/\d+/g).map(Number);
    var lin = rgb.map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    var night = (0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]) < 0.18;
    if (body.classList.contains('is-night') !== night) {
      body.classList.toggle('is-night', night);
      if (themeMeta) themeMeta.setAttribute('content', night ? '#11101E' : '#CFD2DB');
    }
  }
  applyPalette(0);

  /* ── build the row, three times, from one function ───────────────────── */
  function buildMarks(host, cls) {
    if (!host) return [];
    var out = [];
    for (var i = 0; i < COTTAGES; i++) {
      var el = document.createElement('span');
      el.className = cls;
      host.appendChild(el);
      out.push(el);
    }
    return out;
  }
  var railMarks = buildMarks(document.getElementById('railMarks'), 'bru-rail__mark');
  var loaderRow = document.getElementById('loaderRow');
  var loaderMarks = [];
  if (loaderRow) for (var li = 0; li < COTTAGES; li++) { var b = document.createElement('i'); loaderRow.appendChild(b); loaderMarks.push(b); }

  /* ── per-word headline split (accessible name preserved) ─────────────── */
  document.querySelectorAll('[data-headline]').forEach(function (h) {
    var text = h.textContent.replace(/\s+/g, ' ').trim();
    h.setAttribute('aria-label', text);          // split spans mangle the name
    h.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var outer = document.createElement('span');
      outer.className = 'bru-line';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.className = 'bru-word';
      inner.textContent = w;
      outer.appendChild(inner);
      h.appendChild(outer);
      if (i < arr.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  /* ── form ─────────────────────────────────────────────────────────────
     A prototype must never look like it took a real booking. */
  function initForm() {
    var f = document.getElementById('form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('formMsg');
      var need = ['f-name', 'f-mail', 'f-in', 'f-out'];
      for (var i = 0; i < need.length; i++) {
        var el = document.getElementById(need[i]);
        if (el && !el.value.trim()) { msg.textContent = 'Please fill in the missing field.'; el.focus(); return; }
      }
      var name = (document.getElementById('f-name').value || '').trim().split(' ')[0];
      msg.textContent = 'Thank you ' + name + '. This is a prototype, so nothing was actually sent.';
    });
  }

  /* ── menu ─────────────────────────────────────────────────────────────── */
  function initMenu(onClose) {
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu');
    if (!burger || !menu) return;
    var open = false;
    function set(v) {
      open = v;
      menu.hidden = !v;
      burger.setAttribute('aria-expanded', String(v));
      body.style.overflow = v ? 'hidden' : '';
      if (!v && onClose) onClose();
    }
    burger.addEventListener('click', function () { set(!open); });
    menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
  }

  /* ══ reduced motion: the resting state IS the visible one ══════════════
     A fallback that discards the concept is a defect, not a fallback: the row
     still renders and still lights, it simply does not animate. */
  if (reduced) {
    body.classList.add('bru-static');
    var v0 = paletteAt(0.35);
    root.style.setProperty('--c', v0.c);
    root.style.setProperty('--ink', v0.ink);
    root.style.setProperty('--soft', v0.soft);
    railMarks.forEach(function (m, i) { if (i < 4) m.classList.add('is-lit'); });
    initMenu(null); initForm();
    var q0 = document.querySelector('.bru-quote'); if (q0) q0.classList.add('is-on');
    var lo0 = document.getElementById('opening'); if (lo0) lo0.remove();
    return;
  }

  /* ══ motion ═══════════════════════════════════════════════════════════ */
  gsap.registerPlugin(ScrollTrigger);
  // iOS Safari fires a resize when its address bar hides mid-scroll; without
  // this a pinned trigger can refresh and jump mid-gesture
  ScrollTrigger.config({ ignoreMobileResize: true });
  var lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);

  /* drift: batched reads then writes, off-screen skipped, clamped */
  var frames = Array.prototype.slice.call(document.querySelectorAll('.bru-frame-in'));
  function drift() {
    var vh = window.innerHeight, writes = [], i;
    for (i = 0; i < frames.length; i++) {
      var box = frames[i].parentElement;
      if (!box) continue;
      var r = box.getBoundingClientRect();
      if (r.bottom < -240 || r.top > vh + 240) continue;
      var d = Number(frames[i].dataset.drift || 10);
      var mid = (r.top + r.height / 2 - vh / 2) / vh;      // -1 .. 1
      writes.push([frames[i], Math.max(-1, Math.min(1, mid)) * -d]);
    }
    for (i = 0; i < writes.length; i++) {
      writes[i][0].style.transform = 'scale(1.12) translate3d(0,' + writes[i][1].toFixed(2) + 'px,0)';
    }
  }
  gsap.ticker.add(function (t) { drift(); lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  drift();

  /* A HIDDEN TAB PAUSES rAF, which starves the Lenis -> ScrollTrigger loop
     while native scrolling keeps moving underneath it. Re-sync on the way back
     in. ScrollTrigger.update(), never refresh(): a refresh here recalculates
     spacers and poisons every trigger that starts after one. */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    lenis.resize();
    ScrollTrigger.update();
  });

  /* ── the master scroll: palette arc + the light walking the row ──────── */
  function writeRow(progress) {
    applyPalette(progress);
    // the lit cottage walks the row with scroll progress
    var idx = Math.min(COTTAGES - 1, Math.floor(progress * COTTAGES));
    for (var i = 0; i < railMarks.length; i++) {
      railMarks[i].classList.toggle('is-lit', i <= idx);
    }
  }
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onUpdate: function (self) { writeRow(self.progress); }
  });
  writeRow(0);          // paint the resting state; onUpdate does not fire at rest

  /* ── word-mask rises ──────────────────────────────────────────────────── */
  document.querySelectorAll('[data-headline]').forEach(function (h) {
    var words = h.querySelectorAll('.bru-word');
    if (!words.length) return;
    gsap.set(words, { yPercent: 108 });
    ScrollTrigger.create({
      trigger: h, start: 'top 86%', once: true,
      onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1.05, stagger: 0.045, ease: 'expo.out' }); }
    });
  });

  /* ── generic reveals ──────────────────────────────────────────────────── */
  document.querySelectorAll('.bru-rv').forEach(function (el) {
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }); }
    });
  });

  /* ── hero: the horizon hairline draws out of the wordmark ─────────────── */
  var wm = document.querySelector('.bru-hero__wm');
  if (wm) {
    gsap.set(wm, { opacity: 0, y: 18 });
    gsap.set('.bru-hero__eyebrow', { opacity: 0 });
    gsap.set('.bru-hero__foot', { opacity: 0, y: 14 });
  }
  function openHero() {           // used only when there is no opening overlay
    if (!wm) return;
    gsap.timeline()
      .to('.bru-hero__eyebrow', { opacity: .82, duration: .7, ease: 'power2.out' })
      .to(wm, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, '-=0.42')
      .to('.bru-hero__foot', { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, '-=0.6');
  }

  /* ── nav ground ───────────────────────────────────────────────────────── */
  var nav = document.getElementById('nav');
  var heroSec = document.getElementById('hero');
  gsap.ticker.add(function () {
    if (!nav) return;
    var past = heroSec ? heroSec.getBoundingClientRect().bottom <= (nav.offsetHeight + 4) : window.scrollY > 40;
    nav.classList.toggle('is-solid', past);
  });

  /* ══ THE OPENING ══════════════════════════════════════════════════════
     One idea, three beats:
       1. the wordmark stands in OUTLINE on the night ground
       2. a horizon line rises through it on REAL load progress, filling the
          letters from below (the mark is the progress bar; no percentage)
       3. that same line runs out to both edges, the field splits along it, and
          the photograph is behind it already in register
     HORIZON_F is measured, not guessed. The cover geometry is solved so the
     drawn line and the photographed one are the same line. */
  var HORIZON_F = 0.545, HERO_W = 2200, HERO_H = 1470;  // vegurinn.webp: 0.545 is
                                                        // the ground the twelve
                                                        // cottages stand on. Read
                                                        // off marked candidate
                                                        // lines, not off a
                                                        // brightness step — the
                                                        // strongest gradient in
                                                        // the band is the grass
                                                        // /road edge at 0.590,
                                                        // which is the wrong line.
  (function opening() {
    var wrap = document.getElementById('opening');
    var top = document.getElementById('openTop');
    var bot = document.getElementById('openBot');
    var svgText = document.getElementById('bruOpenText');
    var fill = document.getElementById('openFill');
    var rule = document.getElementById('openRule');
    if (!wrap || !top || !bot || !svgText) { openHero(); return; }
    body.classList.add('is-loading');

    var box = null;
    function place() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.max(vw / HERO_W, vh / HERO_H);
      var y = Math.round(HERO_H * HORIZON_F * s - (HERO_H * s - vh) / 2);
      top.style.height = y + 'px';
      bot.style.height = (vh - y) + 'px';
      rule.style.top = y + 'px';
      // the wordmark sits ON that line, its baseline just above it
      var fs = Math.max(58, Math.min(vw * 0.13, 168));
      svgText.setAttribute('font-size', fs.toFixed(1));
      svgText.setAttribute('x', (vw / 2).toFixed(1));
      svgText.setAttribute('y', (y - fs * 0.16).toFixed(1));
      box = svgText.getBBox();
      return y;
    }
    var lineY = place();
    window.addEventListener('resize', function () { lineY = place(); }, { passive: true });

    /* the fill rises from the bottom of the glyphs to their top */
    function setProgress(p) {
      if (!box) return;
      var h = box.height * Math.max(0, Math.min(1, p));
      fill.setAttribute('x', box.x.toFixed(1));
      fill.setAttribute('width', box.width.toFixed(1));
      fill.setAttribute('y', (box.y + box.height - h).toFixed(1));
      fill.setAttribute('height', h.toFixed(1));
    }
    setProgress(0);

    /* Wait on the hero's OWN <img>, never on a duplicate `new Image(src)`.
       The hero ships a srcset, so a hardcoded src here would (a) go stale the
       next time the photograph changes and (b) download a second, different
       file the page never paints. */
    var heroImg = document.querySelector('.bru-hero__media img');
    var srcs = ['assets/img/nott-aurora.webp'];
    var done = 0, total = srcs.length + 2, finished = false, shown = 0;
    function bump() {
      done++;
      var p = Math.min(1, done / total);
      // ease the fill so it never snaps between coarse load steps
      gsap.to({ v: shown }, { v: p, duration: .7, ease: 'power2.out',
        onUpdate: function () { shown = this.targets()[0].v; setProgress(shown); } });
      if (done >= total) gsap.delayedCall(0.75, finish);
    }
    function finish() {
      if (finished) return; finished = true;
      setProgress(1);
      var heroWm = document.querySelector('.bru-hero__wm');
      var tl = gsap.timeline({ delay: 0.2 });
      // 2. the line runs out of the letters to both edges
      tl.set(rule, { width: box ? box.width : 200 })
        .to(rule, { width: '100vw', duration: .9, ease: 'expo.inOut' })
        // the outline goes with it: the mark has done its job
        .to(svgText, { opacity: 0, duration: .5 }, '-=0.5')
        .to('#openFill', { opacity: 0, duration: .5 }, '-=0.5')
        // 3. the field splits along that line
        .to(top, { yPercent: -100, duration: 1.3, ease: 'expo.inOut' }, '-=0.2')
        .to(bot, { yPercent: 100, duration: 1.3, ease: 'expo.inOut' }, '<')
        .to(rule, { opacity: 0, duration: .5 }, '<')
        .fromTo(heroWm, { yPercent: 24, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 1.15, ease: 'expo.out' }, '-=0.85')
        .to('.bru-hero__eyebrow', { opacity: .82, duration: .6 }, '-=0.8')
        .to('.bru-hero__foot', { opacity: 1, y: 0, duration: .8, ease: 'expo.out' }, '-=0.6')
        .add(function () {
          wrap.classList.add('is-done');
          body.classList.remove('is-loading');
          ScrollTrigger.refresh();
        });
    }
    srcs.forEach(function (s) { var im = new Image(); im.onload = im.onerror = bump; im.src = s; });
    if (!heroImg) bump();
    else if (heroImg.complete) bump();
    else { heroImg.addEventListener('load', bump, { once: true });
           heroImg.addEventListener('error', bump, { once: true }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(); bump(); }); else bump();
    setTimeout(finish, 6000);   // a stuck decode must never trap anyone behind it
  })();

  /* ── THE INDEX: which section am I in ─────────────────────────────────
     The current section is computed deterministically (the last one whose top
     has crossed the line). Per-section onToggle let two be active at once and
     whichever fired last won, which lit the wrong link. */
  (function indexNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.bru-index a'));
    if (!links.length) return;
    function light(id) { links.forEach(function (l) { l.classList.toggle('is-here', l.dataset.sec === id); }); }
    var secs = links.map(function (l) { return { id: l.dataset.sec, el: document.getElementById(l.dataset.sec) }; })
                    .filter(function (s) { return s.el; });
    function pick() {
      var line = window.innerHeight * 0.5, cur = secs[0] && secs[0].id;
      for (var i = 0; i < secs.length; i++) {
        if (secs[i].el.getBoundingClientRect().top <= line) cur = secs[i].id;
      }
      light(cur);
    }
    ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', onUpdate: pick });
    pick();
    links.forEach(function (l) {
      l.addEventListener('click', function (e) {
        var t = document.getElementById(l.dataset.sec);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -10 });   // anchors must go through Lenis or it fights them
      });
    });
  })();

  /* ══ THE SET PIECE: pinned, scrubbed day-into-night ═══════════════════ */
  (function film() {
    var sec = document.querySelector('.bru-film');
    var cv = sec && sec.querySelector('.bru-film__canvas');
    if (!sec || !cv) return;
    /* alpha: TRUE on purpose. An opaque context paints the canvas as a solid
       black rectangle the moment it exists, which HIDES the poster still
       behind it until the first frame decodes. On a reload deep in the page
       that is a black hole where the set piece should be — the exact failure
       the outreach preflight exists to catch. Transparent means the poster
       shows through until there is a real frame to draw. */
    var ctx = cv.getContext('2d', { alpha: true });
    var caps = Array.prototype.slice.call(sec.querySelectorAll('.bru-film__cap'));
    /* DPR is capped by the SOURCE, not just by fill rate: asking for more
       device pixels than the footage can fill is exactly what made the first
       version look soft. */
    var FRAME_W = 1760, FRAME_H = 1176;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    /* A PINNED SECTION CAN REPORT A ZERO RECT. While ScrollTrigger sets a pin
       up it writes height:0/max-height:0 on the element, and if size() runs in
       that window the canvas is allocated 0px tall — after which it can never
       paint anything again, silently, with no error. Always fall back to the
       viewport, and never allocate a zero dimension. */
    var inner = sec.querySelector('.bru-film__inner');
    function size() {
      var r = inner.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width || window.innerWidth));
      var h = Math.max(1, Math.round(r.height || window.innerHeight));
      var need = Math.max(w / FRAME_W, h / FRAME_H);
      var d = Math.min(dpr, Math.max(1, 1 / need));
      var nw = Math.max(1, Math.round(w * d)), nh = Math.max(1, Math.round(h * d));
      if (cv.width !== nw || cv.height !== nh) { cv.width = nw; cv.height = nh; }
      draw(cv.dataset.frame ? Number(cv.dataset.frame) : 0);
    }
    function drawCover(im) {
      var cw = cv.width, ch = cv.height;
      var s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
      var w = im.naturalWidth * s, h = im.naturalHeight * s;
      ctx.drawImage(im, (cw - w) / 2, (ch - h) * 0.5, w, h);
    }
    function draw(i) {
      var im = shots[i];
      // clear, or a transparent context composites frames on top of each other
      if (im || shots.some(Boolean)) ctx.clearRect(0, 0, cv.width, cv.height);
      if (!im) {                      // nearest loaded frame, never a blank canvas
        for (var k = 1; k < FRAME_COUNT; k++) {
          if (shots[i - k]) { im = shots[i - k]; break; }
          if (shots[i + k]) { im = shots[i + k]; break; }
        }
      }
      if (!im) {                      // still nothing decoded: hold the poster
        if (poster.complete && poster.naturalWidth) drawCover(poster);
        return;
      }
      drawCover(im);
      cv.dataset.frame = String(i);
    }
    /* THE CANVAS MUST NEVER BE EMPTY. 121 frames is megabytes, and a reload
       deep in the page samples this long before they arrive — which is exactly
       what the outreach preflight flags. Paint the poster into the canvas the
       moment it decodes, so there is always a real picture there, and let the
       frames replace it as they land. */
    var poster = new Image();
    poster.onload = function () { if (!shots[0]) { size(); drawCover(poster); } };
    poster.src = 'assets/img/nott-poster.jpg';

    loadFrames(function () { size(); });
    window.addEventListener('resize', size, { passive: true });
    ScrollTrigger.addEventListener('refresh', size);   // the pin changes the rect
    size();
    ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom',
      scrub: 0.55, invalidateOnRefresh: true,
      onUpdate: function (self) {
        var i = Math.min(FRAME_COUNT - 1, Math.round(self.progress * (FRAME_COUNT - 1)));
        draw(i);
        // an EXACT handoff, never a crossfade: overlapping fades draw both
        // captions at once and the text reads as garbled
        var b = self.progress > 0.52;
        caps.forEach(function (c) { c.classList.toggle('is-on', (c.dataset.cap === 'b') === b); });
      }
    });
  })();

  /* ── testimonials: auto-rotating, but never a trap ────────────────────
     Pauses on hover AND on focus, stops entirely under reduced motion, and the
     dots are real tablist buttons so it can be driven by keyboard. An
     auto-rotator you cannot stop is an accessibility failure, not a flourish. */
  (function says() {
    var stage = document.getElementById('saysStage');
    var dots = document.getElementById('saysDots');
    if (!stage || !dots) return;
    var quotes = Array.prototype.slice.call(stage.querySelectorAll('.bru-quote'));
    if (quotes.length < 2) return;
    var i = 0, timer = null, paused = false;

    quotes.forEach(function (q, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(n === 0));
      b.setAttribute('aria-label', 'Review ' + (n + 1) + ' of ' + quotes.length);
      b.addEventListener('click', function () { show(n); restart(); });
      dots.appendChild(b);
    });
    var buttons = Array.prototype.slice.call(dots.children);

    function show(n) {
      i = (n + quotes.length) % quotes.length;
      quotes.forEach(function (q, k) { q.classList.toggle('is-on', k === i); });
      buttons.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); });
    }
    function tick() { if (!paused) show(i + 1); }
    function restart() { clearInterval(timer); timer = setInterval(tick, 5200); }

    ['mouseenter', 'focusin'].forEach(function (e) {
      stage.addEventListener(e, function () { paused = true; });
      dots.addEventListener(e, function () { paused = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (e) {
      stage.addEventListener(e, function () { paused = false; });
      dots.addEventListener(e, function () { paused = false; });
    });
    // only run while it is actually on screen
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? restart() : clearInterval(timer); });
    }, { threshold: 0.25 }).observe(stage);
  })();

  initMenu(function () {}); initForm();
})();
