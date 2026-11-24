// Panelde ayarlanan görsel görünümünü <img> için inline stile çevirir. Hem site hem panel kullanır.
// Ayarlar: sığdır/doldur, yakınlaştırma, odak noktası, döndürme, aynalama, parlaklık, kontrast, doygunluk.
window.DEFAULT_VIEW = {
  mode: "cover", zoom: 1, x: 50, y: 50,
  rotate: 0, flipX: false, flipY: false,
  brightness: 100, contrast: 100, saturate: 100,
};

window.imageViewStyle = function imageViewStyle(view) {
  const v = { ...window.DEFAULT_VIEW, ...(view || {}) };
  const n = (x, d) => (Number.isFinite(Number(x)) ? Number(x) : d);
  let transform = `scale(${n(v.zoom, 1)})`;
  if (n(v.rotate, 0)) transform += ` rotate(${n(v.rotate, 0)}deg)`;
  if (v.flipX || v.flipY) transform += ` scale(${v.flipX ? -1 : 1}, ${v.flipY ? -1 : 1})`;

  const filters = [];
  if (n(v.brightness, 100) !== 100) filters.push(`brightness(${n(v.brightness, 100)}%)`);
  if (n(v.contrast, 100) !== 100) filters.push(`contrast(${n(v.contrast, 100)}%)`);
  if (n(v.saturate, 100) !== 100) filters.push(`saturate(${n(v.saturate, 100)}%)`);

  return (
    `object-fit:${v.mode === "contain" ? "contain" : "cover"};` +
    `object-position:${n(v.x, 50)}% ${n(v.y, 50)}%;` +
    `transform:${transform};` +
    `transform-origin:${n(v.x, 50)}% ${n(v.y, 50)}%` +
    (filters.length ? `;filter:${filters.join(" ")}` : "")
  );
};
