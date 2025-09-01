const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Müşteri adı zorunludur'],
    trim: true
  },
  customerSurname: {
    type: String,
    required: [true, 'Müşteri soyadı zorunludur'],
    trim: true
  },
  blockNumber: {
    type: String,
    required: [true, 'Blok numarası zorunludur'],
    trim: true
  },
  apartmentNumber: {
    type: String,
    required: [true, 'Daire numarası zorunludur'],
    trim: true
  },
  periodNumber: {
    type: String,
    required: [true, 'Dönem numarası zorunludur'],
    trim: true
  },
  listPrice: {
    type: Number,
    required: [true, 'Liste fiyatı zorunludur'],
    min: [0, 'Liste fiyatı 0\'dan küçük olamaz']
  },
  activitySalePrice: {
    type: Number,
    required: [true, 'Aktivite satış fiyatı zorunludur'],
    min: [0, 'Aktivite satış fiyatı 0\'dan küçük olamaz']
  },
  saleDate: {
    type: Date,
    required: [true, 'Satış tarihi zorunludur']
  },
  contractNumber: {
    type: String,
    required: [true, 'Sözleşme numarası zorunludur'],
    unique: true,
    trim: true
  },
  paymentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentType',
    required: [true, 'Ödeme tipi zorunludur']
  },
  commissionRate: {
    type: Number,
    default: 1.0,
    min: [0.1, 'Prim oranı 0.1\'den küçük olamaz'],
    max: [100.0, 'Prim oranı 100\'den büyük olamaz']
  },
  commission: {
    type: Number,
    required: true,
    default: function() {
      // Liste fiyatı ve aktivite satış fiyatından düşük olanı kullan
      const basePrice = Math.min(this.listPrice || 0, this.activitySalePrice || 0);
      return basePrice * (this.commissionRate / 100);
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: {
    type: Date
  },
  isCommissionPaid: {
    type: Boolean,
    default: false
  },
  commissionPaidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  commissionPaidAt: {
    type: Date
  },
  // Değişiklik tracking
  isModified: {
    type: Boolean,
    default: false
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedAt: {
    type: Date
  },
  modificationNote: {
    type: String,
    trim: true
  },
  // Orijinal veriler (değişiklik öncesi)
  originalData: {
    blockNumber: String,
    apartmentNumber: String,
    listPrice: Number,
    activitySalePrice: Number,
    contractNumber: String,
    commission: Number
  },
  // Prim ayarlamaları
  commissionAdjustment: {
    type: Number,
    default: 0 // Pozitif: ekleme, Negatif: kesinti
  },
  commissionAdjustmentReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index'ler
saleSchema.index({ saleDate: -1 });
saleSchema.index({ createdBy: 1 });
saleSchema.index({ contractNumber: 1 });

// Virtual field - tam müşteri adı
saleSchema.virtual('fullCustomerName').get(function() {
  return `${this.customerName} ${this.customerSurname}`;
});

// Virtual field - tam adres
saleSchema.virtual('fullAddress').get(function() {
  return `Blok: ${this.blockNumber}, Daire: ${this.apartmentNumber}, Dönem: ${this.periodNumber}`;
});

// JSON dönüşümünde virtual field'ları dahil et
saleSchema.set('toJSON', { virtuals: true });
saleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Sale', saleSchema);
