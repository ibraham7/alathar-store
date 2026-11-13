// رسومات القطع (بدون أشخاص) — تُستخدم عندما لا يكون للمنتج صورة
(function () {
  const L = 'fill="none" stroke="rgba(40,24,14,.3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const D = 'fill="rgba(40,24,14,.16)"';

  const shapes = {
    shirt: (c) => `
      <path fill="${c}" d="M70 30 50 40Q36 46 32 70L20 168l22 6L56 96V215H144V96l14 78 22-6L168 70Q164 46 150 40L130 30Q100 52 70 30Z"/>
      <path ${L} d="M70 30l30 34 30-34M100 64v151M56 96V72M144 96V72M24 150l22 6M176 150l-22 6"/>
      <path ${D} d="M70 30l30 34-16 12-22-40ZM130 30l-30 34 16 12 22-40Z"/>
      <g ${D}><circle cx="100" cy="92" r="2.6"/><circle cx="100" cy="122" r="2.6"/><circle cx="100" cy="152" r="2.6"/><circle cx="100" cy="182" r="2.6"/></g>
      <path ${L} d="M116 108h18v16h-18z"/>`,
    tshirt: (c) => `
      <path fill="${c}" d="M72 32 44 42 14 74l22 28 18-12v122h92V90l18 12 22-28-30-32-28-10q-28 24-56 0Z"/>
      <path ${L} d="M72 32q28 30 56 0M54 90V64M146 90V64"/>
      <path ${D} d="M72 32q28 24 56 0-28 36-56 0Z"/>`,
    pants: (c) => `
      <path fill="${c}" d="M58 24h84l12 192h-42L100 84 88 216H46Z"/>
      <path ${L} d="M57 42h86M100 42v42M70 42q-2 16-14 20M130 42q2 16 14 20"/>
      <path ${D} d="M58 24h84l1 18H57Z"/>`,
    jacket: (c) => `
      <path fill="${c}" d="M68 28 48 38Q32 46 28 72L16 172l24 6L52 98V216H148V98l12 80 24-6L172 72Q168 46 152 38L132 28Q100 50 68 28Z"/>
      <path ${D} d="M68 28l32 62-18 10-26-56ZM132 28l-32 62 18 10 26-56Z"/>
      <path ${L} d="M68 28l32 62 32-62M100 90v126M52 98V74M148 98V74M62 164h26v22H62zM112 164h26v22h-26z"/>
      <g ${D}><circle cx="106" cy="118" r="2.8"/><circle cx="106" cy="148" r="2.8"/></g>`,
    hoodie: (c) => `
      <path fill="${c}" d="M70 42 44 52 14 150l26 9 16-56v111h88V103l16 56 26-9-30-98-26-10q-30 22-60 0Z"/>
      <path fill="${c}" d="M70 42q30-44 60 0-30 26-60 0Z"/>
      <path ${D} d="M70 42q30-44 60 0-30 26-60 0Z"/>
      <path ${L} d="M70 42q30 26 60 0M74 160h52l8 36H66ZM92 62v30M108 62v30M56 103V78M144 103V78"/>`,
    other: (c) => `
      <path fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"
        d="M100 92V78q0-8 9-12a15 15 0 1 0-23-13M100 92 26 142q-10 8 2 12h144q12-4 2-12Z"/>`,
  };

  window.Athar.garment = (icon, color) => {
    const c = window.Athar.safeColor(color);
    const draw = shapes[icon] || shapes.other;
    return `<svg class="garment" viewBox="0 0 200 240" aria-hidden="true">
      <ellipse cx="100" cy="226" rx="62" ry="6" fill="rgba(40,24,14,.12)"/>${draw(c)}</svg>`;
  };
  window.Athar.icons = { shirt: 'قميص', tshirt: 'تيشيرت', pants: 'بنطال', jacket: 'جاكيت', hoodie: 'هودي', other: 'أخرى' };
})();
