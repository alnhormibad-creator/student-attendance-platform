$url = "http://localhost:3000"
$port = 3000

Write-Host "Stopping any process using port $port..."
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped process $process."
}

Set-Location "C:\Users\Al\Desktop\MY_PRACTICE"
Write-Host "Opening the website..."
Start-Process $url
node server.js

Write-Host "Waiting for the app to respond..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "$url/health" -Method Get -ErrorAction Stop
        if ($response.success -and $response.status -eq "ok") {
            Write-Host "Website is running successfully at $url"
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}
