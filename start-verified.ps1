$port = 3000
$healthUrl = "http://localhost:3000/health"

Write-Host "Checking whether anything is using port $port..."
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Stopped the old process on port $port."
} else {
    Write-Host "No process was using port $port."
}

Set-Location "C:\Users\Al\Desktop\MY_PRACTICE"
Start-Process $healthUrl
node server.js

Write-Host "Waiting for the app to become healthy..."
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -ErrorAction Stop
        if ($response.success -and $response.status -eq "ok") {
            Write-Host "Server is healthy and running successfully on http://localhost:3000"
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
    $attempt++
}

if ($attempt -ge $maxAttempts) {
    Write-Host "The server did not become healthy in time. Check the terminal output for errors."
}
