// Panel: Google Haritalar önizlemesi ve SEO önizlemesi.
// admin.js'ten sonra yüklenir; ayarlar formu doldurulunca "balevi:settings-filled" olayı gelir.
(function () {
  const $ = (sel) => document.querySelector(sel);

  // Sitede görünecek Google haritasının önizlemesi (yazdıkça güncellenir)
  function updatePreview() {
    const placeId = $("#s-mapPlaceId").value;
    const q = $("#s-mapQuery").value || $("#s-address").value || "";
    $("#map-preview").src = placeId
      ? `https://maps.google.com/maps?cid=${placeId}&z=17&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&output=embed`;
  }

  // Google Haritalar bağlantısından dükkân kaydının kimliğini ve koordinatlarını çıkar
  function parseMapLink() {
    const link = $("#s-mapLink").value.trim();
    const err = $("#s-mapLink-error");
    err.textContent = "";
    if (!link) {
      $("#s-mapPlaceId").value = "";
      $("#s-mapLat").value = "";
      $("#s-mapLng").value = "";
      return updatePreview();
    }
    // "!1s0x...:0x6d97..." biçimindeki kaydın ikinci kısmı Google'ın dükkân numarasıdır (cid)
    const feature = link.match(/0x[0-9a-f]+:(0x[0-9a-f]+)/i);
    const cidParam = link.match(/[?&]cid=(\d+)/);
    const lat = link.match(/!3d(-?\d+\.\d+)/) || link.match(/@(-?\d+\.\d+),/);
    const lng = link.match(/!4d(-?\d+\.\d+)/) || link.match(/@-?\d+\.\d+,(-?\d+\.\d+)/);
    const cid = cidParam ? cidParam[1] : feature ? BigInt(feature[1]).toString() : "";
    if (!cid) {
      err.textContent =
        "Bu bağlantıda dükkân kaydı bulunamadı. Google Haritalar'da dükkânınızın adına tıklayıp açılan sayfanın bağlantısını kopyalayın (kısa \"maps.app.goo.gl\" bağlantıları çalışmaz).";
      return;
    }
    $("#s-mapPlaceId").value = cid;
    $("#s-mapLat").value = lat ? lat[1] : "";
    $("#s-mapLng").value = lng ? lng[1] : "";
    updatePreview();
  }
  $("#s-mapLink").addEventListener("input", parseMapLink);
  let timer;
  $("#s-mapQuery").addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(updatePreview, 600);
  });

  // ---------- SEO önizlemesi ve karakter sayaçları ----------
  function paintSerp() {
    const title = $("#s-seoTitle").value || $("#s-seoTitle").placeholder;
    const desc = $("#s-seoDescription").value || $("#s-heroText")?.value || "";
    const url = ($("#s-siteUrl").value || location.origin).replace(/^https?:\/\//, "").replace(/\/+$/, "");
    $("#serp-title").textContent = title;
    $("#serp-desc").textContent = desc.length > 160 ? desc.slice(0, 157) + "…" : desc;
    $("#serp-url").textContent = url;
    document.querySelectorAll(".char-count").forEach((o) => {
      const len = document.getElementById(o.dataset.countFor).value.length;
      const max = Number(o.dataset.max);
      o.textContent = `${len} / ${max}`;
      o.classList.toggle("is-over", len > max);
    });
  }
  ["#s-seoTitle", "#s-seoDescription", "#s-siteUrl"].forEach((s) => $(s).addEventListener("input", paintSerp));

  document.addEventListener("balevi:settings-filled", () => {
    updatePreview();
    paintSerp();
  });
})();
