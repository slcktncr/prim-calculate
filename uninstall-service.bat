@echo off
echo PrimCalculate Windows Servis Kaldırma İşlemi Başlatılıyor...
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

REM Servisi durdur
echo PrimCalculate servisi durduruluyor...
net stop PrimCalculate >nul 2>&1
echo Servis durduruldu.
echo.

REM Servisi kaldır
echo PrimCalculate servisi kaldırılıyor...
nssm remove PrimCalculate confirm
if %errorLevel% neq 0 (
    echo Servis kaldırılamadı! Manuel olarak kaldırmanız gerekebilir.
    echo.
    echo Manuel kaldırma için:
    echo 1. services.msc açın
    echo 2. PrimCalculate servisini bulun
    echo 3. Sağ tık > Properties > Recovery > Disable
    echo 4. Sağ tık > Delete
    echo.
) else (
    echo Servis başarıyla kaldırıldı.
)

REM Logs klasörünü temizle
if exist "%~dp0logs" (
    echo Logs klasörü temizleniyor...
    rmdir /s /q "%~dp0logs"
    echo Logs klasörü temizlendi.
)

echo.
echo ========================================
echo PrimCalculate Servisi Kaldırıldı!
echo ========================================
echo.
echo Sistem artık otomatik olarak başlamayacak.
echo Manuel olarak çalıştırmak için: npm start
echo.
pause
