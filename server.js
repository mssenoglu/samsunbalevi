// Bal dükkanı tanıtım sitesi — basit Express sunucusu
// Veriler data/db.json içinde, yüklenen fotoğraflar uploads/ klasöründe tutulur.

const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Gizli ayarlar proje klasöründeki .env dosyasından okunur (git'e eklenmez)
const ENV_FILE = path.join(__dirname, ".env");
if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("Panel şifresi bulunamadı veya çok kısa. .env dosyasına en az 12 karakterlik ADMIN_PASSWORD ekleyin.");
  process.exit(1);
}
const DATA_FILE = path.join(__dirname, "data", "db.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- Örnek veriler ----------
const PRIVACY_TEMPLATE = `Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") madde 10 uyarınca, veri sorumlusu sıfatıyla [Şirket / işletme unvanı] ("Balevi") tarafından hazırlanmıştır.

1. İşlenen kişisel veriler
Bizimle telefon, WhatsApp veya e-posta üzerinden iletişime geçtiğinizde paylaştığınız ad-soyad, telefon numarası, e-posta adresi, teslimat adresi ve mesaj içeriği; sitemizi ziyaret ettiğinizde ise IP adresi, tarayıcı bilgisi ve ziyaret zamanı gibi teknik kayıtlar işlenebilir.

2. İşleme amaçları
Kişisel verileriniz; sipariş ve bilgi taleplerinizin yanıtlanması, ürünlerin teslim edilmesi, satış sonrası destek verilmesi, yasal yükümlülüklerimizin (fatura, muhasebe kayıtları vb.) yerine getirilmesi ve sitenin güvenliğinin sağlanması amaçlarıyla işlenir.

3. Hukuki sebepler ve toplama yöntemi
Verileriniz; telefon, WhatsApp, e-posta ve internet sitesi aracılığıyla, KVKK madde 5/2 kapsamında bir sözleşmenin kurulması veya ifası, hukuki yükümlülüğümüzün yerine getirilmesi ve meşru menfaatimiz hukuki sebeplerine dayanılarak toplanır.

4. Aktarım
Verileriniz, yukarıdaki amaçlarla sınırlı olarak kargo firmaları, muhasebe hizmeti aldığımız kişiler ve yetkili kamu kurumlarıyla paylaşılabilir. Sitemizde yer alan Google Haritalar içeriği ve WhatsApp bağlantısı, ilgili hizmet sağlayıcıların (Google LLC, WhatsApp LLC) kendi politikalarına tabidir ve bu hizmetler kullanıldığında verileriniz yurt dışına aktarılabilir.

5. Haklarınız
KVKK madde 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri bilme ve zarara uğramanız hâlinde giderilmesini talep etme haklarına sahipsiniz.

6. Başvuru
Taleplerinizi [e-posta adresi] adresine veya [posta adresi] adresine yazılı olarak iletebilirsiniz. Başvurularınız en geç 30 gün içinde ücretsiz olarak yanıtlanır.

Son güncelleme: [tarih]`;

const SEED = {
  settings: {
    shopName: "Balevi",
    heroEyebrow: "Doğal · Katkısız · Soğuk süzme",
    heroTitle: "Yaylalardan sofranıza, katkısız bal",
    heroText:
      "Kendi arılıklarımızda üretip süzdüğümüz çiçek, kestane ve petek ballarını dükkânımızda ve sipariş üzerine sizlere ulaştırıyoruz.",
    heroImage: "",
    productsTitle: "Ürünlerimiz",
    productsText: "Fiyatlar dükkân satış fiyatıdır. Kargo ve toptan sipariş için bize yazın.",
    originTitle: "Anadolu'nun dört bir yanından Samsun'a",
    originText:
      "Trakya'dan Doğu Anadolu yaylalarına, 21 ilden gelen ballarımız Samsun'daki dükkânımızda süzülüp kavanozlanıyor.",
    aboutTitle: "Üç kuşaktır arıcılık",
    aboutText:
      "Balevi, 1987'de dedemizin Artvin'deki on kovanıyla başladı. Bugün hâlâ aynı yaylalarda, kovanları mevsime göre taşıyarak üretim yapıyoruz.\n\nBallarımızı ısıl işlem uygulamadan, soğuk süzme yöntemiyle kavanozluyoruz. Her parti için analiz raporu dükkânımızda incelemeye açıktır.",
    phone: "+90 532 000 00 00",
    whatsapp: "905468084579",
    email: "merhaba@balevi.com",
    address: "Caferağa Mah. Moda Cad. No: 12, Kadıköy / İstanbul",
    hours: "Pazartesi – Cumartesi: 09:00 – 19:00\nPazar: Kapalı",
    instagram: "balevi",
    mapQuery: "Moda Caddesi, Kadıköy, İstanbul",
    privacyText: PRIVACY_TEMPLATE,
    maintenanceMode: false,
    maintenanceMessage:
      "Sitemizi sizin için yeniliyoruz. Kısa süre içinde yeniden buradayız. Bu sırada siparişleriniz için bize WhatsApp'tan ulaşabilirsiniz.",
  },
  categories: [
    { id: "c1", name: "Ballarımız", description: "Kendi arılıklarımızdan, soğuk süzme." },
    { id: "c2", name: "Arı ürünleri", description: "Polen, propolis ve arı sütü." },
  ],
  products: [
    {
      id: "p1", categoryId: "c1", name: "Kestane Balı",
      description: "Karadeniz kestane ormanlarından. Koyu renkli, hafif acımsı ve yoğun aromalı.",
      price: 650, unit: "850 g kavanoz", image: "", inStock: true,
    },
    {
      id: "p2", categoryId: "c1", name: "Yayla Çiçek Balı",
      description: "1.800 metre rakımlı yaylalardaki kır çiçeklerinden. Açık renkli ve yumuşak içimli.",
      price: 480, unit: "850 g kavanoz", image: "", inStock: true,
    },
    {
      id: "p3", categoryId: "c1", name: "Karakovan Petek Bal",
      description: "Doğal ağaç kovanlarda, temel petek kullanılmadan üretilir. Sınırlı sayıda.",
      price: 1250, unit: "1 kg", image: "", inStock: false,
    },
    {
      id: "p4", categoryId: "c2", name: "Taze Arı Polen",
      description: "Kurutulmamış, dondurularak saklanan taze polen. Buzdolabında muhafaza edin.",
      price: 420, unit: "250 g", image: "", inStock: true,
    },
  ],
  aboutPhotos: [],
  aboutSidePhotos: [],
};

// ---------- Veri katmanı ----------
function saveDb(data) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DATA_FILE);
}

