/* 配信サービスのアフィリエイトリンクと Google AdSense の広告枠。
   config.js に値が入っているものだけを動かす。何も入っていなければ何もしない。 */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const AFF = Object.fromEntries(Object.entries((CFG.affiliate || {}).services || {}).filter(([, u]) => /^https?:\/\//.test(u || "")));
  const ADS = CFG.ads || {};
  const client = /^ca-pub-\d+$/.test(ADS.adsenseClient || "") ? ADS.adsenseClient : "";
  const slots = ADS.slots || {};
  const rakutenOn = !!(CFG.rakuten && CFG.rakuten.affiliateId);
  const anyAff = Object.keys(AFF).length > 0 || /^\d+$/.test(CFG.linkswitchPid || "");

  // このスクリプトの置き場所 = サイトのいちばん上 (サブフォルダのページからでも正しいリンクを作るため)
  const ROOT = (document.currentScript && document.currentScript.src || location.href).replace(/monetize\.js.*$/, "");

  /* ---- バリューコマース LinkSwitch (対応店へのリンクを自動でアフィリエイトリンクに) ---- */
  if (/^\d+$/.test(CFG.linkswitchPid || "") && !document.querySelector('script[src*="vcdal.js"]')) {
    window.vc_pid = CFG.linkswitchPid;
    const ls = document.createElement("script");
    ls.src = "https://aml.valuecommerce.com/vcdal.js";
    ls.async = true;
    document.head.appendChild(ls);
  }

  /* ---- PR表記 (広告やアフィリエイトを使うときはページ上部に必ず出す) ---- */
  if (anyAff || rakutenOn || client) {
    const note = document.createElement("p");
    note.className = "prnote";
    note.innerHTML = `<span class="pr">PR</span>当サイトはアフィリエイト広告${client ? "・Google AdSense による広告" : ""}を利用しています。<a href="${ROOT}privacy.html">広告とプライバシーについて</a>`;
    const anchor = document.querySelector("header") || document.querySelector(".top") || document.querySelector(".cnav");
    if (anchor) anchor.after(note); else document.body.prepend(note);
  }

  /* ---- グッズ・CD・トレカのお店へのリンク ----
     <a data-shop="お店" data-q="検索する言葉"> を、お店の検索結果へのリンクにする。広告リンク (config.js の affiliate.shops) があればそれを使う。
     画面をあとから作るページ (ポケカなど) のために window.shopLink(お店, 言葉) も用意する。 */
  const SHOPS = {
    gamers:   { name: "ゲーマーズ", top: "https://www.gamers.co.jp/", search: "https://www.gamers.co.jp/products/list.php?mode=search&smt={q}" },
    amiami:   { name: "あみあみ", top: "https://www.amiami.jp/", search: "https://slist.amiami.jp/top/search/list?s_keywords={q}" },
    animate:  { name: "アニメイト", top: "https://www.animate-onlineshop.jp/", search: "https://www.animate-onlineshop.jp/products/list.php?smt={q}" },
    hmv:      { name: "HMV", top: "https://www.hmv.co.jp/", search: "https://www.hmv.co.jp/search/keyword_{q}/" },
    discas:   { name: "TSUTAYA DISCAS", top: "https://www.discas.net/" },
    mangazenkan: { name: "漫画全巻ドットコム", top: "https://www.mangazenkan.com/" },
    toretoku: { name: "トレトク", top: "https://www.toretoku.jp/", search: "https://www.toretoku.jp/item?keyword={q}" },
    cardmax:  { name: "CARDMAX", top: "https://www.cardmax.jp/" },
    beehonpo: { name: "Bee本舗", top: "https://www.bee-honpo.com/" },
    furuichi: { name: "ふるいち トレカ買取", top: "https://furuichi.com/" },
  };
  const SHOP_AFF = (CFG.affiliate || {}).shops || {};
  const okURL = u => /^https:\/\//.test(u || "");
  function shopLink(shop, q) {
    const def = SHOPS[shop];
    if (!def) return null;
    const aff = SHOP_AFF[shop] || {};
    const dest = q && def.search ? def.search.replace("{q}", encodeURIComponent(q)) : def.top;
    if (okURL(aff.goods)) return { href: `${aff.goods}&a8ejpredirect=${encodeURIComponent(dest)}`, ad: true, name: def.name };
    if (okURL(aff.link) && (!q || !def.search)) return { href: aff.link, ad: true, name: def.name };
    return { href: dest, ad: false, name: def.name };
  }
  window.shopLink = shopLink;
  document.querySelectorAll("a[data-shop]").forEach(a => {
    const l = shopLink(a.dataset.shop, a.dataset.q || "");
    if (!l) return;
    a.href = l.href; a.target = "_blank"; a.rel = l.ad ? "sponsored noopener" : "noopener";
  });

  /* ---- 作品ページ・比較ページの「公式サイト」ボタン: 広告リンクがあれば差し替える ---- */
  document.querySelectorAll("[data-aff-svc]").forEach(a => {
    const svc = a.dataset.affSvc;
    if (AFF[svc]) { a.href = AFF[svc]; a.rel = "sponsored noopener"; a.textContent = a.textContent.replace("公式サイト", "このサービスで観る"); }
  });

  /* ---- 配信サービスのアフィリエイトリンク ---- */
  function affLink(svc, inner, extraClass) {
    const a = document.createElement("a");
    a.href = AFF[svc]; a.target = "_blank"; a.rel = "sponsored noopener";
    a.className = "afflink" + (extraClass ? " " + extraClass : "");
    a.title = `${NAMES_JA[svc] || svc} で観る (広告リンク)`;
    a.append(inner);
    return a;
  }
  const NAMES_JA = Object.fromEntries(typeof SVC !== "undefined" ? SVC : []);

  if (anyAff) {
    // 配信DBの表: 「●」をそのサービスへのリンクにする
    const linkTable = root => {
      const head = [...root.querySelectorAll("thead th")];
      const colSvc = head.map(th => [...(th.querySelector(".sv")?.classList || [])].find(c => c !== "sv"));
      root.querySelectorAll("tbody tr:not([data-aff])").forEach(tr => {
        tr.dataset.aff = "1";
        [...tr.children].forEach((td, i) => {
          const svc = colSvc[i], dot = td.querySelector(".yes");
          if (svc && AFF[svc] && dot) td.replaceChildren(affLink(svc, dot));
        });
      });
    };
    ["#nlist", "#grid"].forEach(sel => {
      const root = document.querySelector(sel);
      if (!root) return;
      if (sel === "#nlist") {
        linkTable(root);
        new MutationObserver(() => linkTable(root)).observe(root, { childList: true, subtree: true });
      }
    });
    // おすすめ24作品の一覧表示 (表) と作品詳細のサービス名もリンクにする
    const linkBadges = box => box.querySelectorAll(".sv:not(a .sv)").forEach(b => {
      const svc = [...b.classList].find(c => c !== "sv");
      if (AFF[svc]) b.replaceWith(affLink(svc, b.cloneNode(true)));
    });
    const dSvc = document.querySelector("#dSvc");
    if (dSvc) new MutationObserver(() => linkBadges(dSvc)).observe(dSvc, { childList: true });
    const grid = document.querySelector("#grid");
    if (grid) {
      const tbl = () => grid.querySelector("table") && linkTable(grid);
      new MutationObserver(tbl).observe(grid, { childList: true });
    }
  }

  /* ---- Google AdSense ---- */
  if (!client) return;
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const s = document.createElement("script");
    s.async = true; s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    document.head.append(s);
  }

  function adUnit(slot, cls) {
    if (!slot) return null;
    const box = document.createElement("div");
    box.className = "adbox" + (cls ? " " + cls : "");
    box.innerHTML = `<span class="adlabel">広告</span><ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    return box;
  }
  const push = () => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} };
  function place(el, where, how) {
    if (!el || !where) return;
    where[how](el); push();
  }

  place(adUnit(slots.top), document.querySelector(".tabs"), "after");
  place(adUnit(slots.footer), document.querySelector("footer"), "before");
  place(adUnit(slots.dialog), document.querySelector("#dlg .dlg-body"), "append");

  // おすすめ一覧の途中に挟む (一覧は描き直されるので、そのたびに入れ直す)
  const every = Math.max(4, ADS.listEvery | 0 || 8);
  const grid = document.querySelector("#grid");
  if (slots.list && grid) {
    const fill = () => {
      if (grid.classList.contains("list") || grid.querySelector("table") || grid.querySelector(".adbox")) return;
      const cards = [...grid.querySelectorAll(".card")];
      cards.forEach((c, i) => {
        if ((i + 1) % every === 0 && i < cards.length - 1) place(adUnit(slots.list, "incard"), c, "after");
      });
    };
    fill();
    new MutationObserver(fill).observe(grid, { childList: true });
  }
})();
