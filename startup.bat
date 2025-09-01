@echo off
REM PrimCalculate Otomatik Başlatma Script'i
REM Bu dosya Windows başlangıcında otomatik çalışır

REM Log dosyası oluştur
echo %date% %time% - PrimCalculate başlatılıyor... >> "%~dp0logs\startup.log"

REM MongoDB servisini başlat
sc start MongoDB >nul 2>&1
if %errorLevel% equ 0 (
    echo %date% %time% - MongoDB servisi başlatıldı >> "%~dp0logs\startup.log"
) else (
    echo %date% %time% - MongoDB servisi başlatılamadı >> "%~dp0logs\startup.log"
)

REM PrimCalculate servisini başlat
net start PrimCalculate >nul 2>&1
if %errorLevel% equ 0 (
    echo %date% %time% - PrimCalculate servisi başlatıldı >> "%~dp0logs\startup.log"
) else (
    echo %date% %time% - PrimCalculate servisi başlatılamadı >> "%~dp0logs\startup.log"
)

REM Sunucunun hazır olmasını bekle
timeout /t 15 /nobreak >nul

REM MongoDB Compass'ı başlat
start "" "MongoDB Compass" "mongodb://localhost:27017/prim_calculate"
echo %date% %time% - MongoDB Compass başlatıldı >> "%~dp0logs\startup.log"

REM Tarayıcıda uygulamayı aç
start http://localhost:5000
echo %date% %time% - Tarayıcı açıldı >> "%~dp0logs\startup.log"

echo %date% %time% - Başlatma tamamlandı >> "%~dp0logs\startup.log"
