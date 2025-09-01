const express = require('express');
const Sale = require('../models/Sale');
const { auth, adminAuth, ownerOrAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Tüm satışları listele
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Arama filtresi
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerSurname: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName')
      .populate('paymentType', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      data: {
        sales,
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
      message: 'Satışlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Haftalık satışlar
router.get('/weekly', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const weekStart = getDateOfISOWeek(getWeekNumber(currentDate), currentDate.getFullYear());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let query = {
      isActive: true,
      saleDate: { $gte: weekStart, $lte: weekEnd }
    };

    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Haftalık satışlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Aylık satışlar
router.get('/monthly', auth, async (req, res) => {
  try {
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let query = {
      isActive: true,
      saleDate: { $gte: monthStart, $lte: monthEnd }
    };

    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Aylık satışlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Tarih aralığında satışlar
router.get('/date-range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Başlangıç ve bitiş tarihi gerekli'
      });
    }

    let query = {
      isActive: true,
      saleDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Tarih aralığında satışlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Tek satış getir
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('createdBy', 'firstName lastName');
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // Admin değilse sadece kendi satışını görebilir
    if (req.user.role !== 'admin' && sale.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu satışı görme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış getirilirken hata oluştu',
      error: error.message
    });
  }
});

// Yeni satış ekle
router.post('/', auth, async (req, res) => {
  try {
    // Mevcut prim oranını al
    const CommissionRate = require('../models/CommissionRate');
    const currentRate = await CommissionRate.findOne({ isActive: true });
    const commissionRate = currentRate ? currentRate.rate : 1.0;
    
    const saleData = {
      ...req.body,
      commissionRate,
      createdBy: req.user._id
    };

    const sale = new Sale(saleData);
    await sale.save();

    const populatedSale = await Sale.findById(sale._id).populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Satış başarıyla eklendi',
      data: populatedSale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış eklenirken hata oluştu',
      error: error.message
    });
  }
});

// Satış güncelle (basit güncelleme - değişiklik tracking yok)
router.put('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // Kullanıcı sadece kendi satışlarını veya admin ise tümünü güncelleyebilir
    if (req.user.role !== 'admin' && sale.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu satışı güncelleme yetkiniz bulunmamaktadır'
      });
    }

    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Satış başarıyla güncellendi',
      data: updatedSale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Satış değişikliği yap (tracking ile)
router.post('/:id/modify', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // İptal edilmiş satışlar değiştirilemez
    if (sale.isCancelled) {
      return res.status(400).json({
        success: false,
        message: 'İptal edilmiş satışlar değiştirilemez'
      });
    }

    // Kullanıcı sadece kendi satışlarını veya admin ise tümünü değiştirebilir
    if (req.user.role !== 'admin' && sale.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu satışı değiştirme yetkiniz bulunmamaktadır'
      });
    }

    const { blockNumber, apartmentNumber, listPrice, activitySalePrice, contractNumber, modificationNote } = req.body;

    // Zorunlu not kontrolü
    if (!modificationNote || modificationNote.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Değişiklik notu zorunludur'
      });
    }

    // Orijinal verileri sakla (ilk değişiklik ise)
    if (!sale.hasModifications) {
      sale.originalData = {
        blockNumber: sale.blockNumber,
        apartmentNumber: sale.apartmentNumber,
        listPrice: sale.listPrice,
        activitySalePrice: sale.activitySalePrice,
        contractNumber: sale.contractNumber,
        commission: sale.commission
      };
    }

    // Eski komisyon değeri
    const oldCommission = sale.commission;

    // Yeni verileri ata
    if (blockNumber !== undefined) sale.blockNumber = blockNumber;
    if (apartmentNumber !== undefined) sale.apartmentNumber = apartmentNumber;
    if (listPrice !== undefined) sale.listPrice = listPrice;
    if (activitySalePrice !== undefined) sale.activitySalePrice = activitySalePrice;
    if (contractNumber !== undefined) sale.contractNumber = contractNumber;

    // Yeni komisyon hesapla
    const basePrice = Math.min(sale.listPrice || 0, sale.activitySalePrice || 0);
    const newCommission = basePrice * (sale.commissionRate / 100);
    sale.commission = newCommission;

    // Komisyon farkını hesapla
    const commissionDifference = newCommission - oldCommission;
    sale.commissionAdjustment = (sale.commissionAdjustment || 0) + commissionDifference;
    
    if (commissionDifference !== 0) {
      sale.commissionAdjustmentReason = commissionDifference > 0 
        ? 'Değişiklik sonrası ekleme'
        : 'Değişiklik sonrası kesinti';
    }

    // Değişiklik bilgilerini kaydet
    sale.hasModifications = true;
    sale.modifiedBy = req.user._id;
    sale.modifiedAt = new Date();
    sale.modificationNote = modificationNote;

    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName')
      .populate('paymentType', 'name');

    res.json({
      success: true,
      message: 'Satış değişikliği başarıyla kaydedildi',
      data: populatedSale,
      commissionChange: {
        oldCommission,
        newCommission,
        difference: commissionDifference,
        type: commissionDifference > 0 ? 'increase' : commissionDifference < 0 ? 'decrease' : 'no_change'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış değişikliği yapılırken hata oluştu',
      error: error.message
    });
  }
});

