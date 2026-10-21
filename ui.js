/* 全ページ共通の画面の動き: メニューの開け閉め・上へ戻る・もっと見る・並び替え (build_pages.py の footer で読み込む) */
(() => {
  // メニューの引き出し (JSが動かなくても #sitemenu へのリンクで開く)
  const drawer = document.getElementById("sitemenu");
  if (drawer) {
    const open = on => { drawer.classList.toggle("open", on); document.documentElement.style.overflow = on ? "hidden" : ""; };
    document.querySelectorAll('a[href="#sitemenu"]').forEach(a => a.addEventListener("click", ev => { ev.preventDefault(); open(true); }));
    drawer.addEventListener("click", ev => {
      if (ev.target === drawer || ev.target.closest(".closebtn")) { ev.preventDefault(); open(false); }
    });
    document.addEventListener("keydown", ev => { if (ev.key === "Escape") open(false); });
  }
  // PCのプルダウン: 外を押したら閉じる・ほかを開いたら閉じる
  const dds = [...document.querySelectorAll("details.dd")];
  dds.forEach(d => d.addEventListener("toggle", () => { if (d.open) dds.forEach(o => { if (o !== d) o.open = false; }); }));
  document.addEventListener("click", ev => { dds.forEach(d => { if (!d.contains(ev.target)) d.open = false; }); });

  // ページの先頭へ戻る
  const top = document.createElement("button");
  top.type = "button"; top.className = "totop"; top.setAttribute("aria-label", "ページの先頭へ戻る"); top.textContent = "↑";
  top.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.append(top);
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { top.classList.toggle("show", scrollY > 700); ticking = false; });
  }, { passive: true });

  // もっと見る: data-more="N" の要素は、最初の N 件だけ見せる
  const applyMore = box => {
    const n = +box.dataset.more, kids = [...box.children];
    box.querySelector(":scope + .morebtn")?.remove();
    kids.forEach((k, i) => k.classList.toggle("mhide", i >= n));
    if (kids.length <= n || box.classList.contains("all")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "morebtn";
    b.textContent = `${box.dataset.moreLabel || "もっと見る"}（残り ${kids.length - n}件）`;
    b.onclick = () => { box.classList.add("all"); b.remove(); };
    (box.closest(".tblwrap") || box).after(b);
    if (box.closest(".tblwrap")) b.dataset.for = "tbl";
  };
  document.querySelectorAll("[data-more]").forEach(applyMore);
  // ページ内の検索に文字を入れたら、隠していた分も含めて全部から探す
  document.querySelectorAll("#sq,#aq").forEach(inp => inp.addEventListener("input", () => {
    document.querySelectorAll("[data-more]").forEach(box => {
      box.classList.toggle("all", !!inp.value.trim());
      const btn = (box.closest(".tblwrap") || box).nextElementSibling;
      if (btn && btn.classList.contains("morebtn")) btn.hidden = !!inp.value.trim();
    });
  }));

  // よく使うサブスク: 選んだサービスのマークを金色の枠で目立たせ、作品ページでは観られるかをひと言で出す
  const FAVKEY = "madoguchi-favs";
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAVKEY) || "[]") || []; } catch (e) { favs = []; }
  const NAMES = {};
  document.querySelectorAll(".favpick button").forEach(b => { NAMES[b.dataset.k] = b.textContent.trim(); });
  const applyFavs = () => {
    document.querySelectorAll(".sv").forEach(el => {
      const k = [...el.classList].find(c => NAMES[c]);
      el.classList.toggle("fav", !!k && favs.includes(k));
    });
    document.querySelectorAll(".favpick button").forEach(b => b.setAttribute("aria-pressed", String(favs.includes(b.dataset.k))));
    const dg = document.querySelector(".digest");
    dg?.querySelector(".favhit")?.remove();
    if (dg && favs.length) {
      const ok = [...document.querySelectorAll("tr.yes .sv")].map(el => [...el.classList].find(c => NAMES[c])).filter(k => k && favs.includes(k));
      const p = document.createElement("p");
      p.className = "favhit";
      p.textContent = ok.length ? `★ あなたのサブスク（${ok.map(k => NAMES[k]).join("・")}）で見放題です` : "あなたのサブスクでは、見放題が見つかっていません";
      if (!ok.length) p.style.color = "var(--muted)";
      dg.append(p);
    }
  };
  document.querySelectorAll(".favpick button").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.k;
    favs = favs.includes(k) ? favs.filter(x => x !== k) : [...favs, k];
    try { localStorage.setItem(FAVKEY, JSON.stringify(favs)); } catch (e) {}
    applyFavs();
  }));
  applyFavs();
  new MutationObserver(() => { if (favs.length) document.querySelectorAll(".sv:not(.fav)").forEach(el => { const k = [...el.classList].find(c => NAMES[c]); if (k && favs.includes(k)) el.classList.add("fav"); }); })
    .observe(document.body, { childList: true, subtree: true });

  // 並び替え: <div class="sortbar" data-for="#id"> の button[data-sort] (n=配信が多い順 / t=50音順 / y=新しい順)
  document.querySelectorAll(".sortbar").forEach(bar => {
    const list = document.querySelector(bar.dataset.for);
    if (!list) return;
    const coll = new Intl.Collator("ja");
    bar.querySelectorAll("button[data-sort]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.sort;
      const items = [...list.children];
      items.sort((a, c) => k === "t" ? coll.compare(a.dataset.t, c.dataset.t)
        : (+c.dataset[k] || 0) - (+a.dataset[k] || 0) || coll.compare(a.dataset.t, c.dataset.t));
      list.append(...items);
      bar.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      if (list.dataset.more) applyMore(list);
    }));
  });
})();
