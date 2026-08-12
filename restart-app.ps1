$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped process using port $port."
} else {
    Write-Host "No process found using port $port."
}

Set-Location "C:\Users\Al\Desktop\MY_PRACTICE"
Start-Process "http://localhost:3000"
node server.js
