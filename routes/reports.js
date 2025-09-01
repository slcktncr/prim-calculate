const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Sale = require('../models/Sale');
const { auth, adminAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Genel istatistikler
router.get('/statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query).populate('createdBy', 'firstName lastName');

    // İptal edilmiş satışları da al
    let cancelQuery = { isCancelled: true };
    if (req.user.role !== 'admin') {
      cancelQuery.createdBy = req.user._id;
    }
    if (startDate || endDate) {
      cancelQuery.cancelledAt = {};
      if (startDate) cancelQuery.cancelledAt.$gte = new Date(startDate);
      if (endDate) cancelQuery.cancelledAt.$lte = new Date(endDate);
    }
    const cancelledSales = await Sale.find(cancelQuery).populate('createdBy', 'firstName lastName');

    // Toplam değerler
    const totalSales = sales.reduce((sum, sale) => sum + sale.activitySalePrice, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);
    const totalListPrice = sales.reduce((sum, sale) => sum + sale.listPrice, 0);
    
    // Modification ve adjustment istatistikleri
    const modifiedSales = sales.filter(sale => sale.isModified);
    const totalAdjustments = sales.reduce((sum, sale) => sum + (sale.commissionAdjustment || 0), 0);
    const positiveAdjustments = sales.filter(sale => (sale.commissionAdjustment || 0) > 0).reduce((sum, sale) => sum + sale.commissionAdjustment, 0);
    const negativeAdjustments = sales.filter(sale => (sale.commissionAdjustment || 0) < 0).reduce((sum, sale) => sum + Math.abs(sale.commissionAdjustment), 0);
    
    // İptal istatistikleri
    const totalCancelledSales = cancelledSales.reduce((sum, sale) => sum + sale.activitySalePrice, 0);
    const totalCancelledCommission = cancelledSales.reduce((sum, sale) => sum + sale.commission, 0);
    const cancellationRate = (sales.length + cancelledSales.length) > 0 
      ? ((cancelledSales.length / (sales.length + cancelledSales.length)) * 100).toFixed(2)
      : 0;

    // Aylık dağılım
    const monthlyData = {};
    sales.forEach(sale => {
      const month = moment(sale.saleDate).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = {
          sales: 0,
          commission: 0,
          count: 0
        };
      }
      monthlyData[month].sales += sale.activitySalePrice;
      monthlyData[month].commission += sale.commission;
      monthlyData[month].count += 1;
    });

    // Temsilci bazında dağılım (admin için)
    let userData = {};
    if (req.user.role === 'admin') {
      sales.forEach(sale => {
        const userId = sale.createdBy._id.toString();
        const userName = `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
        
        if (!userData[userId]) {
          userData[userId] = {
            name: userName,
            sales: 0,
            commission: 0,
            count: 0
          };
        }
        userData[userId].sales += sale.activitySalePrice;
        userData[userId].commission += sale.commission;
        userData[userId].count += 1;
      });
    }

    // Şampiyonlar
    const userDataArray = Object.values(userData);
    const topSalesChampion = userDataArray.length > 0 ? 
      userDataArray.sort((a, b) => b.sales - a.sales)[0] : null;
    const topCommissionChampion = userDataArray.length > 0 ? 
      userDataArray.sort((a, b) => b.commission - a.commission)[0] : null;

    // Detaylı istatistikler
    const highestSale = sales.length > 0 ? Math.max(...sales.map(s => s.activitySalePrice)) : 0;
    const lowestSale = sales.length > 0 ? Math.min(...sales.map(s => s.activitySalePrice)) : 0;
    const highestSaleCustomer = sales.length > 0 ? 
      sales.find(s => s.activitySalePrice === highestSale) : null;
    const lowestSaleCustomer = sales.length > 0 ? 
      sales.find(s => s.activitySalePrice === lowestSale) : null;

    // Aylık trend analizi
    const monthlyTrendArray = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
              data: {
          summary: {
            totalSales,
            totalCommission,
            totalListPrice,
            salesCount: sales.length,
            averageSalePrice: sales.length > 0 ? totalSales / sales.length : 0,
            averageCommission: sales.length > 0 ? totalCommission / sales.length : 0,
            highestSale,
            lowestSale,
            highestSaleCustomer: highestSaleCustomer ? 
              `${highestSaleCustomer.customerName} ${highestSaleCustomer.customerSurname}` : 'N/A',
            lowestSaleCustomer: lowestSaleCustomer ? 
              `${lowestSaleCustomer.customerName} ${lowestSaleCustomer.customerSurname}` : 'N/A',
            // Modification istatistikleri
            modifiedSalesCount: modifiedSales.length,
            modificationRate: sales.length > 0 ? ((modifiedSales.length / sales.length) * 100).toFixed(2) : 0,
            totalAdjustments,
            positiveAdjustments,
            negativeAdjustments,
            netAdjustment: positiveAdjustments - negativeAdjustments,
            // İptal istatistikleri
            cancelledSalesCount: cancelledSales.length,
            totalCancelledSales,
            totalCancelledCommission,
            cancellationRate
          },
          monthlyData,
          userData: Object.values(userData),
          topSalesChampion,
          topCommissionChampion,
          monthlyTrend: monthlyTrendArray,
          dateRange: {
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
          }
        }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken hata oluştu',
      error: error.message
    });
  }
});

// Excel raporu indir
router.get('/excel', auth, async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;
    
    let query = { isActive: true };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    // Tip filtresi
    if (type === 'weekly') {
      const currentDate = new Date();
      const weekStart = getDateOfISOWeek(getWeekNumber(currentDate), currentDate.getFullYear());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      query.saleDate = { $gte: weekStart, $lte: weekEnd };
    } else if (type === 'monthly') {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      query.saleDate = { $gte: monthStart, $lte: monthEnd };
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
    
    const worksheet = workbook.addWorksheet('Satış Raporu');

    // Başlık satırı - Türkçe karakterler için
    worksheet.columns = [
      { header: 'Müşteri Adı', key: 'customerName', width: 20 },
      { header: 'Müşteri Soyadı', key: 'customerSurname', width: 20 },
      { header: 'Blok No', key: 'blockNumber', width: 15 },
      { header: 'Daire No', key: 'apartmentNumber', width: 15 },
      { header: 'Dönem No', key: 'periodNumber', width: 15 },
      { header: 'Liste Fiyatı (₺)', key: 'listPrice', width: 18 },
      { header: 'Satış Fiyatı (₺)', key: 'activitySalePrice', width: 18 },
      { header: 'Prim (%1) (₺)', key: 'commission', width: 18 },
      { header: 'Satış Tarihi', key: 'saleDate', width: 15 },
      { header: 'Sözleşme No', key: 'contractNumber', width: 20 },
      { header: 'Giren Kişi', key: 'createdBy', width: 20 }
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
        customerName: sale.customerName || '',
        customerSurname: sale.customerSurname || '',
        blockNumber: sale.blockNumber || '',
        apartmentNumber: sale.apartmentNumber || '',
        periodNumber: sale.periodNumber || '',
        listPrice: sale.listPrice || 0,
        activitySalePrice: sale.activitySalePrice || 0,
        commission: sale.commission || 0,
        saleDate: moment(sale.saleDate).format('DD/MM/YYYY'),
        contractNumber: sale.contractNumber || '',
        createdBy: sale.createdBy ? `${sale.createdBy.firstName || ''} ${sale.createdBy.lastName || ''}`.trim() : ''
      });

      // Para birimi formatı
      row.getCell('listPrice').numFmt = '#,##0.00₺';
      row.getCell('activitySalePrice').numFmt = '#,##0.00₺';
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
      customerName: 'TOPLAM',
      customerSurname: '',
      blockNumber: '',
      periodNumber: '',
      apartmentNumber: '',
      listPrice: sales.reduce((sum, sale) => sum + (sale.listPrice || 0), 0),
      activitySalePrice: sales.reduce((sum, sale) => sum + (sale.activitySalePrice || 0), 0),
      commission: sales.reduce((sum, sale) => sum + (sale.commission || 0), 0),
      saleDate: '',
      contractNumber: '',
      createdBy: ''
    });

    // Toplam satırını formatla
    totalRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '70AD47' }
    };
    
    // Toplam satırı para birimi formatı
    totalRow.getCell('listPrice').numFmt = '#,##0.00₺';
    totalRow.getCell('activitySalePrice').numFmt = '#,##0.00₺';
    totalRow.getCell('commission').numFmt = '#,##0.00₺';

    // Sütun genişliklerini otomatik ayarla
    worksheet.columns.forEach(column => {
      if (column.width) {
        column.width = Math.max(column.width, 12);
      }
    });

    // Dosya adı - XLS formatı için
    const fileName = `satis_raporu_${moment().format('YYYY-MM-DD_HH-mm')}.xls`;

    // XLS formatı için header'ları ayarla
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Cache-Control', 'no-cache');

    // XLS formatında yaz (Excel 97-2003 uyumlu)
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
router.get('/pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query;
    
    let query = { isActive: true };
    
    // Admin değilse sadece kendi satışlarını göster
    if (req.user.role !== 'admin') {
      query.createdBy = req.user._id;
    }

    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    // Tip filtresi
    if (type === 'weekly') {
      const currentDate = new Date();
      const weekStart = getDateOfISOWeek(getWeekNumber(currentDate), currentDate.getFullYear());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      query.saleDate = { $gte: weekStart, $lte: weekEnd };
    } else if (type === 'monthly') {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      query.saleDate = { $gte: monthStart, $lte: monthEnd };
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

    const fileName = `satis_raporu_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;

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
       .text('SATIŞ RAPORU', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Oluşturulma Tarihi: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Filtre bilgileri
    if (startDate || endDate || type !== 'all') {
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('FİLTRE BİLGİLERİ:', { underline: true });
      
      if (startDate) doc.text(`Başlangıç Tarihi: ${moment(startDate).format('DD/MM/YYYY')}`);
      if (endDate) doc.text(`Bitiş Tarihi: ${moment(endDate).format('DD/MM/YYYY')}`);
      if (type === 'weekly') doc.text('Rapor Tipi: Haftalık');
      if (type === 'monthly') doc.text('Rapor Tipi: Aylık');
      
      doc.moveDown(0.5);
    }

    // Özet bilgiler
    const totalSales = sales.reduce((sum, sale) => sum + (sale.activitySalePrice || 0), 0);
    const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const totalListPrice = sales.reduce((sum, sale) => sum + (sale.listPrice || 0), 0);

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2E5BBA')
       .text('ÖZET BİLGİLER', { underline: true });
    
    doc.moveDown(0.3);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#333333');
    
    doc.text(`Toplam Satış: ${sales.length} adet`);
    doc.text(`Toplam Liste Fiyatı: ${totalListPrice.toLocaleString('tr-TR')} ₺`);
    doc.text(`Toplam Satış Tutarı: ${totalSales.toLocaleString('tr-TR')} ₺`);
    doc.text(`Toplam Prim: ${totalCommission.toLocaleString('tr-TR')} ₺`);
    
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
    
    doc.text('Müşteri', 55, currentY);
    doc.text('Blok/Daire', 150, currentY);
    doc.text('Fiyatlar (₺)', 250, currentY);
    doc.text('Prim (₺)', 350, currentY);
    doc.text('Tarih', 420, currentY);
    doc.text('Sözleşme', 500, currentY);

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

      // Müşteri bilgisi
      const customerName = `${sale.customerName || ''} ${sale.customerSurname || ''}`.trim();
      doc.text(customerName.length > 20 ? customerName.substring(0, 20) + '...' : customerName, 55, currentY);
      
      // Blok/Daire bilgisi
      doc.text(`${sale.blockNumber || ''}/${sale.apartmentNumber || ''}`, 150, currentY);
      
      // Fiyat bilgileri
      doc.text(`Liste: ${(sale.listPrice || 0).toLocaleString('tr-TR')}`, 250, currentY);
      doc.text(`Satış: ${(sale.activitySalePrice || 0).toLocaleString('tr-TR')}`, 250, currentY + 10);
      
      // Prim bilgisi
      doc.text(`${(sale.commission || 0).toLocaleString('tr-TR')}`, 350, currentY);
      
      // Tarih
      doc.text(moment(sale.saleDate).format('DD/MM/YY'), 420, currentY);
      
      // Sözleşme numarası
      doc.text(sale.contractNumber || '', 500, currentY);

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

module.exports = router;
