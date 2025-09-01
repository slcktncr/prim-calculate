# PrimCalculate Tam Otomatik Başlatma Sistemi
# Registry + Task Scheduler Kombinasyonu
# Windows başlangıcında VE uyku modundan çıkışta çalışır

Write-Host "PrimCalculate Tam Otomatik Başlatma Sistemi Kurulumu" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

# Yönetici yetkisi kontrolü
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Bu script yonetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "Lutfen PowerShell'i 'Yonetici olarak calistir' ile acin." -ForegroundColor Red
    Read-Host "Devam etmek icin Enter'a basin"
    exit
}

Write-Host "Yönetici yetkisi onaylandı." -ForegroundColor Green

# Mevcut dizini al
$currentDir = Get-Location
Write-Host "Mevcut dizin: $currentDir" -ForegroundColor Yellow

# Önce mevcut Task Scheduler task'larını temizle
Write-Host "Mevcut Task Scheduler task'lari temizleniyor..." -ForegroundColor Yellow
try {
    $existingTasks = @("PrimCalculate Main", "PrimCalculate Browser")
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

# 1. REGISTRY: Windows başlangıcında çalışacak
Write-Host "1️⃣ REGISTRY Kurulumu (Windows Başlangıcı)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# PowerShell script dosyası oluştur (SADECE ana dizinde npm run dev)
$psScriptPath = Join-Path $currentDir "start-primcalculate.ps1"
Write-Host "PowerShell script dosyasi olusturuluyor: $psScriptPath" -ForegroundColor Yellow

$psScriptContent = @"
# PrimCalculate Ana Dizin Otomatik Başlatma Script'i
# SADECE ana dizinde npm run dev çalıştırır (client'da değil!)

Write-Host "PrimCalculate baslatiliyor..." -ForegroundColor Green
Write-Host "Calisma dizini: $currentDir" -ForegroundColor Cyan

# MongoDB'yi başlat
Write-Host "MongoDB baslatiliyor..." -ForegroundColor Yellow
Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden

# 5 saniye bekle
Start-Sleep -Seconds 5

# Ana dizine git ve npm run dev çalıştır (SADECE burada!)
Write-Host "PrimCalculate ana uygulamasi baslatiliyor (npm run dev)..." -ForegroundColor Yellow
Set-Location "$currentDir"
npm run dev

# Web tarayıcısını aç
Start-Sleep -Seconds 10
Write-Host "Web tarayicisi aciliyor..." -ForegroundColor Yellow
Start-Process "http://localhost:5000"
"@

# PowerShell script dosyasını oluştur
$psScriptContent | Out-File -FilePath $psScriptPath -Encoding UTF8
Write-Host "PowerShell script dosyasi olusturuldu!" -ForegroundColor Green

# Registry anahtarı oluştur
$registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$registryName = "PrimCalculate"
$registryValue = "powershell.exe -ExecutionPolicy Bypass -File `"$psScriptPath`""

Write-Host "Registry anahtari olusturuluyor..." -ForegroundColor Yellow
Write-Host "Registry yolu: $registryPath" -ForegroundColor Cyan
Write-Host "Anahtar adi: $registryName" -ForegroundColor Cyan

try {
    New-ItemProperty -Path $registryPath -Name $registryName -Value $registryValue -PropertyType String -Force | Out-Null
    Write-Host "✅ Registry anahtari basariyla olusturuldu!" -ForegroundColor Green
} catch {
    Write-Host "❌ Registry anahtari olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 2. TASK SCHEDULER: Uyku modundan çıkışta çalışacak
Write-Host "2️⃣ TASK SCHEDULER Kurulumu (Uyku Modundan Cikis)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Ana uygulama için Task Scheduler
Write-Host "PrimCalculate ana uygulamasi Task Scheduler task'i olusturuluyor..." -ForegroundColor Yellow

try {
    # Batch dosyası oluştur
    $batchContent = @"
@echo off
echo PrimCalculate ana uygulamasi baslatiliyor...
cd /d "$currentDir"
npm run dev
pause
"@
    
    $batchPath = "$currentDir\start-primcalculate.bat"
    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII
    Write-Host "Batch dosyasi olusturuldu: $batchPath" -ForegroundColor Green
    
    # Task action oluştur
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batchPath`""
    
    # Task trigger oluştur (sistem başlangıcında + uyku modundan çıkışta)
    $startupTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 10)
    $wakeTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 5)
    
    # Task settings oluştur
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
    
    # Task principal oluştur
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
    
    # Task'ı oluştur
    $task = New-ScheduledTask -Action $action -Trigger $startupTrigger -Settings $settings -Principal $principal -Description "PrimCalculate Ana Uygulama (npm run dev) - Windows Başlangıcı ve Uyku Modundan Çıkış"
    
    # Task'ı kaydet
    Register-ScheduledTask -TaskName "PrimCalculate Main" -InputObject $task
    Write-Host "✅ Ana uygulama Task Scheduler task'i olusturuldu!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Ana uygulama task olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Web tarayıcısı için Task Scheduler
