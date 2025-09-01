const express = require('express');
const CommissionRate = require('../models/CommissionRate');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Mevcut prim oranını getir
router.get('/current', async (req, res) => {
  try {
    const currentRate = await CommissionRate.findOne({ isActive: true }).sort({ effectiveDate: -1 });
    
    if (!currentRate) {
      // Varsayılan oran yoksa oluştur
      const defaultRate = new CommissionRate({
        rate: 1.0,
        description: 'Varsayılan prim oranı',
        createdBy: req.user?._id || 'system'
      });
      await defaultRate.save();
      
      return res.json({
        success: true,
        data: defaultRate
      });
    }
    
    res.json({
      success: true,
      data: currentRate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Prim oranı alınırken hata oluştu',
      error: error.message
    });
  }
});

// Prim oranı geçmişini getir (admin için)
router.get('/history', adminAuth, async (req, res) => {
  try {
    const rates = await CommissionRate.find({})
      .populate('createdBy', 'firstName lastName')
      .sort({ effectiveDate: -1 });
    
    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Prim oranı geçmişi alınırken hata oluştu',
      error: error.message
    });
  }
});

// Yeni prim oranı ekle (admin için)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { rate, description } = req.body;
    
    if (!rate || rate < 0.1 || rate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir prim oranı giriniz (0.1 - 100)'
      });
    }
    
    // Mevcut aktif oranı pasif yap
    await CommissionRate.updateMany(
      { isActive: true },
      { isActive: false }
    );
    
    // Yeni oranı ekle
    const newRate = new CommissionRate({
      rate,
      description: description || `Prim oranı %${rate} olarak güncellendi`,
      createdBy: req.user._id
    });
    
    await newRate.save();
    
    res.status(201).json({
      success: true,
      message: 'Prim oranı başarıyla güncellendi',
      data: newRate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Prim oranı güncellenirken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
