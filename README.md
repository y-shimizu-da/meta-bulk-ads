# Meta広告 一括入稿ツール

Meta（Facebook / Instagram）広告のキャンペーン・広告セット・広告を、ブラウザだけで一括作成するツールです。Google Sites への埋め込みを想定した単一HTML（`google-sites-embed.html`）で動作し、サーバーは不要です。

作成される広告は **すべて一時停止（PAUSED）状態** で作られます。内容を確認してから、Meta広告マネージャで手動で有効化してください。

公開URL: https://y-shimizu-da.github.io/meta-bulk-ads/google-sites-embed.html

---

## 入力方式は2つ

画面上部の「入力方式」で切り替えます。

| 方式 | 内容 |
|---|---|
| **フォーム入力（従来）** | 1つのフォームに広告文・URL等を入力し、アップロードした画像/動画の数だけ広告を作成。キャンペーン・広告セットは1つずつ。予算やターゲティングは固定。 |
| **CSV / スプレッドシート（一括）** | CSV や Google スプレッドシートで、**キャンペーン・広告セット・広告ごとにパラメータを変えて**一括入稿。 |

以下は CSV / スプレッドシートモードの手順です。

---

## CSV / スプレッドシート一括入稿の手順

### 1. ログイン・アカウント選択
Facebookログイン（または手動トークン入力）で、広告アカウント・Facebookページ・（任意で）Instagramアカウントを選択します。

### 2. 入力方式で「CSV / スプレッドシート」を選択

### 3. 入稿データ（CSV または スプレッドシート）を読み込む
- **CSVファイル**: 「テンプレートCSVをダウンロード」から雛形を取得し、編集して、ドラッグ&ドロップ（またはクリックで選択）。
- **Google スプレッドシート**: 後述の手順で「公開CSV URL」を発行し、URL欄に貼り付けて「読み込み」。

読み込むと、プレビュー表に **キャンペーン数 / 広告セット数 / 広告数** と各行の状態（ファイル照合結果）が表示されます。エラーがあると赤字で行番号付きで表示され、入稿ボタンは押せません。

### 4. クリエイティブ（画像・動画）をアップロード
CSVの `image_filename` / `feed_filename` / `story_filename` 列と**同じファイル名**の画像/動画をアップロードします。ファイル名が一致していないと「ファイル不足」エラーになります。

### 5. 「入稿を開始」
キャンペーン → 広告セット → 広告の順に作成されます。進捗がリアルタイムで表示されます。

---

## 行のまとめ方（グルーピング）

**1行 = 1広告** です。行は次のルールで階層にまとまります。

- `campaign_name` が同じ行 → **同じキャンペーン**
- その中で `adset_name` が同じ行 → **同じ広告セット**
- 各行 → **1広告**

同名のキャンペーンが広告アカウントに既に存在する場合は、それを再利用します（重複作成しません）。

### 例

| campaign_name | adset_name | daily_budget | ad_name | image_filename |
|---|---|---|---|---|
| CP_A | AS_1 | 3000 | 広告1 | a.jpg |
| CP_A | AS_1 | 3000 | 広告2 | b.mp4 |
| CP_A | AS_2 | 5000 | 広告3 | c.jpg |
| CP_B | AS_1 | 2000 | 広告4 | d.png |

→ キャンペーン `CP_A`（広告セット `AS_1` に広告2件・`AS_2` に広告1件）と、キャンペーン `CP_B`（広告セット `AS_1` に広告1件）が作成されます。

### 既存のキャンペーン／広告セットに「広告だけ」追加する

**同じ名前 = 同じ実体**として扱います。`campaign_name` / `adset_name` が広告アカウント内の既存のものと**完全一致**すれば、新規作成せずにその中へ広告を追加します（同名が無ければ新規作成）。再入稿しても重複しません。

- **必須列以外は空欄でOK** です。空欄なら推奨デフォルトが使われます。
- 既存のキャンペーン・広告セットに追加する場合、**キャンペーン級・広告セット級の設定列（objective / daily_budget / targeting 等）は空欄のままで構いません**。既存を再利用するときはこれらの列は無視され、設定は既存のものが維持されます。
- ただし広告を作るために必要な **`campaign_name` / `adset_name` / `link_url` とクリエイティブ（ファイル名列＋アップロード）は必須**です。

例（既存の `CP_既存` / `AS_既存` に広告を2件だけ追加。設定列はすべて空欄）:

| campaign_name | adset_name | link_url | image_filename |
|---|---|---|---|
| CP_既存 | AS_既存 | https://example.com | new1.jpg |
| CP_既存 | AS_既存 | https://example.com | new2.jpg |