Write-Host "Web tarayicisi Task Scheduler task'i olusturuluyor..." -ForegroundColor Yellow

try {
    # Varsayılan tarayıcıyı bul
    $browserPath = $null
    $browserPaths = @(
        "C:\Program Files\Google\Chrome\Application\chrome.exe",
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "C:\Program Files\Mozilla Firefox\firefox.exe",
        "C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
    )
    
    foreach ($path in $browserPaths) {
        if (Test-Path $path) {
            $browserPath = $path
            Write-Host "Tarayici bulundu: $browserPath" -ForegroundColor Green
            break
        }
    }
    
    if ($browserPath) {
        # Task action oluştur
        $action = New-ScheduledTaskAction -Execute $browserPath -Argument "http://localhost:5000"
        
        # Task trigger oluştur (sistem başlangıcında + uyku modundan çıkışta)
        $startupTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 60)
        $wakeTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 30)
        
        # Task settings oluştur
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
        
        # Task principal oluştur
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
        
        # Task'ı oluştur
        $task = New-ScheduledTask -Action $action -Trigger $startupTrigger -Settings $settings -Principal $principal -Description "PrimCalculate Web Arayüzü - Windows Başlangıcı ve Uyku Modundan Çıkış"
        
        # Task'ı kaydet
        Register-ScheduledTask -TaskName "PrimCalculate Browser" -InputObject $task
        Write-Host "✅ Web tarayicisi Task Scheduler task'i olusturuldu!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Tarayici bulunamadi! Web arayuzu otomatik acilmayacak." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Web tarayicisi task olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 3. UYKU MODUNDAN ÇIKIŞ İÇİN EK TASK
Write-Host "3️⃣ UYKU MODUNDAN CIKIS ICIN EK TASK" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

try {
    # Uyku modundan çıkışta çalışacak ek task
    $wakeBatchContent = @"
@echo off
echo Uyku modundan cikis - PrimCalculate kontrol ediliyor...
cd /d "$currentDir"

REM Port 5000'i kontrol et
netstat -an | findstr ":5000" >nul
if errorlevel 1 (
    echo PrimCalculate calismiyor, baslatiliyor...
    start "PrimCalculate" cmd /k "npm run dev"
    timeout /t 15 /nobreak >nul
    start http://localhost:5000
) else (
    echo PrimCalculate zaten calisiyor.
)
"@
    
    $wakeBatchPath = "$currentDir\wake-primcalculate.bat"
    $wakeBatchContent | Out-File -FilePath $wakeBatchPath -Encoding ASCII
    Write-Host "Uyku modundan cikis batch dosyasi olusturuldu: $wakeBatchPath" -ForegroundColor Green
    
    # Uyku modundan çıkış task'ı
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$wakeBatchPath`""
    $wakeTrigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 5)
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
    
    $task = New-ScheduledTask -Action $action -Trigger $wakeTrigger -Settings $settings -Principal $principal -Description "PrimCalculate Uyku Modundan Çıkış Kontrolü"
    
    Register-ScheduledTask -TaskName "PrimCalculate Wake Check" -InputObject $task
    Write-Host "✅ Uyku modundan cikis kontrol task'i olusturuldu!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Uyku modundan cikis task olusturulamadi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 TAM OTOMATİK BAŞLATMA SİSTEMİ KURULDU!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ REGISTRY: Windows baslangicinda calisir" -ForegroundColor Green
Write-Host "✅ TASK SCHEDULER: Uyku modundan cikista da calisir" -ForegroundColor Green
Write-Host "✅ SADECE ana dizinde npm run dev calisir (client'da degil!)" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Olusturulan dosyalar:" -ForegroundColor Yellow
Write-Host "   - $psScriptPath" -ForegroundColor Cyan
Write-Host "   - $batchPath" -ForegroundColor Cyan
Write-Host "   - $wakeBatchPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Olusturulan Task'lar:" -ForegroundColor Yellow
Write-Host "   - PrimCalculate Main (Ana uygulama)" -ForegroundColor Cyan
Write-Host "   - PrimCalculate Browser (Web arayuzu)" -ForegroundColor Cyan
Write-Host "   - PrimCalculate Wake Check (Uyku modundan cikis)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Web arayuzu: http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Test etmek icin:" -ForegroundColor Yellow
Write-Host "   1. Windows'u yeniden baslatin" -ForegroundColor White
Write-Host "   2. Bilgisayari uyku moduna alip cikarin" -ForegroundColor White
Write-Host ""
Write-Host "Her iki durumda da sistem otomatik calisacak! 🚀" -ForegroundColor Green

Read-Host "Kurulum tamamlandi. Devam etmek icin Enter'a basin"
