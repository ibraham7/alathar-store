// واجهة المتجر: عرض المنتجات، السلة، وإرسال الطلب
(function () {
  const { api, esc, safeColor, safeUrl, money, garment, setCurrency } = window.Athar;
  const $ = (id) => document.getElementById(id);
  const fx = window.Athar.fx || {};

  const state = {
    settings: { shipping_fee: 0 },
    categories: [],
    products: [],
    cat: 'all',
    cart: loadCart(),
    step: 'cart', // cart | form | done
    lastOrder: null,
  };

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('athar_cart')) || []; } catch { return []; }
  }
  function saveCart() {
    try { localStorage.setItem('athar_cart', JSON.stringify(state.cart)); } catch { /* تخزين غير متاح */ }
  }

  const byId = (id) => state.products.find((p) => p.id === id);
  const catOf = (p) => state.categories.find((c) => c.id === p.category_id);
  const media = (p) => {
    const url = safeUrl(p.image_url);
    return url ? `<img src="${esc(url)}" alt="${esc(p.name)}" loading="lazy">` : garment(catOf(p)?.icon, p.color);
  };
  const priceHtml = (p) =>
    `<span class="price">${p.old_price > p.price ? `<s>${money(p.old_price)}</s>` : ''}${money(p.price)}</span>`;

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- تحميل البيانات ----------
  async function load() {
    try {
      const [settings, categories, products] = await Promise.all([
        api.select('settings', 'select=*&id=eq.1'),
        api.select('categories', 'select=*&order=sort'),
        api.select('products', 'select=*&order=is_featured.desc,created_at.desc'),
      ]);
      state.settings = settings[0] || state.settings;
      state.categories = categories;
      state.products = products;
      setCurrency(state.settings.currency);
      // أزل من السلة ما لم يعد متوفراً
      state.cart = state.cart.filter((l) => byId(l.id));
      saveCart();
      renderSettings();
      renderChips();
      renderGrid();
      renderCart();
    } catch (e) {
      $('grid').innerHTML = `<p class="empty">تعذّر تحميل المنتجات. تحقّق من الاتصال ثم أعد المحاولة.</p>`;
    }
  }

  function renderSettings() {
    const s = state.settings;
    if (s.announcement) { $('announce').textContent = s.announcement; $('announce').hidden = false; }
    if (s.hero_title && s.hero_title !== ($('heroTitle').getAttribute('aria-label') || $('heroTitle').textContent)) {
      $('heroTitle').textContent = s.hero_title;
      fx.title?.($('heroTitle'));
    }
    if (s.hero_subtitle) $('heroSub').textContent = s.hero_subtitle;

    const links = [];
    const wa = (s.whatsapp || '').replace(/\D/g, '');
    const ig = (s.instagram || '').replace(/[^\w.]/g, '');
    if (wa) links.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">واتساب</a>`);
    if (ig) links.push(`<a href="https://instagram.com/${ig}" target="_blank" rel="noopener">@${esc(ig)}</a>`);
    if (s.phone) links.push(`<a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a>`);
    if (s.email && /^[^\s@]+@[^\s@]+$/.test(s.email)) links.push(`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
    $('contacts').innerHTML = links.join('');

    heroStart();
  }

  // ---------- المنتج المختار في الواجهة (تتبدّل تلقائياً) ----------
  let heroList = [], heroI = 0, heroTimer = null;
  const isLight = (hex) => {
    const n = parseInt(safeColor(hex).slice(1, 7).padEnd(6, '0'), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
  };
  function heroShow(i, instant) {
    heroI = (i + heroList.length) % heroList.length;
    const p = heroList[heroI], art = $('heroArt'), chip = $('heroChip');
    const paint = () => {
      art.style.setProperty('--a', isLight(p.color) ? '#B5653A' : '#DCCAAE');
      art.innerHTML = garment(catOf(p)?.icon, p.color);
      chip.innerHTML = `<b>${esc(p.name)}</b><span style="direction:ltr;display:inline-block">${money(p.price)}</span><br><em>اكتشفيها</em>`;
      $('heroDots').innerHTML = heroList.map((_, k) => `<i class="${k === heroI ? 'on' : ''}"></i>`).join('');
      art.classList.remove('swap'); chip.classList.remove('swap');
    };
    if (instant) return paint();
    art.classList.add('swap'); chip.classList.add('swap');
    setTimeout(paint, 380);
  }
  function heroStart() {
    heroList = state.products.filter((p) => p.is_featured && p.stock > 0);
    if (!heroList.length) heroList = state.products.slice(0, 4);
    if (!heroList.length) return;
    heroShow(Math.min(heroI, heroList.length - 1), true);
    clearInterval(heroTimer);
    if (heroList.length > 1 && !fx.calm) {
      heroTimer = setInterval(() => { if (!document.hidden && !document.querySelector('dialog[open]')) heroShow(heroI + 1); }, 3800);
    }
  }
  const heroOpen = () => { if (heroList[heroI]) openProduct(heroList[heroI].id); };
  $('heroArt').addEventListener('click', heroOpen);
  $('heroChip').addEventListener('click', heroOpen);

  function renderChips() {
    const used = state.categories.filter((c) => state.products.some((p) => p.category_id === c.id));
    const chip = (id, name) =>
      `<button class="chip" type="button" data-cat="${esc(id)}" aria-pressed="${state.cat === id}">${esc(name)}</button>`;
    $('chips').innerHTML = chip('all', 'الكل') + used.map((c) => chip(c.id, c.name)).join('');
  }

  function renderGrid() {
    const list = state.products.filter((p) => state.cat === 'all' || p.category_id === state.cat);
    if (!list.length) {
      $('grid').innerHTML = `<p class="empty">لا توجد منتجات في هذا القسم حالياً.</p>`;
      return;
    }
    $('grid').innerHTML = list.map((p, i) => {
      const badge = p.stock <= 0 ? `<span class="badge out">نفذت الكمية</span>`
        : p.old_price > p.price ? `<span class="badge sale">خصم</span>`
        : p.is_featured ? `<span class="badge">مختار</span>` : '';
      return `<button class="card" type="button" data-id="${esc(p.id)}" style="--i:${i % 4}">
        <div class="card-media" style="--c:${safeColor(p.color)}">${media(p)}${badge}<span class="quick">عرض سريع</span></div>
        <div class="card-body">
          <div><h3>${esc(p.name)}</h3><div class="card-cat">${esc(catOf(p)?.name || '')}</div></div>
          ${priceHtml(p)}
        </div>
      </button>`;
    }).join('');
    fx.reveal?.($('grid'));
  }

  // ---------- نافذة المنتج ----------
  const pick = { id: null, size: '', qty: 1 };

  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    pick.id = id; pick.qty = 1;
    pick.size = p.sizes.length === 1 ? p.sizes[0] : '';
    renderProduct();
    $('productDialog').showModal();
  }

  function renderProduct() {
    const p = byId(pick.id);
    const out = p.stock <= 0;
    const stockNote = out ? `<span class="stock-note low">غير متوفر حالياً</span>`
      : p.stock <= 3 ? `<span class="stock-note low">بقي ${p.stock} فقط</span>`
      : `<span class="stock-note">متوفر</span>`;
    $('pm').innerHTML = `
      <div class="pm-media" style="--c:${safeColor(p.color)}">${media(p)}</div>
      <div class="pm-info">
        <div class="card-cat">${esc(catOf(p)?.name || '')}</div>
        <h2 id="pmName">${esc(p.name)}</h2>
        ${priceHtml(p)}
        <p class="desc">${esc(p.description)}</p>
        ${p.sizes.length ? `<div><div class="label">الدرجة</div><div class="sizes">${p.sizes.map((s) =>
          `<button class="size" type="button" data-size="${esc(s)}" aria-pressed="${pick.size === s}">${esc(s)}</button>`).join('')}</div></div>` : ''}
        ${stockNote}
        <div class="pm-actions">
          <div class="qty" ${out ? 'hidden' : ''}>
            <button type="button" data-q="1" aria-label="زيادة الكمية">+</button><span>${pick.qty}</span><button type="button" data-q="-1" aria-label="إنقاص الكمية">−</button>
          </div>
          <button class="btn" type="button" id="addBtn" ${out ? 'disabled' : ''}>${out ? 'نفذت الكمية' : 'أضف إلى السلة'}</button>
        </div>
      </div>`;
  }

  const inCart = (id) => state.cart.filter((l) => l.id === id).reduce((n, l) => n + l.qty, 0);

  $('pm').addEventListener('click', (e) => {
    const p = byId(pick.id);
    const size = e.target.closest('[data-size]');
    const q = e.target.closest('[data-q]');
    if (size) { pick.size = size.dataset.size; renderProduct(); }
    else if (q) {
      const max = Math.min(20, p.stock - inCart(p.id));
      pick.qty = Math.max(1, Math.min(max, pick.qty + Number(q.dataset.q)));
      renderProduct();
    } else if (e.target.closest('#addBtn')) {
      if (p.sizes.length && !pick.size) return toast('اختاري الدرجة أولاً');
      if (inCart(p.id) + pick.qty > p.stock) return toast('الكمية المطلوبة أكبر من المتوفر');
      const line = state.cart.find((l) => l.id === p.id && l.size === pick.size);
      if (line) line.qty += pick.qty; else state.cart.push({ id: p.id, size: pick.size, qty: pick.qty });
      saveCart();
      state.step = 'cart';
      fx.fly?.(document.querySelector('.pm-media'), media(p));
      renderCart();
      $('productDialog').close();
      setTimeout(openCart, fx.calm || !fx.fly ? 0 : 750);
    }
  });

  document.querySelectorAll('dialog').forEach((d) =>
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));

  // ---------- السلة ----------
  function openCart() {
    document.body.classList.add('cart-open');
    $('drawer').setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    document.body.classList.remove('cart-open');
    $('drawer').setAttribute('aria-hidden', 'true');
    if (state.step === 'done') { state.step = 'cart'; renderCart(); }
  }
  $('cartBtn').addEventListener('click', openCart);
  $('cartClose').addEventListener('click', closeCart);
  $('scrim').addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  const totals = () => {
    const sub = state.cart.reduce((n, l) => n + (byId(l.id)?.price || 0) * l.qty, 0);
    const ship = Number(state.settings.shipping_fee) || 0;
    return { sub, ship, total: sub + ship };
  };

  const sumsHtml = () => {
    const t = totals();
    return `<div class="sum"><span>المجموع</span><span>${money(t.sub)}</span></div>
      <div class="sum"><span>التوصيل</span><span>${t.ship ? money(t.ship) : 'مجاني'}</span></div>
      <div class="sum total"><span>الإجمالي</span><span>${money(t.total)}</span></div>`;
  };

  function renderCart() {
    $('cartCount').textContent = state.cart.reduce((n, l) => n + l.qty, 0);
    const body = $('drawerBody'), foot = $('drawerFoot');

    if (state.step === 'done') {
      $('drawerTitle').textContent = 'تم استلام طلبك';
      body.innerHTML = `<div class="done"><div class="tick">✓</div><h3>شكراً لك</h3>
        <div class="no">#${esc(state.lastOrder.order_no)}</div>
        <p>سجّلنا طلبك بقيمة <b style="direction:ltr;display:inline-block">${money(state.lastOrder.total)}</b> وسنتواصل معك قريباً لتأكيد التوصيل.</p>
        <button class="btn" type="button" id="doneBtn">متابعة التسوق</button></div>`;
      foot.hidden = true;
      return;
    }
    foot.hidden = false;

    if (!state.cart.length) {
      $('drawerTitle').textContent = 'السلة';
      body.innerHTML = `<p class="empty">سلتك فارغة.</p>`;
      foot.innerHTML = `<button class="btn block" type="button" id="doneBtn">تصفّح المجموعة</button>`;
      return;
    }

    if (state.step === 'form') {
      $('drawerTitle').textContent = 'بيانات التوصيل';
      body.innerHTML = `<form id="orderForm" novalidate>
        <label class="field"><span>الاسم الكامل</span><input name="name" required autocomplete="name"></label>
        <label class="field"><span>رقم الجوال</span><input name="phone" type="tel" inputmode="tel" dir="ltr" required autocomplete="tel"></label>
        <label class="field"><span>المدينة</span><input name="city" autocomplete="address-level2"></label>
        <label class="field"><span>العنوان</span><input name="address" autocomplete="street-address"></label>
        <label class="field"><span>ملاحظات (اختياري)</span><textarea name="notes"></textarea></label>
        <p class="err" id="orderErr" hidden></p>
      </form>`;
      foot.innerHTML = `${sumsHtml()}
        <button class="btn clay block" type="submit" form="orderForm" id="sendBtn">تأكيد الطلب — الدفع عند الاستلام</button>
        <p style="text-align:center;margin-top:10px"><button class="link" type="button" id="backBtn">رجوع إلى السلة</button></p>`;
      return;
    }

    $('drawerTitle').textContent = 'السلة';
    body.innerHTML = state.cart.map((l, i) => {
      const p = byId(l.id);
      return `<div class="line" style="--i:${i}">
        <div class="line-media" style="--c:${safeColor(p.color)}">${media(p)}</div>
        <div><b>${esc(p.name)}</b><small>${l.size ? `الدرجة: ${esc(l.size)}` : ''}</small>
          <div><span class="qty"><button type="button" data-line="${i}" data-d="1" aria-label="زيادة">+</button><span>${l.qty}</span><button type="button" data-line="${i}" data-d="-1" aria-label="إنقاص">−</button></span></div>
        </div>
        <div style="text-align:end"><span class="price">${money(p.price * l.qty)}</span><br><button class="link" type="button" data-rm="${i}">حذف</button></div>
      </div>`;
    }).join('');
    foot.innerHTML = `${sumsHtml()}<button class="btn block" type="button" id="checkoutBtn">إتمام الطلب</button>`;
  }

  $('drawer').addEventListener('click', (e) => {
    const d = e.target.closest('[data-d]');
    const rm = e.target.closest('[data-rm]');
    if (d) {
      const l = state.cart[Number(d.dataset.line)];
      const p = byId(l.id);
      const next = l.qty + Number(d.dataset.d);
      if (next < 1) state.cart.splice(Number(d.dataset.line), 1);
      else if (inCart(l.id) - l.qty + next > p.stock) return toast('لا توجد كمية إضافية متوفرة');
      else l.qty = Math.min(20, next);
    } else if (rm) state.cart.splice(Number(rm.dataset.rm), 1);
    else if (e.target.closest('#checkoutBtn')) state.step = 'form';
    else if (e.target.closest('#backBtn')) state.step = 'cart';
    else if (e.target.closest('#doneBtn')) { closeCart(); state.step = 'cart'; location.hash = '#shop'; }
    else return;
    saveCart();
    renderCart();
  });

  const ERRORS = {
    name_required: 'اكتب الاسم الكامل.',
    phone_required: 'اكتب رقم جوال صحيح.',
    empty_cart: 'السلة فارغة.',
    product_unavailable: 'أحد المنتجات لم يعد متوفراً. حدّث الصفحة وحاول مجدداً.',
    bad_qty: 'كمية غير صحيحة.',
  };

  $('drawer').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const customer = Object.fromEntries(f.entries());
    const err = $('orderErr'), btn = $('sendBtn');
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    err.hidden = true;
    if (customer.name.trim().length < 2) return fail(ERRORS.name_required);
    if (customer.phone.replace(/\D/g, '').length < 7) return fail(ERRORS.phone_required);

    btn.disabled = true; btn.textContent = 'جارٍ إرسال الطلب…';
    try {
      const res = await api.rpc('place_order', {
        p_customer: customer,
        p_items: state.cart.map((l) => ({ product_id: l.id, size: l.size, qty: l.qty })),
      });
      state.lastOrder = res;
      state.cart = [];
      saveCart();
      state.step = 'done';
      renderCart();
      fx.confetti?.(document.querySelector('.done .tick'));
      load(); // تحديث المخزون
    } catch (ex) {
      const m = String(ex.message || '');
      fail(m.startsWith('out_of_stock:') ? `الكمية المطلوبة من «${m.slice(13)}» غير متوفرة.` : ERRORS[m] || 'تعذّر إرسال الطلب. حاول مرة أخرى.');
      btn.disabled = false; btn.textContent = 'تأكيد الطلب — الدفع عند الاستلام';
    }
  });

  // ---------- أحداث عامة ----------
  $('chips').addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]');
    if (!c) return;
    state.cat = c.dataset.cat;
    renderChips();
    renderGrid();
    $('grid').classList.remove('switch'); void $('grid').offsetWidth; $('grid').classList.add('switch');
  });
  $('grid').addEventListener('click', (e) => {
    const card = e.target.closest('[data-id]');
    if (card) openProduct(card.dataset.id);
  });

  $('year').textContent = new Date().getFullYear();
  renderCart();
  load();
})();
