# デプロイ手順 — www.digitalathlete.jp/lp/meta-bulk-ads/

このツールは**バックエンド不要の静的HTML1枚**（`google-sites-embed.html`）です。
Meta広告APIはブラウザから直接叩くため、サーバーは不要で、**XServer にFTPでファイルを置くだけ**で公開できます。
（EMSの strategy-analyzer と同じ XServer / `/lp/...` 配信の仕組み。参照: `EMS/webapp/DEPLOY.md`）

- **公開URL**: https://www.digitalathlete.jp/lp/meta-bulk-ads/
- **配信**: XServer FTP `sv919.xserver.jp` / user `y-shimizu@digitalathlete.jp`
  （パスワードは `G:\共有ドライブ\ai_development\daai\.claude\settings.json` を参照）
- **配信先**: `/lp/meta-bulk-ads/`（`index.html` を配置）

## ⚠️ 事前に必須: Meta アプリにドメインを追加

このツールは Facebook JS SDK（App ID `1699295671486963`）を使うため、**配信ドメインを Meta アプリに登録しないと FBログインが動きません**（現在 github.io で動いているのと同じ設定を digitalathlete.jp にも追加する）。

Meta for Developers → 対象アプリ →
1. **設定 > ベーシック** → 「アプリドメイン」に `digitalathlete.jp` を追加（未登録なら「プラットフォームを追加 > ウェブサイト」でサイトURL `https://www.digitalathlete.jp` も設定）
2. **Facebookログイン > 設定** →
   - 「有効なOAuthリダイレクトURI」に `https://www.digitalathlete.jp/` を追加
   - 「JavaScript SDKを許可するドメイン」に `https://www.digitalathlete.jp` を追加
3. 保存。数分で反映。

> 現在ログインできているユーザー（アプリの管理者/テスター等）は、ドメイン追加後そのまま新URLでもログインできます。

## デプロイ（1コマンド）

PowerShell で実行。まず `-DryRun` で対象を確認してから本実行します。

```powershell
# 1) ドライラン（アップロード内容の確認のみ。実際には送信しない）
& "G:\共有ドライブ\ai_development\Meta一括入稿\deploy\deploy-meta-bulk-ads.ps1" -FtpPass '<XServerのFTPパスワード>' -DryRun

# 2) 本実行（-DryRun を外す）
& "G:\共有ドライブ\ai_development\Meta一括入稿\deploy\deploy-meta-bulk-ads.ps1" -FtpPass '<XServerのFTPパスワード>'
```

このスクリプトは最新の `google-sites-embed.html` を `deploy/upload/index.html` としてコピーし、
`/lp/meta-bulk-ads/` に再帰FTPアップロードします。**更新のたびに同じコマンドを再実行**すればOKです。

## 確認

```powershell
# HTTP 200 とタイトル(バージョン)を確認
(Invoke-WebRequest "https://www.digitalathlete.jp/lp/meta-bulk-ads/" -UseBasicParsing).StatusCode
```

ブラウザで https://www.digitalathlete.jp/lp/meta-bulk-ads/ を開き、
Facebookログイン → アカウント選択 → CSV/スプレッドシート読込までを確認してください。
（FBログインが「無効なドメイン」等で失敗する場合は、上記のMetaアプリのドメイン追加が未反映です）

## GitHub Pages 版との関係

- 開発・確認用の常設URL: https://y-shimizu-da.github.io/meta-bulk-ads/google-sites-embed.html （main へ push すると自動反映）
- 本番配布用: 上記 XServer の digitalathlete.jp

ソースは同じ `google-sites-embed.html`。GitHub 側を更新（push）→ その後この XServer デプロイを実行、の順で両方を最新に保てます。
