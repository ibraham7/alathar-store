// الحركة والتفاعل: افتتاحية، ظهور عند التمرير، إمالة البطاقات، مؤشّر، طيران للسلة…
(function () {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);
  root.classList.add('js');

  // ---------- شاشة الافتتاح (مرة واحدة في الجلسة) ----------
  const loader = $('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('athar_intro') === '1'; sessionStorage.setItem('athar_intro', '1'); } catch { /* لا تخزين */ }
  if (loader) {
    if (seen || calm) { loader.remove(); }
    else {
      root.style.setProperty('--t0', '1.9s');
      setTimeout(() => loader.classList.add('gone'), 1700);
      setTimeout(() => loader.remove(), 2900);
    }
  }

  // ---------- العنوان: كلمة كلمة ----------
  function title(el) {
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}"></span></span>`).join(' ');
    el.querySelectorAll('.w > span').forEach((s, i) => { s.textContent = words[i]; });
  }

  // ---------- الظهور عند التمرير ----------
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  function reveal(scope) {
    (scope || document).querySelectorAll('[data-reveal]:not(.in), .card:not(.in)').forEach((el) => {
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  // ---------- التمرير: الترويسة، شريط التقدّم، النص الخلفي ----------
  const header = document.querySelector('.header'), bar = $('progress'), ghost = document.querySelector('.ghost-text');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = root.scrollHeight - innerHeight;
      header?.classList.toggle('scrolled', y > 30);
      if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (ghost && !calm) {
        const r = ghost.parentElement.getBoundingClientRect();
        ghost.style.transform = `translateX(${(r.top - innerHeight) * 0.25}px)`;
      }
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- حركة الواجهة مع الفأرة ----------
  const hero = document.querySelector('.hero'), art = document.querySelector('.hero-art');
  if (hero && art && fine && !calm) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      art.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2);
      art.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2);
    });
    hero.addEventListener('mouseleave', () => { art.style.setProperty('--mx', 0); art.style.setProperty('--my', 0); });
  }

  // ---------- إمالة البطاقات ----------
  const grid = $('grid');
  if (grid && fine && !calm) {
    let last = null;
    const reset = (m) => { m.style.removeProperty('--rx'); m.style.removeProperty('--ry'); };
    grid.addEventListener('mousemove', (e) => {
      const m = e.target.closest('.card')?.querySelector('.card-media');
      if (last && last !== m) reset(last);
      last = m;
      if (!m) return;
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      m.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
      m.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
      m.style.setProperty('--sx', `${x * 100}%`);
      m.style.setProperty('--sy', `${y * 100}%`);
    });
    grid.addEventListener('mouseleave', () => { if (last) reset(last); last = null; });
  }

  // ---------- المؤشّر ----------
  if (fine && !calm) {
    const ring = document.createElement('div'); ring.className = 'cursor'; ring.textContent = 'عرض';
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    let x = 0, y = 0, rx = 0, ry = 0, started = false;
    addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      if (!started) { started = true; rx = x; ry = y; ring.classList.add('on'); dot.classList.add('on'); loop(); }
      const t = e.target;
      const view = !!t.closest?.('.card, .arch');
      ring.classList.toggle('view', view);
      ring.classList.toggle('link', !view && !!t.closest?.('a, button, input, select, textarea, label'));
    });
    document.addEventListener('mouseleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); started = false; });
    function loop() {
      if (!started) return;
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    }

    // أزرار مغناطيسية
    document.querySelectorAll('.magnet').forEach((b) => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  // ---------- شريط الدرجات ----------
  const palette = $('palette');
  if (palette) {
    palette.addEventListener('click', (e) => {
      const s = e.target.closest('.swatch');
      if (!s) return;
      palette.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('on', x === s));
    });
    palette.addEventListener('mouseenter', () => palette.querySelectorAll('.on').forEach((x) => x.classList.remove('on')));
  }

  // ---------- طيران المنتج إلى السلة ----------
  function fly(fromEl, html) {
    const to = $('cartBtn');
    if (calm || !fromEl || !to || !fromEl.animate) return bump();
    const a = fromEl.getBoundingClientRect(), b = to.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'flyer';
    f.innerHTML = html || '';
    f.style.left = `${a.left + a.width / 2 - 32}px`;
    f.style.top = `${a.top + a.height / 2 - 39}px`;
    document.body.append(f);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1.6) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(1.1) rotate(-14deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.15) rotate(-30deg)`, opacity: 0.4 },
    ], { duration: 850, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => { f.remove(); bump(); };
  }
  function bump() {
    const c = $('cartCount');
    if (!c) return;
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }

  // ---------- قصاصات عند نجاح الطلب ----------
  function confetti(origin) {
    if (calm || !origin || !origin.animate) return;
    const r = origin.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#B5653A', '#B08D5B', '#6F6B45', '#DCCAAE', '#3B2A20', '#C97B4A'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.className = 'confetti';
      p.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]};border-radius:${i % 3 ? '2px' : '50%'}`;
      document.body.append(p);
      const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 200;
      p.animate([
        { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist - 60}px) rotate(${Math.random() * 540}deg) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist * 1.15}px, ${Math.sin(ang) * dist + 220}px) rotate(${Math.random() * 900}deg) scale(.4)`, opacity: 0 },
      ], { duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
    }
  }

  title($('heroTitle'));
  reveal();
  window.Athar.fx = { title, reveal, fly, bump, confetti, calm };
})();
