// Yönetim paneli

const priceFmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
const TOKEN_KEY = "balevi-admin-token";
let state = { settings: {}, categories: [], products: [], aboutPhotos: [] };

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const ICONS = { up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>' };
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const moveButtons = (label, isFirst, isLast) => `
  <button class="btn btn--ghost icon-btn" data-move="-1" ${isFirst ? "disabled" : ""} aria-label="${esc(label)} yukarı taşı">${icon("up")}</button>
  <button class="btn btn--ghost icon-btn" data-move="1" ${isLast ? "disabled" : ""} aria-label="${esc(label)} aşağı taşı">${icon("down")}</button>`;

// ---------- Yardımcılar ----------
function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
function setToken(t) {
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

async function api(path, { method = "GET", body } = {}) {
  const headers = { Authorization: "Bearer " + getToken() };
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const res = await fetch(path, { method, headers, body });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/api/login") {
    setToken("");
    showLogin("Oturum süresi doldu, lütfen tekrar giriş yapın.");
    throw new Error("Oturum süresi doldu.");
  }
  if (!res.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
  return data;
}

let toastTimer;
function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = (isError ? "⚠ " : "") + msg;
  t.classList.toggle("toast--error", isError);
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 3600);
}

async function withBusy(btn, fn) {
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
  try { return await fn(); }
  catch (e) { toast(e.message, true); }
  finally { if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); } }
}

const moveIn = (list, id, path, dir) => api(`/api/${path}/${id}/move`, { method: "POST", body: { dir } });

// ---------- Giriş ----------
function showLogin(message = "") {
  $("#app-view").hidden = true;
  $("#login-view").hidden = false;
  $("#login-error").textContent = message;
  $("#password").focus();
}

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#password");
  const btn = e.submitter;
  if (!input.value) {
    $("#login-error").textContent = "Lütfen şifrenizi girin.";
    input.setAttribute("aria-invalid", "true");
    return input.focus();
  }
  btn.disabled = true; btn.setAttribute("aria-busy", "true");
  try {
    const { token } = await api("/api/login", { method: "POST", body: { password: input.value } });
    setToken(token);
    input.value = "";
    input.removeAttribute("aria-invalid");
    await startApp();
  } catch (err) {
    $("#login-error").textContent = err.message;
    input.setAttribute("aria-invalid", "true");
    input.select();
  } finally {
    btn.disabled = false; btn.removeAttribute("aria-busy");
  }
});

$("#logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => {});
  setToken("");
  showLogin();
});

// ---------- Sekmeler ----------
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t));
  t.addEventListener("keydown", (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const next = tabs[(i + d + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});

// ---------- Ana sayfa: giriş fotoğrafı ----------
function renderHeroImage() {
  const img = state.settings.heroImage;
  $("#hero-preview").innerHTML = img
    ? `<img src="${esc(img)}" alt="Şu anki giriş fotoğrafı" width="240" height="300" style="${imageViewStyle(state.settings.heroImageView || { mode: "contain" })}">`
    : "Fotoğraf yok — logo gösteriliyor";
  $("#hero-image-remove").hidden = !img;
  $("#hero-image-adjust").hidden = !img;
}

$("#hero-image-adjust").addEventListener("click", () =>
  openImageEditor({
    target: "hero",
    src: state.settings.heroImage,
    view: state.settings.heroImageView || { mode: "contain" },
    ratio: "4 / 5",
    onSaved: (view) => {
      state.settings.heroImageView = view;
      renderHeroImage();
    },
  })
);

$("#hero-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) $("#hero-preview").innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Seçilen fotoğrafın önizlemesi">`;
});

$("#hero-image-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#hero-file");
  if (!input.files.length) {
    toast("Lütfen önce bir fotoğraf seçin.", true);
    return input.focus();
  }
  await withBusy(e.submitter, async () => {
    state.settings = await api("/api/hero-image", { method: "POST", body: new FormData(e.target) });
    e.target.reset();
    renderHeroImage();
    toast("Giriş fotoğrafı güncellendi. Şimdi görünümünü ayarlayabilirsiniz.");
    $("#hero-image-adjust").click();
  });
});

