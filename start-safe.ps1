$port = 3000
$healthUrl = "http://localhost:3000/health"

Write-Host "Checking if port $port is in use..."
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped process using port $port."
} else {
    Write-Host "No process found using port $port."
}

Set-Location "C:\Users\Al\Desktop\MY_PRACTICE"
Start-Process $healthUrl
node server.js
