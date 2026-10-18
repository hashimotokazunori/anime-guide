/* 公式YouTube予告編の埋め込みと、楽天アフィリエイトの商品画像。
   index.html 本体の openDlg / render をくるんで機能を足す。 */
(() => {
  const CFG = window.SITE_CONFIG || {};
  const RK = CFG.rakuten || {};
  const rakutenOn = !!(RK.applicationId && RK.affiliateId);

  /* ---- 予告編 (trailers.json: {"作品名": "YouTube動画ID"}) ---- */
  let TRAILERS = {};
  const trailersReady = CFG.trailers === false ? Promise.resolve() :
    fetch("trailers.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).then(d => { TRAILERS = d || {}; }).catch(() => {});

  /* 公式PVのサムネイル (YouTubeが動画ごとに公開している画像) をポスターに使う。
     画像は再生ボタンを兼ね、押すとその動画を開く。 */
  function ytThumb(id, img) {
    img.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
    // 高画質版が無い動画は 120x90 の代替画像が返るので、中画質版に切り替える
    const fallback = () => { img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`; };
    img.addEventListener("load", () => { if (img.naturalWidth <= 120) fallback(); }, { once: true });
    img.addEventListener("error", fallback, { once: true });
  }
  function posterFromTrailer(el, a) {
    const id = TRAILERS[a.t];
    const p = el.querySelector(".poster");
    if (!id || !p || p.querySelector("img.pk")) return;
    const img = new Image();
    img.className = "pk yt"; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    ytThumb(id, img);
    p.prepend(img);
    const badge = document.createElement("span");
    badge.className = "ytbadge"; badge.textContent = "▶ 公式PV";
    p.append(badge);
  }
  function showTrailer(a) {
    const box = $("#dTrailer");
    const id = TRAILERS[a.t];
    box.innerHTML = "";
    box.hidden = !id;
    if (!id) return;
    // 押すまでYouTubeに接続しない (プライバシー保護と読み込みの軽さのため)
    box.className = "trailer";
    const th = new Image();
    th.alt = ""; th.className = "thumb";
    ytThumb(id, th);
    box.append(th);
    const b = document.createElement("button");
    b.innerHTML = `公式PVを再生<small>YouTubeの公式動画を読み込みます</small>`;
    b.onclick = () => {
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${esc(a.t)} 公式PV" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    };
    box.append(b);
  }

  /* ---- 楽天ブックス DVD・Blu-ray (1秒に1回まで、24時間キャッシュ) ---- */
  const cacheKey = t => "rk:" + t;
  const DAY = 864e5;
  let queue = Promise.resolve();
  function rakuten(title) {
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey(title)) || "null");
      if (c && Date.now() - c.at < DAY) return Promise.resolve(c.items);
    } catch (e) {}
    const kw = title.replace(/[(（][^)）]*[)）]/g, "").split(/[ 　]/)[0];
    const q = new URLSearchParams({ format: "json", formatVersion: "2", applicationId: RK.applicationId, affiliateId: RK.affiliateId, title: kw, hits: "4", sort: "standard" });
    const job = queue.then(() => fetch(`${RK.endpoint}?${q}`))
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const items = (d.Items || []).map(x => x.Item || x)
          .filter(x => x.largeImageUrl && !/noimage/i.test(x.largeImageUrl))
          .map(x => ({ title: x.title, img: x.largeImageUrl.replace("?_ex=200x200", "?_ex=300x300"), url: x.affiliateUrl || x.itemUrl, price: x.itemPrice }));
        try { localStorage.setItem(cacheKey(title), JSON.stringify({ at: Date.now(), items })); } catch (e) {}
        return items;
      })
      .catch(() => []);
    queue = job.then(() => new Promise(r => setTimeout(r, 1100)));
    return job;
  }
  function showShop(a) {
    const box = $("#dShop");
    box.hidden = !rakutenOn;
    if (!rakutenOn) return;
    box.innerHTML = '<span class="pr">PR</span><div class="meta">楽天ブックスで探しています…</div>';
    rakuten(a.t).then(items => {
      if (cur !== a) return;
      if (!items.length) { box.hidden = true; return; }
      box.innerHTML = `<span class="pr">PR</span>
        <div class="items">${items.map(i => `<a href="${esc(i.url)}" target="_blank" rel="sponsored noopener"><img src="${esc(i.img)}" alt="" loading="lazy"><span>${esc(i.title)}</span>${i.price ? `<span class="price">¥${Number(i.price).toLocaleString()}</span>` : ""}</a>`).join("")}</div>
        <div class="credit">商品情報：<a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener">Supported by Rakuten Developers</a>　このリンクから購入されると、サイト運営者に紹介料が入ります。</div>`;
    });
  }

  // 詳細ダイアログを開くときに予告編と商品を足す
  const baseOpen = openDlg;
  openDlg = function (a) { baseOpen(a); showTrailer(a); showShop(a); };
  // 閉じたら動画を止める
  $("#dlg").addEventListener("close", () => { $("#dTrailer").innerHTML = ""; });

  // カードのポスター: 楽天の商品画像があればそれ、無ければ公式PVのサムネイル
  const useRakutenPoster = rakutenOn && RK.posters !== false;
  const baseRender = render;
  render = function (hl) {
    baseRender(hl);
    document.querySelectorAll("#grid .card").forEach(el => {
      const a = A[+el.id.slice(2)];
      if (!a) return;
      if (!useRakutenPoster) { posterFromTrailer(el, a); return; }
      rakuten(a.t).then(items => {
        const p = el.querySelector(".poster");
        if (!p) return;
        if (!items[0]) { posterFromTrailer(el, a); return; }
        p.querySelector("img.pk")?.remove(); p.querySelector(".ytbadge")?.remove();
        const img = new Image();
        img.className = "pk"; img.alt = ""; img.loading = "lazy"; img.src = items[0].img;
        p.prepend(img);
      });
    });
  };
  trailersReady.then(() => render());

  /* 今期の配信DB・全アニメ一覧: 公式PVがある作品に小さなサムネイルを付ける。
     どちらの一覧も描き直されるたびに中身が入れ替わるので、変化を見張って付け直す。 */
  function miniThumb(title) {
    const id = TRAILERS[title];
    if (!id) return null;
    const a = document.createElement("a");
    a.className = "mini"; a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    a.target = "_blank"; a.rel = "noopener"; a.title = `${title} 公式PVをYouTubeで見る`;
    const img = new Image();
    img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    a.append(img);
    return a;
  }
  function decorate(root) {
    root.querySelectorAll("td.t:not([data-pv])").forEach(td => {
      td.dataset.pv = "1";
      const name = td.querySelector("b, button")?.textContent;
      const th = name && miniThumb(name);
      if (th) td.prepend(th);
    });
    root.querySelectorAll(".arow:not([data-pv])").forEach(row => {
      row.dataset.pv = "1";
      const th = miniThumb(row.querySelector(".at")?.textContent || "");
      if (th) row.prepend(th);
    });
  }
  trailersReady.then(() => {
    ["#nlist", "#alist"].forEach(sel => {
      const root = $(sel);
      if (!root) return;
      decorate(root);
      new MutationObserver(() => decorate(root)).observe(root, { childList: true, subtree: true });
    });
  });
})();

/* 作品ページ (anime/〇〇.html) へのリンク。anime/index.json は build_pages.py が作る {作品名: ページID} */
(() => {
  fetch("anime/index.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).then(MAP => {
    const href = t => MAP[t] ? `anime/${MAP[t]}.html` : null;
    // おすすめ作品の詳細ダイアログ
    const btn = document.getElementById("dPage");
    if (btn && typeof openDlg === "function") {
      const base = openDlg;
      openDlg = function (a) { base(a); const h = href(a.t); btn.hidden = !h; if (h) btn.href = h; };
    }
    // 配信DB・全アニメ一覧の作品名
    const link = root => {
      root.querySelectorAll("td.t b:not([data-pg]), .arow .at:not([data-pg])").forEach(el => {
        el.dataset.pg = "1";
        const h = href(el.textContent);
        if (!h) return;
        const a = document.createElement("a");
        a.href = h; a.className = "pglink"; a.textContent = el.textContent;
        el.replaceChildren(a);
      });
    };
    ["#nlist", "#alist"].forEach(sel => {
      const root = document.querySelector(sel);
      if (!root) return;
      link(root);
      new MutationObserver(() => link(root)).observe(root, { childList: true, subtree: true });
    });
  }).catch(() => {});
})();
