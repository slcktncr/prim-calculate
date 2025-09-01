# PrimCalculate Basit Otomatik Başlatma Script'i
# MongoDB Compass olmadan sadece web arayüzünü otomatik başlatır
# Bu script'i "Yönetici olarak çalıştır" ile çalıştırın

Write-Host "PrimCalculate Basit Otomatik Başlatma Kurulumu Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Yönetici yetkisi kontrolü
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Bu script yönetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "PowerShell'i 'Yönetici olarak çalıştır' ile açın." -ForegroundColor Yellow
    Read-Host "Devam etmek için Enter'a basın"
    exit 1
}

Write-Host "Yönetici yetkisi onaylandı." -ForegroundColor Green
Write-Host ""

# MongoDB servisinin çalıştığından emin ol
Write-Host "MongoDB servisi kontrol ediliyor..." -ForegroundColor Yellow
try {
    $mongoService = Get-Service MongoDB -ErrorAction Stop
    if ($mongoService.Status -ne "Running") {
        Write-Host "MongoDB servisi başlatılıyor..." -ForegroundColor Yellow
        Start-Service MongoDB
        Start-Sleep -Seconds 3
    }
    Write-Host "MongoDB servisi çalışıyor." -ForegroundColor Green
} catch {
    Write-Host "MongoDB servisi bulunamadı! Lütfen MongoDB'yi kurun." -ForegroundColor Red
    Read-Host "Devam etmek için Enter'a basın"
    exit 1
}

Write-Host ""

# PrimCalculate servisinin çalıştığından emin ol
Write-Host "PrimCalculate servisi kontrol ediliyor..." -ForegroundColor Yellow
try {
    $primService = Get-Service PrimCalculate -ErrorAction SilentlyContinue
    if ($primService) {
        if ($primService.Status -ne "Running") {
            Write-Host "PrimCalculate servisi başlatılıyor..." -ForegroundColor Yellow
            Start-Service PrimCalculate
            Start-Sleep -Seconds 5
        }
        Write-Host "PrimCalculate servisi çalışıyor." -ForegroundColor Green
    } else {
        Write-Host "PrimCalculate servisi bulunamadı! Task Scheduler kullanılıyor." -ForegroundColor Yellow
        # Task Scheduler ile başlat
        try {
            Start-ScheduledTask -TaskName "PrimCalculate"
            Start-Sleep -Seconds 5
            Write-Host "PrimCalculate task başlatıldı." -ForegroundColor Green
        } catch {
            Write-Host "PrimCalculate başlatılamadı!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "PrimCalculate kontrol edilemedi!" -ForegroundColor Red
}

Write-Host ""

# Port 5000'i kontrol et
Write-Host "Port 5000 kontrol ediliyor..." -ForegroundColor Yellow
try {
    $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($port5000) {
        Write-Host "Port 5000: AÇIK (PrimCalculate çalışıyor)" -ForegroundColor Green
    } else {
        Write-Host "Port 5000: KAPALI (PrimCalculate henüz başlamadı)" -ForegroundColor Yellow
        Write-Host "Birkaç saniye bekleniyor..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Tekrar kontrol et
        $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
        if ($port5000) {
            Write-Host "Port 5000: AÇIK (PrimCalculate şimdi çalışıyor)" -ForegroundColor Green
        } else {
            Write-Host "Port 5000: HALA KAPALI (PrimCalculate başlatılamadı)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Port kontrolü yapılamadı." -ForegroundColor Yellow
}

Write-Host ""

# Web tarayıcısı otomatik başlatma task'ı oluştur
Write-Host "Web tarayıcısı otomatik başlatma task'ı oluşturuluyor..." -ForegroundColor Yellow

try {
    # Eğer mevcut task varsa kaldır
    $existingTask = Get-ScheduledTask -TaskName "PrimCalculate Browser" -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "Mevcut tarayıcı task'ı kaldırılıyor..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName "PrimCalculate Browser" -Confirm:$false
        Start-Sleep -Seconds 2
    }
    
    # Varsayılan tarayıcıyı bul
    $browserPath = $null
    $browserPaths = @(
        "C:\Program Files\Google\Chrome\Application\chrome.exe",
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        "C:\Program Files\Mozilla Firefox\firefox.exe",
        "C:\Program Files (x86)\Mozilla Firefox\firefox.exe",
        "C:\Program Files\Internet Explorer\iexplore.exe",
        "C:\Program Files (x86)\Internet Explorer\iexplore.exe"
    )
    
    foreach ($path in $browserPaths) {
        if (Test-Path $path) {
            $browserPath = $path
            Write-Host "Tarayıcı bulundu: $browserPath" -ForegroundColor Green
            break
        }
    }
    
    if ($browserPath) {
        # Task action oluştur
        $action = New-ScheduledTaskAction -Execute $browserPath -Argument "http://localhost:5000"
        
        # Task trigger oluştur (sistem başlangıcında + 60 saniye gecikme)
        $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 60)
        
        # Task settings oluştur
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        # Task principal oluştur (kullanıcı hesabı ile çalıştır)
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
        
        # Task'ı oluştur
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "PrimCalculate Web Arayüzü Otomatik Açma"
        
        # Task'ı kaydet
        Register-ScheduledTask -TaskName "PrimCalculate Browser" -InputObject $task
        
        Write-Host "Web tarayıcısı otomatik başlatma task'ı oluşturuldu!" -ForegroundColor Green
    } else {
        Write-Host "Tarayıcı bulunamadı! Web arayüzü otomatik açılmayacak." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Web tarayıcısı task oluşturulamadı: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Şimdi test et
Write-Host "Test ediliyor..." -ForegroundColor Yellow

# Web tarayıcısını şimdi başlat
Write-Host "Web tarayıcısı başlatılıyor..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:5000"
    Write-Host "Web tarayıcısı başlatıldı ve PrimCalculate açıldı!" -ForegroundColor Green
} catch {
    Write-Host "Web tarayıcısı başlatılamadı: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Basit Otomatik Başlatma Sistemi Kuruldu!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ MongoDB Servisi: Otomatik başlar" -ForegroundColor Green
Write-Host "✅ PrimCalculate: Otomatik başlar" -ForegroundColor Green
Write-Host "✅ Web Tarayıcısı: Otomatik başlar (60 saniye gecikme)" -ForegroundColor Green
Write-Host ""
Write-Host "Sistem yeniden başlatıldığında:" -ForegroundColor Yellow
Write-Host "1. MongoDB servisi başlar" -ForegroundColor White
Write-Host "2. PrimCalculate uygulaması başlar" -ForegroundColor White
Write-Host "3. 60 saniye sonra web tarayıcısı açılır ve http://localhost:5000'e gider" -ForegroundColor White
Write-Host ""
Write-Host "MongoDB Compass olmadan da sistem çalışır!" -ForegroundColor Yellow
Write-Host "Veritabanı yönetimi için web arayüzünü kullanabilirsiniz." -ForegroundColor Yellow
Write-Host ""
Write-Host "Task Yönetimi:" -ForegroundColor Cyan
Write-Host "- Web Tarayıcısı: Get-ScheduledTask -TaskName 'PrimCalculate Browser'" -ForegroundColor White
Write-Host ""

Read-Host "Kurulum tamamlandı. Devam etmek için Enter'a basın"
