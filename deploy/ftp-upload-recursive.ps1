param(
  [Parameter(Mandatory=$true)][string]$FtpHost,
  [Parameter(Mandatory=$true)][string]$FtpUser,
  [Parameter(Mandatory=$true)][string]$FtpPass,
  [string]$LocalDir = "upload_xserver",
  [string]$RemoteBase = "/lp/daai/",
  [switch]$DryRun
)

# Recursive plain-FTP upload of upload_xserver/ (with subdirectories) to XServer.
# Credentials are passed as parameters (FtpHost/FtpUser/FtpPass).
# RemoteBase defaults to /lp/daai/ (the daai dashboard site).

$ErrorActionPreference = "Stop"

$ftpHost = $FtpHost
$ftpUser = $FtpUser
$ftpPass = $FtpPass

$remote = $RemoteBase
if (-not $remote.StartsWith('/')) { $remote = "/$remote" }
if (-not $remote.EndsWith('/'))   { $remote = "$remote/" }

$localPath = Join-Path $PSScriptRoot $LocalDir
if (-not (Test-Path $localPath)) { throw "Local directory not found: $localPath" }
$localRoot = (Resolve-Path $localPath).Path

$allFiles = Get-ChildItem -LiteralPath $localRoot -Recurse -File
$allDirs  = Get-ChildItem -LiteralPath $localRoot -Recurse -Directory
Write-Host "FTP target : ftp://${ftpHost}${remote}"
Write-Host "User       : $ftpUser"
Write-Host "Source dir : $localRoot"
Write-Host "Dirs       : $($allDirs.Count)   Files: $($allFiles.Count)"
Write-Host ""

function To-RemoteRel($fullPath) {
  $rel = $fullPath.Substring($localRoot.Length).TrimStart('\','/')
  return ($rel -replace '\\','/')
}

if ($DryRun) {
  Write-Host "-- directories to ensure --"
  $allDirs | ForEach-Object { Write-Host "  DIR  $remote$(To-RemoteRel $_.FullName)/" }
  Write-Host "-- files to upload (first 30) --"
  $allFiles | Select-Object -First 30 | ForEach-Object { Write-Host "  PUT  $remote$(To-RemoteRel $_.FullName)" }
  Write-Host "`nDry-run complete (no upload performed)."
  return
}

$credential = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

function Ensure-Dir($remoteUri) {
  try {
    $req = [System.Net.FtpWebRequest]::Create($remoteUri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $req.Credentials = $credential
    $req.UsePassive = $true
    $req.KeepAlive = $false
    $req.Timeout = 60000
    $resp = $req.GetResponse(); $resp.Close()
  } catch {
    # 550 = already exists -> ignore; rethrow anything else
    if ($_.Exception.Message -notmatch '550') {
      Write-Host ("  [MKDIR WARN] {0}: {1}" -f $remoteUri, $_.Exception.Message) -ForegroundColor Yellow
    }
  }
}

# 1) Ensure base + all subdirectories (shallow -> deep)
Ensure-Dir ("ftp://${ftpHost}${remote}")
$sortedDirs = $allDirs | Sort-Object { ($_.FullName -split '[\\/]').Count }
foreach ($d in $sortedDirs) {
  $rel = To-RemoteRel $d.FullName
  Ensure-Dir ("ftp://${ftpHost}${remote}$rel/")
}

# 2) Upload files
$success = 0; $failed = @()
foreach ($f in $allFiles) {
  $rel = To-RemoteRel $f.FullName
  $remoteUri = "ftp://${ftpHost}${remote}$rel"
  try {
    $req = [System.Net.FtpWebRequest]::Create($remoteUri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $req.Credentials = $credential
    $req.UseBinary = $true
    $req.UsePassive = $true
    $req.KeepAlive = $false
    $req.Timeout = 120000
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    try { $stream.Write($bytes, 0, $bytes.Length) } finally { $stream.Close() }
    $resp = $req.GetResponse(); $resp.Close()
    $success++
  } catch {
    Write-Host ("  [FAIL] {0}: {1}" -f $rel, $_.Exception.Message) -ForegroundColor Red
    $failed += $rel
  }
}

Write-Host ""
Write-Host "Uploaded $success / $($allFiles.Count) files."
if ($failed.Count -gt 0) {
  Write-Host "Failed ($($failed.Count)): $($failed -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host "DONE. Verify at: https://www.digitalathlete.jp${remote}"
