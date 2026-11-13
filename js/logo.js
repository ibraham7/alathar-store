// شعار «أثر ستور» — الختم (خمري + سكري)
// يُرسم داخل الصفحة حتى يستخدم خطوطها. ضع <span class="logo" data-logo="seal|seal-solid|mini"></span>
(function () {
  const star = (x, y, r) =>
    `<path class="fl" d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z"/>`;
  const trail = (x, y, s) => `
    <circle class="fl" cx="${x}" cy="${y}" r="${4.2 * s}"/>
    <circle class="fl" cx="${x - 13 * s}" cy="${y - 3 * s}" r="${3.1 * s}" opacity=".75"/>
    <circle class="fl" cx="${x - 24 * s}" cy="${y - 8 * s}" r="${2.1 * s}" opacity=".5"/>`;

  const seal = (solid) => `
    <svg class="lg ${solid ? 'solid' : ''}" viewBox="0 0 300 300" role="img" aria-label="أثر ستور">
      <circle class="disc" cx="150" cy="150" r="150"/>
      <circle class="ln" cx="150" cy="150" r="142" stroke-width="1.6"/>
      <circle class="ln" cx="150" cy="150" r="136" stroke-width=".6"/>
      <circle class="ln" cx="150" cy="150" r="106" stroke-width=".6"/>
      <defs>
        <path id="lgArcTop" d="M36 150a114 114 0 0 1 228 0"/>
      </defs>
      <text class="en" text-anchor="middle" style="font-size:18px;letter-spacing:10px"><textPath href="#lgArcTop" startOffset="50%">ATHAR STORE</textPath></text>
      ${star(150, 271, 5)}${star(128, 268.5, 2.6)}${star(172, 268.5, 2.6)}
      ${star(29, 150, 6)}${star(271, 150, 6)}
      <text class="ar" x="154" y="196" text-anchor="middle" style="font-size:118px;letter-spacing:0">أثر</text>
      ${trail(140, 222, 1)}
      <path class="ln" d="M176 222h36" stroke-width="1"/>
    </svg>`;

  const mini = () => `
    <svg class="lg solid" viewBox="0 0 100 100" role="img" aria-label="أثر ستور">
      <circle class="disc" cx="50" cy="50" r="50"/>
      <circle class="ln" cx="50" cy="50" r="45" stroke-width=".9"/>
      <text class="ar" x="52" y="72" text-anchor="middle" style="font-size:58px;letter-spacing:0">أثر</text>
      ${trail(48, 84, 0.4)}
    </svg>`;

  const draw = { seal: () => seal(false), 'seal-solid': () => seal(true), mini };
  document.querySelectorAll('[data-logo]').forEach((el) => {
    const fn = draw[el.dataset.logo];
    if (fn) el.innerHTML = fn();
  });
})();