// Eski kayıtları yeni alanlara taşır (veri kaybı olmadan).
function migrate(data) {
  data.settings = { ...SEED.settings, heroImage: "", ...data.settings };
  if (!Array.isArray(data.categories)) {
    data.categories = [{ id: crypto.randomUUID(), name: "Ballarımız", description: "" }];
  }
  const firstCat = data.categories[0]?.id || "";
  for (const p of data.products || []) if (p.categoryId === undefined) p.categoryId = firstCat;
  for (const ph of data.aboutPhotos || []) {
    if (ph.title === undefined) ph.title = ph.caption || "";
    if (ph.description === undefined) ph.description = "";
    delete ph.caption;
  }
  if (!Array.isArray(data.aboutSidePhotos)) data.aboutSidePhotos = [];
  return data;
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) saveDb(SEED);
  const data = migrate(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  saveDb(data);
  return data;
}

let db = loadDb();

function removeUpload(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true }, () => {});
}

const str = (v, fallback = "") => (typeof v === "string" ? v.trim() : fallback);

// Görsel görünüm ayarı: sığdır/doldur, yakınlaştırma ve odak noktası
const clamp = (n, min, max, def) => (Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : def);
function sanitizeView(v = {}) {
  return {
    mode: v.mode === "contain" ? "contain" : "cover",
    zoom: Math.round(clamp(v.zoom, 1, 3, 1) * 100) / 100,
    x: Math.round(clamp(v.x, 0, 100, 50)),
    y: Math.round(clamp(v.y, 0, 100, 50)),
    rotate: Math.round(clamp(v.rotate, -180, 180, 0)), // derece
    flipX: v.flipX === true,
    flipY: v.flipY === true,
    brightness: Math.round(clamp(v.brightness, 50, 150, 100)), // yüzde
    contrast: Math.round(clamp(v.contrast, 50, 150, 100)),
    saturate: Math.round(clamp(v.saturate, 0, 200, 100)),
  };
}

