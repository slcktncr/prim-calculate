const mongoose = require('mongoose');

const commissionPeriodSchema = new mongoose.Schema({
  // Dönem bilgileri
  year: {
    type: Number,
    required: [true, 'Yıl zorunludur'],
    min: 2020,
    max: 2050
  },
  month: {
    type: Number,
    required: [true, 'Ay zorunludur'],
    min: 1,
    max: 12
  },
  
  // Dönem adı (örn: "Ağustos 2024")
  periodName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dönem durumu
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'paid'],
    default: 'draft',
    required: true
  },
  
  // Tarih aralıkları
  salesStartDate: {
    type: Date,
    required: [true, 'Satış başlangıç tarihi zorunludur']
  },
  salesEndDate: {
    type: Date,
    required: [true, 'Satış bitiş tarihi zorunludur']
  },
  
  // Hakediş tarihleri
  commissionDueDate: {
    type: Date,
    required: [true, 'Hakediş vadesi zorunludur']
  },
  commissionPaidDate: {
    type: Date
  },
  
  // İstatistikler (hesaplanacak)
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  totalUnpaidCommission: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  
  // Transfer edilmiş satışlar (önceki dönemlerden)
  transferredSales: [{
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true
    },
    fromPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionPeriod'
    },
    transferDate: {
      type: Date,
      default: Date.now
    },
    transferReason: {
      type: String,
      trim: true
    }
  }],
  
  // Notlar ve açıklamalar
  description: {
    type: String,
    trim: true
  },
  
  // Dönem işlemleri
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: {
    type: Date
  },
  
  // Otomatik hesaplama
  isAutoCalculated: {
    type: Boolean,
    default: true
  },
  lastCalculatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index'ler
commissionPeriodSchema.index({ year: 1, month: 1 }, { unique: true });
commissionPeriodSchema.index({ status: 1 });
commissionPeriodSchema.index({ salesStartDate: 1, salesEndDate: 1 });

// Virtual: Dönem aktif mi?
commissionPeriodSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual: Dönem kapalı mı?
commissionPeriodSchema.virtual('isClosed').get(function() {
  return ['closed', 'paid'].includes(this.status);
});

// Virtual: Dönem adı formatı
commissionPeriodSchema.virtual('displayName').get(function() {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return `${months[this.month - 1]} ${this.year}`;
});

// Static method: Aktif dönem
commissionPeriodSchema.statics.getActivePeriod = function() {
  return this.findOne({ status: 'active' });
};

// Static method: Gelecek dönem oluştur
commissionPeriodSchema.statics.createNextPeriod = async function(createdBy) {
  const currentDate = new Date();
  const nextMonth = currentDate.getMonth() + 1;
  const year = nextMonth > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
  const month = nextMonth > 11 ? 1 : nextMonth + 1;
  
  // Bu dönem zaten var mı kontrol et
  const existingPeriod = await this.findOne({ year, month });
  if (existingPeriod) {
    throw new Error('Bu dönem zaten mevcut');
  }
  
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  // Dönem tarihleri
  const salesStartDate = new Date(year, month - 1, 1);
  const salesEndDate = new Date(year, month, 0, 23, 59, 59);
  const commissionDueDate = new Date(year, month, 15); // Ayın 15'i
  
  const period = new this({
    year,
    month,
    periodName: `${months[month - 1]} ${year}`,
    salesStartDate,
    salesEndDate,
    commissionDueDate,
    createdBy,
    description: `${months[month - 1]} ${year} hakediş dönemi`
  });
  
  return await period.save();
};

// Instance method: İstatistikleri hesapla
commissionPeriodSchema.methods.calculateStats = async function() {
  const Sale = mongoose.model('Sale');
  
  // Bu dönemin satışları
  const sales = await Sale.find({
    saleDate: {
      $gte: this.salesStartDate,
      $lte: this.salesEndDate
    },
    isActive: true,
    isCancelled: false
  });
  
  // Transfer edilmiş satışlar
  const transferredSalesIds = this.transferredSales.map(ts => ts.sale);
  const transferredSalesData = await Sale.find({
    _id: { $in: transferredSalesIds },
    isActive: true,
    isCancelled: false
  });
  
  // Tüm satışları birleştir
  const allSales = [...sales, ...transferredSalesData];
  
  this.totalSales = allSales.reduce((sum, sale) => sum + sale.activitySalePrice, 0);
  this.totalCommission = allSales.reduce((sum, sale) => sum + sale.commission, 0);
  this.totalUnpaidCommission = allSales
    .filter(sale => !sale.isCommissionPaid)
    .reduce((sum, sale) => sum + sale.commission, 0);
  this.salesCount = allSales.length;
  this.lastCalculatedAt = new Date();
  
  return await this.save();
};

// Instance method: Dönemi kapat
commissionPeriodSchema.methods.closePeriod = async function(closedBy) {
  if (this.status === 'closed' || this.status === 'paid') {
    throw new Error('Dönem zaten kapalı');
  }
  
  await this.calculateStats();
  
  this.status = 'closed';
  this.closedBy = closedBy;
  this.closedAt = new Date();
  
  return await this.save();
};

module.exports = mongoose.model('CommissionPeriod', commissionPeriodSchema);
