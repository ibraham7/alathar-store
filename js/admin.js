// لوحة التحكم: الطلبات، المنتجات، الأقسام، الإعدادات
(function () {
  const { api, esc, safeColor, safeUrl, money, garment, icons, setCurrency } = window.Athar;
  const $ = (id) => document.getElementById(id);

  let token = sessionStorage.getItem('athar_admin') || '';
  const data = { products: [], categories: [], orders: [], settings: {}, stats: null };
  let orderFilter = 'all';

  const STATUS = { new: 'جديد', confirmed: 'مؤكد', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // كل طلبات الأدمن تمر من هنا: تضيف رمز الجلسة وتعيد لشاشة الدخول إذا انتهت
  async function admin(fn, args) {
    try {
      return await api.rpc(fn, { p_token: token, ...args });
    } catch (e) {
      if (e.message === 'unauthorized') { showLogin('انتهت الجلسة. سجّل الدخول من جديد.'); }
      throw e;
    }
  }

  // ---------- الدخول ----------
  function showLogin(msg) {
    token = '';
    sessionStorage.removeItem('athar_admin');
    $('shell').hidden = true;
    $('login').hidden = false;
    $('loginErr').hidden = !msg;
    $('loginErr').textContent = msg || '';
  }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('loginBtn');
    btn.disabled = true;
    $('loginErr').hidden = true;
    try {
      const t = await api.rpc('admin_login', { p_password: $('loginPass').value });
      if (!t) throw new Error('wrong');
      token = t;
      sessionStorage.setItem('athar_admin', token);
      $('loginPass').value = '';
      await start();
    } catch (ex) {
      $('loginErr').textContent = ex.message === 'too_many_attempts'
        ? 'محاولات كثيرة. انتظر عشر دقائق ثم حاول مجدداً.'
        : ex.message === 'wrong' ? 'كلمة السر غير صحيحة.' : 'تعذّر الاتصال. حاول مرة أخرى.';
      $('loginErr').hidden = false;
    }
    btn.disabled = false;
  });

  $('logoutBtn').addEventListener('click', async () => {
    try { await api.rpc('admin_logout', { p_token: token }); } catch { /* الجلسة ستنتهي تلقائياً */ }
    showLogin();
  });

  async function start() {
    await refresh();
    $('login').hidden = true;
    $('shell').hidden = false;
  }

  async function refresh() {
    const [stats, orders, products, categories, settings] = await Promise.all([
      admin('admin_stats'),
      admin('admin_orders'),
      admin('admin_products'),
      api.select('categories', 'select=*&order=sort'),
      api.select('settings', 'select=*&id=eq.1'),
    ]);
    Object.assign(data, { stats, orders, products, categories, settings: settings[0] || {} });
    setCurrency(data.settings.currency);
    renderAll();
  }

  function renderAll() {
    renderOverview(); renderOrders(); renderProducts(); renderCategories(); renderSettings();
  }

  // ---------- التبويبات ----------
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    document.querySelectorAll('#tabs button').forEach((x) => x.setAttribute('aria-current', x === b));
    document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== `tab-${b.dataset.tab}`; });
  });
  document.querySelector('[data-refresh]').addEventListener('click', () => refresh().then(() => toast('تم التحديث')));

  // ---------- نظرة عامة ----------
  function renderOverview() {
    const s = data.stats;
    $('newPill').hidden = !s.new_count;
    $('newPill').textContent = s.new_count;
    const stat = (label, value, hot) => `<div class="stat ${hot ? 'hot' : ''}"><span>${label}</span><b>${value}</b></div>`;
    $('stats').innerHTML =
      stat('مبيعات اليوم', money(s.revenue_today), true) +
      stat('مبيعات هذا الشهر', money(s.revenue_month)) +
      stat('إجمالي المبيعات', money(s.revenue)) +
      stat('طلبات جديدة', s.new_count) +
      stat('عدد الطلبات', s.orders_count) +
      stat('قطع مباعة', s.items_sold);

    const max = Math.max(1, ...s.daily.map((d) => Number(d.total)));
    $('chart').innerHTML = s.daily.map((d) => {
      const total = Number(d.total);
      const day = d.day.slice(8) + '/' + d.day.slice(5, 7);
      return `<div class="bar ${total ? 'has' : ''}" title="${day} — ${esc(money(total))} (${d.orders} طلب)">
        <i style="height:${Math.round((total / max) * 100)}%"></i><small>${d.day.slice(8)}</small></div>`;
    }).join('');

    $('top').innerHTML = s.top_products.length
      ? s.top_products.map((t) => `<div class="rank"><span>${esc(t.name)}</span><b>${t.qty} قطعة</b></div>`).join('')
      : `<p class="muted">لا توجد مبيعات بعد.</p>`;
    $('low').innerHTML = s.low_stock.length
      ? s.low_stock.map((t) => `<div class="rank"><span>${esc(t.name)}</span><b>${t.stock ? `بقي ${t.stock}` : 'نفذ'}</b></div>`).join('')
      : `<p class="muted">كل المنتجات متوفرة بكميات جيدة.</p>`;
  }

  // ---------- الطلبات ----------
  function renderOrders() {
    const count = (st) => data.orders.filter((o) => o.status === st).length;
    const chip = (id, label) => `<button class="chip" type="button" data-f="${id}" aria-pressed="${orderFilter === id}">${label}</button>`;
    $('orderFilter').innerHTML = chip('all', `الكل (${data.orders.length})`) +
      Object.entries(STATUS).map(([k, v]) => chip(k, `${v} (${count(k)})`)).join('');

    const list = data.orders.filter((o) => orderFilter === 'all' || o.status === orderFilter);
    if (!list.length) { $('orders').innerHTML = `<div class="box muted">لا توجد طلبات هنا.</div>`; return; }

    $('orders').innerHTML = list.map((o) => {
      const when = new Date(o.created_at).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' });
      const place = [o.city, o.address].filter(Boolean).map(esc).join(' — ');
      return `<article class="order">
        <div class="order-top">
          <div><span class="order-no">#${o.order_no}</span> <span class="tag ${esc(o.status)}">${STATUS[o.status] || esc(o.status)}</span></div>
          <span class="order-meta">${esc(when)}</span>
        </div>
        <div class="order-cust"><b>${esc(o.customer_name)}</b> · <a href="tel:${esc(o.phone.replace(/[^\d+]/g, ''))}">${esc(o.phone)}</a>
          ${place ? `<div class="order-meta">${place}</div>` : ''}
          ${o.notes ? `<div class="order-meta">ملاحظة: ${esc(o.notes)}</div>` : ''}</div>
        <div class="order-items">${o.items.map((i) =>
          `<div><span>${esc(i.product_name)}${i.size ? ` <span class="muted" dir="ltr">(${esc(i.size)})</span>` : ''} × ${i.qty}</span><span class="num">${money(i.unit_price * i.qty)}</span></div>`).join('')}
          ${Number(o.shipping_fee) ? `<div><span class="muted">التوصيل</span><span class="num">${money(o.shipping_fee)}</span></div>` : ''}
        </div>
        <div class="order-bottom">
          <div><select data-order="${o.id}" aria-label="حالة الطلب">${Object.entries(STATUS).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
            <button class="link" type="button" data-del-order="${o.id}" style="margin-inline-start:12px">حذف</button></div>
          <span class="order-total">${money(o.total)}</span>
        </div>
      </article>`;
    }).join('');
  }

  $('orderFilter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) { orderFilter = b.dataset.f; renderOrders(); }
  });
  $('orders').addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-order]');
    if (!sel) return;
    try {
      await admin('admin_set_order_status', { p_id: sel.dataset.order, p_status: sel.value });
      await refresh();
      toast('تم تحديث حالة الطلب');
    } catch { toast('تعذّر تحديث الحالة'); }
  });
  $('orders').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del-order]');
    if (!b) return;
    const o = data.orders.find((x) => x.id === b.dataset.delOrder);
    confirmDelete(`حذف الطلب #${o.order_no} نهائياً؟`, async () => {
      // حذف طلب غير ملغي يعيد كمياته للمخزون أولاً
      if (o.status !== 'cancelled') await admin('admin_set_order_status', { p_id: o.id, p_status: 'cancelled' });
      await admin('admin_delete_order', { p_id: o.id });
    });
  });

  // ---------- تأكيد الحذف ----------
  let onConfirm = null;
  function confirmDelete(text, action) {
    $('confirmText').textContent = text;
    onConfirm = action;
    $('confirmDialog').showModal();
  }
  $('confirmYes').addEventListener('click', async () => {
    $('confirmYes').disabled = true;
    try { await onConfirm(); await refresh(); toast('تم الحذف'); } catch { toast('تعذّر الحذف'); }
    $('confirmYes').disabled = false;
    $('confirmDialog').close();
  });
  document.querySelectorAll('dialog').forEach((d) =>
    d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) d.close(); }));

  // ---------- المنتجات ----------
  const catOf = (p) => data.categories.find((c) => c.id === p.category_id);
  const media = (p) => {
    const url = safeUrl(p.image_url);
    return url ? `<img src="${esc(url)}" alt="">` : garment(catOf(p)?.icon, p.color);
  };

  function renderProducts() {
    if (!data.products.length) { $('products').innerHTML = `<tr><td class="muted">لا توجد منتجات بعد. أضف أول منتج.</td></tr>`; return; }
    $('products').innerHTML = `<thead><tr><th></th><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead><tbody>` +
      data.products.map((p) => `<tr>
        <td><div class="thumb" style="--c:${safeColor(p.color)}">${media(p)}</div></td>
        <td><b>${esc(p.name)}</b>${p.is_featured ? ' <span class="tag">مختارة</span>' : ''}<div class="muted" dir="ltr" style="text-align:end">${esc(p.sizes.join(' · '))}</div></td>
        <td>${esc(catOf(p)?.name || '—')}</td>
        <td class="num">${money(p.price)}</td>
        <td><span class="tag ${p.stock <= 3 ? 'low' : ''}">${p.stock}</span></td>
        <td><span class="tag ${p.is_active ? 'shipped' : 'off'}">${p.is_active ? 'ظاهر' : 'مخفي'}</span></td>
        <td><div class="acts"><button class="link" type="button" data-edit="${p.id}">تعديل</button><button class="link" type="button" data-del="${p.id}">حذف</button></div></td>
      </tr>`).join('') + `</tbody>`;
  }

  const pf = $('productForm');

  function updatePreview() {
    const url = safeUrl(pf.image_url.value);
    const icon = data.categories.find((c) => c.id === pf.category_id.value)?.icon;
    $('preview').style.setProperty('--c', safeColor(pf.color.value));
    $('preview').innerHTML = url ? `<img src="${esc(url)}" alt="">` : garment(icon, pf.color.value);
    $('removeImage').hidden = !url;
  }

  function openProductForm(p) {
    pf.reset();
    $('productErr').hidden = true;
    $('productFormTitle').textContent = p ? 'تعديل المنتج' : 'منتج جديد';
    pf.category_id.innerHTML = `<option value="">بدون قسم</option>` +
      data.categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    pf.id.value = p?.id || '';
    pf.image_url.value = p?.image_url || '';
    if (p) {
      pf.name.value = p.name; pf.description.value = p.description; pf.price.value = p.price;
      pf.old_price.value = p.old_price ?? ''; pf.category_id.value = p.category_id || ''; pf.stock.value = p.stock;
      pf.sizes.value = p.sizes.join(', '); pf.color.value = safeColor(p.color);
      pf.is_active.checked = p.is_active; pf.is_featured.checked = p.is_featured;
    } else { pf.stock.value = 10; }
    updatePreview();
    $('productDialog').showModal();
  }

  $('newProduct').addEventListener('click', () => openProductForm(null));
  $('products').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openProductForm(data.products.find((p) => p.id === ed.dataset.edit));
    if (del) {
      const p = data.products.find((x) => x.id === del.dataset.del);
      confirmDelete(`حذف «${p.name}» نهائياً؟`, () => admin('admin_delete_product', { p_id: p.id }));
    }
  });
  pf.color.addEventListener('input', updatePreview);
  pf.category_id.addEventListener('change', updatePreview);
  $('removeImage').addEventListener('click', () => { pf.image_url.value = ''; updatePreview(); });

  // تصغير الصورة في المتصفح قبل الرفع (أقصى ضلع 1400px)
  async function shrink(file) {
    const img = await createImageBitmap(file);
    const k = Math.min(1, 1400 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.86));
  }

  $('imageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    toast('جارٍ رفع الصورة…');
    try {
      const { url } = await api.uploadImage(await shrink(file), token);
      pf.image_url.value = url;
      updatePreview();
      toast('تم رفع الصورة');
    } catch (ex) {
      if (ex.status === 401) return showLogin('انتهت الجلسة. سجّل الدخول من جديد.');
      toast('تعذّر رفع الصورة');
    }
  });

  pf.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('productSave');
    btn.disabled = true;
    $('productErr').hidden = true;
    try {
      await admin('admin_save_product', { p: {
        id: pf.id.value, name: pf.name.value, description: pf.description.value,
        price: pf.price.value, old_price: pf.old_price.value, category_id: pf.category_id.value,
        sizes: pf.sizes.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
        color: pf.color.value, image_url: pf.image_url.value, stock: pf.stock.value || 0,
        is_active: pf.is_active.checked, is_featured: pf.is_featured.checked,
      } });
      $('productDialog').close();
      await refresh();
      toast('تم حفظ المنتج');
    } catch {
      $('productErr').textContent = 'تعذّر الحفظ. تأكد من الاسم والسعر والكمية.';
      $('productErr').hidden = false;
    }
    btn.disabled = false;
  });

  // ---------- الأقسام ----------
  const cf = $('categoryForm');
  cf.icon.innerHTML = Object.entries(icons).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  function renderCategories() {
    if (!data.categories.length) { $('categories').innerHTML = `<tr><td class="muted">لا توجد أقسام بعد.</td></tr>`; return; }
    $('categories').innerHTML = `<thead><tr><th></th><th>القسم</th><th>عدد المنتجات</th><th>الترتيب</th><th></th></tr></thead><tbody>` +
      data.categories.map((c) => `<tr>
        <td><div class="thumb">${garment(c.icon, '#B08968')}</div></td>
        <td><b>${esc(c.name)}</b></td>
        <td>${data.products.filter((p) => p.category_id === c.id).length}</td>
        <td>${c.sort}</td>
        <td><div class="acts"><button class="link" type="button" data-edit="${c.id}">تعديل</button><button class="link" type="button" data-del="${c.id}">حذف</button></div></td>
      </tr>`).join('') + `</tbody>`;
  }

  function openCategoryForm(c) {
    cf.reset();
    $('categoryFormTitle').textContent = c ? 'تعديل القسم' : 'قسم جديد';
    cf.id.value = c?.id || '';
    if (c) { cf.name.value = c.name; cf.icon.value = c.icon; cf.sort.value = c.sort; }
    else cf.sort.value = data.categories.length + 1;
    $('categoryDialog').showModal();
  }
  $('newCategory').addEventListener('click', () => openCategoryForm(null));
  $('categories').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) openCategoryForm(data.categories.find((c) => c.id === ed.dataset.edit));
    if (del) {
      const c = data.categories.find((x) => x.id === del.dataset.del);
      confirmDelete(`حذف قسم «${c.name}»؟ منتجاته ستبقى بدون قسم.`, () => admin('admin_delete_category', { p_id: c.id }));
    }
  });
  cf.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await admin('admin_save_category', { p: { id: cf.id.value, name: cf.name.value, icon: cf.icon.value, sort: cf.sort.value || 0 } });
      $('categoryDialog').close();
      await refresh();
      toast('تم حفظ القسم');
    } catch { toast('تعذّر حفظ القسم'); }
  });

  // ---------- الإعدادات ----------
  const sf = $('settingsForm');
  const SETTING_KEYS = ['currency', 'shipping_fee', 'announcement', 'hero_title', 'hero_subtitle', 'whatsapp', 'instagram', 'phone', 'email'];
  function renderSettings() {
    SETTING_KEYS.forEach((k) => { if (document.activeElement !== sf[k]) sf[k].value = data.settings[k] ?? ''; });
  }
  sf.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await admin('admin_save_settings', { p: Object.fromEntries(SETTING_KEYS.map((k) => [k, sf[k].value])) });
      await refresh();
      toast('تم حفظ الإعدادات');
    } catch { toast('تعذّر حفظ الإعدادات'); }
  });

  $('passForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      const ok = await admin('admin_change_password', { p_old: f.old.value, p_new: f.new.value });
      toast(ok ? 'تم تغيير كلمة السر' : 'كلمة السر الحالية غير صحيحة');
      if (ok) f.reset();
    } catch { toast('تعذّر تغيير كلمة السر'); }
  });

  // ---------- البداية ----------
  if (token) start().catch(() => showLogin());
})();
