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
      abema: "",
    },
  },

  // ---- Google AdSense -------------------------------------------------------------
  // 審査に通ったら、パブリッシャーID (ca-pub-から始まる) と広告ユニットのIDを入れる。
  ads: {
    adsenseClient: "",      // 例: "ca-pub-1234567890123456"
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
  // Google Search Console の所有権確認用 (HTMLタグの content の値)。python build_pages.py で各ページに入る
  searchConsole: "",

  // 公式YouTube予告編の埋め込み (trailers.json) を使うか
  trailers: true,
};
