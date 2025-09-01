import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const CancelledSales = () => {
  const { user } = useAuth();
  const [cancelledSales, setCancelledSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalCommission: 0,
    totalSales: 0
  });

  useEffect(() => {
    fetchCancelledSales();
  }, []);

  const fetchCancelledSales = async () => {
    setLoading(true);
    try {
      console.log('İptal edilmiş satışlar getiriliyor...');
      
      const response = await axios.get('/api/sales/cancelled');
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const sales = response.data.data?.sales || [];
        setCancelledSales(sales);
        
        // İstatistikleri hesapla
        const totalCount = sales.length;
        const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
        const totalSales = sales.reduce((sum, sale) => sum + (sale.activitySalePrice || 0), 0);
        
        setStats({ totalCount, totalCommission, totalSales });
        
        console.log(`${totalCount} adet iptal edilmiş satış bulundu`);
      } else {
        throw new Error(response.data.message || 'API başarısız');
      }
    } catch (error) {
      console.error('İptal satışlar hatası:', error);
      
      // Hata detaylarını göster
      if (error.response) {
        console.error('Server response:', error.response.data);
        toast.error(`Server Hatası: ${error.response.data?.message || 'Bilinmeyen hata'}`);
      } else {
        toast.error('Bağlantı hatası');
      }
      
      setCancelledSales([]);
      setStats({ totalCount: 0, totalCommission: 0, totalSales: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSale = async (saleId) => {
    if (window.confirm('Bu satışın iptalini kaldırmak istediğinizden emin misiniz?')) {
      try {
        await axios.post(`/api/sales/${saleId}/restore`);
        toast.success('Satış iptali kaldırıldı');
        fetchCancelledSales(); // Listeyi yenile
      } catch (error) {
        console.error('İptal kaldırma hatası:', error);
        toast.error(error.response?.data?.message || 'İptal kaldırma işlemi başarısız');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">İptal edilmiş satışlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          İptal Edilmiş Satışlar
        </h1>
        <button
          onClick={fetchCancelledSales}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-red-600 text-sm font-medium">Toplam İptal</div>
          <div className="text-2xl font-bold text-red-900">{stats.totalCount}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-red-600 text-sm font-medium">Kayıp Satış</div>
          <div className="text-xl font-bold text-red-900">
            ₺{stats.totalSales.toLocaleString('tr-TR')}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-red-600 text-sm font-medium">Kayıp Prim</div>
          <div className="text-xl font-bold text-red-900">
            ₺{stats.totalCommission.toLocaleString('tr-TR')}
          </div>
        </div>
      </div>

      {/* İptal Listesi */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            İptal Edilmiş Satışlar Listesi
          </h3>
          
          {cancelledSales.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">İptal edilmiş satış yok</h3>
              <p className="mt-1 text-sm text-gray-500">
                Henüz hiç satış iptal edilmemiş.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Müşteri
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satış Fiyatı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İptal Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İptal Eden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cancelledSales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customerName} {sale.customerSurname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.contractNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Blok {sale.blockNumber}, Daire {sale.apartmentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{(sale.activitySalePrice || 0).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₺{(sale.commission || 0).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.cancelledAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(sale.cancelledAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
                          </div>
                        ) : (
                          <span className="text-gray-400">Tarih yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.cancelledBy ? (
                          `${sale.cancelledBy.firstName || ''} ${sale.cancelledBy.lastName || ''}`
                        ) : (
                          <span className="text-gray-400">Bilinmiyor</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(user.role === 'admin' || sale.createdBy?._id === user._id) && (
                          <button
                            onClick={() => handleRestoreSale(sale._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            İptal Kaldır
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelledSales;