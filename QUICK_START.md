# PrimCalculate Hızlı Başlangıç

## 🚀 En Hızlı Yöntem (Docker ile)

### 1. Docker Kurulumu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) indirin ve kurun
- Docker'ı başlatın

### 2. Projeyi Çalıştırın
```bash
# Proje klasöründe
docker-compose up -d
```

### 3. Erişim
- Uygulama: http://localhost:5000
- MongoDB: localhost:27017

---

## ⚡ Manuel Kurulum

### 1. Gereksinimler
- Node.js 16+
- MongoDB 5+

### 2. Kurulum
```bash
# Windows
setup.bat

# Linux/macOS
chmod +x setup.sh
./setup.sh
```

### 3. Çalıştırma
```bash
# Geliştirme
npm run dev

# Production
npm run build
npm start
```

---

## 📱 İlk Kullanım

1. http://localhost:5000 adresine gidin
2. `/setup-admin` sayfasından admin hesabı oluşturun
3. Giriş yapın ve sistemi kullanmaya başlayın

---

## 🔧 Sorun Giderme

- **Port hatası**: `config.env` dosyasında PORT değerini değiştirin
- **MongoDB hatası**: MongoDB servisinin çalıştığından emin olun
- **Node modules hatası**: `node_modules` klasörünü silip `npm install` çalıştırın

---

## 📞 Destek

Detaylı kurulum için `INSTALL.md` dosyasını inceleyin.
