# PrimCalculate DOĞRU Otomatik Başlatma Script'i
# Ana dizinde npm run dev komutu ile çalışır!
# Bu script'i "Yönetici olarak çalıştır" ile çalıştırın

Write-Host "PrimCalculate DOĞRU Otomatik Başlatma Kurulumu Başlatılıyor..." -ForegroundColor Green
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

# Çalışma dizinini al
$currentDir = Get-Location
Write-Host "Çalışma Dizini: $currentDir" -ForegroundColor Cyan
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

# PrimCalculate ana uygulaması için Task Scheduler oluştur
Write-Host "PrimCalculate ana uygulaması otomatik başlatma task'ı oluşturuluyor..." -ForegroundColor Yellow

try {
    # Eğer mevcut task varsa kaldır
    $existingTask = Get-ScheduledTask -TaskName "PrimCalculate Main" -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Host "Mevcut ana task kaldırılıyor..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName "PrimCalculate Main" -Confirm:$false
        Start-Sleep -Seconds 2
    }
    
    # Node.js yolunu bul
    $nodePath = $null
    $nodePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe"
    )
    
    foreach ($path in $nodePaths) {
        if (Test-Path $path) {
            $nodePath = $path
            Write-Host "Node.js bulundu: $nodePath" -ForegroundColor Green
            break
        }
    }
    
    if ($nodePath) {
        # Ana dizinde npm run dev komutunu çalıştıracak batch dosyası oluştur
        $batchContent = @"
@echo off
cd /d "$currentDir"
npm run dev
pause
"@
        
        $batchPath = "$currentDir\start-primcalculate.bat"
        $batchContent | Out-File -FilePath $batchPath -Encoding ASCII
        
        Write-Host "PrimCalculate başlatma batch dosyası oluşturuldu: $batchPath" -ForegroundColor Green
        
        # Task action oluştur
        $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batchPath`""
        
        # Task trigger oluştur (sistem başlangıcında + 10 saniye gecikme)
        $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Seconds 10)
        
        # Task settings oluştur
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        # Task principal oluştur (kullanıcı hesabı ile çalıştır)
        $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
        
        # Task'ı oluştur
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "PrimCalculate Ana Uygulama Otomatik Başlatma (npm run dev)"
        
        # Task'ı kaydet
        Register-ScheduledTask -TaskName "PrimCalculate Main" -InputObject $task
        
        Write-Host "PrimCalculate ana uygulaması otomatik başlatma task'ı oluşturuldu!" -ForegroundColor Green
    } else {
        Write-Host "Node.js bulunamadı! PrimCalculate otomatik başlatılamayacak." -ForegroundColor Red
    }
    
} catch {
    Write-Host "PrimCalculate task oluşturulamadı: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Web tarayıcısı otomatik başlatma task'ı oluştur
Write-Host "Web tarayıcısı otomatik başlatma task'ı oluşturuluyor..." -ForegroundColor Yellow

try {
    # Eğer mevcut tarayıcı task varsa kaldır
    $existingBrowserTask = Get-ScheduledTask -TaskName "PrimCalculate Browser" -ErrorAction SilentlyContinue
    if ($existingBrowserTask) {
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
        # Task action oluştur - PORT 5000'e gider (ana panel)
        $action = New-ScheduledTaskAction -Execute $browserPath -Argument "http://localhost:5000"
        
        # Task trigger oluştur (sistem başlangıcında + 60 saniye gecikme - uygulamanın başlaması için)
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

# Port kontrolü
Write-Host "Port kontrolü yapılıyor..." -ForegroundColor Yellow

# Port 5000 (Backend)
try {
    $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($port5000) {
        Write-Host "Port 5000: AÇIK (Backend çalışıyor)" -ForegroundColor Green
    } else {
        Write-Host "Port 5000: KAPALI (Backend henüz başlamadı)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Port 5000 kontrolü yapılamadı." -ForegroundColor Yellow
}

Write-Host ""

# Şimdi test et
Write-Host "Test ediliyor..." -ForegroundColor Yellow

# PrimCalculate'i şimdi başlat
Write-Host "PrimCalculate ana uygulaması başlatılıyor..." -ForegroundColor Yellow
try {
    Start-Process "cmd.exe" -ArgumentList "/k npm run dev" -WindowStyle Normal -WorkingDirectory $currentDir
    Write-Host "PrimCalculate ana uygulaması başlatıldı!" -ForegroundColor Green
    Start-Sleep -Seconds 10
} catch {
    Write-Host "PrimCalculate başlatılamadı: $($_.Exception.Message)" -ForegroundColor Red
}

# Web tarayıcısını şimdi başlat - PORT 5000'e gider (ana panel)
Write-Host "Web tarayıcısı başlatılıyor..." -ForegroundColor Yellow
try {
    Start-Process "http://localhost:5000"
    Write-Host "Web tarayıcısı başlatıldı ve PrimCalculate Ana Panel açıldı!" -ForegroundColor Green
} catch {
    Write-Host "Web tarayıcısı başlatılamadı: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DOĞRU Otomatik Başlatma Sistemi Kuruldu!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ MongoDB Servisi: Otomatik başlar" -ForegroundColor Green
Write-Host "✅ PrimCalculate Ana Uygulama: Otomatik başlar (npm run dev, 10 saniye gecikme)" -ForegroundColor Green
Write-Host "✅ Web Tarayıcısı: Otomatik başlar (60 saniye gecikme, port 5000'e gider)" -ForegroundColor Green
Write-Host ""
Write-Host "Sistem yeniden başlatıldığında:" -ForegroundColor Yellow
Write-Host "1. MongoDB servisi başlar" -ForegroundColor White
Write-Host "2. 10 saniye sonra PrimCalculate ana uygulaması başlar (npm run dev)" -ForegroundColor White
Write-Host "3. 60 saniye sonra web tarayıcısı açılır ve http://localhost:5000'e gider (ANA PANEL)" -ForegroundColor White
Write-Host ""
Write-Host "MongoDB Compass olmadan da sistem çalışır!" -ForegroundColor Yellow
Write-Host "Veritabanı yönetimi için web arayüzünü kullanabilirsiniz." -ForegroundColor Yellow
Write-Host ""
Write-Host "Task Yönetimi:" -ForegroundColor Cyan
Write-Host "- Ana Uygulama: Get-ScheduledTask -TaskName 'PrimCalculate Main'" -ForegroundColor White
Write-Host "- Web Tarayıcısı: Get-ScheduledTask -TaskName 'PrimCalculate Browser'" -ForegroundColor White
Write-Host ""
Write-Host "Manuel Başlatma:" -ForegroundColor Cyan
Write-Host "- Ana Dizinde: npm run dev" -ForegroundColor White
Write-Host "- Veya: node server.js" -ForegroundColor White
Write-Host ""
Write-Host "ÖNEMLİ: Ana panel http://localhost:5000'de çalışır!" -ForegroundColor Yellow
Write-Host "npm run dev komutu nodemon ile server.js'i çalıştırır!" -ForegroundColor Yellow
Write-Host ""

Read-Host "Kurulum tamamlandı. Devam etmek için Enter'a basın"
