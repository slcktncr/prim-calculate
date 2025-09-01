const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Sale = require('../models/Sale');
const { auth, adminAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// İptal edilen satışlar raporu (temsilci bazında)
router.get('/cancelled-sales', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isCancelled: true };
    
    // Tarih filtresi
    if (startDate || endDate) {
      query.cancelledAt = {};
      if (startDate) query.cancelledAt.$gte = new Date(startDate);
      if (endDate) query.cancelledAt.$lte = new Date(endDate);
    }

    const cancelledSales = await Sale.find(query)
      .populate({
        path: 'createdBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'cancelledBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
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
      .sort({ cancelledAt: -1 });

    // Temsilci bazında grupla
    const agentData = {};
    let totalCancelledCommission = 0;

    cancelledSales.forEach(sale => {
      const userId = sale.createdBy._id.toString();
      const userName = `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
      
      if (!agentData[userId]) {
        agentData[userId] = {
          id: userId,
          name: userName,
          cancelledSales: 0,
          cancelledCommission: 0,
          cancelledCount: 0,
          cancellationRate: 0,
          cancelledSalesList: []
        };
      }
      
      agentData[userId].cancelledSales += sale.activitySalePrice;
      agentData[userId].cancelledCommission += sale.commission;
      agentData[userId].cancelledCount += 1;
      totalCancelledCommission += sale.commission;
      
      agentData[userId].cancelledSalesList.push({
        customerName: `${sale.customerName} ${sale.customerSurname}`,
        cancelledDate: sale.cancelledAt,
        salePrice: sale.activitySalePrice,
        commission: sale.commission,
        cancelledBy: sale.cancelledBy ? `${sale.cancelledBy.firstName} ${sale.cancelledBy.lastName}` : 'Bilinmiyor',
        contractNumber: sale.contractNumber,
        paymentType: sale.paymentType?.name || 'Belirtilmemiş'
      });
    });

    // Her temsilci için iptal oranını hesapla
    for (const userId in agentData) {
      const totalSalesCount = await Sale.countDocuments({ 
        createdBy: userId, 
        isActive: true 
      });
      const cancelledCount = agentData[userId].cancelledCount;
      agentData[userId].cancellationRate = totalSalesCount > 0 
        ? ((cancelledCount / (totalSalesCount + cancelledCount)) * 100).toFixed(2)
        : 0;
    }

    const agentArray = Object.values(agentData).sort((a, b) => b.cancelledCommission - a.cancelledCommission);

    res.json({
      success: true,
      data: {
        agents: agentArray,
        summary: {
          totalAgents: agentArray.length,
          totalCancelledSales: cancelledSales.reduce((sum, sale) => sum + sale.activitySalePrice, 0),
          totalCancelledCommission: totalCancelledCommission,
          totalCancelledCount: cancelledSales.length,
          averageCancellationRate: agentArray.length > 0 
            ? (agentArray.reduce((sum, agent) => sum + parseFloat(agent.cancellationRate), 0) / agentArray.length).toFixed(2)
            : 0
        },
        dateRange: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İptal raporu oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Temsilci primleri raporu
router.get('/agent-commissions', auth, async (req, res) => {
  try {
    const { startDate, endDate, agentId } = req.query;
    
    let query = { isActive: true, isCancelled: false };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Belirli temsilci filtresi
    if (agentId && req.user.role === 'admin') {
      query.createdBy = agentId;
    }

    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    // İptal edilen satışları da al (aynı filtrelerle)
    let cancelQuery = { isCancelled: true };
    if (req.user.role !== 'admin') {
      cancelQuery.createdBy = req.user._id;
    }
    if (agentId && req.user.role === 'admin') {
      cancelQuery.createdBy = agentId;
    }
    if (startDate || endDate) {
      cancelQuery.cancelledAt = {};
      if (startDate) cancelQuery.cancelledAt.$gte = new Date(startDate);
      if (endDate) cancelQuery.cancelledAt.$lte = new Date(endDate);
    }

    const cancelledSales = await Sale.find(cancelQuery)
      .populate({
        path: 'createdBy',
        select: 'firstName lastName',
        options: { strictPopulate: false }
      })
      .sort({ cancelledAt: -1 });

    // Temsilci bazında grupla
    const agentData = {};
    sales.forEach(sale => {
      const userId = sale.createdBy._id.toString();
      const userName = `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
      
      if (!agentData[userId]) {
        agentData[userId] = {
          id: userId,
          name: userName,
          sales: 0,
          commission: 0,
          count: 0,
          paidCommission: 0,
          unpaidCommission: 0,
          cancelledCommission: 0,
          cancelledCount: 0,
          netCommission: 0,
          salesList: []
        };
      }
      
      agentData[userId].sales += sale.activitySalePrice;
      agentData[userId].commission += sale.commission;
      agentData[userId].count += 1;
      
      if (sale.isCommissionPaid) {
        agentData[userId].paidCommission += sale.commission;
      } else {
        agentData[userId].unpaidCommission += sale.commission;
      }
      
      agentData[userId].salesList.push({
        customerName: `${sale.customerName} ${sale.customerSurname}`,
        saleDate: sale.saleDate,
        salePrice: sale.activitySalePrice,
        commission: sale.commission,
        isPaid: sale.isCommissionPaid,
        contractNumber: sale.contractNumber
      });
    });

    // İptal edilen satışları işle
    cancelledSales.forEach(sale => {
      const userId = sale.createdBy._id.toString();
      const userName = `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
      
      if (!agentData[userId]) {
        agentData[userId] = {
          id: userId,
          name: userName,
          sales: 0,
          commission: 0,
          count: 0,
          paidCommission: 0,
          unpaidCommission: 0,
          cancelledCommission: 0,
          cancelledCount: 0,
          netCommission: 0,
          salesList: []
        };
      }
      
      agentData[userId].cancelledCommission += sale.commission;
      agentData[userId].cancelledCount += 1;
    });

    // Net komisyon hesapla (komisyon - iptal edilen komisyon)
    Object.keys(agentData).forEach(userId => {
      agentData[userId].netCommission = agentData[userId].commission - agentData[userId].cancelledCommission;
    });

    const agentArray = Object.values(agentData).sort((a, b) => b.netCommission - a.netCommission);

    res.json({
      success: true,
      data: {
        agents: agentArray,
        summary: {
          totalAgents: agentArray.length,
          totalSales: sales.reduce((sum, sale) => sum + sale.activitySalePrice, 0),
          totalCommission: sales.reduce((sum, sale) => sum + sale.commission, 0),
          totalCancelledCommission: agentArray.reduce((sum, agent) => sum + agent.cancelledCommission, 0),
          totalNetCommission: agentArray.reduce((sum, agent) => sum + agent.netCommission, 0),
          totalPaidCommission: agentArray.reduce((sum, agent) => sum + agent.paidCommission, 0),
          totalUnpaidCommission: agentArray.reduce((sum, agent) => sum + agent.unpaidCommission, 0),
          totalCancelledCount: cancelledSales.length
        },
        dateRange: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Temsilci primleri raporu alınırken hata oluştu',
      error: error.message
    });
  }
});

// Excel raporu indir
router.get('/agent-commissions/excel', auth, async (req, res) => {
  try {
    const { startDate, endDate, agentId } = req.query;
    
    let query = { isActive: true, isCancelled: false };
    
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    if (agentId && req.user.role === 'admin') {
      query.createdBy = agentId;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    // Excel workbook oluştur (XLS formatı için)
    const workbook = new ExcelJS.Workbook();
    
    // Türkçe karakter desteği için encoding ayarı
    workbook.creator = 'PrimCalculate';
    workbook.lastModifiedBy = 'PrimCalculate';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Temsilci Primleri');

    // Başlık satırı - Türkçe karakterler için
    worksheet.columns = [
      { header: 'Temsilci', key: 'agent', width: 25 },
      { header: 'Müşteri', key: 'customer', width: 30 },
      { header: 'Satış Tarihi', key: 'saleDate', width: 15 },
      { header: 'Satış Tutarı (₺)', key: 'salePrice', width: 18 },
      { header: 'Prim Tutarı (₺)', key: 'commission', width: 18 },
      { header: 'Ödeme Durumu', key: 'paymentStatus', width: 15 },
      { header: 'Sözleşme No', key: 'contractNumber', width: 20 }
    ];

    // Başlık satırını formatla
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Veri satırları
    sales.forEach((sale, index) => {
      const row = worksheet.addRow({
        agent: sale.createdBy ? `${sale.createdBy.firstName || ''} ${sale.createdBy.lastName || ''}`.trim() : '',
        customer: `${sale.customerName || ''} ${sale.customerSurname || ''}`.trim(),
        saleDate: moment(sale.saleDate).format('DD/MM/YYYY'),
        salePrice: sale.activitySalePrice || 0,
        commission: sale.commission || 0,
        paymentStatus: sale.isCommissionPaid ? 'Ödendi' : 'Ödenmedi',
        contractNumber: sale.contractNumber || ''
      });

      // Para birimi formatı
      row.getCell('salePrice').numFmt = '#,##0.00₺';
      row.getCell('commission').numFmt = '#,##0.00₺';

      // Satır numarası çift ise arka plan rengi ver
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }
    });

    // Toplam satırı
    const totalRow = worksheet.addRow({
      agent: 'TOPLAM',
      customer: '',
      saleDate: '',
      salePrice: sales.reduce((sum, sale) => sum + (sale.activitySalePrice || 0), 0),
      commission: sales.reduce((sum, sale) => sum + (sale.commission || 0), 0),
      paymentStatus: '',
      contractNumber: ''
    });

    // Toplam satırını formatla
    totalRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '70AD47' }
    };
    
    // Toplam satırı para birimi formatı
    totalRow.getCell('salePrice').numFmt = '#,##0.00₺';
    totalRow.getCell('commission').numFmt = '#,##0.00₺';

    // Sütun genişliklerini otomatik ayarla
    worksheet.columns.forEach(column => {
      if (column.width) {
        column.width = Math.max(column.width, 12);
      }
    });

    const fileName = `temsilci_primleri_${moment().format('YYYY-MM-DD_HH-mm')}.xls`;

    // XLS formatı için header'ları ayarla
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-cache');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel rapor hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel raporu oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// PDF raporu indir
router.get('/agent-commissions/pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, agentId } = req.query;
    
    let query = { isActive: true, isCancelled: false };
    
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    if (agentId && req.user.role === 'admin') {
      query.createdBy = agentId;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ saleDate: -1 });

    // PDF oluştur
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const fileName = `temsilci_primleri_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-cache');

    doc.pipe(res);

    // Türkçe karakter desteği için font ayarları
    doc.font('Helvetica');

    // Başlık
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2E5BBA')
       .text('TEMSiLCi PRiMLERi RAPORU', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Oluşturulma Tarihi: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Filtre bilgileri
    if (startDate || endDate || agentId) {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('FİLTRE BİLGİLERİ:', { underline: true });
      
      if (startDate) doc.text(`Başlangıç Tarihi: ${moment(startDate).format('DD/MM/YYYY')}`);
      if (endDate) doc.text(`Bitiş Tarihi: ${moment(endDate).format('DD/MM/YYYY')}`);
      if (agentId) doc.text(`Temsilci ID: ${agentId}`);
      
      doc.moveDown(0.5);
    }

    // Özet bilgiler
    const totalSales = sales.reduce((sum, sale) => sum + (sale.activitySalePrice || 0), 0);
    const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const paidCommission = sales.filter(s => s.isCommissionPaid).reduce((sum, sale) => sum + (sale.commission || 0), 0);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2E5BBA')
       .text('ÖZET BİLGİLER', { underline: true });
    
    doc.moveDown(0.3);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text(`Toplam Satış: ${sales.length} adet`);
    doc.text(`Toplam Satış Tutarı: ${totalSales.toLocaleString('tr-TR')} ₺`);
    doc.text(`Toplam Prim: ${totalCommission.toLocaleString('tr-TR')} ₺`);
    doc.text(`Ödenen Prim: ${paidCommission.toLocaleString('tr-TR')} ₺`);
    doc.text(`Kalan Prim: ${(totalCommission - paidCommission).toLocaleString('tr-TR')} ₺`);
    
    doc.moveDown(1);

    // Tablo başlıkları
    const tableTop = doc.y + 20;
    let currentY = tableTop;

    // Tablo başlıkları
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');
    
    // Başlık arka planı
    doc.rect(50, currentY - 5, 500, 20)
       .fill('#2E5BBA');
    
    doc.text('Temsilci', 55, currentY);
    doc.text('Müşteri', 150, currentY);
    doc.text('Satış Tutarı (₺)', 250, currentY);
    doc.text('Prim (₺)', 350, currentY);
    doc.text('Tarih', 420, currentY);
    doc.text('Durum', 500, currentY);

    currentY += 25;

    // Tablo verileri
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#333333');

    sales.forEach((sale, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Satır arka planı (zebra striping)
      if (index % 2 === 0) {
        doc.rect(50, currentY - 3, 500, 16)
           .fill('#F8F9FA');
      }

      // Temsilci bilgisi
      const agentName = sale.createdBy ? `${sale.createdBy.firstName || ''} ${sale.createdBy.lastName || ''}`.trim() : '';
      doc.text(agentName.length > 20 ? agentName.substring(0, 20) + '...' : agentName, 55, currentY);
      
      // Müşteri bilgisi
      const customerName = `${sale.customerName || ''} ${sale.customerSurname || ''}`.trim();
      doc.text(customerName.length > 25 ? customerName.substring(0, 25) + '...' : customerName, 150, currentY);
      
      // Satış tutarı
      doc.text(`${(sale.activitySalePrice || 0).toLocaleString('tr-TR')}`, 250, currentY);
      
      // Prim tutarı
      doc.text(`${(sale.commission || 0).toLocaleString('tr-TR')}`, 350, currentY);
      
      // Tarih
      doc.text(moment(sale.saleDate).format('DD/MM/YY'), 420, currentY);
      
      // Ödeme durumu
      const status = sale.isCommissionPaid ? 'Ödendi' : 'Ödenmedi';
      doc.text(status, 500, currentY);

      currentY += 20;
    });

    // Toplam satırı
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#FFFFFF');
    
    doc.rect(50, currentY - 3, 500, 20)
       .fill('#70AD47');
    
    doc.text('TOPLAM:', 55, currentY);
    doc.text(`${totalSales.toLocaleString('tr-TR')} ₺`, 250, currentY);
    doc.text(`${totalCommission.toLocaleString('tr-TR')} ₺`, 350, currentY);

    // Alt bilgi
    doc.moveDown(2);
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Bu rapor PrimCalculate sistemi tarafından otomatik olarak oluşturulmuştur.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF rapor hatası:', error);
    res.status(500).json({
      success: false,
      message: 'PDF raporu oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
