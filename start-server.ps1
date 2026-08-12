$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $workspace '.server.pid'

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue).Trim()
  if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $existingPid -Force
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$nodeExe = (Get-Command node).Source
$process = Start-Process -FilePath $nodeExe -ArgumentList 'server.js' -WorkingDirectory $workspace -PassThru
$process.Id | Set-Content $pidFile

Write-Host "Server started with PID $($process.Id)"
Write-Host 'Open http://127.0.0.1:3000'
