# Prim Hesaplama Sistemi

Modern ve gelişmiş bir prim hesaplama web uygulaması. Bu sistem, satış verilerini takip eder ve otomatik olarak prim hesaplamalarını yapar.

## 🚀 Özellikler

- **Kullanıcı Yönetimi**: Güvenli kayıt ve giriş sistemi
- **Satış Takibi**: Detaylı satış bilgileri girişi ve yönetimi
- **Otomatik Prim Hesaplama**: Aktivite satış fiyatının %1'i üzerinden
- **Raporlama**: Excel ve PDF formatında detaylı raporlar
- **Filtreleme**: Tarih, hafta, ay bazında satış listeleme
- **Dashboard**: Görsel istatistikler ve grafikler
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Güvenlik**: JWT token tabanlı kimlik doğrulama

## 🛠️ Teknolojiler

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL veritabanı
- **Mongoose** - MongoDB ODM
- **JWT** - Kimlik doğrulama
- **bcryptjs** - Şifre hash'leme

### Frontend
- **React** - UI kütüphanesi
- **Tailwind CSS** - CSS framework
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP client
- **Recharts** - Grafik kütüphanesi
- **React Hook Form** - Form yönetimi

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- MongoDB (v4.4 veya üzeri)
- npm veya yarn

## 🚀 Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd PrimCalculate
```

### 2. Backend bağımlılıklarını yükleyin
```bash
npm install
```

### 3. Frontend bağımlılıklarını yükleyin
```bash
cd client
npm install
cd ..
```

### 4. Çevre değişkenlerini ayarlayın
`.env` dosyasını oluşturun:
```env
MONGODB_URI=mongodb://localhost:27017/prim_calculate
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

### 5. MongoDB'yi başlatın
MongoDB servisinizin çalıştığından emin olun.

### 6. Uygulamayı başlatın

**Development modunda:**
```bash
# Backend (Terminal 1)
npm run dev

# Frontend (Terminal 2)
cd client
npm start
```

**Production modunda:**
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
npm start
```

## 🔐 İlk Kurulum

Sistem ilk kez çalıştırıldığında admin hesabı oluşturmanız gerekir:

1. `/setup-admin` sayfasına gidin
2. Admin bilgilerini girin
3. Admin hesabı oluşturun

## 📊 Veri Yapısı

### Satış Bilgileri
- Müşteri adı ve soyadı
- Blok numarası
- Daire numarası
- Dönem numarası
- Liste fiyatı
- Aktivite satış fiyatı
- Satış tarihi
- Sözleşme numarası
- Otomatik prim hesaplama (%1)

### Kullanıcı Rolleri
- **Admin**: Tüm verilere erişim, kullanıcı yönetimi
- **User**: Sadece kendi verilerine erişim

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Şifre hash'leme (bcrypt)
- Rate limiting
- CORS koruması
- Helmet güvenlik middleware'i

## 📱 Kullanım

### Satış Ekleme
1. Satışlar sayfasına gidin
2. "Yeni Satış Ekle" butonuna tıklayın
3. Gerekli bilgileri doldurun
4. Prim otomatik olarak hesaplanacaktır

### Rapor Oluşturma
1. Raporlar sayfasına gidin
2. Tarih aralığı seçin
3. Excel veya PDF formatında indirin

### Filtreleme
- Tüm satışları görüntüle
- Haftalık satışları görüntüle
- Aylık satışları görüntüle
- Tarih aralığı belirle

## 🎨 Tasarım Özellikleri

- Modern ve temiz arayüz
- Responsive tasarım
- Dark/Light tema desteği
- Animasyonlar ve geçişler
- İkonlar ve görsel öğeler

## 📈 Performans

- Lazy loading
- Optimized queries
- Caching strategies
- Efficient pagination

## 🐛 Hata Ayıklama

Geliştirme modunda detaylı hata mesajları görüntülenir. Production modunda genel hata mesajları gösterilir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje hakkında sorularınız için issue açabilir veya iletişime geçebilirsiniz.

## 🔄 Güncellemeler

### v1.0.0
- İlk sürüm
- Temel satış ve prim hesaplama
- Kullanıcı yönetimi
- Raporlama sistemi
- Dashboard ve istatistikler

---

**Not**: Bu sistem production ortamında kullanılmadan önce güvenlik testlerinden geçirilmeli ve gerekli güvenlik önlemleri alınmalıdır.