// ---------- Yükleme ----------
const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new Error("Yalnızca JPG, PNG, WebP veya AVIF yükleyebilirsiniz."));
  },
});

// ---------- Oturum ----------
const sessions = new Map(); // token -> son kullanma zamanı
const SESSION_MS = 1000 * 60 * 60 * 8;
const bearer = (req) => (req.get("authorization") || "").replace(/^Bearer /, "");

function requireAuth(req, res, next) {
  const token = bearer(req);
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: "Oturum süresi doldu, lütfen tekrar giriş yapın." });
  }
  next();
}

// Panele giriş yapan tarayıcıya ayrıca bir çerez verilir; böylece bakım modunda
// yönetici siteyi görmeye devam eder (ziyaretçiler bakım sayfasını görür).
const ADMIN_COOKIE = "balevi_admin";
const cookieOf = (req, name) =>
  (req.get("cookie") || "").split(/;\s*/).map((c) => c.split("=")).find(([k]) => k === name)?.[1] || "";
const isAdminRequest = (req) => {
  const exp = sessions.get(cookieOf(req, ADMIN_COOKIE));
  return !!exp && exp > Date.now();
};
const setAdminCookie = (res, token) =>
  res.cookie(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "strict", maxAge: SESSION_MS, path: "/" });

// ---------- Uygulama ----------
const app = express();
app.use(express.json({ limit: "200kb" }));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));
// Bakım modu: ziyaretçilere sitenin yerine bakım sayfası gösterilir (panel ve API etkilenmez)
const PUBLIC_PAGES = new Set(["/", "/index.html", "/aydinlatma-metni", "/aydinlatma-metni.html"]);
app.use((req, res, next) => {
  if (!db.settings.maintenanceMode || req.method !== "GET" || !PUBLIC_PAGES.has(req.path)) return next();
  if (isAdminRequest(req)) return next();
  res.status(503).set("Retry-After", "3600").set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "public", "bakim.html"));
});
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.get("/api/content", (_req, res) => res.json(db));

app.post("/api/login", (req, res) => {
  const given = Buffer.from(String(req.body?.password || ""));
  const real = Buffer.from(ADMIN_PASSWORD);
  if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) {
    return res.status(401).json({ error: "Şifre hatalı." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + SESSION_MS);
  setAdminCookie(res, token);
  res.json({ token });
});

app.get("/api/session", requireAuth, (req, res) => {
  setAdminCookie(res, bearer(req));
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  sessions.delete(bearer(req));
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// Bakım modunu aç / kapat: { enabled: true | false }
app.put("/api/maintenance", requireAuth, (req, res) => {
  db.settings.maintenanceMode = req.body?.enabled === true;
  saveDb(db);
  res.json({ maintenanceMode: db.settings.maintenanceMode });
});

// ---------- Site ayarları (metinler, iletişim, harita, aydınlatma metni) ----------
const SETTING_KEYS = Object.keys(SEED.settings).filter(
  (k) => !["heroImage", "heroImageView", "maintenanceMode"].includes(k)
);
app.put("/api/settings", requireAuth, (req, res) => {
  for (const key of SETTING_KEYS) {
    if (typeof req.body[key] === "string") db.settings[key] = req.body[key].trim();
  }
  saveDb(db);
  res.json(db.settings);
});

// Giriş (hero) görseli
app.post("/api/hero-image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Lütfen bir fotoğraf seçin." });
  removeUpload(db.settings.heroImage);
  db.settings.heroImage = "/uploads/" + req.file.filename;
  db.settings.heroImageView = sanitizeView({ mode: "contain" });
  saveDb(db);
  res.json(db.settings);
});

