const mongoose = require('mongoose');

const paymentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ödeme tipi adı zorunludur'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Varsayılan ödeme tiplerini oluştur
paymentTypeSchema.statics.createDefaults = async function(adminUserId) {
  const defaultTypes = [
    { name: 'Peşin', description: 'Peşin ödeme', sortOrder: 1 },
    { name: 'Kredi Kartı 3 Taksit', description: '3 taksit kredi kartı', sortOrder: 2 },
    { name: 'Kredi Kartı 6 Taksit', description: '6 taksit kredi kartı', sortOrder: 3 },
    { name: 'Kredi Kartı 9 Taksit', description: '9 taksit kredi kartı', sortOrder: 4 },
    { name: 'Kredi Kartı 12 Taksit', description: '12 taksit kredi kartı', sortOrder: 5 },
    { name: 'Şirket İçi Vadeli', description: 'Şirket içi vadeli ödeme', sortOrder: 6 }
  ];

  for (const type of defaultTypes) {
    const exists = await this.findOne({ name: type.name });
    if (!exists) {
      await this.create({
        ...type,
        createdBy: adminUserId
      });
    }
  }
};

module.exports = mongoose.model('PaymentType', paymentTypeSchema);