$("#hero-image-remove").addEventListener("click", async (e) => {
  if (!confirm("Giriş fotoğrafını kaldırmak istediğinize emin misiniz?")) return;
  await withBusy(e.currentTarget, async () => {
    state.settings = await api("/api/hero-image", { method: "DELETE" });
    renderHeroImage();
    toast("Giriş fotoğrafı kaldırıldı.");
  });
});

// ---------- Kategoriler ----------
function renderCategories() {
  const list = $("#admin-categories");
  if (!state.categories.length) {
    list.innerHTML = `<li class="empty">Henüz kategori yok. Aşağıdan ilk kategorinizi ekleyin.</li>`;
    return;
  }
  const last = state.categories.length - 1;
  list.innerHTML = state.categories
    .map((c, i) => {
      const count = state.products.filter((p) => p.categoryId === c.id).length;
      return `<li class="cat-item" data-id="${esc(c.id)}">
        <div class="cat-item__fields">
          <div class="field">
            <label for="cn-${esc(c.id)}">Kategori adı</label>
            <input id="cn-${esc(c.id)}" type="text" value="${esc(c.name)}" data-name>
          </div>
          <div class="field">
            <label for="cd-${esc(c.id)}">Açıklama</label>
            <input id="cd-${esc(c.id)}" type="text" value="${esc(c.description)}" data-desc>
          </div>
          <span class="cat-item__count">${count} ürün</span>
        </div>
        <div class="item__actions">
          ${moveButtons(c.name, i === 0, i === last)}
          <button class="btn btn--secondary" data-save>Kaydet</button>
          <button class="btn btn--danger" data-delete>Sil</button>
        </div>
      </li>`;
    })
    .join("");
}

$("#admin-categories").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  const li = e.target.closest("[data-id]");
  if (!btn || !li) return;
  const id = li.dataset.id;
  const cat = state.categories.find((c) => c.id === id);

  if (btn.hasAttribute("data-save")) {
    await withBusy(btn, async () => {
      const saved = await api(`/api/categories/${id}`, {
        method: "PUT",
        body: { name: $("[data-name]", li).value, description: $("[data-desc]", li).value },
      });
      Object.assign(cat, saved);
      renderProducts();
      toast("Kategori kaydedildi.");
    });
  }
  if (btn.hasAttribute("data-delete")) {
    if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    await withBusy(btn, async () => {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      state.categories = state.categories.filter((c) => c.id !== id);
      renderCategories();
      renderProducts();
      toast("Kategori silindi.");
    });
  }
  if (btn.dataset.move) {
    await withBusy(btn, async () => {
      state.categories = await moveIn(state.categories, id, "categories", Number(btn.dataset.move));
      renderCategories();
      renderProducts();
    });
  }
});

$("#category-add-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#cat-name");
  if (!name.value.trim()) {
    toast("Kategori adını yazın.", true);
    name.setAttribute("aria-invalid", "true");
    return name.focus();
  }
  name.removeAttribute("aria-invalid");
  await withBusy(e.submitter, async () => {
    const cat = await api("/api/categories", { method: "POST", body: Object.fromEntries(new FormData(e.target)) });
    state.categories.push(cat);
    e.target.reset();
    renderCategories();
    renderProducts();
    toast("Kategori eklendi.");
  });
});

// ---------- Ürünler ----------
function productRow(p, i, items) {
  return `<li class="item" data-id="${esc(p.id)}">
    ${p.image
      ? `<div class="thumb-frame"><img src="${esc(p.image)}" alt="" width="64" height="80" style="${imageViewStyle(p.imageView)}"></div>`
      : `<span class="thumb">Fotoğraf yok</span>`}
    <div class="item__info">
      <span class="item__name">${esc(p.name)}</span>
      <span class="item__meta">${priceFmt.format(p.price)}${p.unit ? " · " + esc(p.unit) : ""} · ${
        p.inStock ? "Stokta" : '<span class="out">Stokta yok</span>'
      }</span>
    </div>
    <div class="item__actions">
      ${moveButtons(p.name, i === 0, i === items.length - 1)}
      ${p.image ? `<button class="btn btn--ghost" data-adjust>Görseli ayarla</button>` : ""}
      <button class="btn btn--secondary" data-edit>Düzenle</button>
      <button class="btn btn--danger" data-delete>Sil</button>
    </div>
  </li>`;
}

