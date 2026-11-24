# CLAUDE.md — Web Tasarım Kuralları

Bu dosya, bu projede çalışırken Claude'un uyması gereken tasarım ve kod kurallarını içerir.
Framework'ten bağımsızdır: düz HTML/CSS, React, Next.js, Vue, Nuxt, Svelte, Angular, Astro,
PHP/Laravel (Blade), Django/Flask (Jinja), Tailwind veya düz CSS — hepsinde geçerlidir.

---

## 0. Proje Bilgileri (BUNU DOLDUR)

- **Proje türü:** (örn. kişisel portfolyo / e-ticaret / SaaS landing page / blog)
- **Hedef kitle:** (örn. genç kullanıcılar, kurumsal müşteriler)
- **Marka hissi:** (örn. sade ve premium / enerjik ve renkli / ciddi ve güvenilir)
- **Teknoloji:** (örn. Next.js + Tailwind / düz HTML + CSS / Vue + SCSS)
- **Ana renk:** (örn. #4F46E5) — boşsa Claude uygun bir palet önersin
- **Font tercihi:** (örn. Inter, Manrope) — boşsa aşağıdaki varsayılanlar
- **Örnek beğendiğim siteler:** (linkler)

> Bu bölüm doluysa, aşağıdaki genel kurallardan önce buradaki tercihler geçerlidir.

---

## 1. Genel Tasarım Felsefesi

- Az ama iyi: her ekranda **tek bir ana amaç** ve **tek bir ana buton (CTA)** olsun.
- Boşluk (whitespace) cömert kullanılsın; sıkışık tasarım ucuz görünür.
- Görsel hiyerarşi net olsun: başlık → alt başlık → metin → aksiyon.
- "Hazır şablon / yapay zekâ yapımı" görünümünden kaçın:
  - Her yere mor-mavi gradyan koyma.
  - Her kartı aynı gölge + aynı yuvarlaklıkla tekrar etme.
  - Gereksiz emoji, anlamsız ikon yığını ve "🚀 Hemen Başla" tarzı klişeler kullanma.
  - Lorem ipsum yerine projeye uygun gerçekçi örnek metin yaz.
- Tutarlılık yaratıcılıktan önce gelir: aynı tür eleman her yerde aynı görünsün.

---

## 2. Tasarım Token'ları (Tek Kaynak)

Tüm renk, boşluk, font ve yuvarlaklık değerleri **tek bir yerde** tanımlansın; bileşenlerde
sabit (hard-coded) değer kullanılmasın.

- Düz CSS / SCSS / Vue / Svelte / Angular → `:root` içinde CSS değişkenleri
- Tailwind → `tailwind.config` (veya v4'te `@theme`) içinde
- CSS-in-JS → `theme` nesnesi

```css
:root {
  /* Renkler */
  --color-bg: #ffffff;
  --color-surface: #f7f7f8;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-on-primary: #ffffff;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;

  /* Boşluk ölçeği (4px tabanlı) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;

  /* Yuvarlaklık */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 9999px;

  /* Gölge (hafif tut) */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);

  /* Tipografi */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0b0b0f;
    --color-surface: #16161d;
    --color-text: #f3f4f6;
    --color-text-muted: #9ca3af;
    --color-border: #26262e;
    --color-primary: #818cf8;
    --color-primary-hover: #a5b4fc;
    --color-on-primary: #0b0b0f;
  }
}
```

---

## 3. Renk Kuralları

- Palet: 1 ana renk + 1 vurgu rengi (isteğe bağlı) + nötr griler + durum renkleri. Fazlası yok.
- Ana renk sadece önemli yerlerde (CTA, link, aktif durum). Yüzeyin ~%10'unu geçmesin.
- Saf siyah (#000) metin yerine koyu gri kullan; saf beyaz üstünde daha yumuşak durur.
- Kontrast: normal metin en az **4.5:1**, büyük metin en az **3:1** (WCAG AA).
- Bilgiyi yalnızca renkle verme (hata mesajında ikon + metin de olsun).
- Karanlık mod destekle; karanlık modda renkleri sadece ters çevirme, doygunluğu azalt.

---

## 4. Tipografi

- En fazla **2 font ailesi** (biri başlık, biri gövde — veya tek aile yeter).
- Gövde metni: **16px** minimum, satır yüksekliği **1.5–1.7**.
- Başlıklar: satır yüksekliği **1.1–1.3**, hafif negatif harf aralığı (`-0.01em` ~ `-0.02em`).
- Metin genişliği: satır başına **60–75 karakter** (`max-width: 65ch`).
- Tip ölçeği (örnek): 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 60 px.
- Büyük başlıklar için akışkan boyut: `font-size: clamp(2rem, 5vw, 3.75rem);`
- Kalınlık: gövde 400, vurgu 500–600, başlık 600–700. 800+ nadiren.
- Türkçe karakterleri (ğ, ü, ş, ı, İ, ö, ç) destekleyen font seç; Google Fonts'ta `latin-ext` alt kümesini dahil et.

---

## 5. Boşluk ve Yerleşim

- Tüm boşluklar token ölçeğinden gelsin (4'ün katları). 13px, 27px gibi rastgele değer yok.
- Bölümler arası dikey boşluk: mobilde 64px, masaüstünde 96–128px.
- İçerik genişliği: `max-width: 1200px` (metin ağırlıklı sayfalarda 720px), ortalanmış,
  yanlarda en az 16px (mobil) / 24–32px (masaüstü) boşluk.
- Layout için **Flexbox** ve **CSS Grid** kullan; `float` ve mutlak konumlandırma ile yerleşim yapma.
- İlişkili öğeler birbirine yakın, ilişkisizler uzak olsun (yakınlık ilkesi).
- Hizalamaya dikkat: her şey bir ızgaraya otursun.

---

## 6. Responsive (Mobil Öncelikli)

- Önce mobil tasarla, sonra büyüt (`min-width` media query'leri).
- Kırılma noktaları: `640px`, `768px`, `1024px`, `1280px`.
- 320px genişlikte bile yatay kaydırma (horizontal scroll) olmamalı.
- Dokunma hedefleri en az **44×44px**.
- Görseller: `max-width: 100%; height: auto;` ve `width`/`height` niteliği ver (layout kaymasını önler).
- Mobilde navigasyon hamburger menüye dönüşsün; menü klavye ile de açılıp kapanabilsin.

---

## 7. Bileşen Kuralları

**Butonlar**
- Türler: primary (dolu), secondary (çerçeveli), ghost (sadece metin). Bir bölümde tek primary.
- Durumlar: `hover`, `active`, `focus-visible`, `disabled`, `loading` — hepsi tasarlanmış olsun.
- Buton metni fiil olsun: "Gönder", "Hesap oluştur" (sadece "Tamam" değil).

**Formlar**
- Her input'un görünür bir `<label>`'ı olsun (placeholder label yerine geçmez).
- Hata mesajı alanın hemen altında, ne yapılması gerektiğini söylesin.
- Doğru input türlerini kullan: `type="email"`, `type="tel"`, `autocomplete` niteliği.

**Kartlar**
- Ya kenarlık ya gölge — ikisi birden genelde fazla.
- Kart içi boşluk: 16–24px.

**Görseller ve ikonlar**
- Tek bir ikon seti kullan (örn. Lucide, Heroicons, Phosphor) — karıştırma.
- İkon boyutu metinle uyumlu (16/20/24px), çizgi kalınlığı tutarlı.
- Modern format: WebP/AVIF, `loading="lazy"` (ilk ekrandaki görsel hariç).

**Boş / yükleniyor / hata durumları**
- Her liste ve veri alanı için bu üç durumu da tasarla. Yükleniyorken iskelet (skeleton) tercih et.

---

## 8. Animasyon ve Etkileşim

- Süre: mikro etkileşim 150–200ms, panel/modal 200–300ms. 500ms'yi geçme.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` veya `ease-out`. `linear` kullanma (dönen loader hariç).
- Sadece `transform` ve `opacity` anime et (performans).
- Hareket hassasiyetine saygı:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```
- Animasyon bir amaca hizmet etsin (geri bildirim, yönlendirme); süs için sayfa her yerinden uçan öğeler yok.

---

## 9. Erişilebilirlik (Zorunlu)

- Anlamlı HTML: `header`, `nav`, `main`, `section`, `article`, `footer`, `button`, `a`.
  Tıklanabilir `div` yok.
- Sayfada tek `h1`, başlık sırası atlanmasın (h2 → h4 değil).
- Tüm görsellerde `alt` (dekoratif ise `alt=""`).
- Klavye ile her şey kullanılabilsin; odak halkası **asla** kaldırılmasın:
  ```css
  :focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
  ```
- `<html lang="tr">` (veya sayfanın dili) mutlaka belirtilsin.
- ARIA'yı yalnızca yerel HTML yetmediğinde kullan.

---

## 10. Çok Dilli Destek (i18n)

- Metinleri koda gömme; dil dosyalarında tut (örn. `locales/tr.json`, `locales/en.json`).
  - React/Next: `next-intl` veya `react-i18next` · Vue: `vue-i18n` · Angular: `@angular/localize`
  - Laravel: `lang/` klasörü · Django: `gettext` · Düz HTML: basit JSON + JS
- Tasarım metin uzunluğuna dayanıklı olsun: Almanca metin ~%30 daha uzun olabilir;
  sabit genişlikli butonlar kullanma.
- Sağdan sola diller (Arapça, Farsça, İbranice) için `dir="rtl"` ve mantıksal CSS özellikleri:
  `margin-inline-start`, `padding-inline-end`, `inset-inline-start` (left/right yerine).
- Tarih, sayı ve para birimi için `Intl.DateTimeFormat` / `Intl.NumberFormat` kullan.
- Türkçe büyük/küçük harf için `toLocaleUpperCase('tr')` (i → İ sorunu).

---

## 11. Performans

- Hedef: Lighthouse Performance ve Accessibility ≥ 90.
- Fontlar: en fazla 2 aile, 3–4 ağırlık; `font-display: swap`.
- Kullanılmayan CSS/JS'yi ekleme; küçük bir iş için büyük kütüphane yükleme.
- Görselleri boyutlandır ve sıkıştır; `srcset` / framework'ün görsel bileşenini kullan (`next/image`, `<NuxtImg>` vb.).

---

## 12. Kod Düzeni

- Bileşenler küçük ve tek amaçlı olsun; tekrar eden UI'ı bileşene çıkar.
- Sınıf/değişken isimleri anlamlı ve tutarlı (BEM, Tailwind veya CSS Modules — projede hangisi varsa ona uy).
- Mevcut projede bir stil sistemi varsa **yenisini ekleme**, var olana uy.
- Inline style yalnızca dinamik değerler için.
- `!important` kullanma (reduced-motion kuralı hariç).

---

## 13. Claude İçin Çalışma Şekli

1. Yeni bir sayfa/bileşen yazmadan önce mevcut token'lara ve bileşenlere bak; varsa onları kullan.
2. Tasarım kararı belirsizse (renk, düzen, ton) kısa bir soru sor veya 2 seçenek sun.
3. Her değişiklikten sonra kontrol et:
   - [ ] Mobil (375px) ve masaüstü (1440px) görünümü düzgün mü?
   - [ ] Açık ve karanlık modda kontrast yeterli mi?
   - [ ] Klavye ile gezilebiliyor mu, odak görünüyor mu?
   - [ ] Hover / focus / disabled / loading / boş / hata durumları var mı?
   - [ ] Sabit (hard-coded) renk veya boşluk değeri kaldı mı?
4. Bitirdiğinde ne değiştiğini kısa özetle.
