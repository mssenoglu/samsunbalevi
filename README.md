# Balevi — Bal dükkânı tanıtım sitesi

Ürün vitrini, hakkımızda galerisi, iletişim ve Google Haritalar konumu olan site + yönetim paneli.

## Çalıştırma

```
npm install
npm start
```

- Site: http://localhost:3000
- Panel: http://localhost:3000/admin/

Panel şifresi proje klasöründeki `.env` dosyasında tutulur (git'e eklenmez, kimseyle paylaşmayın):

```
ADMIN_PASSWORD="buraya-şifre"
```

Şifreyi değiştirmek için bu satırı düzenleyip sunucuyu yeniden başlatın. Şifre en az 12 karakter olmalı;
`.env` yoksa veya şifre eksikse sunucu açılmaz. Siteyi başka bir bilgisayara/sunucuya taşırken `.env`
dosyasını da elle oluşturmanız gerekir.

## Klasörler

| Yol | İçerik |
| --- | --- |
| `server.js` | Express sunucusu ve API |
| `data/db.json` | Ürünler, fotoğraflar ve site metinleri (ilk açılışta örnek verilerle oluşur) |
| `uploads/` | Panelden yüklenen fotoğraflar |
| `public/` | Site (`index.html`) ve panel (`admin/`) |
| `public/css/tokens.css` | Renk, boşluk, font token'ları — tasarım değişiklikleri buradan |

## Panelde neler düzenlenir

- **Ana sayfa:** giriş fotoğrafı (sağ taraf), üst satır, ana başlık, tanıtım metni
- **Ürünler:** bölüm başlığı, kategoriler (sitede alt başlık olur), ürün ekle / düzenle / sil, fotoğraf, fiyat, miktar, açıklama, stok, sıralama
- **Hakkımızda:** başlık, metin, kaydırmalı galeri (fotoğraf + başlık + açıklama, sıralama)
- **Site ve iletişim:** dükkân adı, telefon, WhatsApp, e-posta, Instagram, adres, saatler, harita konumu, KVKK aydınlatma metni

Logo dosyaları `public/img/` içindedir (`logo.webp`, `favicon.png`, giriş deseni `honeycomb.svg`).
Panelde her görsel için "Görseli ayarla" ile sığdırma, yakınlaştırma ve konum ayarı yapılabilir.