function renderProducts() {
  const box = $("#admin-products");
  const known = new Set(state.categories.map((c) => c.id));
  const uncategorized = state.products.filter((p) => !known.has(p.categoryId));
  // Her kategori (boş olsa bile) kendi "Ürün ekle" düğmesiyle listelenir.
  const groups = state.categories
    .map((c) => ({ id: c.id, name: c.name, items: state.products.filter((p) => p.categoryId === c.id) }))
    .concat(uncategorized.length ? [{ id: "", name: "Kategorisiz", items: uncategorized }] : []);

  if (!groups.length) {
    box.innerHTML = `<ul class="item-list"><li class="empty">Önce yukarıdan bir kategori ekleyin, sonra ürünlerinizi o kategoriye ekleyin.</li></ul>`;
    return;
  }

  box.innerHTML = groups
    .map(
      (g) => `<div class="product-group">
        <div class="product-group__head">
          <h4 class="product-group__title">${esc(g.name)} <span class="muted">(${g.items.length})</span></h4>
          <button class="btn btn--secondary" type="button" data-add-to="${esc(g.id)}">${esc(g.name)} kategorisine ürün ekle</button>
        </div>
        <ul class="item-list">${
          g.items.length
            ? g.items.map((p, i) => productRow(p, i, g.items)).join("")
            : `<li class="empty">Bu kategoride henüz ürün yok.</li>`
        }</ul>
      </div>`
    )
    .join("");
}

$("#admin-products").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (btn?.hasAttribute("data-add-to")) return openProductDialog(null, btn.dataset.addTo);
  const li = e.target.closest("[data-id]");
  if (!btn || !li) return;
  const product = state.products.find((p) => p.id === li.dataset.id);

  if (btn.hasAttribute("data-edit")) return openProductDialog(product);

  if (btn.hasAttribute("data-adjust")) {
    return openImageEditor({
      target: "product",
      id: product.id,
      src: product.image,
      view: product.imageView,
      ratio: "4 / 5",
      onSaved: (view) => {
        product.imageView = view;
        renderProducts();
      },
    });
  }

  if (btn.hasAttribute("data-delete")) {
    if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    await withBusy(btn, async () => {
      await api(`/api/products/${product.id}`, { method: "DELETE" });
      state.products = state.products.filter((p) => p.id !== product.id);
      renderProducts();
      renderCategories();
      toast("Ürün silindi.");
    });
  }

  if (btn.dataset.move) {
    await withBusy(btn, async () => {
      state.products = await moveIn(state.products, product.id, "products", Number(btn.dataset.move));
      renderProducts();
      $(`[data-id="${product.id}"] [data-move="${btn.dataset.move}"]`)?.focus();
    });
  }
});

// Ürün formu (dialog)
const dialog = $("#product-dialog");
const form = $("#product-form");
let editingId = null;

function setPreview(src) {
  $("#product-preview").innerHTML = src ? `<img src="${esc(src)}" alt="Seçilen fotoğrafın önizlemesi">` : "Fotoğraf seçilmedi";
}