// Satış sil (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // Kullanıcı sadece kendi satışlarını veya admin ise tümünü silebilir
    if (req.user.role !== 'admin' && sale.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bu satışı silme yetkiniz bulunmamaktadır'
      });
    }

    sale.isActive = false;
    await sale.save();

    res.json({
      success: true,
      message: 'Satış başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış silinirken hata oluştu',
      error: error.message
    });
  }
});

// İptal edilmiş satışları listele
router.get('/cancelled', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    
    let query = { isCancelled: true };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Arama filtresi
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerSurname: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Tarih filtresi (iptal tarihi)
    if (startDate || endDate) {
      query.cancelledAt = {};
      if (startDate) query.cancelledAt.$gte = new Date(startDate);
      if (endDate) query.cancelledAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    
    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName')
      .populate({
        path: 'modifiedBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'paymentType',
        select: 'name',
        options: { strictPopulate: false }
      })
      .sort({ cancelledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      data: {
        sales,
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
      message: 'İptal edilmiş satışlar listelenirken hata oluştu',
      error: error.message
    });
  }
});

// Satış iptal et
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // Admin veya iptal yetkisi olan kullanıcı iptal edebilir
    if (req.user.role !== 'admin' && !req.user.permissions?.canCancelSales) {
      return res.status(403).json({
        success: false,
        message: 'Satış iptal etme yetkiniz yok'
      });
    }

    sale.isCancelled = !sale.isCancelled;
    if (sale.isCancelled) {
      sale.cancelledBy = req.user._id;
      sale.cancelledAt = new Date();
      console.log(`Satış iptal edildi: ${sale.customerName} ${sale.customerSurname} - ID: ${sale._id}`);
    } else {
      sale.cancelledBy = undefined;
      sale.cancelledAt = undefined;
      console.log(`Satış iptal geri alındı: ${sale.customerName} ${sale.customerSurname} - ID: ${sale._id}`);
    }

    await sale.save();
    const updatedSale = await Sale.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('cancelledBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName')
      .populate('paymentType', 'name');

    res.json({
      success: true,
      data: updatedSale,
      message: sale.isCancelled ? 'Satış iptal edildi' : 'Satış iptali kaldırıldı'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Satış iptal edilirken hata oluştu',
      error: error.message
    });
  }
});

