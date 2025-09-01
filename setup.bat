@echo off
echo PrimCalculate Kurulum Script'i Başlatılıyor...
echo.

echo Node.js versiyonu kontrol ediliyor...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js bulunamadı! Lütfen önce Node.js'i kurun.
    echo https://nodejs.org/ adresinden indirebilirsiniz.
    pause
    exit /b 1
) else (
    echo Node.js bulundu: 
    node --version
)

echo.
echo MongoDB servisi kontrol ediliyor...
sc query MongoDB >nul 2>&1
if %errorlevel% neq 0 (
    echo MongoDB servisi bulunamadı! Lütfen önce MongoDB'yi kurun.
    echo https://www.mongodb.com/try/download/community adresinden indirebilirsiniz.
    pause
    exit /b 1
) else (
    echo MongoDB servisi bulundu.
)

echo.
echo Ana bağımlılıklar yükleniyor...
npm install
if %errorlevel% neq 0 (
    echo Ana bağımlılıklar yüklenirken hata oluştu!
    pause
    exit /b 1
)

echo.
echo Client bağımlılıkları yükleniyor...
cd client
npm install
if %errorlevel% neq 0 (
    echo Client bağımlılıkları yüklenirken hata oluştu!
    pause
    exit /b 1
)
cd ..

echo.
echo Kurulum tamamlandı!
echo.
echo Uygulamayı başlatmak için:
echo 1. Geliştirme modu: npm run dev
echo 2. Production modu: npm run build && npm start
echo.
echo Frontend geliştirme için: cd client && npm start
echo.
pause