function openProductDialog(product = null, categoryId) {
  editingId = product?.id ?? null;
  form.reset();
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  form.querySelectorAll(".field__error, .form-error").forEach((el) => (el.textContent = ""));
  $("#product-dialog-title").textContent = product ? "Ürünü düzenle" : "Yeni ürün";
  $("#p-category").innerHTML =
    state.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("") +
    `<option value="">Kategorisiz</option>`;
  $("#p-category").value = product ? product.categoryId : categoryId ?? state.categories[0]?.id ?? "";
  $("#p-name").value = product?.name ?? "";
  $("#p-price").value = product?.price ?? "";
  $("#p-unit").value = product?.unit ?? "";
  $("#p-description").value = product?.description ?? "";
  $("#p-region").value = product?.region ?? "";
  $("#p-benefits").value = product?.benefits ?? "";
  $("#p-inStock").checked = product?.inStock ?? true;
  $("#p-remove-wrap").hidden = !product?.image;
  setPreview(product?.image);
  dialog.showModal();
  $("#p-name").focus();
}

$("#add-product").addEventListener("click", () => openProductDialog());
dialog.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

$("#p-image").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) setPreview(URL.createObjectURL(file));
});

function validateField(input, errorEl, message) {
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
  errorEl.textContent = message || "";
  return !message;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#p-name");
  const price = $("#p-price");
  const okName = validateField(name, $("#p-name-error"), name.value.trim() ? "" : "Ürün adını yazın.");
  const okPrice = validateField(
    price,
    $("#p-price-error"),
    price.value === "" || Number(price.value) < 0 ? "Geçerli bir fiyat girin (örn. 450)." : ""
  );
  if (!okName) return name.focus();
  if (!okPrice) return price.focus();

  const fd = new FormData(form);
  fd.set("inStock", String($("#p-inStock").checked));
  if (!fd.get("image")?.size) fd.delete("image");

  await withBusy(e.submitter, async () => {
    try {
      const saved = editingId
        ? await api(`/api/products/${editingId}`, { method: "PUT", body: fd })
        : await api("/api/products", { method: "POST", body: fd });
      const i = state.products.findIndex((p) => p.id === saved.id);
      if (i >= 0) state.products[i] = saved;
      else state.products.push(saved);
      renderProducts();
      renderCategories();
      dialog.close();
      toast(editingId ? "Ürün güncellendi." : "Ürün eklendi.");
    } catch (err) {
      $("#product-form-error").textContent = err.message;
    }
  });
});

// ---------- Hakkımızda galerisi ----------
// Her kartta kaydedilmemiş görünüm ayarları (büyütme, kaydırma, sığdırma)
const photoDrafts = new Map();
const draftOf = (ph) => {
  if (!photoDrafts.has(ph.id)) photoDrafts.set(ph.id, { ...DEFAULT_VIEW, ...(ph.imageView || {}) });
  return photoDrafts.get(ph.id);
};

function renderPhotos() {
  const grid = $("#admin-photos");
  if (!state.aboutPhotos.length) {
    grid.innerHTML = `<li class="empty">Henüz fotoğraf yok. Dükkânınızdan, arılığınızdan veya üretimden kareler ekleyin.</li>`;
    return;
  }
  const last = state.aboutPhotos.length - 1;
  grid.innerHTML = state.aboutPhotos
    .map((ph, i) => {
      const v = draftOf(ph);
      return `<li class="photo" data-id="${esc(ph.id)}">
        <div class="photo__frame" data-pan title="Kaydırmak için sürükleyin">
          <img src="${esc(ph.image)}" alt="" width="400" height="225" loading="lazy" draggable="false" style="${imageViewStyle(v)}">
        </div>
        <div class="photo__tools" role="group" aria-label="${i + 1}. fotoğrafın görünümü">
          <button type="button" class="tool-btn" data-zoom="-0.1" aria-label="Küçült">−</button>
          <output class="tool-val" data-zoom-val>%${Math.round(v.zoom * 100)}</output>
          <button type="button" class="tool-btn" data-zoom="0.1" aria-label="Büyüt">+</button>
          <button type="button" class="tool-btn tool-btn--text" data-fit aria-pressed="${v.mode === "contain"}">Tamamını sığdır</button>
          <button type="button" class="tool-btn tool-btn--text" data-center>Ortala</button>
          <button type="button" class="tool-btn tool-btn--text tool-btn--accent" data-detail>Detaylı düzenle</button>
        </div>
        <p class="field__hint photo__hint">Fotoğrafı sürükleyerek kaydırabilirsiniz. Ayarlar "Kaydet" ile siteye yansır.</p>
        <div class="photo__body">
          <span class="photo__first">${i + 1}. sırada</span>
          <div class="field">
            <label for="pt-${esc(ph.id)}">Başlık</label>
            <input id="pt-${esc(ph.id)}" type="text" value="${esc(ph.title)}" data-title>
          </div>
          <div class="field">
            <label for="pd-${esc(ph.id)}">Detaylı açıklama</label>
            <textarea id="pd-${esc(ph.id)}" rows="4" data-desc>${esc(ph.description)}</textarea>
          </div>
          <div class="photo__actions">
            ${moveButtons(`${i + 1}. fotoğrafı`, i === 0, i === last)}
            <span class="spacer"></span>
            <button class="btn btn--secondary" data-save>Kaydet</button>
            <button class="btn btn--danger" data-delete>Sil</button>
          </div>
        </div>
      </li>`;
    })
    .join("");
}