app.delete("/api/hero-image", requireAuth, (_req, res) => {
  removeUpload(db.settings.heroImage);
  db.settings.heroImage = "";
  delete db.settings.heroImageView;
  saveDb(db);
  res.json(db.settings);
});

// Görsel ayarı kaydet: { target: "hero" | "product" | "photo", id?, view }
app.put("/api/image-view", requireAuth, (req, res) => {
  const { target, id } = req.body || {};
  const view = sanitizeView(req.body?.view);
  let owner;
  if (target === "hero") owner = db.settings;
  else if (target === "product") owner = db.products.find((p) => p.id === id);
  else if (target === "photo") owner = db.aboutPhotos.find((p) => p.id === id);
  else if (target === "side") owner = db.aboutSidePhotos.find((p) => p.id === id);
  if (!owner) return res.status(404).json({ error: "Görsel bulunamadı." });
  if (target === "hero") owner.heroImageView = view;
  else owner.imageView = view;
  saveDb(db);
  res.json(view);
});

// ---------- Kategoriler ----------
app.post("/api/categories", requireAuth, (req, res) => {
  const name = str(req.body.name);
  if (!name) return res.status(400).json({ error: "Kategori adı zorunludur." });
  const cat = { id: crypto.randomUUID(), name, description: str(req.body.description) };
  db.categories.push(cat);
  saveDb(db);
  res.status(201).json(cat);
});

app.put("/api/categories/:id", requireAuth, (req, res) => {
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: "Kategori bulunamadı." });
  const name = str(req.body.name, cat.name);
  if (!name) return res.status(400).json({ error: "Kategori adı zorunludur." });
  cat.name = name;
  cat.description = str(req.body.description, cat.description);
  saveDb(db);
  res.json(cat);
});

app.delete("/api/categories/:id", requireAuth, (req, res) => {
  const cat = db.categories.find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: "Kategori bulunamadı." });
  const count = db.products.filter((p) => p.categoryId === cat.id).length;
  if (count) {
    return res
      .status(400)
      .json({ error: `Bu kategoride ${count} ürün var. Önce ürünleri başka kategoriye taşıyın veya silin.` });
  }
  db.categories = db.categories.filter((c) => c.id !== cat.id);
  saveDb(db);
  res.json({ ok: true });
});

// ---------- Ürünler ----------
function productFromBody(body, base = {}) {
  const price = Number(String(body.price ?? base.price).replace(",", "."));
  const categoryId = str(body.categoryId, base.categoryId ?? "");
  return {
    ...base,
    categoryId: db.categories.some((c) => c.id === categoryId) ? categoryId : "",
    name: str(body.name, base.name ?? ""),
    description: str(body.description, base.description ?? ""),
    unit: str(body.unit, base.unit ?? ""),
    region: str(body.region, base.region ?? ""),
    benefits: str(body.benefits, base.benefits ?? ""),
    price: Number.isFinite(price) ? price : 0,
    inStock: body.inStock === undefined ? base.inStock ?? true : body.inStock === "true",
  };
}

app.post("/api/products", requireAuth, upload.single("image"), (req, res, next) => {
  const product = productFromBody(req.body, { id: crypto.randomUUID(), image: "" });
  if (!product.name) return next(new Error("Ürün adı zorunludur."));
  if (req.file) product.image = "/uploads/" + req.file.filename;
  db.products.push(product);
  saveDb(db);
  res.status(201).json(product);
});

app.put("/api/products/:id", requireAuth, upload.single("image"), (req, res, next) => {
  const i = db.products.findIndex((p) => p.id === req.params.id);
  if (i < 0) return next(new Error("Ürün bulunamadı."));
  const updated = productFromBody(req.body, db.products[i]);
  if (!updated.name) return next(new Error("Ürün adı zorunludur."));
  if (req.file) {
    removeUpload(updated.image);
    updated.image = "/uploads/" + req.file.filename;
    delete updated.imageView;
  } else if (req.body.removeImage === "true") {
    removeUpload(updated.image);
    updated.image = "";
    delete updated.imageView;
  }
  db.products[i] = updated;
  saveDb(db);
  res.json(updated);
});

