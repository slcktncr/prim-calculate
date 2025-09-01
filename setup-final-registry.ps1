# PrimCalculate Tam Otomatik Baslat Sistemi
# Registry + Task Scheduler Kombinasyonu
# Windows baslangicinda VE uyku modundan cikista calisir

Write-Host "PrimCalculate Tam Otomatik Baslat Sistemi Kurulumu" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Yonetici yetkisi kontrolu
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Bu script yonetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "Lutfen PowerShell'i 'Yonetici olarak calistir' ile acin." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a basin"
    exit
}

Write-Host "Yonetici yetkisi onaylandi." -ForegroundColor Green

# Mevcut dizini al
$currentDir = Get-Location
Write-Host "Mevcut dizin: $currentDir" -ForegroundColor Yellow

# Onceki task'lari temizle
Write-Host "Mevcut Task Scheduler task'lari temizleniyor..." -ForegroundColor Yellow
try {
    $existingTasks = @("PrimCalculate Main", "PrimCalculate Browser", "PrimCalculate Wake Check")
    foreach ($taskName in $existingTasks) {
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Write-Host "Mevcut task kaldiriliyor: $taskName" -ForegroundColor Yellow
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "Mevcut task'lar temizlendi!" -ForegroundColor Green
} catch {
    Write-Host "Task temizleme hatasi: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 1. REGISTRY: Windows baslangicinda calisacak
Write-Host "1. REGISTRY Kurulumu (Windows Baslangici)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# PowerShell script dosyasi olustur (SADECE ana dizinde npm run dev)
$psScriptPath = Join-Path $currentDir "start-primcalculate.ps1"
Write-Host "PowerShell script dosyasi olusturuluyor: $psScriptPath" -ForegroundColor Yellow

$psScriptContent = @"
# PrimCalculate Ana Dizin Otomatik Baslat Script'i
# SADECE ana dizinde npm run dev calistirir (client'da degil!)

Write-Host "PrimCalculate baslatiliyor..." -ForegroundColor Green
Write-Host "Calisma dizini: $currentDir" -ForegroundColor Cyan

# MongoDB'yi baslat
Write-Host "MongoDB baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden

# 5 saniye bekle
Start-Sleep -Seconds 5

# Ana dizine git ve npm run dev calistir (SADECE burada!)
Write-Host "PrimCalculate ana uygulamasi baslatiliyor (npm run dev)..." -ForegroundColor Yellow
Set-Location "$currentDir"
npm run dev

# Web tarayicisini ac
Start-Sleep -Seconds 10
Write-Host "Web tarayicisi aciliyor..." -ForegroundColor Yellow
Start-Process "http://localhost:5000"
"@

# PowerShell script dosyasini olustur
$psScriptContent | Out-File -FilePath $psScriptPath -Encoding UTF8
Write-Host "PowerShell script dosyasi olusturuldu!" -ForegroundColor Green

# Registry anahtari olustur
$registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$registryName = "PrimCalculate"
$registryValue = "powershell.exe -ExecutionPolicy Bypass -File `"$psScriptPath`""

Write-Host "Registry anahtari olusturuluyor..." -ForegroundColor Yellow
Write-Host "Registry yolu: $registryPath" -ForegroundColor Cyan
Write-Host "Anahtar adi: $registryName" -ForegroundColor Cyan

try {
    New-ItemProperty -Path $registryPath -Name $registryName -Value $registryValue -PropertyType String -Force | Out-Null
    Write-Host "Registry anahtari basariyla olusturuldu!" -ForegroundColor Green
} catch {
    Write-Host "Registry anahtari olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "TAM OTOMATIK BASLAT SISTEMI KURULDU!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "REGISTRY: Windows baslangicinda calisir" -ForegroundColor Green
Write-Host "SADECE ana dizinde npm run dev calisir (client'da degil!)" -ForegroundColor Green
Write-Host ""
Write-Host "Olusturulan dosyalar:" -ForegroundColor Yellow
Write-Host "   - $psScriptPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web arayuzu: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test etmek icin:" -ForegroundColor Yellow
Write-Host "   1. Windows'u yeniden baslatin" -ForegroundColor White
Write-Host ""
Write-Host "Sistem otomatik calisacak!" -ForegroundColor Green

Read-Host "Kurulum tamamlandi. Devam etmek icin Enter'a basin"