// Kartın önizlemesini taslak ayarla günceller (tüm listeyi yeniden çizmeden)
function paintPhotoCard(li) {
  const v = photoDrafts.get(li.dataset.id);
  $("[data-pan] img", li).setAttribute("style", imageViewStyle(v));
  $("[data-zoom-val]", li).textContent = "%" + Math.round(v.zoom * 100);
  $("[data-fit]", li).setAttribute("aria-pressed", String(v.mode === "contain"));
}

// Önizlemede sürükleyerek kaydırma
let photoDrag = null;
function bindPan(list) {
list.addEventListener("pointerdown", (e) => {
  const frame = e.target.closest("[data-pan]");
  if (!frame) return;
  const li = frame.closest("[data-id]");
  const v = photoDrafts.get(li.dataset.id);
  photoDrag = { frame, li, v, x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
  frame.setPointerCapture(e.pointerId);
});
list.addEventListener("pointermove", (e) => {
  if (!photoDrag) return;
  const r = photoDrag.frame.getBoundingClientRect();
  const clampP = (n) => Math.round(Math.min(100, Math.max(0, n)));
  photoDrag.v.x = clampP(photoDrag.vx - ((e.clientX - photoDrag.x) / r.width) * 100);
  photoDrag.v.y = clampP(photoDrag.vy - ((e.clientY - photoDrag.y) / r.height) * 100);
  paintPhotoCard(photoDrag.li);
});
["pointerup", "pointercancel"].forEach((t) => list.addEventListener(t, () => (photoDrag = null)));
}
bindPan($("#admin-photos"));
bindPan($("#admin-side-photos"));

$("#about-upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = $("#about-file");
  if (!fileInput.files.length) {
    toast("Lütfen yüklemek için bir fotoğraf seçin.", true);
    return fileInput.focus();
  }
  await withBusy(e.submitter, async () => {
    const photo = await api("/api/about-photos", { method: "POST", body: new FormData(e.target) });
    state.aboutPhotos.push(photo);
    e.target.reset();
    renderPhotos();
    toast("Fotoğraf eklendi. Şimdi görünümünü ayarlayabilirsiniz.");
    openPhotoEditor(photo, "photo", "16 / 10", renderPhotos);
  });
});

