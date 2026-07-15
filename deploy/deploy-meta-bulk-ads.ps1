param(
  [Parameter(Mandatory=$true)][string]$FtpPass,  # XServer FTP password (daai/.claude/settings.json 参照)
  [switch]$DryRun
)

# Meta広告 一括入稿ツールを XServer (www.digitalathlete.jp) の /lp/meta-bulk-ads/ に配信する。
# google-sites-embed.html を index.html として upload/ に配置し、既存のFTPスクリプトで再帰アップロードする。
# 使い方:
#   & "G:\共有ドライブ\ai_development\Meta一括入稿\deploy\deploy-meta-bulk-ads.ps1" -FtpPass '<パスワード>' -DryRun
#   （確認後、-DryRun を外して本実行）

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$src = Join-Path $root "..\google-sites-embed.html"
if (-not (Test-Path $src)) { throw "ソースが見つかりません: $src" }

$uploadDir = Join-Path $root "upload"
New-Item -ItemType Directory -Force -Path $uploadDir | Out-Null
Copy-Item -Force -LiteralPath $src -Destination (Join-Path $uploadDir "index.html")
Write-Host "prepared: upload/index.html (from google-sites-embed.html)"

& (Join-Path $root "ftp-upload-recursive.ps1") `
  -FtpHost 'sv919.xserver.jp' `
  -FtpUser 'y-shimizu@digitalathlete.jp' `
  -FtpPass $FtpPass `
  -LocalDir 'upload' `
  -RemoteBase '/lp/meta-bulk-ads/' `
  -DryRun:$DryRun
