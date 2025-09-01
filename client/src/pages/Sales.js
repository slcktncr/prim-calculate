import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Filter, Download, Eye, Settings, AlertCircle, FileText, X } from 'lucide-react';
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

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingSale, setModifyingSale] = useState(null);
  const [modifyFormData, setModifyFormData] = useState({
    blockNumber: '',
    apartmentNumber: '',
    listPrice: '',
    activitySalePrice: '',
    contractNumber: '',
    modificationNote: ''
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSaleHistory, setSelectedSaleHistory] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerSurname: '',
    blockNumber: '',
    apartmentNumber: '',
    periodNumber: '',
    listPrice: '',
    activitySalePrice: '',
    saleDate: '',
    contractNumber: '',
    paymentType: ''
  });

  useEffect(() => {
    fetchSales();
    fetchPaymentTypes();
  }, [filterType, dateRange]);

  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get('/api/payment-types');
      setPaymentTypes(response.data.data || []);
    } catch (error) {
      console.error('Ödeme tipleri yüklenirken hata:', error);
    }
  };

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

  const handleModify = (sale) => {
    setModifyingSale(sale);
    setModifyFormData({
      blockNumber: sale.blockNumber,
      apartmentNumber: sale.apartmentNumber,
      listPrice: sale.listPrice,
      activitySalePrice: sale.activitySalePrice,
      contractNumber: sale.contractNumber,
      modificationNote: ''
    });
    setShowModifyModal(true);
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/sales/${modifyingSale._id}/modify`, modifyFormData);
      toast.success(response.data.message);
      
      // Komisyon değişikliği varsa bildir
      if (response.data.commissionChange?.difference !== 0) {
        const change = response.data.commissionChange;
        const message = change.type === 'increase' 
          ? `Prim artışı: +₺${Math.abs(change.difference).toLocaleString('tr-TR')}`
          : `Prim kesintisi: -₺${Math.abs(change.difference).toLocaleString('tr-TR')}`;
        toast.info(message, { duration: 4000 });
      }
      
      setShowModifyModal(false);
      setModifyingSale(null);
      fetchSales();
    } catch (error) {
      console.error('Değişiklik hatası:', error);
      toast.error(error.response?.data?.message || 'Değişiklik yapılamadı');
    }
  };

  const showModificationHistory = (sale) => {
    setSelectedSaleHistory(sale);
    setShowHistoryModal(true);
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
      contractNumber: '',
      paymentType: ''
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Tipi</label>
              <select
                required
                value={formData.paymentType}
                onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Ödeme tipi seçin</option>
                {paymentTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                  </option>
                ))}
              </select>
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
                 <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                   Ödeme Tipi
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
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {sale.customerName} {sale.customerSurname}
                          {sale.hasModifications && (
                            <div className="flex items-center gap-1">
                              <AlertCircle 
                                size={14} 
                                className="text-orange-500 cursor-pointer hover:text-orange-700" 
                                title="Değişiklik geçmişini göster" 
                                onClick={() => showModificationHistory(sale)}
                              />
                              {sale.modificationNote && (
                                <FileText size={12} className="text-blue-500 cursor-pointer" title={sale.modificationNote} />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.createdBy?.firstName} {sale.createdBy?.lastName}
                          {sale.hasModifications && sale.modifiedAt && (
                            <span className="text-xs text-orange-600 ml-2">
                              (değiştirildi: {format(new Date(sale.modifiedAt), 'dd.MM.yyyy', { locale: tr })})
                            </span>
                          )}
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
                         Prim Oranı: %{((sale.commission / Math.min(sale.listPrice || 0, sale.activitySalePrice || 0)) * 100).toFixed(2)}
                       </div>
                       <div className="text-xs text-green-600">
                         Prim Tabanı: ₺{Math.min(sale.listPrice || 0, sale.activitySalePrice || 0).toLocaleString('tr-TR')}
                       </div>
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         ₺{parseFloat(sale.commission).toLocaleString('tr-TR')}
                       </span>
                       <div className="text-xs text-gray-500 mt-1">
                         {sale.commissionRate ? `Oran: %${sale.commissionRate}` : 'Oran: %1.00'}
                       </div>
                       <div className="text-xs text-green-600">
                         Prim Tabanı: ₺{Math.min(sale.listPrice || 0, sale.activitySalePrice || 0).toLocaleString('tr-TR')}
                       </div>
                       {sale.commissionAdjustment !== 0 && (
                         <div className={`text-xs font-medium mt-1 ${sale.commissionAdjustment > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                           {sale.commissionAdjustment > 0 ? '+' : ''}₺{Math.abs(sale.commissionAdjustment).toLocaleString('tr-TR')}
                           <div className="text-xs text-gray-500">
                             {sale.commissionAdjustmentReason}
                           </div>
                         </div>
                       )}
                     </td>
                     <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                       <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                         {sale.paymentType?.name || 'Belirtilmemiş'}
                       </span>
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
                              title="Düzenle"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleModify(sale)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Değişiklik Yap"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(sale._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Sil"
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

      {/* Değişiklik Modal */}
      {showModifyModal && modifyingSale && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Satış Değişikliği Yap
              </h3>
              
              {/* Mevcut Bilgiler */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Mevcut Bilgiler:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Müşteri:</span> {modifyingSale.customerName} {modifyingSale.customerSurname}
                  </div>
                  <div>
                    <span className="text-gray-500">Sözleşme:</span> {modifyingSale.contractNumber}
                  </div>
                  <div>
                    <span className="text-gray-500">Blok:</span> {modifyingSale.blockNumber}
                  </div>
                  <div>
                    <span className="text-gray-500">Daire:</span> {modifyingSale.apartmentNumber}
                  </div>
                  <div>
                    <span className="text-gray-500">Liste Fiyatı:</span> ₺{modifyingSale.listPrice?.toLocaleString('tr-TR')}
                  </div>
                  <div>
                    <span className="text-gray-500">Aktivite Fiyatı:</span> ₺{modifyingSale.activitySalePrice?.toLocaleString('tr-TR')}
                  </div>
                </div>
                {modifyingSale.hasModifications && (
                  <div className="mt-2 text-xs text-orange-600">
                    ⚠️ Bu satışta daha önce değişiklik yapılmış
                  </div>
                )}
              </div>

              <form onSubmit={handleModifySubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Blok No
                    </label>
                    <input
                      type="text"
                      required
                      value={modifyFormData.blockNumber}
                      onChange={(e) => setModifyFormData({...modifyFormData, blockNumber: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Blok numarası"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Daire No
                    </label>
                    <input
                      type="text"
                      required
                      value={modifyFormData.apartmentNumber}
                      onChange={(e) => setModifyFormData({...modifyFormData, apartmentNumber: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Daire numarası"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Liste Fiyatı
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modifyFormData.listPrice}
                      onChange={(e) => setModifyFormData({...modifyFormData, listPrice: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Liste fiyatı"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Aktivite Satış Fiyatı
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={modifyFormData.activitySalePrice}
                      onChange={(e) => setModifyFormData({...modifyFormData, activitySalePrice: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Aktivite satış fiyatı"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Sözleşme No
                    </label>
                    <input
                      type="text"
                      required
                      value={modifyFormData.contractNumber}
                      onChange={(e) => setModifyFormData({...modifyFormData, contractNumber: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Sözleşme numarası"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Değişiklik Notu *
                  </label>
                  <textarea
                    required
                    value={modifyFormData.modificationNote}
                    onChange={(e) => setModifyFormData({...modifyFormData, modificationNote: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Değişiklik nedenini açıklayın..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bu not zorunludur ve değişiklik geçmişinde saklanacaktır.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Değişikliği Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModifyModal(false);
                      setModifyingSale(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Değişiklik Geçmişi Modal */}
      {showHistoryModal && selectedSaleHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Değişiklik Geçmişi
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Satış Bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Satış Bilgileri:</h4>
                <div className="text-sm text-gray-600">
                  <strong>{selectedSaleHistory.customerName} {selectedSaleHistory.customerSurname}</strong> - 
                  Sözleşme: {selectedSaleHistory.contractNumber}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orijinal Veriler */}
                {selectedSaleHistory.originalData && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      Orijinal Veriler
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blok:</span>
                        <span className="font-medium">{selectedSaleHistory.originalData.blockNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Daire:</span>
                        <span className="font-medium">{selectedSaleHistory.originalData.apartmentNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Liste Fiyatı:</span>
                        <span className="font-medium">₺{selectedSaleHistory.originalData.listPrice?.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aktivite Fiyatı:</span>
                        <span className="font-medium">₺{selectedSaleHistory.originalData.activitySalePrice?.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sözleşme No:</span>
                        <span className="font-medium">{selectedSaleHistory.originalData.contractNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orijinal Prim:</span>
                        <span className="font-medium text-green-600">₺{selectedSaleHistory.originalData.commission?.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Güncel Veriler */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Güncel Veriler
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blok:</span>
                      <span className="font-medium">{selectedSaleHistory.blockNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daire:</span>
                      <span className="font-medium">{selectedSaleHistory.apartmentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liste Fiyatı:</span>
                      <span className="font-medium">₺{selectedSaleHistory.listPrice?.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aktivite Fiyatı:</span>
                      <span className="font-medium">₺{selectedSaleHistory.activitySalePrice?.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sözleşme No:</span>
                      <span className="font-medium">{selectedSaleHistory.contractNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Güncel Prim:</span>
                      <span className="font-medium text-blue-600">₺{selectedSaleHistory.commission?.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Değişiklik Detayları */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Değişiklik Detayları</h4>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Değişiklik Tarihi:</span>
                      <div className="font-medium">
                        {selectedSaleHistory.modifiedAt ? format(new Date(selectedSaleHistory.modifiedAt), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Değiştiren:</span>
                      <div className="font-medium">
                        {selectedSaleHistory.modifiedBy ? `${selectedSaleHistory.modifiedBy.firstName} ${selectedSaleHistory.modifiedBy.lastName}` : 'Bilinmiyor'}
                      </div>
                    </div>
                  </div>
                  
                  {selectedSaleHistory.modificationNote && (
                    <div className="mt-3">
                      <span className="text-gray-600">Değişiklik Notu:</span>
                      <div className="font-medium mt-1 p-3 bg-white rounded border">
                        {selectedSaleHistory.modificationNote}
                      </div>
                    </div>
                  )}

                  {selectedSaleHistory.commissionAdjustment !== 0 && (
                    <div className="mt-3">
                      <span className="text-gray-600">Prim Değişikliği:</span>
                      <div className={`font-medium ${selectedSaleHistory.commissionAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedSaleHistory.commissionAdjustment > 0 ? '+' : ''}₺{Math.abs(selectedSaleHistory.commissionAdjustment).toLocaleString('tr-TR')}
                        <div className="text-xs text-gray-500 mt-1">
                          {selectedSaleHistory.commissionAdjustmentReason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