// Mevcut satışların prim hesaplamalarını yeniden hesapla (admin için)
router.post('/recalculate-commissions', auth, async (req, res) => {
  try {
    // Sadece admin bu işlemi yapabilir
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gereklidir'
      });
    }

    // Tüm aktif satışları al
    const sales = await Sale.find({ isActive: true, isCancelled: false });
    let updatedCount = 0;

    // Her satış için yeni prim hesaplama mantığını uygula
    for (const sale of sales) {
      const oldCommission = sale.commission;
      
      // Yeni hesaplama: liste fiyatı ve aktivite satış fiyatından düşük olanı kullan
      const basePrice = Math.min(sale.listPrice || 0, sale.activitySalePrice || 0);
      const newCommission = basePrice * (sale.commissionRate / 100);
      
      // Eğer değişiklik varsa güncelle
      if (Math.abs(oldCommission - newCommission) > 0.01) {
        sale.commission = newCommission;
        await sale.save();
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} adet satışın primi yeniden hesaplandı`,
      data: {
        totalSales: sales.length,
        updatedSales: updatedCount,
        skippedSales: sales.length - updatedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Prim yeniden hesaplama işlemi sırasında hata oluştu',
      error: error.message
    });
  }
});

// Prim ödeme durumunu güncelle
router.post('/:id/commission-paid', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış bulunamadı'
      });
    }

    // Admin veya prim ödeme yetkisi olan kullanıcı güncelleyebilir
    if (req.user.role !== 'admin' && !req.user.permissions?.canMarkCommissionPaid) {
      return res.status(403).json({
        success: false,
        message: 'Prim ödeme durumu güncelleme yetkiniz yok'
      });
    }

    sale.isCommissionPaid = !sale.isCommissionPaid;
    if (sale.isCommissionPaid) {
      sale.commissionPaidBy = req.user._id;
      sale.commissionPaidAt = new Date();
    } else {
      sale.commissionPaidBy = undefined;
      sale.commissionPaidAt = undefined;
    }

    await sale.save();
    const updatedSale = await Sale.findById(req.params.id).populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedSale,
      message: sale.isCommissionPaid ? 'Prim ödendi olarak işaretlendi' : 'Prim ödenmedi olarak işaretlendi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Prim ödeme durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
});

// Yardımcı fonksiyonlar
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getDateOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = simple;
  if (dayOfWeek <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

// Phantom iptal kayıtlarını temizle (admin)
router.post('/fix-phantom-cancellations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli'
      });
    }

    // İptal edilmiş ama cancelledAt ve cancelledBy bilgisi olmayan kayıtları bul
    const phantomCancelled = await Sale.find({
      isCancelled: true,
      $or: [
        { cancelledAt: { $exists: false } },
        { cancelledAt: null },
        { cancelledBy: { $exists: false } },
        { cancelledBy: null }
      ]
    });

    console.log('Phantom iptal kayıtları:', phantomCancelled.length);

    // Bu kayıtları düzelt - ya tamamen iptal et ya da aktif hale getir
    let fixedCount = 0;
    for (const sale of phantomCancelled) {
      // Eğer hiç iptal bilgisi yoksa, aktif hale getir
      if (!sale.cancelledAt && !sale.cancelledBy) {
        sale.isCancelled = false;
        await sale.save();
        fixedCount++;
        console.log(`Düzeltildi: ${sale.customerName} ${sale.customerSurname} - aktif hale getirildi`);
      }
    }

    res.json({
      success: true,
      message: `${fixedCount} phantom iptal kaydı düzeltildi`,
      data: {
        phantomCount: phantomCancelled.length,
        fixedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Phantom kayıt düzeltme hatası',
      error: error.message
    });
  }
});

// Data temizleme endpoint (admin)
router.post('/clean-data', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli'
      });
    }

    // Tüm satışları kontrol et
    const allSales = await Sale.find({});
    console.log('Toplam satış sayısı:', allSales.length);
    
    const activeSales = await Sale.find({ isCancelled: { $ne: true } });
    console.log('Aktif satış sayısı:', activeSales.length);
    
    const cancelledSales = await Sale.find({ isCancelled: true });
    console.log('İptal edilmiş satış sayısı:', cancelledSales.length);
    
    // İptal edilmiş satışların detayları
    const cancelledDetails = cancelledSales.map(sale => ({
      _id: sale._id,
      customer: `${sale.customerName} ${sale.customerSurname}`,
      isCancelled: sale.isCancelled,
      cancelledAt: sale.cancelledAt,
      cancelledBy: sale.cancelledBy
    }));
    
    console.log('İptal detayları:', JSON.stringify(cancelledDetails, null, 2));

    res.json({
      success: true,
      data: {
        totalSales: allSales.length,
        activeSales: activeSales.length,
        cancelledSales: cancelledSales.length,
        cancelledDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Veri temizleme hatası',
      error: error.message
    });
  }
});

module.exports = router;