$("#admin-photos").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  const li = e.target.closest("[data-id]");
  if (!btn || !li) return;
  const id = li.dataset.id;
  const photo = state.aboutPhotos.find((p) => p.id === id);
  const v = draftOf(photo);

  if (btn.dataset.zoom) {
    v.zoom = Math.round(Math.min(3, Math.max(1, v.zoom + Number(btn.dataset.zoom))) * 100) / 100;
    return paintPhotoCard(li);
  }
  if (btn.hasAttribute("data-fit")) {
    v.mode = v.mode === "contain" ? "cover" : "contain";
    return paintPhotoCard(li);
  }
  if (btn.hasAttribute("data-detail")) {
    return openPhotoEditor(photo, "photo", "16 / 10", renderPhotos);
  }
  if (btn.hasAttribute("data-center")) {
    v.x = 50;
    v.y = 50;
    return paintPhotoCard(li);
  }

  if (btn.hasAttribute("data-save")) {
    const fd = new FormData();
    fd.set("title", $("[data-title]", li).value);
    fd.set("description", $("[data-desc]", li).value);
    await withBusy(btn, async () => {
      const saved = await api(`/api/about-photos/${id}`, { method: "PUT", body: fd });
      const view = await api("/api/image-view", { method: "PUT", body: { target: "photo", id, view: v } });
      Object.assign(photo, saved, { imageView: view });
      photoDrafts.set(id, { ...view });
      toast("Fotoğraf ve görünüm ayarı kaydedildi.");
    });
  }

  if (btn.hasAttribute("data-delete")) {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    await withBusy(btn, async () => {
      await api(`/api/about-photos/${id}`, { method: "DELETE" });
      state.aboutPhotos = state.aboutPhotos.filter((p) => p.id !== id);
      photoDrafts.delete(id);
      renderPhotos();
      toast("Fotoğraf silindi.");
    });
  }

  if (btn.dataset.move) {
    await withBusy(btn, async () => {
      state.aboutPhotos = await moveIn(state.aboutPhotos, id, "about-photos", Number(btn.dataset.move));
      renderPhotos();
    });
  }
});

// ---------- Site ayarları ----------
function fillSettings() {
  document.querySelectorAll("[data-settings-form] [name]").forEach((el) => {
    el.value = state.settings[el.name] ?? "";
  });
  paintMaintenance();
  document.dispatchEvent(new Event("balevi:settings-filled"));
}

// ---------- Bakım modu ----------
const maintSwitch = $("#maint-switch");
function paintMaintenance() {
  const on = !!state.settings.maintenanceMode;
  maintSwitch.setAttribute("aria-checked", String(on));
  $("#maint-switch-state").textContent = on ? "Açık — site ziyaretçilere kapalı" : "Kapalı";
}
maintSwitch.addEventListener("click", async () => {
  const turnOn = !state.settings.maintenanceMode;
  if (turnOn && !confirm("Bakım modu açılsın mı? Ziyaretçiler siteyi göremez, yalnızca bakım yazısını görür. Siz panelden girdiğiniz için siteyi görmeye devam edersiniz.")) return;
  await withBusy(maintSwitch, async () => {
    const r = await api("/api/maintenance", { method: "PUT", body: { enabled: turnOn } });
    state.settings.maintenanceMode = r.maintenanceMode;
    paintMaintenance();
    toast(r.maintenanceMode ? "Bakım modu açıldı. Ziyaretçiler bakım yazısını görüyor." : "Bakım modu kapatıldı. Site yeniden herkese açık.");
  });
});


document.querySelectorAll("[data-settings-form]").forEach((f) =>
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(f));
    await withBusy(e.submitter, async () => {
      state.settings = await api("/api/settings", { method: "PUT", body });
      toast("Değişiklikler kaydedildi.");
    });
  })
);

// ---------- Başlat ----------
async function startApp() {
  $("#login-view").hidden = true;
  $("#app-view").hidden = false;
  $("#admin-products").innerHTML = '<ul class="item-list"><li class="skeleton-row"></li><li class="skeleton-row"></li></ul>';
  try {
    const res = await fetch("/api/content");
    if (!res.ok) throw new Error();
    state = await res.json();
    renderHeroImage();
    renderCategories();
    renderProducts();
    renderPhotos();
    renderSidePhotos();
    fillSettings();
  } catch {
    $("#admin-products").innerHTML = `<p class="empty" role="alert">⚠ İçerik yüklenemedi. Sunucunun çalıştığından emin olup sayfayı yenileyin.</p>`;
  }
}

if (getToken()) api("/api/session").then(startApp, () => {});
else showLogin();

// ---------- Görsel ayarlama (sığdır/doldur, yakınlaştır, konumlandır) ----------
const editor = $("#image-editor");
const editorImg = $("#editor-img");
const editorFrame = $("#editor-frame");
let editorCtx = null;
let view = { ...DEFAULT_VIEW };

