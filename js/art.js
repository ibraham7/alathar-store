// رسومات منتجات المكياج (بدون أشخاص) — تُستخدم عندما لا يكون للمنتج صورة.
// اللون c هو «لون العرض» للمنتج؛ الغطاء داكن والحلقات ذهبية.
(function () {
  const CAP = '#2A1D15', GOLD = '#C9A77C';
  const L = 'fill="none" stroke="rgba(40,24,14,.28)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const SHINE = 'fill="rgba(255,250,240,.32)"';
  const SHADE = 'fill="rgba(40,24,14,.16)"';

  const shapes = {
    // أحمر شفاه
    lipstick: (c) => `
      <path fill="${c}" d="M82 108V66q0-7 6-11l22-15q8-5 8 4v64Z"/>
      <path ${SHINE} d="M88 108V68q0-4 3-6l7-5v51Z"/>
      <rect x="74" y="104" width="52" height="34" rx="3" fill="${GOLD}"/>
      <path ${SHADE} d="M74 128h52v10H74Z"/>
      <rect x="66" y="136" width="68" height="80" rx="6" fill="${CAP}"/>
      <path fill="rgba(255,250,240,.12)" d="M74 142h8v68h-8Z"/>`,
    // كريم أساس
    foundation: (c) => `
      <rect x="80" y="26" width="40" height="50" rx="5" fill="${CAP}"/>
      <path fill="rgba(255,250,240,.12)" d="M86 32h6v38h-6Z"/>
      <rect x="86" y="74" width="28" height="14" fill="${GOLD}"/>
      <rect x="58" y="86" width="84" height="130" rx="16" fill="${c}"/>
      <path ${SHINE} d="M66 102q0-8 8-8h4v114h-4q-8 0-8-8Z"/>
      <rect x="78" y="128" width="50" height="46" rx="3" fill="rgba(255,250,240,.6)"/>
      <path ${L} d="M88 144h30M88 156h20"/>`,
    // ظلال عيون
    palette: (c) => `
      <rect x="20" y="58" width="160" height="130" rx="14" fill="${CAP}"/>
      <rect x="26" y="64" width="148" height="118" rx="10" fill="none" stroke="${GOLD}" stroke-width="1.2"/>
      ${[0, 1, 2].map((i) => [0, 1].map((j) => {
        const x = 36 + i * 44, y = 74 + j * 52, k = i + j * 3;
        const tone = ['rgba(255,250,240,.55)', 'rgba(255,250,240,.28)', 'rgba(255,250,240,0)', 'rgba(40,24,14,.12)', 'rgba(40,24,14,.3)', 'rgba(40,24,14,.5)'][k];
        return `<rect x="${x}" y="${y}" width="40" height="46" rx="6" fill="${c}"/><rect x="${x}" y="${y}" width="40" height="46" rx="6" fill="${tone}"/>`;
      }).join('')).join('')}`,
    // ماسكارا
    mascara: (c) => `
      <rect x="80" y="22" width="40" height="86" rx="9" fill="${CAP}"/>
      <path fill="rgba(255,250,240,.12)" d="M87 30h6v70h-6Z"/>
      <rect x="80" y="104" width="40" height="12" fill="${GOLD}"/>
      <rect x="80" y="114" width="40" height="102" rx="9" fill="${c}"/>
      <path ${SHINE} d="M87 122h6v86h-6Z"/>`,
    // بودرة / بلاشر مضغوط
    compact: (c) => `
      <circle cx="100" cy="128" r="82" fill="${CAP}"/>
      <circle cx="100" cy="128" r="74" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
      <circle cx="100" cy="128" r="64" fill="${c}"/>
      <path ${SHINE} d="M58 110a46 46 0 0 1 54-38 60 60 0 0 0-54 38Z"/>
      <path ${SHADE} d="M100 192a64 64 0 0 0 60-42 70 70 0 0 1-104 22 64 64 0 0 0 44 20Z"/>`,
    // فرشاة
    brush: (c) => `
      <path fill="${c}" d="M84 100Q66 52 100 22q34 30 16 78Z"/>
      <path ${SHINE} d="M90 96Q78 58 100 34q-6 30-2 62Z"/>
      <rect x="84" y="98" width="32" height="30" rx="2" fill="${GOLD}"/>
      <path ${SHADE} d="M84 118h32v10H84Z"/>
      <path fill="${CAP}" d="M88 128h24l-5 86q-1 8-7 8t-7-8Z"/>`,
    // طلاء أظافر
    nail: (c) => `
      <rect x="82" y="22" width="36" height="88" rx="7" fill="${CAP}"/>
      <path fill="rgba(255,250,240,.12)" d="M88 30h6v72h-6Z"/>
      <rect x="86" y="106" width="28" height="12" fill="${GOLD}"/>
      <path fill="${c}" d="M72 116h56q16 0 16 18v64q0 18-18 18H74q-18 0-18-18v-64q0-18 16-18Z"/>
      <path ${SHINE} d="M64 134q0-10 8-10h4v84h-2q-10 0-10-10Z"/>`,
    // أخرى: أنبوب
    other: (c) => `
      <rect x="78" y="24" width="44" height="40" rx="5" fill="${CAP}"/>
      <rect x="84" y="62" width="32" height="10" fill="${GOLD}"/>
      <path fill="${c}" d="M70 72h60l8 132q0 12-12 12H74q-12 0-12-12Z"/>
      <path ${SHINE} d="M76 80h8l-4 128h-6q-6 0-6-6Z"/>`,
  };

  window.Athar.garment = (icon, color) => {
    const c = window.Athar.safeColor(color);
    const draw = shapes[icon] || shapes.other;
    return `<svg class="garment" viewBox="0 0 200 240" aria-hidden="true">
      <ellipse cx="100" cy="228" rx="58" ry="6" fill="rgba(40,24,14,.12)"/>${draw(c)}</svg>`;
  };
  window.Athar.icons = {
    lipstick: 'أحمر شفاه', foundation: 'كريم أساس', palette: 'ظلال عيون', mascara: 'ماسكارا',
    compact: 'بودرة / بلاشر', brush: 'فرشاة', nail: 'طلاء أظافر', other: 'أخرى',
  };
})();
