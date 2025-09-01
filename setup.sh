#!/bin/bash

echo "PrimCalculate Kurulum Script'i Başlatılıyor..."
echo

# Node.js kontrolü
echo "Node.js versiyonu kontrol ediliyor..."
if ! command -v node &> /dev/null; then
    echo "Node.js bulunamadı! Lütfen önce Node.js'i kurun."
    echo "https://nodejs.org/ adresinden indirebilirsiniz."
    exit 1
else
    echo "Node.js bulundu: $(node --version)"
fi

# MongoDB kontrolü
echo
echo "MongoDB servisi kontrol ediliyor..."
if ! command -v mongod &> /dev/null; then
    echo "MongoDB bulunamadı! Lütfen önce MongoDB'yi kurun."
    echo "https://www.mongodb.com/try/download/community adresinden indirebilirsiniz."
    exit 1
else
    echo "MongoDB bulundu."
fi

# MongoDB servis durumu kontrolü (Linux için)
if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet mongod; then
        echo "MongoDB servisi çalışıyor."
    else
        echo "MongoDB servisi çalışmıyor. Başlatılıyor..."
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
fi

echo
echo "Ana bağımlılıklar yükleniyor..."
npm install
if [ $? -ne 0 ]; then
    echo "Ana bağımlılıklar yüklenirken hata oluştu!"
    exit 1
fi

echo
echo "Client bağımlılıkları yükleniyor..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "Client bağımlılıkları yüklenirken hata oluştu!"
    exit 1
fi
cd ..

echo
echo "Kurulum tamamlandı!"
echo
echo "Uygulamayı başlatmak için:"
echo "1. Geliştirme modu: npm run dev"
echo "2. Production modu: npm run build && npm start"
echo
echo "Frontend geliştirme için: cd client && npm start"
echo
