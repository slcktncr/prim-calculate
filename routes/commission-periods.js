const express = require('express');
const CommissionPeriod = require('../models/CommissionPeriod');
const Sale = require('../models/Sale');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Tüm dönemleri listele
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const periods = await CommissionPeriod.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('closedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CommissionPeriod.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        periods,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Dönemler listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Aktif dönem getir
router.get('/active', auth, async (req, res) => {
  try {
    const activePeriod = await CommissionPeriod.getActivePeriod()
      .populate('createdBy', 'firstName lastName');
    
    if (!activePeriod) {
      return res.json({
        success: true,
        data: null,
        message: 'Aktif dönem bulunamadı'
      });
    }
    
    // İstatistikleri güncelle
    await activePeriod.calculateStats();
    
    res.json({
      success: true,
      data: activePeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Aktif dönem getirilirken hata oluştu',
      error: error.message
    });
  }
});

// Yeni dönem oluştur (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { year, month, salesStartDate, salesEndDate, commissionDueDate, description } = req.body;
    
    // Bu dönem zaten var mı kontrol et
    const existingPeriod = await CommissionPeriod.findOne({ year: parseInt(year), month: parseInt(month) });
    if (existingPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Bu dönem zaten mevcut'
      });
    }
    
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const period = new CommissionPeriod({
      year: parseInt(year),
      month: parseInt(month),
      periodName: `${months[parseInt(month) - 1]} ${year}`,
      salesStartDate: new Date(salesStartDate),
      salesEndDate: new Date(salesEndDate),
      commissionDueDate: new Date(commissionDueDate),
      description: description || `${months[parseInt(month) - 1]} ${year} hakediş dönemi`,
      createdBy: req.user._id
    });
    
    await period.save();
    
    const populatedPeriod = await CommissionPeriod.findById(period._id)
      .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Dönem başarıyla oluşturuldu',
      data: populatedPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Dönem oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Otomatik gelecek dönem oluştur (admin)
router.post('/create-next', adminAuth, async (req, res) => {
  try {
    const nextPeriod = await CommissionPeriod.createNextPeriod(req.user._id);
    
    const populatedPeriod = await CommissionPeriod.findById(nextPeriod._id)
      .populate('createdBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Gelecek dönem başarıyla oluşturuldu',
      data: populatedPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Gelecek dönem oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Dönem detayı getir
router.get('/:id', auth, async (req, res) => {
  try {
    const period = await CommissionPeriod.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('closedBy', 'firstName lastName')
      .populate('transferredSales.sale')
      .populate('transferredSales.fromPeriod', 'periodName');
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Dönem bulunamadı'
      });
    }
    
    // İstatistikleri güncelle
    await period.calculateStats();
    
    res.json({
      success: true,
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Dönem getirilirken hata oluştu',
      error: error.message
    });
  }
});

// Dönem durumunu güncelle (admin)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const period = await CommissionPeriod.findById(req.params.id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Dönem bulunamadı'
      });
    }
    
    const validStatuses = ['draft', 'active', 'closed', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dönem durumu'
      });
    }
    
    // Eğer dönem aktif yapılıyorsa, diğer aktif dönemleri kapat
    if (status === 'active') {
      await CommissionPeriod.updateMany(
        { status: 'active' },
        { status: 'draft' }
      );
    }
    
    // Eğer dönem kapatılıyorsa
    if (status === 'closed' && period.status !== 'closed') {
      await period.closePeriod(req.user._id);
    } else {
      period.status = status;
      await period.save();
    }
    
    const updatedPeriod = await CommissionPeriod.findById(period._id)
      .populate('createdBy', 'firstName lastName')
      .populate('closedBy', 'firstName lastName');
    
    res.json({
      success: true,
      message: 'Dönem durumu güncellendi',
      data: updatedPeriod
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Dönem durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Dönemin satışlarını getir
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const period = await CommissionPeriod.findById(req.params.id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Dönem bulunamadı'
      });
    }
    
    let query = {
      saleDate: {
        $gte: period.salesStartDate,
        $lte: period.salesEndDate
      },
      isActive: true,
      isCancelled: false
    };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }
    
    const skip = (page - 1) * limit;
    
    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('paymentType', 'name')
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Transfer edilmiş satışları da ekle
    const transferredSalesIds = period.transferredSales.map(ts => ts.sale);
    const transferredSales = await Sale.find({
      _id: { $in: transferredSalesIds },
      isActive: true,
      isCancelled: false
    })
      .populate('createdBy', 'firstName lastName')
      .populate('paymentType', 'name');
    
    const total = await Sale.countDocuments(query) + transferredSales.length;
    
    res.json({
      success: true,
      data: {
        sales,
        transferredSales,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Dönem satışları getirilirken hata oluştu',
      error: error.message
    });
  }
});

// Ödenmemiş satışları sıradaki döneme aktar (admin)
router.post('/:id/transfer-unpaid', adminAuth, async (req, res) => {
  try {
    const { targetPeriodId, reason } = req.body;
    const sourcePeriod = await CommissionPeriod.findById(req.params.id);
    const targetPeriod = await CommissionPeriod.findById(targetPeriodId);
    
    if (!sourcePeriod || !targetPeriod) {
      return res.status(404).json({
        success: false,
        message: 'Kaynak veya hedef dönem bulunamadı'
      });
    }
    
    // Ödenmemiş satışları bul
    const unpaidSales = await Sale.find({
      saleDate: {
        $gte: sourcePeriod.salesStartDate,
        $lte: sourcePeriod.salesEndDate
      },
      isActive: true,
      isCancelled: false,
      isCommissionPaid: false,
      isTransferredToNextPeriod: false
    });
    
    let transferredCount = 0;
    
    for (const sale of unpaidSales) {
      // Satışı transfer et
      sale.isTransferredToNextPeriod = true;
      sale.transferredToPeriod = targetPeriod._id;
      sale.transferDate = new Date();
      sale.transferReason = reason || 'Ödenmemiş prim sıradaki döneme aktarıldı';
      await sale.save();
      
      // Hedef döneme ekle
      targetPeriod.transferredSales.push({
        sale: sale._id,
        fromPeriod: sourcePeriod._id,
        transferDate: new Date(),
        transferReason: reason || 'Ödenmemiş prim önceki dönemden aktarıldı'
      });
      
      transferredCount++;
    }
    
    await targetPeriod.save();
    await targetPeriod.calculateStats();
    
    res.json({
      success: true,
      message: `${transferredCount} adet ödenmemiş satış ${targetPeriod.periodName} dönemine aktarıldı`,
      data: {
        transferredCount,
        sourcePeriod: sourcePeriod.periodName,
        targetPeriod: targetPeriod.periodName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satışlar aktarılırken hata oluştu',
      error: error.message
    });
  }
});

// Dönem istatistiklerini yeniden hesapla
router.post('/:id/recalculate', auth, async (req, res) => {
  try {
    const period = await CommissionPeriod.findById(req.params.id);
    
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Dönem bulunamadı'
      });
    }
    
    await period.calculateStats();
    
    res.json({
      success: true,
      message: 'Dönem istatistikleri yeniden hesaplandı',
      data: period
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İstatistikler hesaplanırken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
