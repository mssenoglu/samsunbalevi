// Kamuya açık site: içeriği /api/content'ten çekip sayfaya yerleştirir.

const priceFmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });

const JAR_SVG = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" aria-hidden="true">
  <rect x="18" y="8" width="28" height="8" rx="2"/><path d="M16 20h32v32a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z"/>
  <path d="M16 32c6 3 10-3 16 0s10 3 16 0"/></svg>`;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function waLink(number, text) {
  const n = String(number || "").replace(/\D/g, "");
  if (!n) return "#iletisim";
  return `https://wa.me/${n}` + (text ? `?text=${encodeURIComponent(text)}` : "");
}

// ---------- Giriş görseli ----------
// Görsel içerik gelince bir kez yerleştirilir ve yumuşakça belirir (önce varsayılan logo görünüp
// sonra değişmesin diye çerçeve başta boştur).
function renderHero(s) {
  const src = s.heroImage || "/img/logo.webp";
  const view = s.heroImage ? s.heroImageView || { mode: "contain" } : { mode: "contain" };
  document.querySelector("#hero-visual .hero__frame").innerHTML =
    `<img class="hero__image${s.heroImage ? "" : " hero__image--logo"}" src="${esc(src)}" alt="${esc(s.shopName || "Balevi")}" width="800" height="1000" fetchpriority="high" style="${imageViewStyle(view)}">`;
}

// ---------- Ürünler (kategorilere göre) ----------
function productCard(p, settings) {
  const media = p.image
    ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" width="400" height="500" loading="lazy" style="${imageViewStyle(p.imageView)}">`
    : `<div class="product-card__placeholder">${JAR_SVG}</div>`;
  return `<article class="product-card${p.inStock ? "" : " product-card--out"}">
    <div class="product-card__media">${media}${p.inStock ? "" : `<span class="badge">Stokta yok</span>`}</div>
    <div class="product-card__body">
      <div class="product-card__top">
        <h4>${esc(p.name)}</h4>
        <span class="product-card__price">${priceFmt.format(p.price)}</span>
      </div>
      ${p.unit ? `<span class="product-card__unit">${esc(p.unit)}</span>` : ""}
      ${p.description ? `<p class="product-card__desc">${esc(p.description)}</p>` : ""}
      ${productExtras(p)}
    </div>
  </article>`;
}

// Yöresi ve faydaları (panelden girilirse görünür). Faydalarda her satır bir madde olur.
function productExtras(p) {
  const benefits = String(p.benefits || "")
    .split("\n")
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (!p.region && !benefits.length) return "";
  return `<dl class="product-extras">
    ${p.region ? `<div><dt>Yöresi</dt><dd>${esc(p.region)}</dd></div>` : ""}
    ${benefits.length ? `<div><dt>Faydaları</dt><dd><ul>${benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></dd></div>` : ""}
  </dl>`;
}

function renderProducts(categories, products, settings) {
  const list = document.getElementById("product-list");
  if (!products.length) {
    list.innerHTML = `<p class="state">Ürünlerimizi yakında burada paylaşacağız. Şimdilik dükkânımıza uğrayabilir veya bize yazabilirsiniz.</p>`;
    return;
  }
  const known = new Set(categories.map((c) => c.id));
  const groups = categories
    .map((c) => ({ ...c, items: products.filter((p) => p.categoryId === c.id) }))
    .concat([{ id: "", name: "Diğer ürünler", description: "", items: products.filter((p) => !known.has(p.categoryId)) }])
    .filter((g) => g.items.length);

  const ARROW = {
    prev: '<path d="m15 18-6-6 6-6"/>',
    next: '<path d="m9 18 6-6-6-6"/>',
  };
  const arrow = (dir, label) =>
    `<button class="row-nav__btn" type="button" data-scroll="${dir === "prev" ? -1 : 1}" aria-label="${label}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ARROW[dir]}</svg>
    </button>`;

  list.innerHTML = groups
    .map((g) => {
      const hid = `kat-${esc(g.id || "diger")}`;
      return `<section class="product-group" aria-labelledby="${hid}">
        <header class="product-group__head">
          <div class="product-group__titles">
            <h3 id="${hid}">${esc(g.name)}</h3>
            ${g.description ? `<p>${esc(g.description)}</p>` : ""}
          </div>
          <div class="row-nav" hidden>
            ${arrow("prev", `${esc(g.name)}: önceki ürünler`)}
            ${arrow("next", `${esc(g.name)}: sonraki ürünler`)}
          </div>
        </header>
        <div class="product-row" tabindex="0" role="region" aria-label="${esc(g.name)} ürünleri, yana kaydırılabilir">
          ${g.items.map((p) => productCard(p, settings)).join("")}
        </div>
      </section>`;
    })
    .join("");

  list.querySelectorAll(".product-group").forEach(setupRow);
}

// Yana kaydırmalı ürün satırı: oklar yalnızca taşma varsa görünür, uçlarda pasifleşir
function setupRow(group) {
  const row = group.querySelector(".product-row");
  const nav = group.querySelector(".row-nav");
  const [prev, next] = nav.querySelectorAll("button");

  function step() {
    const card = row.firstElementChild;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : row.clientWidth * 0.8;
  }
  const slide = (dir) => row.scrollBy({ left: dir * step(), behavior: "smooth" });

  function update() {
    const max = row.scrollWidth - row.clientWidth;
    nav.hidden = max <= 2;
    prev.disabled = row.scrollLeft <= 2;
    next.disabled = row.scrollLeft >= max - 2;
    // Yarısı görünen kartlar tıklanabilir: tıklayınca satır o yöne kayar
    const R = row.getBoundingClientRect();
    [...row.children].forEach((card) => {
      const c = card.getBoundingClientRect();
      const peek = c.right > R.right + 2 ? 1 : c.left < R.left - 2 ? -1 : 0;
      card.dataset.peek = String(peek);
    });
  }
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-scroll]");
    if (b) slide(Number(b.dataset.scroll));
  });
  row.addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    const dir = Number(card?.dataset.peek || 0);
    if (dir) slide(dir);
  });
  row.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// ---------- Hakkımızda ----------
