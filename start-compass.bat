@echo off
echo MongoDB Compass Başlatılıyor...
echo.

REM MongoDB Compass'ın kurulu olup olmadığını kontrol et
where "MongoDB Compass" >nul 2>&1
if %errorLevel% neq 0 (
    echo MongoDB Compass bulunamadı!
    echo Lütfen MongoDB Compass'ı kurun: https://www.mongodb.com/try/download/compass
    pause
    exit /b 1
)

REM PrimCalculate sunucusunun çalışıp çalışmadığını kontrol et
echo PrimCalculate sunucusu kontrol ediliyor...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/check-admin-exists' -TimeoutSec 5; Write-Host 'Sunucu çalışıyor' } catch { Write-Host 'Sunucu çalışmıyor' }"

REM Sunucu çalışmıyorsa başlat
if %errorLevel% neq 0 (
    echo Sunucu çalışmıyor. Başlatılıyor...
    start /min cmd /c "npm start"
    timeout /t 10 /nobreak >nul
    echo Sunucu başlatıldı.
)

REM MongoDB Compass'ı başlat ve otomatik bağlan
echo MongoDB Compass başlatılıyor...
start "" "MongoDB Compass" "mongodb://localhost:27017/prim_calculate"

echo.
echo ========================================
echo MongoDB Compass Başlatıldı!
echo ========================================
echo.
echo Otomatik olarak prim_calculate veritabanına bağlanacak.
echo Sunucu: localhost:5000
echo MongoDB: localhost:27017
echo.
echo Compass açıldıktan sonra:
echo 1. "New Connection" tıklayın
echo 2. "mongodb://localhost:27017" yazın
echo 3. "Connect" tıklayın
echo 4. "prim_calculate" veritabanını seçin
echo.
pause