> 💡 CSVモードでは、画面の「既存を選択」ドロップダウンは使いません。既存に追加したいときは上記のとおり**名前で指定**してください。名前は大文字小文字・全角半角・前後の空白も区別されるため、既存の名称を正確にコピーしてください。

### ASC（Advantage+）など：`adset_name` を空欄にして自動追加

`adset_name` を**空欄**にすると、`campaign_name` で指定した**既存キャンペーンの広告セットに広告を自動追加**します。広告セットをMetaが自動管理する **ASC（Advantage+ ショッピング/販売）** に広告だけ入稿したいときに使います。

- 対象キャンペーンは**事前にAds Manager等で作成**しておく必要があります（本ツールはASCキャンペーン自体は作成できません）。
- そのキャンペーンの広告セットが**1つだけなら自動採用**します。**複数ある場合はエラー**になるので `adset_name` で対象を指定してください。
- ad-setの設定列（予算・ターゲティング等）は不要です（既存セットにそのまま追加）。

例（既存ASCキャンペーンに広告を2件追加。`adset_name` は空欄）:

| campaign_name | adset_name | link_url | image_filename |
|---|---|---|---|
| ASC_売上_2026 |  | https://example.com/lp | asc1.jpg |
| ASC_売上_2026 |  | https://example.com/lp | asc2.jpg |

---

## 列の仕様

**キャンペーン級・広告セット級の列は、同じグループ内では先頭行の値が採用されます**（食い違うと警告表示）。空欄の列は下表のデフォルト値（＝従来ツールの固定値）が使われるため、後方互換です。

| 列名 | 階層 | 必須 | デフォルト / 備考 |
|---|---|:---:|---|
| `campaign_name` | キャンペーン | ✅ | 同名でグルーピング。既存同名があれば再利用 |
| `objective` | キャンペーン | | `OUTCOME_TRAFFIC` |
| `adset_name` | 広告セット | ✅ | キャンペーン内で同名をグルーピング |
| `daily_budget` | 広告セット | | `2000`（最小単位＝円） |
| `optimization_goal` | 広告セット | | `LINK_CLICKS` |
| `billing_event` | 広告セット | | `IMPRESSIONS` |
| `bid_strategy` | 広告セット | | `LOWEST_COST_WITHOUT_CAP` |
| `countries` | 広告セット | | `JP`（`;` 区切りで複数指定可 例:`JP;US`） |
| `age_min` / `age_max` | 広告セット | | `18` / `65` |
| `start_time` | 広告セット | | 空欄なら翌日0:00。指定する場合は ISO 8601（例 `2026-08-01T00:00:00+09:00`） |
| `ad_name` | 広告 | | 空欄ならファイル名（拡張子なし）を使用 |
| `image_filename` | 広告 | ※ | 通常の1ファイル広告用 |
| `feed_filename` / `story_filename` | 広告 | ※ | 配置分割用（フィード=1:1 / ストーリーズ・リール=9:16） |
| `body_text` | 広告 | | 広告文 |
| `headline` | 広告 | | 見出し |
| `description` | 広告 | | 説明 |
| `link_url` | 広告 | ✅ | リンク先URL |
| `cta_type` | 広告 | | `LEARN_MORE`（例: `SHOP_NOW`, `SIGN_UP` など） |
| `url_params` | 広告 | | URLパラメータ（例 `utm_source=meta&utm_medium=paid`） |

※ `image_filename`、または `feed_filename` / `story_filename` のいずれかが必須です。

### `objective` / `optimization_goal` / `billing_event` / `bid_strategy` に入れる値

**迷ったら空欄にしてください。** 空欄なら下記の推奨デフォルトが自動で入ります（従来ツールと同じ設定）。値を入れる場合は、大文字・小文字どちらでもOK（自動で大文字に変換されます）。誤った値はプレビューでエラー表示され、入稿前に気づけます。

