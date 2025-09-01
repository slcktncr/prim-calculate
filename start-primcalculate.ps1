# PrimCalculate Ana Dizin Otomatik Baslat Script'i
# SADECE ana dizinde npm run dev calistirir (client'da degil!)

Write-Host "PrimCalculate baslatiliyor..." -ForegroundColor Green
Write-Host "Calisma dizini: C:\Users\Selcuk Tuncer\Desktop\PrimCalculate" -ForegroundColor Cyan

# MongoDB'yi baslat
Write-Host "MongoDB baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden

# 5 saniye bekle
Start-Sleep -Seconds 5

# Ana dizine git ve npm run dev calistir (SADECE burada!)
Write-Host "PrimCalculate ana uygulamasi baslatiliyor (npm run dev)..." -ForegroundColor Yellow
Set-Location "C:\Users\Selcuk Tuncer\Desktop\PrimCalculate"
npm run dev

# Web tarayicisini ac
Start-Sleep -Seconds 10
Write-Host "Web tarayicisi aciliyor..." -ForegroundColor Yellow
Start-Process "http://localhost:5000"
