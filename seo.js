// Arama motorları (SEO) ve yerel arama (GEO) için sunucu tarafında üretilen içerikler:
//  - Ana sayfanın <head> bölümüne başlık, açıklama, Open Graph, konum etiketleri ve
//    schema.org yapılandırılmış verisi (Store + ürünler) eklenir.
//  - robots.txt, sitemap.xml ve yapay zekâ arama motorları için llms.txt üretilir.
const fs = require("fs");
const path = require("path");

const INDEX_FILE = path.join(__dirname, "public", "index.html");

const escHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// JSON-LD içinde </script> kapanışını engelle
const safeJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

function baseUrl(req, settings) {
  const fromSettings = String(settings.siteUrl || "").trim().replace(/\/+$/, "");
  if (/^https?:\/\/[^\s]+$/i.test(fromSettings)) return fromSettings;
  return `${req.protocol}://${req.get("host")}`;
}

const abs = (base, url) => (!url ? "" : /^https?:\/\//i.test(url) ? url : base + (url.startsWith("/") ? url : "/" + url));

function coords(s) {
  const lat = Number(s.mapLat);
  const lng = Number(s.mapLng);
  if (!s.mapLat || !s.mapLng || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function mapsUrl(s) {
  if (/^\d+$/.test(String(s.mapPlaceId || ""))) return `https://maps.google.com/?cid=${s.mapPlaceId}`;
  const c = coords(s);
  const q = c ? `${c.lat},${c.lng}` : s.mapQuery || s.address || "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function seoTitle(s) {
  return s.seoTitle || `${s.shopName || "Balevi"} — ${s.geoCity ? s.geoCity + "'da " : ""}doğal ve katkısız bal`;
}

function seoDescription(s) {
  return (s.seoDescription || s.heroText || "").replace(/\s+/g, " ").trim().slice(0, 300);
}

function structuredData(db, base) {
  const s = db.settings;
  const c = coords(s);
  const name = s.shopName || "Balevi";
  const image = abs(base, s.heroImage || "/img/logo.webp");
  const instagram = String(s.instagram || "").replace(/^@/, "");
  const categoryName = new Map((db.categories || []).map((k) => [k.id, k.name]));

  const offers = (db.products || []).map((p) => ({
    "@type": "Offer",
    price: Number(p.price) || 0,
    priceCurrency: "TRY",
    availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemOffered: {
      "@type": "Product",
      name: p.name,
      ...(p.description ? { description: p.description } : {}),
      ...(p.image ? { image: abs(base, p.image) } : {}),
      ...(categoryName.get(p.categoryId) ? { category: categoryName.get(p.categoryId) } : {}),
      ...(p.region ? { countryOfOrigin: "TR", additionalProperty: [{ "@type": "PropertyValue", name: "Yöresi", value: p.region }] } : {}),
    },
  }));

  const store = {
    "@type": "Store",
    "@id": base + "/#dukkan",
    name,
    description: seoDescription(s),
    url: base + "/",
    image,
    logo: abs(base, "/img/logo.webp"),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    address: {
      "@type": "PostalAddress",
      ...(s.address ? { streetAddress: s.address } : {}),
      ...(s.geoCity ? { addressLocality: s.geoCity, addressRegion: s.geoCity } : {}),
      ...(s.postalCode ? { postalCode: s.postalCode } : {}),
      addressCountry: "TR",
    },
    ...(c ? { geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } } : {}),
    hasMap: mapsUrl(s),
    currenciesAccepted: "TRY",
    areaServed: { "@type": "Country", name: "Türkiye" },
    ...(instagram ? { sameAs: [`https://www.instagram.com/${instagram}`] } : {}),
    ...(offers.length
      ? { hasOfferCatalog: { "@type": "OfferCatalog", name: s.productsTitle || "Ürünlerimiz", itemListElement: offers } }
      : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": base + "/#site", name, url: base + "/", inLanguage: "tr-TR", publisher: { "@id": store["@id"] } },
      store,
    ],
  };
}

function headTags(db, base) {
  const s = db.settings;
  const c = coords(s);
  const title = seoTitle(s);
  const desc = seoDescription(s);
  const image = abs(base, s.heroImage || "/img/logo.webp");
  const tags = [
    `<title>${escHtml(title)}</title>`,
    `<meta name="description" content="${escHtml(desc)}">`,
    `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<link rel="canonical" href="${escHtml(base)}/">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="tr_TR">`,
    `<meta property="og:site_name" content="${escHtml(s.shopName || "Balevi")}">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    `<meta property="og:description" content="${escHtml(desc)}">`,
    `<meta property="og:url" content="${escHtml(base)}/">`,
    `<meta property="og:image" content="${escHtml(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escHtml(title)}">`,
    `<meta name="twitter:description" content="${escHtml(desc)}">`,
    `<meta name="twitter:image" content="${escHtml(image)}">`,
  ];
  // Yerel arama için konum etiketleri
  if (s.geoRegion) tags.push(`<meta name="geo.region" content="${escHtml(s.geoRegion)}">`);
  if (s.geoCity) tags.push(`<meta name="geo.placename" content="${escHtml(s.geoCity)}">`);
  if (c) {
    tags.push(`<meta name="geo.position" content="${c.lat};${c.lng}">`);
    tags.push(`<meta name="ICBM" content="${c.lat}, ${c.lng}">`);
  }
  tags.push(`<script type="application/ld+json">${safeJson(structuredData(db, base))}</script>`);
  return tags.map((t) => "  " + t).join("\n");
}

// Ana sayfa: dosyadaki varsayılan başlık/açıklama çıkarılır, güncel etiketler eklenir
function renderIndex(db, req) {
  const base = baseUrl(req, db.settings);
  let html = fs.readFileSync(INDEX_FILE, "utf8");
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/, "").replace(/\s*<meta name="description"[^>]*>/, "");
  return html.replace('<meta name="viewport" content="width=device-width, initial-scale=1">', (m) => m + "\n" + headTags(db, base));
}

function robotsTxt(db, req) {
  const base = baseUrl(req, db.settings);
  return `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
}

function sitemapXml(db, req, lastModified) {
  const base = baseUrl(req, db.settings);
  const day = new Date(lastModified).toISOString().slice(0, 10);
  const urls = [
    [base + "/", "1.0"],
    [base + "/aydinlatma-metni", "0.2"],
  ];
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([u, p]) => `  <url><loc>${escHtml(u)}</loc><lastmod>${day}</lastmod><priority>${p}</priority></url>`).join("\n") +
    `\n</urlset>\n`
  );
}

// Yapay zekâ destekli arama motorları (GEO) için sade metin özeti
function llmsTxt(db, req) {
  const s = db.settings;
  const base = baseUrl(req, s);
  const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
  const lines = [
    `# ${s.shopName || "Balevi"}`,
    "",
    `> ${seoDescription(s)}`,
    "",
    "## İşletme",
    `- Site: ${base}/`,
    s.address ? `- Adres: ${s.address}` : "",
    s.geoCity ? `- Şehir: ${s.geoCity}, Türkiye` : "",
    s.phone ? `- Telefon: ${s.phone}` : "",
    s.whatsapp ? `- WhatsApp: https://wa.me/${String(s.whatsapp).replace(/\D/g, "")}` : "",
    s.email ? `- E-posta: ${s.email}` : "",
    s.hours ? `- Çalışma saatleri: ${String(s.hours).replace(/\n/g, "; ")}` : "",
    `- Harita: ${mapsUrl(s)}`,
    "",
  ];
  for (const cat of db.categories || []) {
    const items = (db.products || []).filter((p) => p.categoryId === cat.id);
    if (!items.length) continue;
    lines.push(`## ${cat.name}`);
    for (const p of items) {
      const parts = [`${p.name}: ${price.format(Number(p.price) || 0)}`];
      if (p.unit) parts.push(p.unit);
      if (p.region) parts.push(`yöresi ${p.region}`);
      if (!p.inStock) parts.push("şu an stokta yok");
      lines.push(`- ${parts.join(", ")}${p.description ? ". " + p.description.replace(/\s+/g, " ") : ""}`);
    }
    lines.push("");
  }
  if (s.aboutText) lines.push("## Hakkımızda", String(s.aboutText).trim(), "");
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").replace(/\n{3,}/g, "\n\n");
}

module.exports = { renderIndex, robotsTxt, sitemapXml, llmsTxt };