function renderAbout(settings, photos, sidePhotos) {
  document.getElementById("about-text").innerHTML = String(settings.aboutText || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((para) => `<p>${esc(para)}</p>`)
    .join("");

  const gallery = document.getElementById("about-gallery");
  gallery.hidden = !photos.length && !sidePhotos.length;
  gallery.classList.toggle("gallery--no-side", !sidePhotos.length);
  gallery.classList.toggle("gallery--no-main", !photos.length);
  setupSlider(photos);
  renderSidePhotos(sidePhotos);
}

// Sağdaki sabit dikey fotoğraf (açıklamasız, tek fotoğraf)
function renderSidePhotos(list) {
  const box = document.getElementById("side-photos");
  const shown = list.slice(0, 1);
  box.hidden = !shown.length;
  box.innerHTML = shown
    .map(
      (ph) => `<div class="side-photo">
        <img src="${esc(ph.image)}" alt="" width="600" height="800" loading="lazy" style="${imageViewStyle(ph.imageView)}">
      </div>`
    )
    .join("");
  // Telefonda çerçeve fotoğrafın kendi oranını alır: kenarlarda boşluk kalmaz
  const img = box.querySelector("img");
  if (img) {
    const setRatio = () => img.naturalWidth && box.style.setProperty("--side-ratio", `${img.naturalWidth} / ${img.naturalHeight}`);
    img.complete ? setRatio() : img.addEventListener("load", setRatio, { once: true });
  }
}

// Detay penceresi: fotoğraf, başlık ve detaylı açıklama
const detail = document.getElementById("photo-detail");
function openDetail(ph) {
  const img = document.getElementById("photo-detail-img");
  img.src = ph.image;
  img.alt = ph.title || "Balevi'den bir kare";
  document.getElementById("photo-detail-title").textContent = ph.title || "Balevi'den bir kare";
  document.getElementById("photo-detail-text").innerHTML = String(ph.description || "")
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
  detail.showModal();
}
detail.querySelector("[data-close]").addEventListener("click", () => detail.close());
detail.addEventListener("click", (e) => e.target === detail && detail.close());

function setupSlider(photos) {
  const slider = document.getElementById("about-slider");
  if (!photos.length) return;
  slider.hidden = false;
  slider.classList.toggle("slider--single", photos.length === 1);

  const track = document.getElementById("slider-track");
  const dots = document.getElementById("slider-dots");
  const total = photos.length;

  track.innerHTML = photos
    .map(
      (ph, i) => `<figure class="slide" role="group" aria-roledescription="slayt" aria-label="${i + 1} / ${total}">
        <img src="${esc(ph.image)}" alt="" width="1600" height="1000" ${i ? 'loading="lazy"' : ""} style="${imageViewStyle(ph.imageView)}">
        <figcaption class="slide__caption">
          ${ph.title ? `<span class="slide__title">${esc(ph.title)}</span>` : ""}
          <button class="slide__open" type="button" data-open="${i}">
            Detayları gör
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span class="visually-hidden">: ${esc(ph.title || `${i + 1}. fotoğraf`)}</span>
          </button>
        </figcaption>
      </figure>`
    )
    .join("");
  dots.innerHTML = photos
    .map((ph, i) => `<button type="button" data-index="${i}" aria-label="${i + 1}. fotoğraf${ph.title ? ": " + esc(ph.title) : ""}"></button>`)
    .join("");

  const slides = [...track.children];
  const dotButtons = [...dots.children];
  let current = 0;

  function go(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(${-100 * current}%)`;
    slides.forEach((s, i) => {
      s.inert = i !== current;
      s.setAttribute("aria-hidden", String(i !== current));
    });
    dotButtons.forEach((d, i) => d.setAttribute("aria-current", String(i === current)));
  }

  slider.querySelectorAll(".slider__arrow").forEach((b) =>
    b.addEventListener("click", () => go(current + Number(b.dataset.dir)))
  );
  dots.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) go(Number(b.dataset.index));
  });
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(current - 1);
    if (e.key === "ArrowRight") go(current + 1);
  });

  // Fotoğrafa tıklayınca (kaydırma hareketi değilse) detay açılır
  let startX = null;
  let swiped = false;
  const viewport = slider.querySelector(".slider__viewport");
  viewport.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    swiped = false;
  });
  viewport.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) {
      swiped = true;
      go(current + (dx < 0 ? 1 : -1));
    }
    startX = null;
  });
  track.addEventListener("click", (e) => {
    if (swiped) return;
    const btn = e.target.closest("[data-open]");
    const slide = e.target.closest(".slide");
    if (btn || slide) openDetail(photos[btn ? Number(btn.dataset.open) : current]);
  });

  go(0);
}

// ---------- İletişim ----------
function renderContact(s) {
  // Panelde boş bırakılan bilgilerin başlıkları da gizlenir
  document.querySelectorAll("[data-contact]").forEach((row) => {
    row.hidden = !String(s[row.dataset.contact] || "").trim();
  });
  const phone = document.getElementById("contact-phone");
  phone.textContent = s.phone;
  phone.href = "tel:" + String(s.phone || "").replace(/[^\d+]/g, "");

  const email = document.getElementById("contact-email");
  email.textContent = s.email;
  email.href = "mailto:" + s.email;

  const ig = document.getElementById("contact-instagram");
  const handle = String(s.instagram || "").replace(/^@/, "");
  document.getElementById("contact-instagram-row").hidden = !handle;
  ig.textContent = "@" + handle;
  ig.href = "https://instagram.com/" + encodeURIComponent(handle);

  document.querySelectorAll(".js-whatsapp").forEach((a) => (a.href = waLink(s.whatsapp, "Merhaba, ürünleriniz hakkında bilgi almak istiyorum.")));

  // Panelde haritadan işaretlenen konum varsa iğne tam o noktaya konur
  const lat = Number(s.mapLat), lng = Number(s.mapLng);
  const hasPin = s.mapLat && s.mapLng && Number.isFinite(lat) && Number.isFinite(lng);
  const q = encodeURIComponent(hasPin ? `${lat},${lng}` : s.mapQuery || s.address || "");
  // Google Haritalar kaydı bağlıysa harita doğrudan dükkânın kendi kaydını (adı ve iğnesiyle) gösterir
  const placeId = /^\d+$/.test(String(s.mapPlaceId || "")) ? s.mapPlaceId : "";
  document.getElementById("map").src = placeId
    ? `https://maps.google.com/maps?cid=${placeId}&z=17&output=embed`
    : `https://www.google.com/maps?q=${q}&z=${hasPin ? 17 : 15}&output=embed`;
  document.getElementById("map-link").href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  try {
    const res = await fetch("/api/content");
    if (!res.ok) throw new Error();
    const { settings, categories, products, aboutPhotos, aboutSidePhotos = [] } = await res.json();

    document.querySelectorAll("[data-field]").forEach((el) => {
      const v = settings[el.dataset.field];
      if (v) el.textContent = v;
      // İsteğe bağlı alanlar panelde boş bırakılırsa hiç yer kaplamaz
      else if (el.hasAttribute("data-optional")) el.hidden = true;
    });
    // Bakım modu açıkken siteyi yalnızca panele giriş yapmış yönetici görür; ona hatırlatma göster
    if (settings.maintenanceMode) {
      const note = document.createElement("div");
      note.className = "maint-note";
      note.setAttribute("role", "status");
      note.textContent = "Bakım modu açık: ziyaretçiler şu an bakım yazısını görüyor. Bu sayfayı yalnızca siz görüyorsunuz.";
      document.body.prepend(note);
    }

    renderHero(settings);
    renderProducts(categories, products, settings);
    renderAbout(settings, aboutPhotos, aboutSidePhotos);
    renderContact(settings);
    document.dispatchEvent(new Event("balevi:content"));
    document.documentElement.classList.add("content-ready");
  } catch {
    renderHero({});
    document.documentElement.classList.add("content-ready");
    document.getElementById("product-list").innerHTML =
      `<p class="state state--error" role="alert">⚠ Ürünler şu anda yüklenemedi. Lütfen sayfayı yenileyin.</p>`;
  }
}

// Mobil menü
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector(".visually-hidden").textContent = open ? "Menüyü kapat" : "Menüyü aç";
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    toggle.focus();
  }
});

init();

// Üst menü: kaydırınca ince gölge, görünen bölümün bağlantısı vurgulanır
(function () {
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (!("IntersectionObserver" in window) || !sections.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        byId.get(e.target.id)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => io.observe(s));
})();
