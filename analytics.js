/* アクセス解析。config.js の analytics.ga4 に Google アナリティクス 4 の測定ID (G-から始まる) を入れたときだけ動く。 */
(() => {
  const id = ((window.SITE_CONFIG || {}).analytics || {}).ga4 || "";
  if (!/^G-[A-Z0-9]+$/.test(id)) return;
  if (typeof window.gtag === "function") return; // ページに直接タグが書かれている場合 (トップページ) は二重に計測しない
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.append(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
})();
