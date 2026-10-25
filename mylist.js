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
    else if (b.classList.contains("mldel")) { b.textContent = "外す"; b.title = "見たいリストから外す"; }
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

  function render() {
    const sh = sharedIds();
    const list = sh ? sh.map(id => ({ id })) : read();
    const items = list.map(x => {
      const w = D.w[x.id];
      return w ? { id: x.id, t: w[0], ok: w[1], q: w[2] } : { id: x.id, t: x.t || "（作品が見つかりません）", ok: [], q: [], gone: true };
    });
    const box = page.querySelector(".mlbody");
    if (!items.length) {
      box.innerHTML = `<div class="digest none"><p class="dl">見たいリストはまだ空です</p><p class="ds">上の検索窓で作品を探して「＋」を押すか、作品ページの「＋ 見たいリストに入れる」を押してください。2本以上入れると、ムダなく全部観られるサブスクを計算します。</p></div>`;
      return;
    }
    const { need, best, alts, single } = solve(items);
    const none = items.filter(x => !x.ok.length);
    let top = sh ? `<div class="mlshared"><p><b>共有された見たいリスト（${items.length}作品）</b>を表示しています。</p><p><button type="button" class="mlbtn" id="mlimport">自分のリストに入れる</button> <a href="mylist.html" id="mlmine">自分のリストを見る ›</a></p></div>` : "";
    if (best) {
      const one = best.set.length === 1;
      const names = best.set.map(k => `<span class="sv ${k}">${esc(D.svc[k].n)}</span>`).join(" ＋ ");
      const trials = best.set.filter(hasTrial).map(k => `${esc(D.svc[k].n)}は無料体験 ${esc(D.svc[k].trial)}`);
      const per = best.set.map(k => `${esc(D.svc[k].n)} ${yen(D.svc[k].m)}（${esc(D.svc[k].p)}）`).join("　＋　");
      top += `<div class="digest mlbest"><p class="dl"><i class="ic ic-crown" aria-hidden="true"></i>一押しのサブスク${one ? "" : "（いちばん安い組み合わせ）"}</p>`
        + `<p class="dm">${names}</p>`
        + `<p class="mlsum">月額 合計 <b class="yen">${yen(best.sum)}</b>${one ? "" : `<small>（${best.set.length}つのサービス）</small>`}</p>`
        + `<p class="ds">${one ? `この1つで、リストの${need.length}作品${none.length ? "（見放題のある作品）" : ""}がぜんぶ見放題です。` : `1つでは足りないので、${need.length}作品${none.length ? "（見放題のある作品）" : ""}をぜんぶ観られる、いちばん安い組み合わせです。`}</p>`
        + `<p class="ds mlper">${per}</p>`
        + (trials.length ? `<p class="ds mltrial">🎁 ${trials.join("・")}${trials.length === best.set.length && one ? "。期間内に観終われば0円です。" : "。"}</p>` : "")
        + (!one ? `<p class="ds">1か月ずつ順番に契約すれば、同時に払うのは1つ分ですみます。</p>` : "")
        + `<div class="act">${best.set.map(k => svLink(k, hasTrial(k) ? `${D.svc[k].n}を無料体験（${D.svc[k].trial}）` : `${D.svc[k].n}を見る`)).join("")}</div>`
        + (trials.length ? `<p class="ds mlpr">無料体験は、期間が終わると自動で有料に切り替わります。続けないときは期間内に解約してください。</p>` : "")
        + `<p class="ds mlpr"><span class="pr">PR</span> 料金は${esc(D.asof)}時点の最安プラン（税込）、配信は${esc(D.vasof)}時点の見放題です。登録前に公式サイトで確認してください。</p></div>`;
      if (!one && single) {
        const k = single.k;
        top += `<div class="mlone"><p class="mlonel">1つにまとめるなら</p><p><span class="sv ${k}">${esc(D.svc[k].n)}</span> 月額 <b>${yen(D.svc[k].m)}</b>　リストの${need.length}作品中 <b>${single.n}作品</b>が見放題</p>`
          + `<p class="mlonea">${svLink(k, hasTrial(k) ? `${D.svc[k].n}を無料体験（${D.svc[k].trial}）` : `${D.svc[k].n}を見る`)}</p></div>`;
      }
      if (alts.length) top += `<p class="mlalt">ほかの候補：` + alts.map(a => a.set.map(k => esc(D.svc[k].n)).join("＋") + `（月額 ${yen(a.sum)}）`).join("　") + `</p>`;
    } else if (items.length) {
      top += `<div class="digest none"><p class="dl">一押しのサブスク</p><p class="dm">リストの作品は、いま見放題で観られるサービスが見つかりませんでした</p><p class="ds">レンタル・購入なら観られることがあります。各作品のページから探せます。</p></div>`;
    }
    if (none.length && best) top += `<p class="mlnone">⚠ 見放題で観られるサービスが見つからなかった作品：${none.map(x => `<a href="anime/${esc(x.id)}.html">${esc(x.t)}</a>`).join("・")}（一押しの計算には入れていません）</p>`;
    const ks = SVKEYS();
    const inBest = k => best && best.set.includes(k);
    const cell = (x, k) => x.ok.includes(k) ? `<td class="c ok${inBest(k) ? " hit" : ""}" title="見放題">○</td>` : x.q.includes(k) ? `<td class="c q" title="当サイトでは未確認">?</td>` : `<td class="c no" title="見放題なし">－</td>`;
    const table = `<h2>作品ごとの見放題（${items.length}作品）</h2><div class="tblwrap"><table class="mltbl"><thead><tr><th>作品</th>`
      + ks.map(k => `<th class="${inBest(k) ? "hit" : ""}"><span class="sv ${k}">${esc(D.svc[k].n)}</span></th>`).join("") + `<th></th></tr></thead><tbody>`
      + items.map(x => `<tr><th><a href="anime/${esc(x.id)}.html">${esc(x.t)}</a>${x.ok.length ? "" : `<small class="mlno">見放題なし</small>`}</th>`
        + ks.map(k => cell(x, k)).join("") + `<td><button type="button" class="mldel" data-ml-id="${esc(x.id)}" data-ml-t="${esc(x.t)}"></button></td></tr>`).join("")
      + `<tr class="mlprice"><th>最安の月額</th>` + ks.map(k => `<td class="c">${D.svc[k].m ? yen(D.svc[k].m) : "—"}</td>`).join("") + `<td></td></tr></tbody></table></div>`
      + `<p class="tblhint">← 表は横にスクロールできます</p>`
      + `<p class="notes">○＝見放題、－＝見放題なし、?＝当サイトでは未確認（見放題の可能性があります。作品ページから各サービスで調べられます）。金色の列が一押しです。</p>`
      + (sh ? "" : `<div class="mlshare"><button type="button" class="morebtn" id="mlsharebtn">このリストを共有（URLをコピー）</button><button type="button" class="morebtn" id="mlclear">リストを空にする</button></div>`
        + `<p class="notes">リストはこの端末のブラウザにだけ保存されます。機種変更やブラウザのデータ削除で消えるので、共有URLをメモしておくと、あとで開いて「自分のリストに入れる」で戻せます。</p>`);
    box.innerHTML = top + table;
    if (sh) {
      box.querySelectorAll(".mldel").forEach(b => b.closest("td").replaceChildren());
      box.querySelector("#mlimport").onclick = () => {
        const a = read();
        items.filter(x => !x.gone && !a.some(y => y.id === x.id)).forEach(x => a.push({ id: x.id, t: x.t }));
        save(a); history.replaceState(null, "", "mylist.html"); refresh();
        toast("自分の見たいリストに入れました");
      };
      box.querySelector("#mlmine").onclick = ev => { ev.preventDefault(); history.replaceState(null, "", "mylist.html"); refresh(); };
      return;
    }
    box.querySelector("#mlclear").onclick = () => { if (confirm("見たいリストを空にしますか？")) { save([]); refresh(); } };
    box.querySelector("#mlsharebtn").onclick = ev => {
      const url = `${location.origin}${location.pathname}#ids=${items.map(x => x.id).join(",")}`;
      const done = () => { ev.target.textContent = "URLをコピーしました ✓"; setTimeout(() => { ev.target.textContent = "このリストを共有（URLをコピー）"; }, 2500); };
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
    for (const id in d.w) d.w[id] = [d.w[id][0], dec(d.w[id][1]), dec(d.w[id][2])];
    D = d; refresh();
  })
    .catch(() => { page.querySelector(".mlbody").innerHTML = `<p class="notes">配信データを読み込めませんでした。ページを読み込み直してください。</p>`; });
  refresh();
})();
