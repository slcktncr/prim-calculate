# PrimCalculate Registry Tabanlı Otomatik Başlatma Sistemi
# PowerShell script'ini Windows başlangıcında otomatik çalıştırır

Write-Host "PrimCalculate Registry Tabanlı Otomatik Başlatma Kurulumu" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Yönetici yetkisi kontrolü
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Bu script yönetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "Lütfen PowerShell'i 'Yönetici olarak çalıştır' ile açın." -ForegroundColor Red
    Read-Host "Devam etmek için Enter'a basın"
    exit
}

Write-Host "Yönetici yetkisi onaylandı." -ForegroundColor Green

# Mevcut dizini al
$currentDir = Get-Location
Write-Host "Mevcut dizin: $currentDir" -ForegroundColor Yellow

# PowerShell script dosyası oluştur
$psScriptPath = Join-Path $currentDir "start-primcalculate.ps1"
Write-Host "PowerShell script dosyası oluşturuluyor: $psScriptPath" -ForegroundColor Yellow

$psScriptContent = @"
# PrimCalculate Otomatik Başlatma Script'i
Write-Host "PrimCalculate başlatılıyor..." -ForegroundColor Green

# MongoDB'yi başlat
Write-Host "MongoDB başlatılıyor..." -ForegroundColor Yellow
Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden

# 5 saniye bekle
Start-Sleep -Seconds 5

# Ana dizine git ve npm run dev çalıştır
Write-Host "PrimCalculate uygulaması başlatılıyor..." -ForegroundColor Yellow
Set-Location "$currentDir"
npm run dev

# Web tarayıcısını aç
Start-Sleep -Seconds 10
Write-Host "Web tarayıcısı açılıyor..." -ForegroundColor Yellow
Start-Process "http://localhost:5000"
"@

# PowerShell script dosyasını oluştur
$psScriptContent | Out-File -FilePath $psScriptPath -Encoding UTF8
Write-Host "PowerShell script dosyası oluşturuldu!" -ForegroundColor Green

# Registry anahtarı oluştur
$registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$registryName = "PrimCalculate"
$registryValue = "powershell.exe -ExecutionPolicy Bypass -File `"$psScriptPath`""

Write-Host "Registry anahtarı oluşturuluyor..." -ForegroundColor Yellow
Write-Host "Registry yolu: $registryPath" -ForegroundColor Cyan
Write-Host "Anahtar adı: $registryName" -ForegroundColor Cyan
Write-Host "Değer: $registryValue" -ForegroundColor Cyan

try {
    # Registry anahtarını oluştur
    New-ItemProperty -Path $registryPath -Name $registryName -Value $registryValue -PropertyType String -Force | Out-Null
    Write-Host "Registry anahtarı başarıyla oluşturuldu!" -ForegroundColor Green
} catch {
    Write-Host "Registry anahtarı oluşturulurken hata: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Devam etmek için Enter'a basın"
    exit
}

# Registry anahtarını doğrula
$createdValue = Get-ItemProperty -Path $registryPath -Name $registryName -ErrorAction SilentlyContinue
if ($createdValue) {
    Write-Host "Registry anahtarı doğrulandı!" -ForegroundColor Green
    Write-Host "Oluşturulan değer: $($createdValue.$registryName)" -ForegroundColor Cyan
} else {
    Write-Host "Registry anahtarı doğrulanamadı!" -ForegroundColor Red
}

# Batch dosyası da oluştur (alternatif olarak)
$batchPath = Join-Path $currentDir "start-primcalculate.bat"
Write-Host "Batch dosyası da oluşturuluyor: $batchPath" -ForegroundColor Yellow

$batchContent = @"
@echo off
echo PrimCalculate baslatiliyor...
cd /d "$currentDir"
npm run dev
pause
"@

$batchContent | Out-File -FilePath $batchPath -Encoding ASCII
Write-Host "Batch dosyası oluşturuldu!" -ForegroundColor Green

# Registry'ye batch dosyası da ekle (alternatif)
$registryNameBatch = "PrimCalculateBatch"
$registryValueBatch = "`"$batchPath`""

try {
    New-ItemProperty -Path $registryPath -Name $registryNameBatch -Value $registryValueBatch -PropertyType String -Force | Out-Null
    Write-Host "Batch dosyası registry anahtarı da oluşturuldu!" -ForegroundColor Green
} catch {
    Write-Host "Batch dosyası registry anahtarı oluşturulamadı: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Kurulum Tamamlandı!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Artık Windows her başladığında:" -ForegroundColor Yellow
Write-Host "1. MongoDB otomatik başlayacak" -ForegroundColor Cyan
Write-Host "2. PrimCalculate (npm run dev) otomatik başlayacak" -ForegroundColor Cyan
Write-Host "3. Web tarayıcısı otomatik açılacak" -ForegroundColor Cyan
Write-Host ""
Write-Host "Oluşturulan dosyalar:" -ForegroundColor Yellow
Write-Host "- $psScriptPath" -ForegroundColor Cyan
Write-Host "- $batchPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Registry anahtarları:" -ForegroundColor Yellow
Write-Host "- $registryName (PowerShell script)" -ForegroundColor Cyan
Write-Host "- $registryNameBatch (Batch dosyası)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test etmek için Windows'u yeniden başlatın!" -ForegroundColor Green

Read-Host "Devam etmek için Enter'a basın"
