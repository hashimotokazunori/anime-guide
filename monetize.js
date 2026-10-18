/* 配信サービスのアフィリエイトリンクと Google AdSense の広告枠。
   config.js に値が入っているものだけを動かす。何も入っていなければ何もしない。 */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const AFF = Object.fromEntries(Object.entries((CFG.affiliate || {}).services || {}).filter(([, u]) => /^https?:\/\//.test(u || "")));
  const ADS = CFG.ads || {};
  const client = /^ca-pub-\d+$/.test(ADS.adsenseClient || "") ? ADS.adsenseClient : "";
  const slots = ADS.slots || {};
  const rakutenOn = !!(CFG.rakuten && CFG.rakuten.applicationId && CFG.rakuten.affiliateId);
  const anyAff = Object.keys(AFF).length > 0;

  // このスクリプトの置き場所 = サイトのいちばん上 (サブフォルダのページからでも正しいリンクを作るため)
  const ROOT = (document.currentScript && document.currentScript.src || location.href).replace(/monetize\.js.*$/, "");

  /* ---- PR表記 (広告やアフィリエイトを使うときはページ上部に必ず出す) ---- */
  if (anyAff || rakutenOn || client) {
    const note = document.createElement("p");
    note.className = "prnote";
    note.innerHTML = `<span class="pr">PR</span>当サイトはアフィリエイト広告${client ? "・Google AdSense による広告" : ""}を利用しています。<a href="${ROOT}privacy.html">広告とプライバシーについて</a>`;
    const anchor = document.querySelector("header") || document.querySelector(".top") || document.querySelector(".cnav");
    if (anchor) anchor.after(note); else document.body.prepend(note);
  }

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
  const s = document.createElement("script");
  s.async = true; s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.append(s);

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
