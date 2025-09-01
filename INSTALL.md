# PrimCalculate Kurulum Talimatları

Bu doküman, PrimCalculate projesini yeni bir bilgisayarda MongoDB ile çalıştırmak için gerekli adımları açıklar.

## Gereksinimler

- Node.js (v16 veya üzeri)
- MongoDB (v5 veya üzeri)
- npm veya yarn

## 1. Node.js Kurulumu

### Windows için:
1. [Node.js resmi sitesinden](https://nodejs.org/) LTS sürümünü indirin
2. İndirilen .msi dosyasını çalıştırın ve kurulumu tamamlayın
3. Kurulum sonrası PowerShell'i yeniden başlatın

### macOS için:
```bash
brew install node
```

### Linux için:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. MongoDB Kurulumu

### Windows için:
1. [MongoDB Community Server](https://www.mongodb.com/try/download/community) indirin
2. .msi dosyasını çalıştırın ve kurulumu tamamlayın
3. MongoDB servisinin çalıştığından emin olun

### macOS için:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux için:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 3. Proje Kurulumu

1. Proje klasörünü yeni bilgisayara kopyalayın
2. Terminal/PowerShell'i açın ve proje klasörüne gidin
3. Ana dizinde aşağıdaki komutları çalıştırın:

```bash
# Ana bağımlılıkları yükleyin
npm install

# Client bağımlılıklarını yükleyin
cd client
npm install
cd ..
```

## 4. Veritabanı Yapılandırması

1. `config.env` dosyasını düzenleyin:
```env
MONGODB_URI=mongodb://localhost:27017/prim_calculate
JWT_SECRET=güvenli_jwt_anahtari_buraya_yazin
PORT=5000
NODE_ENV=development
```

2. MongoDB'de veritabanını oluşturun:
```bash
mongosh
use prim_calculate
```

## 5. Uygulamayı Çalıştırma

### Geliştirme Modu:
```bash
# Terminal 1: Backend sunucusu
npm run dev

# Terminal 2: Frontend geliştirme sunucusu
cd client
npm start
```

### Production Modu:
```bash
# Client'ı build edin
npm run build

# Sunucuyu başlatın
npm start
```

## 6. Erişim

- Backend API: http://localhost:5000
- Frontend: http://localhost:3000 (geliştirme) veya http://localhost:5000 (production)

## 7. İlk Kullanıcı Oluşturma

Uygulama ilk kez çalıştırıldığında, `/setup-admin` sayfasından ilk admin kullanıcısını oluşturabilirsiniz.

## Sorun Giderme

### MongoDB Bağlantı Hatası:
- MongoDB servisinin çalıştığından emin olun
- `config.env` dosyasındaki MONGODB_URI'yi kontrol edin
- Firewall ayarlarını kontrol edin

### Port Çakışması:
- 5000 portu kullanımdaysa `config.env` dosyasında PORT değerini değiştirin

### Node Modules Hatası:
- `node_modules` klasörünü silin ve `npm install` komutunu tekrar çalıştırın

## Destek

Herhangi bir sorun yaşarsanız, proje dosyalarını kontrol edin veya geliştirici ile iletişime geçin.
