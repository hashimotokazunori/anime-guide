/* コナン特集のサイト版だけで使う機能。
   - 相関図: 各人物のカードに楽天市場の商品画像 (conan-goods.json。fetch_conan_goods.py で作る)
   - 劇場版: 公式予告編をサムネイル付きでページ内再生 */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const AFF = (CFG.rakuten || {}).affiliateId || "";
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---- 相関図の商品画像 ---- */
  const grid = document.getElementById("grid");
  const goods = document.getElementById("goods");
  // 楽天の検索結果ページへのアフィリエイトリンク (もっと探す用)
  const searchLink = name => {
    const u = "https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(`名探偵コナン ${name}`) + "/";
    return AFF ? `https://hb.afl.rakuten.co.jp/hgc/${AFF}/?pc=${encodeURIComponent(u)}` : u;
  };
  if (grid) {
    fetch("conan-goods.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).then(data => {
      const items = (data && data.items) || {};
      if (!Object.keys(items).length) return;
      document.getElementById("board").classList.add("with-goods");
      const note = document.createElement("p");
      note.className = "goods-note";
      note.innerHTML = `<span class="pr">PR</span>人物の画像は楽天市場で販売中の関連グッズです。押すと商品ページが開きます。${data.updated ? `（${escH(data.updated)} 時点）` : ""}`;
      document.getElementById("board").before(note);

      document.querySelectorAll("#grid .p").forEach(btn => {
        const id = btn.dataset.id, it = items[id];
        const wrap = document.createElement("div");
        wrap.className = "pw";
        btn.replaceWith(wrap);
        let thumb;
        if (it) {
          thumb = document.createElement("a");
          thumb.className = "pimg"; thumb.href = it.url; thumb.target = "_blank"; thumb.rel = "sponsored noopener";
          thumb.title = it.name;
          thumb.innerHTML = `<img src="${escH(it.img)}" alt="" loading="lazy"><span class="kind">${escH(it.kind || "")}</span>`;
        } else {
          // 商品が無い人物は、同じ大きさの枠に勢力マークを出す
          const g = (P.find(p => p.id === id) || {}).g;
          const color = (GROUPS.find(x => x.id === g) || {}).c || "#999";
          thumb = document.createElement("span");
          thumb.className = "pimg none"; thumb.style.color = color;
          thumb.innerHTML = `${typeof icon === "function" ? icon(g, 26) : ""}<span class="kind">グッズなし</span>`;
        }
        wrap.append(thumb, btn);
      });
      if (typeof draw === "function") draw();

      // 選択中の人物の詳細に、商品と「もっと探す」を出す
      const show = () => {
        const name = document.querySelector("#focus h2 span")?.textContent || "";
        const p = P.find(x => x.n === name);
        if (!goods || !p) return;
        const it = items[p.id];
        goods.hidden = false;
        goods.innerHTML = `<div class="goods-h"><span class="pr">PR</span>${escH(name)} の関連グッズ</div>
          <div class="goods-one">${it ? `<a href="${escH(it.url)}" target="_blank" rel="sponsored noopener"><img src="${escH(it.img)}" alt="" loading="lazy"><span>${escH(it.name)}</span>${it.price ? `<b>¥${Number(it.price).toLocaleString()}</b>` : ""}</a>` : `<span class="none-msg">いま販売中のグッズは見つかりませんでした。</span>`}
          <a class="more" href="${escH(searchLink(name))}" target="_blank" rel="sponsored noopener">楽天市場でほかのグッズを探す ↗</a></div>
          <div class="credit">商品情報：<a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener">Supported by Rakuten Developers</a>　リンク先で購入されると、サイト運営者に紹介料が入ります。</div>`;
      };
      const focus = document.getElementById("focus");
      new MutationObserver(show).observe(focus, { childList: true });
      show();
    }).catch(() => {});
  }

  /* ---- 劇場版の予告編 ---- */
  const dlg = document.getElementById("mvdlg");
  document.querySelectorAll(".mv [data-yt]").forEach(a => {
    const id = a.dataset.yt;
    const b = document.createElement("button");
    b.className = "mvplay"; b.type = "button";
    b.innerHTML = `<img src="https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg" alt="" loading="lazy"><span>▶ 予告編</span>`;
    b.onclick = () => {
      dlg.querySelector(".mvframe").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${escH(a.dataset.title)} 予告編" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      dlg.querySelector(".mvt").textContent = a.dataset.title;
      dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    };
    a.closest(".mv").prepend(b);
    a.remove();
  });
  if (dlg) {
    dlg.addEventListener("close", () => { dlg.querySelector(".mvframe").innerHTML = ""; });
    dlg.querySelector(".mvclose").onclick = () => dlg.close();
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  }
})();
