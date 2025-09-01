@echo off
echo PrimCalculate Windows Servis Kurulumu Başlatılıyor...
echo.

REM Yönetici yetkisi kontrolü
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Bu script yönetici yetkisi gerektirir!
    echo PowerShell'i "Yönetici olarak çalıştır" ile açın.
    pause
    exit /b 1
)

echo Yönetici yetkisi onaylandı.
echo.

REM MongoDB servisini başlat ve otomatik başlatma
echo MongoDB servisi başlatılıyor...
sc start MongoDB
sc config MongoDB start= auto
if %errorLevel% neq 0 (
    echo MongoDB servisi başlatılamadı! Lütfen MongoDB'yi kurun.
    pause
    exit /b 1
)
echo MongoDB servisi başlatıldı ve otomatik başlatma ayarlandı.
echo.

REM NSSM (Non-Sucking Service Manager) kontrolü
where nssm >nul 2>&1
if %errorLevel% neq 0 (
    echo NSSM bulunamadı. İndiriliyor...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'"
    powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm' -Force"
    copy "nssm\nssm-2.24\win64\nssm.exe" "C:\Windows\System32\" >nul 2>&1
    rmdir /s /q nssm >nul 2>&1
    del nssm.zip >nul 2>&1
    echo NSSM kuruldu.
    echo.
)

REM PrimCalculate servisini kur
echo PrimCalculate servisi kuruluyor...
nssm install PrimCalculate "C:\Program Files\nodejs\node.exe" "%~dp0server.js"
if %errorLevel% neq 0 (
    echo Servis kurulumunda hata oluştu!
    pause
    exit /b 1
)

REM Servis ayarları
echo Servis ayarları yapılandırılıyor...
nssm set PrimCalculate AppDirectory "%~dp0"
nssm set PrimCalculate Description "PrimCalculate - Prim Hesaplama Sistemi"
nssm set PrimCalculate Start SERVICE_AUTO_START
nssm set PrimCalculate AppStdout "%~dp0logs\service.log"
nssm set PrimCalculate AppStderr "%~dp0logs\service-error.log"

REM Logs klasörü oluştur
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Servisi başlat
echo Servis başlatılıyor...
net start PrimCalculate
if %errorLevel% neq 0 (
    echo Servis başlatılamadı!
    pause
    exit /b 1
)

echo.
echo ========================================
echo PrimCalculate Servisi Başarıyla Kuruldu!
echo ========================================
echo.
echo Servis Durumu: ÇALIŞIYOR
echo Otomatik Başlatma: AKTİF
echo MongoDB: ÇALIŞIYOR
echo.
echo Sistem yeniden başlatıldığında otomatik olarak çalışacak.
echo.
echo Servis Yönetimi:
echo - Başlat: net start PrimCalculate
echo - Durdur: net stop PrimCalculate
echo - Durum: sc query PrimCalculate
echo - Kaldır: nssm remove PrimCalculate confirm
echo.
pause
