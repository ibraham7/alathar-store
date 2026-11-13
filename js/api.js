// الاتصال بقاعدة البيانات (Supabase) + أدوات مشتركة بين المتجر ولوحة التحكم
(function () {
  const SB_URL = 'https://vgfkycylwiwxxqahhaad.supabase.co';
  const SB_KEY = 'sb_publishable_uopRU4YGsT4h_bc_lzN7yA_c0gs9L3E'; // مفتاح عام — آمن للنشر

  const headers = { apikey: SB_KEY, 'Content-Type': 'application/json' };

  async function parse(res) {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const err = new Error((data && (data.message || data.error)) || 'request_failed');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  const api = {
    select: (table, query) =>
      fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers }).then(parse),
    rpc: (fn, args) =>
      fetch(`${SB_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args || {}) }).then(parse),
    uploadImage: (blob, token) =>
      fetch(`${SB_URL}/functions/v1/upload-image`, {
        method: 'POST',
        headers: { apikey: SB_KEY, 'x-admin-token': token, 'Content-Type': blob.type },
        body: blob,
      }).then(parse),
  };

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const safeColor = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#B08968');
  const safeUrl = (u) => (/^https:\/\//i.test(u || '') ? u : '');

  let currency = '$';
  const money = (n) =>
    `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;

  window.Athar = {
    api, esc, safeColor, safeUrl, money,
    setCurrency: (c) => { currency = c || '$'; },
  };
})();