| 列 | 空欄時のデフォルト | 指定できる値（代表） |
|---|---|---|
| `objective`（キャンペーンの目的） | `OUTCOME_TRAFFIC` | `OUTCOME_TRAFFIC`（トラフィック） / `OUTCOME_ENGAGEMENT`（エンゲージメント） / `OUTCOME_LEADS`（リード） / `OUTCOME_SALES`（売上） / `OUTCOME_AWARENESS`（認知度） / `OUTCOME_APP_PROMOTION`（アプリ） |
| `optimization_goal`（最適化の対象） | `LINK_CLICKS` | `LINK_CLICKS`（リンククリック） / `LANDING_PAGE_VIEWS`（LP閲覧） / `IMPRESSIONS`（インプレッション） / `REACH`（リーチ） / `OFFSITE_CONVERSIONS`（コンバージョン） / `LEAD_GENERATION`（リード獲得） / `THRUPLAY`（動画視聴） ほか |
| `billing_event`（課金基準） | `IMPRESSIONS` | `IMPRESSIONS`（表示ごと） / `LINK_CLICKS`（クリックごと） / `POST_ENGAGEMENT` / `THRUPLAY` |
| `bid_strategy`（入札戦略） | `LOWEST_COST_WITHOUT_CAP` | `LOWEST_COST_WITHOUT_CAP`（最小単価・上限なし） / `LOWEST_COST_WITH_BID_CAP`（入札上限あり） / `COST_CAP`（費用上限） / `LOWEST_COST_WITH_MIN_ROAS`（最小ROAS） |
| `cta_type`（ボタン文言） | `LEARN_MORE` | `LEARN_MORE`（詳しくはこちら） / `SHOP_NOW`（購入する） / `SIGN_UP`（登録する） / `SUBSCRIBE` / `DOWNLOAD` / `CONTACT_US` / `APPLY_NOW` / `GET_QUOTE` / `BOOK_TRAVEL` ほか |

> ⚠️ `objective` と `optimization_goal` / `billing_event` には**組み合わせの制約**があります（例: 目的が `OUTCOME_TRAFFIC` なら `LINK_CLICKS` や `LANDING_PAGE_VIEWS`）。整合しない組み合わせはMeta側でエラーになります。**基本は全部空欄（デフォルト）のままで問題ありません。**

### クリエイティブの対応付けと配置分割
- 通常は `image_filename` に画像/動画ファイル名を指定します（画像・動画どちらも可）。
- **配置分割**したい場合は、同じ行に `feed_filename`（フィード用 1:1 推奨）と `story_filename`（ストーリーズ/リール用 9:16 推奨）の両方を指定します。1つの広告内で配置ごとにクリエイティブを出し分けます。
- 指定したファイル名と一致する画像/動画を、画面下部のアップロード欄に読み込ませてください。

---

## Google スプレッドシートで入稿する手順

### 方法A（かんたん・推奨）: 通常の共有URLを貼るだけ
1. スプレッドシートの列を [テンプレート](meta_bulk_template.csv) に合わせて作成・編集
2. 右上 **共有** → 「リンクを知っている全員」を **閲覧者** に設定
3. そのシートのURL（`.../edit#gid=...` の通常URLでOK）をコピー
4. ツールのURL欄に貼り付けて「読み込み」

ツール側でCSV取得用URLに自動変換して読み込みます。入稿したいシートのタブを開いた状態のURL（`#gid=...` 付き）だと、そのタブが読み込まれます。

### 方法B（方法Aで読めない場合）: ウェブに公開
1. メニュー **ファイル → 共有 → ウェブに公開**
2. 公開範囲を該当シートにし、形式を **カンマ区切り（.csv）** に設定
3. **公開** をクリックし、表示されたURLをコピーしてURL欄に貼り付け

> 💡 いずれの方法も、シートが第三者から閲覧可能な状態である必要があります（社外秘データは扱わないでください）。CSVファイルをダウンロードして直接アップロードする方法なら、共有設定は不要です。

---

## 注意点

- **すべて PAUSED で作成**されます。確認後、広告マネージャで有効化してください。
- **予算の単位**: `daily_budget` は最小通貨単位（日本円ならそのまま「円」）です。
- **Instagram**: ログイン時に選んだIGアカウントが広告アカウントに紐付いていない場合、自動的に **Facebook限定配信** にフォールバックします。
- **レート制限対策**: API呼び出しの間隔調整と、制限エラー時の自動リトライ（指数バックオフ）が入っています。件数が多いと時間がかかります。
- **文字コード**: CSVは UTF-8 で保存してください（テンプレートは UTF-8 BOM 付きで出力されます）。

---

## テンプレート

- **CSV版**: アプリ内の「CSVテンプレをダウンロード」ボタン、またはリポジトリ同梱の [`meta_bulk_template.csv`](meta_bulk_template.csv)
- **スプレッドシート版**: [コピーを作成](https://docs.google.com/spreadsheets/d/1TkIutlbNczuvXWSNtNH0OcyM8PWmdaQVhWPEnTZuklA/copy)（自分のドライブにコピーして編集 → 共有URLをツールに貼り付け）

> ℹ️ スプレッドシート版テンプレは、閲覧・コピーできるよう共有設定（「リンクを知っている全員: 閲覧者」）が必要です。社内限定にしている場合は、対象メンバーがGoogleにログインしている必要があります。
