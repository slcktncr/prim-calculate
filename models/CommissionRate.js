const mongoose = require('mongoose');

const commissionRateSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0.1,
    max: 100.0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: 'Varsayılan prim oranı'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CommissionRate', commissionRateSchema);
