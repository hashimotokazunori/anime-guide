// サイトの設定。空欄 ("") のままの項目は使われません (何も表示されません)。
window.SITE_CONFIG = {
  // ---- 楽天アフィリエイト (作品の詳細にBlu-ray・DVDの商品画像) --------------------
  rakuten: {
    // アプリIDとアクセスキーはサイトに置かない (rakuten.env に書いて、スクリプトだけで使う)
    applicationId: "",
    // 楽天アフィリエイトのアフィリエイトID
    affiliateId: "589c5f8e.ab4d569f.589c5f8f.b5b814de",
    // 楽天ブックス DVD・Blu-ray検索API。楽天側でURLが変わったら、ここだけ書き換える
    endpoint: "https://app.rakuten.co.jp/services/api/BooksDVD/Search/20170404",
    // 楽天市場の商品検索API (コナン特集の「関連グッズ」に使う)
    ichibaEndpoint: "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601",
    // カードのポスターも商品画像に差し替えるか
    posters: true,
  },

  // ---- Amazonアソシエイト ----------------------------------------------------------
  // トラッキングID (例: "animemadoguchi-22")。入れると作品ページに「Amazonで探す」リンクが出る (python build_pages.py で反映)
  amazonTag: "",

  // ---- 配信サービスのアフィリエイト ----------------------------------------------
  // A8.net・もしもアフィリエイト・バリューコマース などで発行した「広告リンクのURL」を入れる。
  // 入れたサービスは、配信DBの「●」と作品詳細のサービス名がリンクになる。
  affiliate: {
    services: {
      netflix: "",
      prime: "",
      unext: "",
      hulu: "",
      disney: "",
      danime: "",
      dmm: "",
      abema: "https://px.a8.net/svt/ejp?a8mat=4BEL1F+4NATRM+4EKC+5YJRM",  // A8.net ABEMAプレミアム (2026-10-20 提携)
      // 音楽サブスク・楽譜 (アニソンページ)
      rakutenmusic: "https://px.a8.net/svt/ejp?a8mat=4BEL1F+9CDXKI+5WLM+5YJRM",  // A8.net 楽天ミュージック (2026-10-20 提携)
      printgakufu: "",  // A8.net ぷりんと楽譜 (審査中)
    },
    // グッズ・CD・トレカのお店 (A8.net)。link = 通常の広告リンク (お店のトップへ)、goods = 商品リンク用 (検索結果など、お店の中の好きなページへ飛ばせる)
    // 空のお店は、広告ではない普通のリンク (お店の検索結果) になる。審査が通ったらここに入れる
    shops: {
      gamers:   { link: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+CAYIUQ+4AHY+5YRHE", goods: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+CAYIUQ+4AHY+BW0YB" },  // ゲーマーズ (2026-10-20 提携)
      toretoku: { link: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+C506SY+2QOI+1BN3TU", goods: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+C506SY+2QOI+1HKDAR" },  // トレトク (2026-10-20 提携)
      beehonpo: { link: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+C5LMEQ+5NJ8+5YJRM" },   // Bee本舗 (2026-10-20 提携)
      furuichi: { link: "https://px.a8.net/svt/ejp?a8mat=4BEL1K+C4ER76+5W1M+BWVTE" },   // ふるいち トレカ買取 (2026-10-20 提携)
      amiami:   { link: "", goods: "" },   // あみあみ (審査中・ポケモンカードは成果の対象外)
      animate:  { link: "", goods: "" },   // アニメイト (審査中)
      cardmax:  { link: "", goods: "" },   // CARDMAX (審査中)
      hmv:      { link: "", goods: "" },   // HMV&BOOKS online (リンクシェア。未登録)
    },
  },

  // ---- Google AdSense -------------------------------------------------------------
  // 審査に通ったら、パブリッシャーID (ca-pub-から始まる) と広告ユニットのIDを入れる。
  ads: {
    adsenseClient: "ca-pub-8509241257297550",
    slots: {
      top: "",              // タブの下 (ページ上部)
      list: "",             // おすすめ作品の一覧の途中
      dialog: "",           // 作品詳細の一番下
      footer: "",           // ページ下部
    },
    listEvery: 8,           // 一覧の何作品ごとに広告を挟むか
  },

  // ---- アクセス解析 -------------------------------------------------------------
  analytics: {
    ga4: "G-RW67PMC3PM",               // Google アナリティクス 4 の測定ID (例: "G-ABCDE12345")
  },
  // 管理人ページに埋め込む Looker Studio レポートの埋め込みURL (https://lookerstudio.google.com/embed/reporting/...)
  // レポートは限定公開のままにする (閲覧権限のある Google アカウントでログインしている人にだけ数字が見える)
  lookerEmbed: "https://datastudio.google.com/embed/reporting/6a43096b-16f3-4ce8-ad3f-3e7c7c542db2/page/E4bBG",
  // Google Search Console の所有権確認用 (HTMLタグの content の値)。python build_pages.py で各ページに入る
  searchConsole: "",
  // Google アナリティクス経由など、タグ以外の方法で所有権を確認済みなら true (管理人ページの表示用)
  searchConsoleVerified: true,

  // データの間違いの報告先 (Googleフォームなどの URL)。空なら GitHub の Issue に案内する (python build_pages.py で反映)
  reportForm: "https://docs.google.com/forms/d/e/1FAIpQLScBQdyGr2Sbqzm01aDdfg8xbwptkjpbXUwN9m0UrLd_5FLP3g/viewform",

  // 公式YouTube予告編の埋め込み (trailers.json) を使うか
  trailers: true,
};
