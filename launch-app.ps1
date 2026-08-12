$url = "http://localhost:3000"
$port = 3000

Write-Host "Checking whether port $port is in use..."
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped the process using port $port."
}

Set-Location "C:\Users\Al\Desktop\MY_PRACTICE"
Start-Process $url
node server.js

Write-Host "Launching the app..."
Start-Sleep -Seconds 2
Start-Process $url
