import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Filter, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [formData, setFormData] = useState({
    customerName: '',
    customerSurname: '',
    blockNumber: '',
    apartmentNumber: '',
    periodNumber: '',
    listPrice: '',
    activitySalePrice: '',
    saleDate: '',
    contractNumber: ''
  });

  useEffect(() => {
    fetchSales();
  }, [filterType, dateRange]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = '/api/sales';
      
      if (filterType === 'weekly') {
        url = '/api/sales/weekly';
      } else if (filterType === 'monthly') {
        url = '/api/sales/monthly';
      } else if (filterType === 'date-range' && dateRange.start && dateRange.end) {
        url = `/api/sales/date-range?start=${dateRange.start}&end=${dateRange.end}`;
      }

      const response = await axios.get(url);
      setSales(response.data.data?.sales || response.data.data || response.data || []);
    } catch (error) {
      toast.error('Satış verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingSale) {
        await axios.put(`/api/sales/${editingSale._id}`, formData);
        toast.success('Satış güncellendi');
      } else {
        await axios.post('/api/sales', formData);
        toast.success('Satış eklendi');
      }
      
      setShowForm(false);
      setEditingSale(null);
      resetForm();
      fetchSales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      customerName: sale.customerName,
      customerSurname: sale.customerSurname,
      blockNumber: sale.blockNumber,
      apartmentNumber: sale.apartmentNumber,
      periodNumber: sale.periodNumber,
      listPrice: sale.listPrice,
      activitySalePrice: sale.activitySalePrice,
      saleDate: sale.saleDate.split('T')[0],
      contractNumber: sale.contractNumber
    });
    setShowForm(true);
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Bu satışı silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`/api/sales/${saleId}`);
        toast.success('Satış silindi');
        fetchSales();
      } catch (error) {
        toast.error('Silme işlemi başarısız');
      }
    }
  };

  const handleCancelSale = async (saleId) => {
    try {
      const response = await axios.post(`/api/sales/${saleId}/cancel`);
      toast.success(response.data.message);
      fetchSales();
    } catch (error) {
      console.error('İptal hatası:', error);
      toast.error(error.response?.data?.message || 'İptal işlemi başarısız');
    }
  };

  const handleCommissionPaid = async (saleId) => {
    try {
      const response = await axios.post(`/api/sales/${saleId}/commission-paid`);
      toast.success(response.data.message);
      fetchSales();
    } catch (error) {
      console.error('Prim ödeme hatası:', error);
      toast.error(error.response?.data?.message || 'Prim ödeme durumu güncellenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerSurname: '',
      blockNumber: '',
      apartmentNumber: '',
      periodNumber: '',
      listPrice: '',
      activitySalePrice: '',
      saleDate: '',
      contractNumber: ''
    });
  };

  const filteredSales = sales.filter(sale => {
    const fullName = `${sale.customerName} ${sale.customerSurname}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || 
           sale.contractNumber.toLowerCase().includes(searchLower);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Satış Yönetimi</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Yeni Satış
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtre Tipi</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">Tüm Satışlar</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
              <option value="date-range">Tarih Aralığı</option>
            </select>
          </div>
          
          {filterType === 'date-range' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <div className="relative">
              <Search size={20} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri adı veya sözleşme no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Satış Formu */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingSale ? 'Satış Düzenle' : 'Yeni Satış Ekle'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri Adı</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri Soyadı</label>
              <input
                type="text"
                required
                value={formData.customerSurname}
                onChange={(e) => setFormData({...formData, customerSurname: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blok No</label>
              <input
                type="text"
                required
                value={formData.blockNumber}
                onChange={(e) => setFormData({...formData, blockNumber: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daire No</label>
              <input
                type="text"
                required
                value={formData.apartmentNumber}
                onChange={(e) => setFormData({...formData, apartmentNumber: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dönem No</label>
              <input
                type="text"
                required
                value={formData.periodNumber}
                onChange={(e) => setFormData({...formData, periodNumber: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Liste Fiyatı</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.listPrice}
                onChange={(e) => setFormData({...formData, listPrice: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aktivite Satış Fiyatı</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.activitySalePrice}
                onChange={(e) => setFormData({...formData, activitySalePrice: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Satış Tarihi</label>
              <input
                type="date"
                required
                value={formData.saleDate}
                onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sözleşme No</label>
              <input
                type="text"
                required
                value={formData.contractNumber}
                onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                {editingSale ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSale(null);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Satış Listesi */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
                     <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                   Müşteri
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                   Adres
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                   Satış Fiyatı & Prim Oranı
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                   Hesaplanan Prim
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                   Tarih
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                   Sözleşme
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                   İşlemler
                 </th>
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                   Durum
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                                    <td colSpan="8" className="px-4 py-3 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
                    Satış bulunamadı
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customerName} {sale.customerSurname}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.createdBy?.firstName} {sale.createdBy?.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Blok {sale.blockNumber}, Daire {sale.apartmentNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dönem {sale.periodNumber}
                      </div>
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         ₺{parseFloat(sale.activitySalePrice).toLocaleString('tr-TR')}
                       </div>
                       <div className="text-sm text-gray-500">
                         Liste: ₺{parseFloat(sale.listPrice).toLocaleString('tr-TR')}
                       </div>
                       <div className="text-xs text-blue-600 font-medium">
                         Prim Oranı: %{((sale.commission / sale.activitySalePrice) * 100).toFixed(2)}
                       </div>
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         ₺{parseFloat(sale.commission).toLocaleString('tr-TR')}
                       </span>
                       <div className="text-xs text-gray-500 mt-1">
                         {sale.commissionRate ? `Oran: %${sale.commissionRate}` : 'Oran: %1.00'}
                       </div>
                     </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {sale.contractNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {(user.role === 'admin' || sale.createdBy?._id === user._id) && (
                          <>
                            <button
                              onClick={() => handleEdit(sale)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(sale._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        {/* İptal Butonu */}
                        {(user.role === 'admin' || user.permissions?.canCancelSales) && (
                          <button
                            onClick={() => handleCancelSale(sale._id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sale.isCancelled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sale.isCancelled ? 'İptal Kaldır' : 'İptal Et'}
                          </button>
                        )}
                        
                        {/* Prim Ödeme Butonu */}
                        {(user.role === 'admin' || user.permissions?.canMarkCommissionPaid) && (
                          <button
                            onClick={() => handleCommissionPaid(sale._id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sale.isCancelled
                                ? 'bg-gray-100 text-gray-800 cursor-not-allowed'
                                : sale.isCommissionPaid
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            disabled={sale.isCancelled}
                          >
                            {sale.isCancelled ? 'İptal Edildi' : sale.isCommissionPaid ? 'Prim Ödendi' : 'Prim Ödenmedi'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