function paintEditor() {
  editorImg.setAttribute("style", imageViewStyle(view));
  editor.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === view.mode)));
  $("#editor-zoom").value = view.zoom;
  $("#editor-zoom-out").textContent = "%" + Math.round(view.zoom * 100);
  $("#editor-x").value = view.x;
  $("#editor-y").value = view.y;
}

function openImageEditor(ctx) {
  editorCtx = ctx;
  view = { ...DEFAULT_VIEW, ...(ctx.view || {}) };
  editorImg.src = ctx.src;
  editorFrame.style.aspectRatio = ctx.ratio;
  // Dikey çerçeveler pencereye sığsın diye daha dar gösterilir
  const [rw, rh] = String(ctx.ratio).split("/").map(Number);
  editorFrame.style.maxWidth = rh > rw ? "340px" : "";
  paintEditor();
  editor.showModal();
}

const clampN = (n, min, max) => Math.min(max, Math.max(min, n));

editor.querySelectorAll("[data-mode]").forEach((b) =>
  b.addEventListener("click", () => {
    view.mode = b.dataset.mode;
    paintEditor();
  })
);
editor.querySelectorAll("[data-zoom]").forEach((b) =>
  b.addEventListener("click", () => {
    view.zoom = Math.round(clampN(view.zoom + Number(b.dataset.zoom), 1, 3) * 100) / 100;
    paintEditor();
  })
);
$("#editor-zoom").addEventListener("input", (e) => { view.zoom = Number(e.target.value); paintEditor(); });
$("#editor-x").addEventListener("input", (e) => { view.x = Number(e.target.value); paintEditor(); });
$("#editor-y").addEventListener("input", (e) => { view.y = Number(e.target.value); paintEditor(); });
$("#editor-center").addEventListener("click", () => { view.x = 50; view.y = 50; paintEditor(); });
$("#editor-reset").addEventListener("click", () => { view = { ...DEFAULT_VIEW }; paintEditor(); });
editor.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => editor.close()));

// Sürükleyerek konumlandırma
let drag = null;
editorFrame.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  editorFrame.setPointerCapture(e.pointerId);
});
editorFrame.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const r = editorFrame.getBoundingClientRect();
  view.x = Math.round(clampN(drag.vx - ((e.clientX - drag.x) / r.width) * 100, 0, 100));
  view.y = Math.round(clampN(drag.vy - ((e.clientY - drag.y) / r.height) * 100, 0, 100));
  paintEditor();
});
["pointerup", "pointercancel"].forEach((t) => editorFrame.addEventListener(t, () => (drag = null)));

$("#image-editor-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await withBusy(e.submitter, async () => {
    const saved = await api("/api/image-view", {
      method: "PUT",
      body: { target: editorCtx.target, id: editorCtx.id, view },
    });
    editorCtx.onSaved(saved);
    editor.close();
    toast("Görsel ayarı kaydedildi.");
  });
});

// ---------- Hakkımızda: sağdaki sabit yan fotoğraflar ----------
function renderSidePhotos() {
  const grid = $("#admin-side-photos");
  const list = state.aboutSidePhotos || [];
  if (!list.length) {
    grid.innerHTML = `<li class="empty">Henüz yan fotoğraf yok. Ana galerinin sağında durmasını istediğiniz fotoğrafları ekleyin.</li>`;
    return;
  }
  const last = list.length - 1;
  grid.innerHTML = list
    .map((ph, i) => {
      const v = draftOf(ph);
      return `<li class="photo" data-id="${esc(ph.id)}">
        <div class="photo__frame" data-pan title="Kaydırmak için sürükleyin">
          <img src="${esc(ph.image)}" alt="" width="400" height="300" loading="lazy" draggable="false" style="${imageViewStyle(v)}">
        </div>
        <div class="photo__tools" role="group" aria-label="${i + 1}. yan fotoğrafın görünümü">
          <button type="button" class="tool-btn" data-zoom="-0.1" aria-label="Küçült">−</button>
          <output class="tool-val" data-zoom-val>%${Math.round(v.zoom * 100)}</output>
          <button type="button" class="tool-btn" data-zoom="0.1" aria-label="Büyüt">+</button>
          <button type="button" class="tool-btn tool-btn--text" data-fit aria-pressed="${v.mode === "contain"}">Tamamını sığdır</button>
          <button type="button" class="tool-btn tool-btn--text" data-center>Ortala</button>
          <button type="button" class="tool-btn tool-btn--text tool-btn--accent" data-detail>Detaylı düzenle</button>
        </div>
        <div class="photo__body">
          <span class="photo__first">Sitede gösterilen fotoğraf</span>
          <div class="photo__actions">
            <span class="spacer"></span>
            <button class="btn btn--secondary" data-save>Kaydet</button>
            <button class="btn btn--danger" data-delete>Sil</button>
          </div>
        </div>
      </li>`;
    })
    .join("");
}

