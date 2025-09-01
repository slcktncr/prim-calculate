const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Sale = require('../models/Sale');
const { auth, adminAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// İPTAL SİSTEMİ KALDIRILDI - YENİDEN YAZILACAK
router.get('/cancelled-sales', auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      agents: [],
      summary: {
        totalAgents: 0,
        totalCancelledSales: 0,
        totalCancelledCommission: 0,
        totalCancelledCount: 0,
        averageCancellationRate: 0
      },
      cancelledDetails: []
    }
  });
});

// Temsilci prim raporları
router.get('/agent-commissions', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    // Tarih filtresi
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('paymentType', 'name')
      .sort({ saleDate: -1 });

    // Temsilci bazında grupla
    const agentData = {};
    let totalCommission = 0;
    let totalSales = 0;

    sales.forEach(sale => {
      const userId = sale.createdBy._id.toString();
      const userName = `${sale.createdBy.firstName} ${sale.createdBy.lastName}`;
      
      if (!agentData[userId]) {
        agentData[userId] = {
          id: userId,
          name: userName,
          sales: 0,
          commission: 0,
          salesCount: 0,
          paidCommission: 0,
          remainingCommission: 0
        };
      }
      
      agentData[userId].sales += sale.activitySalePrice;
      agentData[userId].commission += sale.commission;
      agentData[userId].salesCount += 1;
      agentData[userId].paidCommission += sale.isCommissionPaid ? sale.commission : 0;
      agentData[userId].remainingCommission += sale.isCommissionPaid ? 0 : sale.commission;
      
      totalCommission += sale.commission;
      totalSales += sale.activitySalePrice;
    });

    const agentArray = Object.values(agentData).sort((a, b) => b.commission - a.commission);

    res.json({
      success: true,
      data: {
        agents: agentArray,
        summary: {
          totalAgents: agentArray.length,
          totalSales: totalSales,
          totalCommission: totalCommission,
          totalPaidCommission: agentArray.reduce((sum, agent) => sum + agent.paidCommission, 0),
          totalRemainingCommission: agentArray.reduce((sum, agent) => sum + agent.remainingCommission, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Temsilci prim raporu oluşturulurken hata oluştu',
      error: error.message
    });
  }
});

// Excel export
router.get('/export/excel', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('paymentType', 'name')
      .sort({ saleDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Temsilci Primleri');

    // Başlıklar
    worksheet.columns = [
      { header: 'Temsilci', key: 'agent', width: 20 },
      { header: 'Müşteri', key: 'customer', width: 25 },
      { header: 'Sözleşme No', key: 'contract', width: 15 },
      { header: 'Satış Tarihi', key: 'date', width: 15 },
      { header: 'Satış Tutarı', key: 'amount', width: 15 },
      { header: 'Prim', key: 'commission', width: 15 },
      { header: 'Ödeme Tipi', key: 'paymentType', width: 15 },
      { header: 'Prim Durumu', key: 'status', width: 15 }
    ];

    // Veriler
    sales.forEach(sale => {
      worksheet.addRow({
        agent: `${sale.createdBy.firstName} ${sale.createdBy.lastName}`,
        customer: `${sale.customerName} ${sale.customerSurname}`,
        contract: sale.contractNumber,
        date: moment(sale.saleDate).format('DD.MM.YYYY'),
        amount: sale.activitySalePrice,
        commission: sale.commission,
        paymentType: sale.paymentType?.name || 'Belirtilmemiş',
        status: sale.isCommissionPaid ? 'Ödendi' : 'Ödenmedi'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=temsilci-primleri.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Excel export hatası',
      error: error.message
    });
  }
});

// PDF export
router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { isActive: true };
    
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('paymentType', 'name')
      .sort({ saleDate: -1 });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=temsilci-primleri.pdf');
    
    doc.pipe(res);
    
    doc.fontSize(20).text('Temsilci Prim Raporu', { align: 'center' });
    doc.moveDown();
    
    if (startDate || endDate) {
      doc.fontSize(12).text(`Tarih Aralığı: ${startDate ? moment(startDate).format('DD.MM.YYYY') : 'Başlangıç'} - ${endDate ? moment(endDate).format('DD.MM.YYYY') : 'Bitiş'}`, { align: 'center' });
      doc.moveDown();
    }
    
    doc.fontSize(12).text(`Toplam Satış: ${sales.length} adet`, { align: 'center' });
    doc.fontSize(12).text(`Toplam Prim: ₺${sales.reduce((sum, sale) => sum + sale.commission, 0).toLocaleString('tr-TR')}`, { align: 'center' });
    doc.moveDown(2);
    
    // Tablo başlıkları
    doc.fontSize(10);
    doc.text('Temsilci', 50, doc.y);
    doc.text('Müşteri', 150, doc.y);
    doc.text('Sözleşme', 250, doc.y);
    doc.text('Tarih', 320, doc.y);
    doc.text('Tutar', 380, doc.y);
    doc.text('Prim', 450, doc.y);
    doc.text('Durum', 500, doc.y);
    
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
    doc.moveDown();
    
    // Veriler
    sales.forEach(sale => {
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(10);
        doc.text('Temsilci', 50, doc.y);
        doc.text('Müşteri', 150, doc.y);
        doc.text('Sözleşme', 250, doc.y);
        doc.text('Tarih', 320, doc.y);
        doc.text('Tutar', 380, doc.y);
        doc.text('Prim', 450, doc.y);
        doc.text('Durum', 500, doc.y);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
        doc.moveDown();
      }
      
      doc.text(`${sale.createdBy.firstName} ${sale.createdBy.lastName}`, 50, doc.y);
      doc.text(`${sale.customerName} ${sale.customerSurname}`, 150, doc.y);
      doc.text(sale.contractNumber, 250, doc.y);
      doc.text(moment(sale.saleDate).format('DD.MM.YY'), 320, doc.y);
      doc.text(`₺${sale.activitySalePrice.toLocaleString('tr-TR')}`, 380, doc.y);
      doc.text(`₺${sale.commission.toLocaleString('tr-TR')}`, 450, doc.y);
      doc.text(sale.isCommissionPaid ? 'Ödendi' : 'Ödenmedi', 500, doc.y);
      doc.moveDown();
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'PDF export hatası',
      error: error.message
    });
  }
});

module.exports = router;