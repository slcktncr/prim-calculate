import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Filter, Download, Calendar, X, BarChart3, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const CancelledSales = () => {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchCancelledSales();
  }, [dateRange]);

  const fetchCancelledSales = async () => {
    setLoading(true);
    try {
      let url = '/api/sales/cancelled';
      const params = new URLSearchParams();
      
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setSales(response.data.data?.sales || []);
    } catch (error) {
      toast.error('İptal edilmiş satışlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCancelReport = async () => {
    setLoading(true);
    try {
      let url = '/api/commission-reports/cancelled-sales';
      const params = new URLSearchParams();
      
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      setReportData(response.data.data);
      setShowReport(true);
    } catch (error) {
      toast.error('İptal raporu yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSale = async (saleId) => {
    if (window.confirm('Bu satışın iptalini kaldırmak istediğinizden emin misiniz?')) {
      try {
        await axios.post(`/api/sales/${saleId}/cancel`);
        toast.success('Satış iptali kaldırıldı');
        fetchCancelledSales();
      } catch (error) {
        toast.error('İptal kaldırma işlemi başarısız');
      }
    }
  };

  const filteredSales = sales.filter(sale => {
    const fullName = `${sale.customerName} ${sale.customerSurname}`.toLowerCase();
    const contractNumber = sale.contractNumber.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || contractNumber.includes(search);
  });

  const totalCancelledCommission = filteredSales.reduce((sum, sale) => sum + sale.commission, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">İptal Edilmiş Satışlar</h1>
          <p className="text-gray-600">
            Toplam {filteredSales.length} iptal edilmiş satış
            {totalCancelledCommission > 0 && (
              <span className="text-red-600 font-medium">
                {' '}• ₺{totalCancelledCommission.toLocaleString('tr-TR')} kayıp prim
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={fetchCancelReport}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <BarChart3 size={20} />
              İptal Raporu
            </button>
          )}
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Müşteri/Sözleşme Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Müşteri adı veya sözleşme no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Satışlar Listesi */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">İptal Edilmiş Satışlar</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-500 mt-2">Yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satış Fiyatı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıp Prim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödeme Tipi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İptal Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İptal Eden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temsilci
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.customerName} {sale.customerSurname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.contractNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Blok: {sale.blockNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Daire: {sale.apartmentNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₺{parseFloat(sale.activitySalePrice).toLocaleString('tr-TR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Liste: ₺{parseFloat(sale.listPrice).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <TrendingDown size={12} className="mr-1" />
                        ₺{parseFloat(sale.commission).toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {sale.paymentType?.name || 'Belirtilmemiş'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.cancelledAt ? format(new Date(sale.cancelledAt), 'dd MMM yyyy HH:mm', { locale: tr }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.cancelledBy ? `${sale.cancelledBy.firstName} ${sale.cancelledBy.lastName}` : 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.createdBy ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(isAdmin || sale.createdBy?._id === user._id) && (
                        <button
                          onClick={() => handleRestoreSale(sale._id)}
                          className="text-green-600 hover:text-green-900"
                          title="İptali Kaldır"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredSales.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                İptal edilmiş satış bulunamadı
              </div>
            )}
          </div>
        )}
      </div>

      {/* İptal Raporu Modal */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Temsilci Bazında İptal Raporu
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-sm font-medium">Toplam İptal</div>
                <div className="text-2xl font-bold text-red-900">
                  {reportData.summary.totalCancelledCount}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-sm font-medium">Kayıp Satış</div>
                <div className="text-xl font-bold text-red-900">
                  ₺{reportData.summary.totalCancelledSales?.toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-sm font-medium">Kayıp Prim</div>
                <div className="text-xl font-bold text-red-900">
                  ₺{reportData.summary.totalCancelledCommission?.toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-yellow-600 text-sm font-medium">Ort. İptal Oranı</div>
                <div className="text-xl font-bold text-yellow-900">
                  %{reportData.summary.averageCancellationRate}
                </div>
              </div>
            </div>

            {/* Temsilci Listesi */}
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Temsilci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İptal Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İptal Oranı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıp Satış
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıp Prim
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {agent.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.cancelledCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(agent.cancellationRate) > 10 
                            ? 'bg-red-100 text-red-800' 
                            : parseFloat(agent.cancellationRate) > 5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          %{agent.cancellationRate}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{agent.cancelledSales?.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        -₺{agent.cancelledCommission?.toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelledSales;
