const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const commissionRoutes = require('./routes/commission');
const commissionReportRoutes = require('./routes/commission-reports');
const paymentTypeRoutes = require('./routes/payment-types');
const commissionPeriodRoutes = require('./routes/commission-periods');

const app = express();
const PORT = process.env.PORT || 5000;

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına maksimum istek
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'client/build')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/commission-reports', commissionReportRoutes);
app.use('/api/payment-types', paymentTypeRoutes);
app.use('/api/commission-periods', commissionPeriodRoutes);

// React app için catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB bağlantısı başarılı');
  
  // Otomatik veri temizliği
  try {
    console.log('🔧 Otomatik veri temizliği başlıyor...');
    
    const Sale = require('./models/Sale');
    
    // Phantom iptal kayıtlarını bul ve düzelt
    const phantomCancelled = await Sale.find({
      isCancelled: true,
      $or: [
        { cancelledAt: { $exists: false } },
        { cancelledAt: null },
        { cancelledBy: { $exists: false } },
        { cancelledBy: null }
      ]
    });

    console.log(`📊 ${phantomCancelled.length} phantom iptal kaydı bulundu`);

    let fixedCount = 0;
    for (const sale of phantomCancelled) {
      // Eğer iptal bilgileri eksikse, satışı aktif hale getir
      if (!sale.cancelledAt || !sale.cancelledBy) {
        sale.isCancelled = false;
        sale.cancelledAt = undefined;
        sale.cancelledBy = undefined;
        await sale.save();
        fixedCount++;
        console.log(`✅ Düzeltildi: ${sale.customerName} ${sale.customerSurname}`);
      }
    }

    // Ek kontrol: isCancelled false ama cancelledAt/cancelledBy dolu olanları temizle
    const inconsistentSales = await Sale.find({
      isCancelled: false,
      $or: [
        { cancelledAt: { $exists: true, $ne: null } },
        { cancelledBy: { $exists: true, $ne: null } }
      ]
    });

    console.log(`📊 ${inconsistentSales.length} tutarsız aktif satış bulundu`);

    for (const sale of inconsistentSales) {
      sale.cancelledAt = undefined;
      sale.cancelledBy = undefined;
      await sale.save();
      fixedCount++;
      console.log(`✅ Aktif satış temizlendi: ${sale.customerName} ${sale.customerSurname}`);
    }

    // İstatistikleri logla
    const totalSales = await Sale.countDocuments({});
    const activeSales = await Sale.countDocuments({ isCancelled: { $ne: true } });
    const cancelledSales = await Sale.countDocuments({ isCancelled: true });
    
    console.log(`📈 Veri Durumu: Toplam:${totalSales} Aktif:${activeSales} İptal:${cancelledSales} Düzeltilen:${fixedCount}`);
    console.log('✅ Otomatik veri temizliği tamamlandı!');
    
  } catch (error) {
    console.error('❌ Otomatik veri temizliği hatası:', error.message);
  }
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
