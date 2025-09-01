const express = require('express');
const PaymentType = require('../models/PaymentType');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Tüm aktif ödeme tiplerini listele
router.get('/', auth, async (req, res) => {
  try {
    const paymentTypes = await PaymentType.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: paymentTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme tipleri listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Tüm ödeme tiplerini listele (admin için - pasif olanlar dahil)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const paymentTypes = await PaymentType.find()
      .sort({ sortOrder: 1, name: 1 })
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: paymentTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme tipleri listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Yeni ödeme tipi ekle (admin için)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, sortOrder } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Ödeme tipi adı zorunludur'
      });
    }

    // Aynı isimde aktif ödeme tipi var mı kontrol et
    const exists = await PaymentType.findOne({ 
      name: name.trim(), 
      isActive: true 
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir ödeme tipi zaten mevcut'
      });
    }

    const paymentType = new PaymentType({
      name: name.trim(),
      description: description?.trim() || '',
      sortOrder: sortOrder || 0,
      createdBy: req.user._id
    });

    await paymentType.save();
    const populatedPaymentType = await PaymentType.findById(paymentType._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Ödeme tipi başarıyla eklendi',
      data: populatedPaymentType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme tipi eklenirken hata oluştu',
      error: error.message
    });
  }
});

// Ödeme tipi güncelle (admin için)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, sortOrder, isActive } = req.body;
    
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme tipi bulunamadı'
      });
    }

    // Aynı isimde başka aktif ödeme tipi var mı kontrol et
    if (name && name.trim() !== paymentType.name) {
      const exists = await PaymentType.findOne({ 
        name: name.trim(), 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'Bu isimde bir ödeme tipi zaten mevcut'
        });
      }
    }

    // Güncelleme
    if (name) paymentType.name = name.trim();
    if (description !== undefined) paymentType.description = description.trim();
    if (sortOrder !== undefined) paymentType.sortOrder = sortOrder;
    if (isActive !== undefined) paymentType.isActive = isActive;

    await paymentType.save();
    const populatedPaymentType = await PaymentType.findById(paymentType._id)
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Ödeme tipi başarıyla güncellendi',
      data: populatedPaymentType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme tipi güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Ödeme tipi sil (admin için)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const paymentType = await PaymentType.findById(req.params.id);
    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme tipi bulunamadı'
      });
    }

    // Soft delete - pasif yap
    paymentType.isActive = false;
    await paymentType.save();

    res.json({
      success: true,
      message: 'Ödeme tipi başarıyla pasif edildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme tipi silinirken hata oluştu',
      error: error.message
    });
  }
});

// Varsayılan ödeme tiplerini oluştur (admin için)
router.post('/create-defaults', adminAuth, async (req, res) => {
  try {
    await PaymentType.createDefaults(req.user._id);
    
    res.json({
      success: true,
      message: 'Varsayılan ödeme tipleri oluşturuldu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Varsayılan ödeme tipleri oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
