// Balların geldiği iller → Samsun haritası.
// Türkiye sınırı elle sadeleştirilmiş bir çizimdir (illüstrasyon amaçlı, ölçekli harita değildir).
(function () {
  const box = document.getElementById("origin-map");
  if (!box) return;

  // Boylam/enlem → SVG koordinatı (eşdikdörtgen izdüşüm, 39° enlemde düzeltilmiş)
  const W = 800, H = 360, PAD = 20;
  const LON0 = 25.6, LAT1 = 42.25, S = 52;
  const KX = Math.cos((39 * Math.PI) / 180);
  const P = ([lon, lat]) => [PAD + (lon - LON0) * S * KX, PAD + (LAT1 - lat) * S];

  const THRACE = [
    [26.04, 40.73], [26.35, 41.0], [26.6, 41.35], [26.33, 41.72], [26.6, 41.97], [27.05, 42.08],
    [27.6, 41.95], [28.02, 41.98], [28.3, 41.55], [28.95, 41.25], [29.05, 41.05], [28.6, 40.98],
    [28.0, 41.05], [27.5, 40.98], [27.2, 40.65], [26.7, 40.43], [26.2, 40.03], [26.5, 40.45],
    [26.8, 40.62], [26.4, 40.62],
  ];
  const ANATOLIA = [
    [29.1, 41.2], [29.9, 41.15], [30.5, 41.2], [31.4, 41.3], [31.8, 41.45], [32.3, 41.73],
    [33.0, 41.98], [33.5, 42.0], [34.0, 41.97], [34.9, 42.02], [35.2, 42.03], [35.5, 41.65],
    [36.0, 41.7], [36.3, 41.3], [36.6, 41.3], [37.1, 41.15], [37.6, 41.1], [38.4, 40.95],
    [39.2, 41.05], [39.7, 41.0], [40.5, 41.05], [41.0, 41.2], [41.55, 41.52], [42.3, 41.55],
    [42.8, 41.6], [43.4, 41.15], [43.75, 40.75], [43.6, 40.3], [44.0, 40.05], [44.8, 39.7],
    [44.4, 39.4], [44.2, 39.0], [44.3, 38.4], [44.5, 38.0], [44.3, 37.4], [44.8, 37.2],
    [44.2, 37.1], [43.3, 37.3], [42.4, 37.1], [41.2, 37.1], [40.3, 37.1], [39.0, 36.7],
    [38.2, 36.9], [37.0, 36.65], [36.65, 36.8], [36.4, 36.2], [35.95, 35.9], [35.8, 36.3],
    [36.2, 36.6], [35.8, 36.8], [35.3, 36.6], [34.6, 36.8], [34.0, 36.3], [33.5, 36.15],
    [32.8, 36.05], [32.3, 36.1], [31.7, 36.6], [31.0, 36.85], [30.6, 36.85], [30.5, 36.4],
    [30.1, 36.2], [29.6, 36.15], [29.1, 36.6], [28.6, 36.75], [28.0, 36.65], [27.4, 37.0],
    [27.2, 37.35], [27.1, 37.8], [26.6, 38.2], [26.3, 38.3], [26.8, 38.45], [26.85, 38.8],
    [26.75, 39.35], [26.1, 39.45], [26.15, 40.0], [26.4, 40.15], [26.7, 40.38], [27.3, 40.38],
    [27.8, 40.35], [28.2, 40.4], [28.95, 40.38], [29.3, 40.75], [29.9, 40.72], [29.4, 40.82],
    [29.05, 41.0],
  ];

  // Ballarımızın geldiği iller (il merkezi koordinatları)
  const ORIGINS = {
    Kırklareli: [27.22, 41.73], Edirne: [26.56, 41.68], Çanakkale: [26.41, 40.15],
    Aydın: [27.84, 37.85], Muğla: [28.36, 37.21], Isparta: [30.55, 37.76], Burdur: [30.29, 37.72],
    Antalya: [30.71, 36.89], Mersin: [34.64, 36.81], Zonguldak: [31.79, 41.45], Bartın: [32.34, 41.63],
    Kastamonu: [33.78, 41.38], Rize: [40.52, 41.02], Artvin: [41.82, 41.18], Erzincan: [39.49, 39.75],
    Erzurum: [41.27, 39.9], Bingöl: [40.5, 38.88], Ağrı: [43.05, 39.72], Bitlis: [42.11, 38.4],
    Van: [43.38, 38.5], Hakkari: [43.74, 37.57],
  };
  const SAMSUN = P([36.33, 41.29]);

  const poly = (pts) => "M" + pts.map((p) => P(p).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z";

  // Her ilden Samsun'a hafif kavisli bir yol; ok ucu Samsun işaretinin dışında biter
  function arc([x1, y1]) {
    const [x2, y2] = SAMSUN;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const bend = Math.min(0.28 * len, 90);
    let nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; } // kavis hep yukarı doğru
    const cx = (x1 + x2) / 2 + nx * bend, cy = (y1 + y2) / 2 + ny * bend;
    // Uç noktayı Samsun dairesinin kenarına çek
    const ex = x2 - cx, ey = y2 - cy, el = Math.hypot(ex, ey);
    const R = 24; // Samsun rozetinin kenarı
    const tx = x2 - (ex / el) * R, ty = y2 - (ey / el) * R;
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`;
  }

  // Yön, ok ucu yerine yol boyunca Samsun'a akan bal damlalarıyla gösterilir
  const moving = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const entries = Object.entries(ORIGINS);
  const routes = entries
    .map(([name, ll], i) => {
      const p = P(ll);
      const d = arc(p);
      const dur = (3.2 + (i % 5) * 0.35).toFixed(2);
      const begin = (2.2 + (i % 7) * 0.4).toFixed(1);
      const drop = moving
        ? `<circle class="route__drop" r="2.6"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${d}"/></circle>`
        : "";
      return `<g class="route" style="--i:${i}">
        <path class="route__line" d="${d}" pathLength="100"/>
        ${drop}
        <circle class="route__dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5"><title>${name}</title></circle>
      </g>`;
    })
    .join("");

  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="origin-map-title origin-map-desc">
    <title id="origin-map-title">Ballarımızın geldiği iller</title>
    <desc id="origin-map-desc">${entries.map(([n]) => n).join(", ")} illerinden Samsun'a uzanan yollar.</desc>
    <defs>
      <pattern id="map-hex" width="12.1" height="21" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
        <path d="M6.05 0 12.1 3.5v7L6.05 14 0 10.5v-7zM6.05 14v7" class="map__hex"/>
      </pattern>
    </defs>
    <g class="map__land">
      <path d="${poly(ANATOLIA)}"/>
      <path d="${poly(THRACE)}"/>
    </g>
    <g class="map__texture">
      <path d="${poly(ANATOLIA)}"/>
      <path d="${poly(THRACE)}"/>
    </g>
    <g class="routes">${routes}</g>
    <g class="samsun" transform="translate(${SAMSUN[0].toFixed(1)} ${SAMSUN[1].toFixed(1)})">
      <circle r="30" class="samsun__pulse"/>
      <circle r="22" class="samsun__halo"/>
      <circle r="16" class="samsun__ring"/>
      <image href="/img/logo-bee.webp" x="-12" y="-12" width="24" height="24"/>
      <title>Samsun</title>
    </g>
  </svg>`;

  // Oklar bölüm ekrana girince sırayla çizilir
  const svg = box.querySelector("svg");
  if (!("IntersectionObserver" in window)) return svg.classList.add("is-drawn");
  const io = new IntersectionObserver(
    (list) => {
      if (list.some((e) => e.isIntersecting)) {
        svg.classList.add("is-drawn");
        io.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  io.observe(svg);
})();
