// サイトの設定。空欄 ("") のままの項目は使われません (何も表示されません)。
window.SITE_CONFIG = {
  // ---- 楽天アフィリエイト (作品の詳細にBlu-ray・DVDの商品画像) --------------------
  rakuten: {
    // 楽天ウェブサービス (https://webservice.rakuten.co.jp/) で発行したアプリID
    applicationId: "",
    // 楽天アフィリエイトのアフィリエイトID
    affiliateId: "",
    // 楽天ブックス DVD・Blu-ray検索API。楽天側でURLが変わったら、ここだけ書き換える
    endpoint: "https://app.rakuten.co.jp/services/api/BooksDVD/Search/20170404",
    // 楽天市場の商品検索API (コナン特集の「関連グッズ」に使う)
    ichibaEndpoint: "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601",
    // カードのポスターも商品画像に差し替えるか
    posters: true,
  },

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

  // 公式YouTube予告編の埋め込み (trailers.json) を使うか
  trailers: true,
};
