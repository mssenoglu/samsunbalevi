// Giriş bölümü süsleri:
//  1) Arka plandaki petek deseninin bazı gözlerini balla doldurur (sağa doğru yoğunlaşır)
//  2) Bölümün üst kenarından sarkan bal damlalarını çizer
// Rastgelelik sabit tohumla yapılır; sayfa her açıldığında aynı görünür.
(function () {
  const hero = document.getElementById("giris");
  const comb = document.getElementById("hero-comb");
  const drips = document.getElementById("hero-drips");
  if (!hero || !comb || !drips) return;

  const NS = "http://www.w3.org/2000/svg";
  // honeycomb.svg karosu ile aynı ölçüler (sivri tepeli altıgen, r = 28)
  const TW = 48.5, TH = 84, R = 28;

  // Basit tekrarlanabilir rastgele sayı (0–1)
  const rand = (a, b) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const hexPath = (cx, cy, r) => {
    const pts = [];
    for (let k = 0; k < 6; k++) {
      const ang = (Math.PI / 180) * (60 * k - 90);
      pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)} ${(cy + r * Math.sin(ang)).toFixed(1)}`);
    }
    return "M" + pts.join("L") + "Z";
  };

  function drawComb(W, H) {
    comb.setAttribute("viewBox", `0 0 ${W} ${H}`);
    let d = "";
    let dLight = "";
    const cols = Math.ceil(W / TW) + 1;
    const rows = Math.ceil(H / TH) + 1;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        for (const [cx, cy, tag] of [
          [TW / 2 + TW * i, R + TH * j, 0],
          [TW * i, R * 2.5 + TH * j, 1],
        ]) {
          const w = Math.min(1, Math.max(0, (cx / W - 0.45) / 0.55)); // sağa doğru 0 → 1
          const r = rand(i * 2 + tag, j);
          if (r < w * 0.38) d += hexPath(cx, cy, R - 4);
          else if (r < w * 0.55) dLight += hexPath(cx, cy, R - 4);
        }
      }
    }
    comb.innerHTML = `<path class="comb-cell" d="${d}"/><path class="comb-cell comb-cell--light" d="${dLight}"/>`;
  }

  function drawDrips(W) {
    const base = 10;
    let x = W;
    let path = `M0 0H${W}V${base}`;
    let longest = { cx: 0, tip: 0 };
    let n = 0;
    // Sağdan sola ilerleyerek düzensiz aralıklarla damla oluştur
    while (x > 40) {
      const gap = 50 + rand(n, 7) * 110;
      const cx = x - gap;
      if (cx < 30) break;
      const h = 7 + rand(n, 3) * 7; // damlanın yarı genişliği
      const L = 14 + rand(n, 5) * 46; // uzunluk
      const rb = h * 0.85;
      const tip = base + L;
      path +=
        `L${(cx + h).toFixed(1)} ${base}` +
        `C${(cx + h * 0.4).toFixed(1)} ${(base + h * 0.8).toFixed(1)} ${(cx + rb).toFixed(1)} ${(tip - rb * 1.8).toFixed(1)} ${(cx + rb).toFixed(1)} ${(tip - rb).toFixed(1)}` +
        `A${rb.toFixed(1)} ${rb.toFixed(1)} 0 0 1 ${(cx - rb).toFixed(1)} ${(tip - rb).toFixed(1)}` +
        `C${(cx - rb).toFixed(1)} ${(tip - rb * 1.8).toFixed(1)} ${(cx - h * 0.4).toFixed(1)} ${(base + h * 0.8).toFixed(1)} ${(cx - h).toFixed(1)} ${base}`;
      if (L > longest.tip - base && cx > W * 0.15) longest = { cx, tip };
      x = cx - h;
      n++;
    }
    path += `L0 ${base}Z`;
    const height = 80;
    drips.setAttribute("viewBox", `0 0 ${W} ${height}`);
    drips.innerHTML =
      `<path class="drip-band" d="${path}"/>` +
      `<circle class="drip-drop" cx="${longest.cx.toFixed(1)}" cy="${(longest.tip - 3).toFixed(1)}" r="5"/>`;
  }

  function draw() {
    const W = Math.round(hero.clientWidth);
    const H = Math.round(hero.clientHeight);
    if (!W || !H) return;
    drawComb(W, H);
    drawDrips(W);
    hero.classList.add("deco-ready");
  }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(draw, 150);
  });
  draw();
  // İçerik (başlık, görsel) yüklendikten sonra yükseklik değişebilir
  window.addEventListener("load", draw);
  document.addEventListener("balevi:content", draw);
})();