$("#side-upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = $("#side-file");
  if (!fileInput.files.length) {
    toast("Lütfen yüklemek için bir fotoğraf seçin.", true);
    return fileInput.focus();
  }
  await withBusy(e.submitter, async () => {
    const photo = await api("/api/side-photos", { method: "POST", body: new FormData(e.target) });
    state.aboutSidePhotos = [photo];
    e.target.reset();
    renderSidePhotos();
    toast("Yan fotoğraf güncellendi. Şimdi görünümünü ayarlayabilirsiniz.");
    openPhotoEditor(photo, "side", "3 / 4", renderSidePhotos);
  });
});

$("#admin-side-photos").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  const li = e.target.closest("[data-id]");
  if (!btn || !li) return;
  const id = li.dataset.id;
  const photo = state.aboutSidePhotos.find((p) => p.id === id);
  const v = draftOf(photo);

  if (btn.dataset.zoom) {
    v.zoom = Math.round(Math.min(3, Math.max(1, v.zoom + Number(btn.dataset.zoom))) * 100) / 100;
    return paintPhotoCard(li);
  }
  if (btn.hasAttribute("data-fit")) {
    v.mode = v.mode === "contain" ? "cover" : "contain";
    return paintPhotoCard(li);
  }
  if (btn.hasAttribute("data-detail")) {
    return openPhotoEditor(photo, "side", "3 / 4", renderSidePhotos);
  }
  if (btn.hasAttribute("data-center")) {
    v.x = 50;
    v.y = 50;
    return paintPhotoCard(li);
  }
  if (btn.hasAttribute("data-save")) {
    await withBusy(btn, async () => {
      const view = await api("/api/image-view", { method: "PUT", body: { target: "side", id, view: v } });
      photo.imageView = view;
      photoDrafts.set(id, { ...view });
      toast("Görünüm ayarı kaydedildi.");
    });
  }
  if (btn.hasAttribute("data-delete")) {
    if (!confirm("Bu yan fotoğrafı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    await withBusy(btn, async () => {
      await api(`/api/side-photos/${id}`, { method: "DELETE" });
      state.aboutSidePhotos = state.aboutSidePhotos.filter((p) => p.id !== id);
      photoDrafts.delete(id);
      renderSidePhotos();
      toast("Yan fotoğraf silindi.");
    });
  }
  if (btn.dataset.move) {
    await withBusy(btn, async () => {
      state.aboutSidePhotos = await moveIn(state.aboutSidePhotos, id, "side-photos", Number(btn.dataset.move));
      renderSidePhotos();
    });
  }
});

// Galeri / yan fotoğraf için ayrıntılı düzenleyiciyi açar; kaydedince kart da güncellenir
function openPhotoEditor(photo, target, ratio, rerender) {
  openImageEditor({
    target,
    id: photo.id,
    src: photo.image,
    view: photoDrafts.get(photo.id) || photo.imageView,
    ratio,
    onSaved: (view) => {
      photo.imageView = view;
      photoDrafts.set(photo.id, { ...view });
      rerender();
    },
  });
}
