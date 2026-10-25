/* 見たいリスト: 作品ページ・検索結果の「見たいリストに入れる」ボタンと、mylist.html の一覧・一押しサブスクの計算。
   リストはこの端末の localStorage にだけ保存する (ログインなし)。build_pages.py の footer で全ページに読み込む。 */
(() => {
  const KEY = "madoguchi-mylist";
  const ROOT = (document.currentScript && document.currentScript.src || location.href).replace(/mylist\.js.*$/, "");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const read = () => { try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a.filter(x => x && x.id) : []; } catch (e) { return []; } };
  const save = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* 保存できない端末 (プライベートモードなど) では何もしない */ } };
  const has = id => read().some(x => x.id === id);
  const toggle = (id, t) => {
    const a = read(), i = a.findIndex(x => x.id === id);
    if (i >= 0) a.splice(i, 1); else a.push({ id, t });
    save(a); refresh();
    return i < 0;
  };

  // ボタンの見た目 (data-ml-id を持つボタンはどれも同じ動き)
  function paint(b) {
    const on = has(b.dataset.mlId);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.classList.toggle("on", on);
    if (b.classList.contains("mlbtn")) b.innerHTML = on ? "✓ 見たいリストに入っています" : "＋ 見たいリストに入れる";
    else if (b.classList.contains("mldel")) { b.textContent = "×"; b.title = "見たいリストから外す"; b.setAttribute("aria-label", b.title); }
    else { b.textContent = on ? "✓" : "＋"; b.title = on ? "見たいリストから外す" : "見たいリストに入れる"; b.setAttribute("aria-label", b.title); }
  }
  function refresh() {
    document.querySelectorAll("[data-ml-id]").forEach(paint);
    const n = read().length;
    document.querySelectorAll(".mlcount").forEach(el => { el.textContent = n ? String(n) : ""; el.hidden = !n; });
    document.querySelectorAll(".mlgo").forEach(el => { el.hidden = !n; });
    if (window.renderMyList) window.renderMyList();
  }
  document.addEventListener("click", ev => {
    const b = ev.target.closest("[data-ml-id]");
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    const added = toggle(b.dataset.mlId, b.dataset.mlT || "");
    if (b.classList.contains("mlbtn")) toast(added ? "見たいリストに入れました" : "見たいリストから外しました");
  }, true);
  // 検索結果のように、あとから出てくるボタンにも色をつける
  new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) document.querySelectorAll("[data-ml-id]:not([aria-pressed])").forEach(paint); })
    .observe(document.body, { childList: true, subtree: true });
  addEventListener("storage", ev => { if (ev.key === KEY) refresh(); });

  let tt = 0;
  function toast(msg) {
    let el = document.querySelector(".mltoast");
    if (!el) { el = document.createElement("div"); el.className = "mltoast"; el.setAttribute("role", "status"); document.body.append(el); }
    el.innerHTML = `${esc(msg)}　<a href="${ROOT}mylist.html">リストを見る ›</a>`;
    el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---- mylist.html: 一覧・表・一押しサブスク ---- */
  const page = document.getElementById("mylist");
  if (!page) { refresh(); return; }
  let D = null;
  const SVKEYS = () => D.keys;
  const affHref = k => {
    const u = (((window.SITE_CONFIG || {}).affiliate || {}).services || {})[k];
    return /^https?:\/\//.test(u || "") ? [u, true] : [D.svc[k].url || "#", false];
  };
  const svLink = (k, label) => {
    const [href, ad] = affHref(k);
    return `<a class="cta" href="${esc(href)}" target="_blank" rel="${ad ? "sponsored noopener" : "noopener"}">${esc(label)} ↗</a>`;
  };
  const yen = n => n.toLocaleString() + "円";
  const hasTrial = k => { const t = D.svc[k].trial; return !!t && !/^(なし|無し)$/.test(t); };

  // 集合被覆: 見放題で観られる作品をすべてカバーする組み合わせのうち、月額合計がいちばん安いもの (サービスは8つなので全通り試す)
  function solve(items) {
    const ks = SVKEYS().filter(k => D.svc[k].m > 0);
    const need = items.filter(x => x.ok.length);
    const res = [];
    for (let mask = 1; mask < (1 << ks.length); mask++) {
      const set = ks.filter((_, i) => mask & (1 << i));
      if (!need.every(x => x.ok.some(k => set.includes(k)))) continue;
      // ムダな契約 (外しても全部観られるサービス) が入っている組み合わせは候補にしない
      if (set.some(k => need.every(x => x.ok.some(o => o !== k && set.includes(o))))) continue;
      res.push({ set, sum: set.reduce((s, k) => s + D.svc[k].m, 0), trials: set.filter(hasTrial).length });
    }
    res.sort((a, b) => a.sum - b.sum || a.set.length - b.set.length || b.trials - a.trials);
    // 1つにまとめたい人向け: いちばん多くの作品を観られるサービス (同じ数なら安いほう)
    const single = ks.map(k => ({ k, n: need.filter(x => x.ok.includes(k)).length })).filter(x => x.n).sort((a, b) => b.n - a.n || D.svc[a.k].m - D.svc[b.k].m)[0] || null;
    return { need, best: res[0] || null, alts: res.slice(1, 3), single };
  }

  // 共有URL (mylist.html#ids=作品ID,作品ID…) で開いたときは、そのリストを表示する。自分のリストには「入れる」を押すまで混ぜない
  const sharedIds = () => { const m = location.hash.match(/ids=([0-9a-f,]+)/); return m ? [...new Set(m[1].split(",").filter(Boolean))] : null; };
  addEventListener("hashchange", () => window.renderMyList());

  const svChip = k => `<span class="sv ${k}">${esc(D.svc[k].n)}</span>`;
  const trialTxt = k => hasTrial(k) ? `無料体験 ${D.svc[k].trial}` : "無料体験なし";
  const goLabel = k => hasTrial(k) ? `${D.svc[k].n}を無料で試す` : `${D.svc[k].n}を見る`;
  const thumb = x => x.vid ? `<img src="https://i.ytimg.com/vi/${esc(x.vid)}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180">` : `<span class="mlnoth">${esc([...x.t][0] || "？")}</span>`;

  function render() {
    const sh = sharedIds();
    const list = sh ? sh.map(id => ({ id })) : read();
    const items = list.map(x => {
      const w = D.w[x.id];
      return w ? { id: x.id, t: w[0], ok: w[1], q: w[2], vid: w[3] } : { id: x.id, t: x.t || "（作品が見つかりません）", ok: [], q: [], vid: "", gone: true };
    });
    const side = page.querySelector(".mlside"), main = page.querySelector(".mlmain"), more = page.querySelector(".mlmore");
    page.classList.toggle("empty", !items.length);
    if (!items.length) {
      side.innerHTML = "";
      more.innerHTML = "";
      main.innerHTML = `<div class="mlempty"><p class="mlei">☆</p><p class="mlet">見たいリストはまだ空です</p>`
        + `<p>上の検索窓で作品を探して「＋」を押すか、作品ページの「＋ 見たいリストに入れる」を押してください。<br>入れた作品をぜんぶ観られる、いちばん安いサブスクをここに出します。</p>`
        + `<p class="mlel"><a href="ranking.html">人気ランキングから選ぶ ›</a><a href="explore.html">おすすめ名作から選ぶ ›</a></p></div>`;
      return;
    }
    const { need, best, single } = solve(items);
    const inBest = k => !!best && best.set.includes(k);

    /* ---- 右 (スマホでは上): 答え ---- */
    let ans = "";
    if (best) {
      const one = best.set.length === 1;
      const cov = need.length;
      ans = `<div class="mlans"><p class="mlk">あなたのリストなら</p>`
        + `<div class="mllogos">${best.set.map(svChip).join(`<span class="mlplus">＋</span>`)}</div>`
        + `<p class="mlprice">${one ? "月額" : `${best.set.length}つ合わせて 月額`}<b>${best.sum.toLocaleString()}</b>円</p>`
        + `<p class="mlcovt">${items.length}作品中 <b>${cov}作品</b>が見放題${cov < items.length ? `<small>（${items.length - cov}作品はどこも見放題なし）</small>` : ""}</p>`
        + `<div class="mlcov" role="img" aria-label="${items.length}作品中${cov}作品"><i style="width:${Math.round(cov * 100 / items.length)}%"></i></div>`;
      if (one) {
        const k = best.set[0];
        ans += `<p class="mlsub">${esc(D.svc[k].p)}・${esc(trialTxt(k))}</p>` + `<div class="mlgo1">${svLink(k, goLabel(k))}</div>`;
      } else {
        // サービスごとに「このサービスで観る作品」を分ける (作品の多いサービスから)
        const order = [...best.set].sort((a, b) => need.filter(x => x.ok.includes(b)).length - need.filter(x => x.ok.includes(a)).length);
        const left = new Set(need.map(x => x.id));
        ans += `<ol class="mlsteps">` + order.map(k => {
          const mine = need.filter(x => left.has(x.id) && x.ok.includes(k));
          mine.forEach(x => left.delete(x.id));
          return `<li><div class="mlsh">${svChip(k)}<span>月額 ${yen(D.svc[k].m)}・${esc(trialTxt(k))}</span></div>`
            + svLink(k, hasTrial(k) ? "無料で試す" : "公式サイト") + `<p class="mlsw">${mine.map(x => esc(x.t)).join("、")}</p></li>`;
        }).join("") + `</ol><p class="mltip">💡 1か月ずつ順番に契約すれば、同時に払うのは1つ分だけです。</p>`;
      }
      ans += `<p class="mlfine"><span class="pr">PR</span> 料金は${esc(D.asof)}時点の最安プラン（税込）、配信は${esc(D.vasof)}時点。無料体験は期間が終わると自動で有料になります。</p></div>`;
      if (!one && single) {
        const k = single.k;
        ans += `<div class="mlalt1"><p class="mlk">1つだけにするなら</p><div class="mlalt1r">${svChip(k)}<span>月額 ${yen(D.svc[k].m)}・${need.length}作品中 <b>${single.n}作品</b></span></div>${svLink(k, goLabel(k))}</div>`;
      }
    } else {
      ans = `<div class="mlans none"><p class="mlk">あなたのリストなら</p><p class="mlnone1">いま見放題で観られるサービスが見つかりませんでした</p><p class="mlsub">レンタル・購入なら観られることがあります。各作品のページから探せます。</p></div>`;
    }
    side.innerHTML = ans;

    /* ---- 左 (スマホでは下): リストの作品 ---- */
    const chips = x => x.ok.length ? x.ok.map(k => `<span class="sv ${k}${inBest(k) ? " mlhit" : ""}">${esc(D.svc[k].n)}</span>`).join("")
      : x.q.length ? `<span class="mlq">見放題は未確認（作品ページで調べられます）</span>` : `<span class="mlno">どこも見放題なし</span>`;
    main.innerHTML = (sh ? `<div class="mlshared"><p><b>共有された見たいリスト</b>を表示しています</p><p><button type="button" class="mlbtn" id="mlimport">自分のリストに入れる</button><a href="mylist.html" id="mlmine">自分のリストを見る ›</a></p></div>` : "")
      + `<div class="mlhead"><h2>リスト <small>${items.length}作品</small></h2>`
      + (sh ? "" : `<div class="mlhbtns"><button type="button" id="mlsharebtn">共有</button><button type="button" id="mlclear">空にする</button></div>`) + `</div>`
      + `<ul class="mlitems">` + items.map(x => `<li><a class="mlth" href="anime/${esc(x.id)}.html" tabindex="-1" aria-hidden="true">${thumb(x)}</a>`
        + `<div class="mlinfo"><a class="mlt" href="anime/${esc(x.id)}.html">${esc(x.t)}</a><div class="mlsv">${chips(x)}</div></div>`
        + (sh ? "" : `<button type="button" class="mldel" data-ml-id="${esc(x.id)}" data-ml-t="${esc(x.t)}"></button>`) + `</li>`).join("") + `</ul>`
      + (sh ? "" : `<p class="mlsave">リストはこの端末のブラウザにだけ保存されます。機種変更に備えるなら「共有」のURLをメモしておくと、あとで開いて戻せます。</p>`);

    /* ---- 下: サービス別・くわしい表 ---- */
    const ks = SVKEYS();
    const cnt = k => items.filter(x => x.ok.includes(k)).length;
    const bars = ks.filter(k => D.svc[k].m > 0).sort((a, b) => cnt(b) - cnt(a) || D.svc[a].m - D.svc[b].m).map(k =>
      `<li class="${inBest(k) ? "on" : ""}"><span class="mlbn">${svChip(k)}</span><span class="mlbb"><i style="width:${Math.round(cnt(k) * 100 / items.length)}%"></i></span><span class="mlbc">${cnt(k)}/${items.length}作品</span><span class="mlbp">${yen(D.svc[k].m)}</span></li>`).join("");
    const cell = (x, k) => x.ok.includes(k) ? `<td class="c ok">○</td>` : x.q.includes(k) ? `<td class="c q">?</td>` : `<td class="c no">－</td>`;
    more.innerHTML = `<h2>サービス別に見ると</h2><ul class="mlbars">${bars}</ul>`
      + `<details class="acc mltblacc"><summary><h2>作品×サービスの表</h2><small>○見放題 －なし ?未確認</small></summary><div class="accb"><div class="tblwrap"><table class="mltbl"><thead><tr><th>作品</th>`
      + ks.map(k => `<th>${svChip(k)}</th>`).join("") + `</tr></thead><tbody>`
      + items.map(x => `<tr><th><a href="anime/${esc(x.id)}.html">${esc(x.t)}</a></th>` + ks.map(k => cell(x, k)).join("") + `</tr>`).join("")
      + `</tbody></table></div><p class="notes">?＝当サイトでは未確認です（見放題の可能性があります。作品ページから各サービスで調べられます）。</p></div></details>`;

    if (sh) {
      main.querySelector("#mlimport").onclick = () => {
        const a = read();
        items.filter(x => !x.gone && !a.some(y => y.id === x.id)).forEach(x => a.push({ id: x.id, t: x.t }));
        save(a); history.replaceState(null, "", "mylist.html"); refresh();
        toast("自分の見たいリストに入れました");
      };
      main.querySelector("#mlmine").onclick = ev => { ev.preventDefault(); history.replaceState(null, "", "mylist.html"); refresh(); };
      return;
    }
    main.querySelector("#mlclear").onclick = () => { if (confirm("見たいリストを空にしますか？")) { save([]); refresh(); } };
    main.querySelector("#mlsharebtn").onclick = ev => {
      const url = `${location.origin}${location.pathname}#ids=${items.map(x => x.id).join(",")}`;
      const done = () => { ev.target.textContent = "URLをコピーしました ✓"; setTimeout(() => { ev.target.textContent = "共有"; }, 2500); };
      if (navigator.share && matchMedia("(max-width:640px)").matches) navigator.share({ title: "見たいアニメのリスト｜アニメの窓口", url }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt("このURLをコピーしてください", url));
      else prompt("このURLをコピーしてください", url);
    };
  }
  window.renderMyList = () => { if (D) render(); };

  // リストのページの中で作品を探して入れる検索窓
  const q = page.querySelector("#mlq"), qres = page.querySelector("#mlqres");
  const norm = s => String(s || "").normalize("NFKC").toLowerCase().replace(/[\s・☆★!！?？「」『』（）()\-‐～〜]/g, "");
  let idx = null;
  if (q) {
    q.addEventListener("input", () => {
      const k = norm(q.value);
      if (!k || !D) { qres.hidden = true; qres.innerHTML = ""; return; }
      idx = idx || Object.entries(D.w).map(([id, w]) => [id, w[0], norm(w[0]), w[1].length]);
      const hit = idx.filter(x => x[2].includes(k)).sort((a, b) => (a[2].indexOf(k) - b[2].indexOf(k)) || a[2].length - b[2].length).slice(0, 8);
      qres.innerHTML = hit.length ? hit.map(x => `<div class="mlrow"><a href="anime/${esc(x[0])}.html"><b>${esc(x[1])}</b><small>見放題 ${x[3]}サービス</small></a><button type="button" class="mladd" data-ml-id="${esc(x[0])}" data-ml-t="${esc(x[1])}"></button></div>`).join("")
        : `<p class="qnone">「${esc(q.value)}」に当てはまる作品が見つかりませんでした。</p>`;
      qres.hidden = false;
    });
    q.addEventListener("keydown", ev => { if (ev.key === "Escape") qres.hidden = true; });
    document.addEventListener("click", ev => { if (!ev.target.closest(".mlsearch")) qres.hidden = true; });
  }

  fetch(`${ROOT}data/mylist.json?v=${encodeURIComponent(page.dataset.v || "1")}`).then(r => r.json()).then(d => {
    const dec = s => [...(s || "")].map(i => d.keys[+i]);
    for (const id in d.w) d.w[id] = [d.w[id][0], dec(d.w[id][1]), dec(d.w[id][2]), d.w[id][3] || ""];
    D = d; refresh();
  })
    .catch(() => { page.querySelector(".mlside").innerHTML = `<p class="notes">配信データを読み込めませんでした。ページを読み込み直してください。</p>`; });
  refresh();
})();