app.delete("/api/products/:id", requireAuth, (req, res) => {
  const p = db.products.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Ürün bulunamadı." });
  removeUpload(p.image);
  db.products = db.products.filter((x) => x.id !== p.id);
  saveDb(db);
  res.json({ ok: true });
});

// ---------- Hakkımızda fotoğrafları (kaydırmalı galeri) ----------
app.post("/api/about-photos", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Lütfen bir fotoğraf seçin." });
  const photo = {
    id: crypto.randomUUID(),
    image: "/uploads/" + req.file.filename,
    title: str(req.body.title),
    description: str(req.body.description),
  };
  db.aboutPhotos.push(photo);
  saveDb(db);
  res.status(201).json(photo);
});

app.put("/api/about-photos/:id", requireAuth, upload.single("image"), (req, res, next) => {
  const photo = db.aboutPhotos.find((x) => x.id === req.params.id);
  if (!photo) return next(new Error("Fotoğraf bulunamadı."));
  photo.title = str(req.body.title, photo.title);
  photo.description = str(req.body.description, photo.description);
  if (req.file) {
    removeUpload(photo.image);
    photo.image = "/uploads/" + req.file.filename;
    delete photo.imageView;
  }
  saveDb(db);
  res.json(photo);
});

app.delete("/api/about-photos/:id", requireAuth, (req, res) => {
  const photo = db.aboutPhotos.find((x) => x.id === req.params.id);
  if (!photo) return res.status(404).json({ error: "Fotoğraf bulunamadı." });
  removeUpload(photo.image);
  db.aboutPhotos = db.aboutPhotos.filter((x) => x.id !== photo.id);
  saveDb(db);
  res.json({ ok: true });
});

// ---------- Hakkımızda: sağda sabit duran yan fotoğraflar (açıklamasız) ----------
app.post("/api/side-photos", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Lütfen bir fotoğraf seçin." });
  const photo = { id: crypto.randomUUID(), image: "/uploads/" + req.file.filename };
  // Sağda tek bir dikey fotoğraf durur: yenisi eskisinin yerini alır
  for (const old of db.aboutSidePhotos) removeUpload(old.image);
  db.aboutSidePhotos = [photo];
  saveDb(db);
  res.status(201).json(photo);
});

app.delete("/api/side-photos/:id", requireAuth, (req, res) => {
  const photo = db.aboutSidePhotos.find((x) => x.id === req.params.id);
  if (!photo) return res.status(404).json({ error: "Fotoğraf bulunamadı." });
  removeUpload(photo.image);
  db.aboutSidePhotos = db.aboutSidePhotos.filter((x) => x.id !== photo.id);
  saveDb(db);
  res.json({ ok: true });
});

// ---------- Sıralama: { dir: -1 | 1 } ----------
// Ürünler yalnızca kendi kategorileri içinde yer değiştirir.
const LISTS = {
  products: "products",
  "about-photos": "aboutPhotos",
  "side-photos": "aboutSidePhotos",
  categories: "categories",
};
app.post("/api/:list/:id/move", requireAuth, (req, res) => {
  const key = LISTS[req.params.list];
  if (!key) return res.status(404).json({ error: "Bulunamadı." });
  const list = db[key];
  const i = list.findIndex((x) => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: "Bulunamadı." });
  const step = req.body.dir === -1 ? -1 : 1;
  let j = i + step;
  if (key === "products") {
    while (j >= 0 && j < list.length && list[j].categoryId !== list[i].categoryId) j += step;
  }
  if (j >= 0 && j < list.length) {
    [list[i], list[j]] = [list[j], list[i]];
    saveDb(db);
  }
  res.json(list);
});

// Hata yakalayıcı (yükleme hataları dahil)
app.use((err, req, res, _next) => {
  if (req.file) removeUpload("/uploads/" + req.file.filename);
  const msg =
    err.code === "LIMIT_FILE_SIZE" ? "Fotoğraf en fazla 8 MB olabilir." : err.message || "Beklenmeyen bir hata oluştu.";
  res.status(400).json({ error: msg });
});

app.listen(PORT, () => {
  console.log(`Site:  http://localhost:${PORT}`);
  console.log(`Panel: http://localhost:${PORT}/admin/`);
});
