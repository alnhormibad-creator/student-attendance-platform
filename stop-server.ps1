$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $workspace '.server.pid'

if (Test-Path $pidFile) {
  $savedPid = (Get-Content $pidFile -ErrorAction SilentlyContinue).Trim()
  if ($savedPid -and (Get-Process -Id $savedPid -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $savedPid -Force
    Write-Host "Server stopped (PID $savedPid)"
  } else {
    Write-Host 'No running server found for the saved PID'
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
} else {
  Write-Host 'No server PID file found'
}
