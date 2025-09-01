import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Calendar, Settings, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Users, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const CommissionPeriods = () => {
  const { user, isAdmin } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    salesStartDate: '',
    salesEndDate: '',
    commissionDueDate: '',
    description: ''
  });
  const [transferData, setTransferData] = useState({
    targetPeriodId: '',
    reason: ''
  });

  useEffect(() => {
    fetchPeriods();
    fetchActivePeriod();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/commission-periods');
      setPeriods(response.data.data?.periods || []);
    } catch (error) {
      toast.error('Dönemler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivePeriod = async () => {
    try {
      const response = await axios.get('/api/commission-periods/active');
      setActivePeriod(response.data.data);
    } catch (error) {
      console.error('Aktif dönem yüklenirken hata:', error);
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/commission-periods', formData);
      toast.success(response.data.message);
      setShowCreateModal(false);
      resetForm();
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Dönem oluşturulurken hata oluştu');
    }
  };

  const handleCreateNext = async () => {
    try {
      const response = await axios.post('/api/commission-periods/create-next');
      toast.success(response.data.message);
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gelecek dönem oluşturulurken hata oluştu');
    }
  };

  const handleStatusChange = async (periodId, newStatus) => {
    try {
      const response = await axios.patch(`/api/commission-periods/${periodId}/status`, {
        status: newStatus
      });
      toast.success(response.data.message);
      fetchPeriods();
      fetchActivePeriod();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Dönem durumu güncellenirken hata oluştu');
    }
  };

  const handleTransferUnpaid = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/commission-periods/${selectedPeriod._id}/transfer-unpaid`, transferData);
      toast.success(response.data.message);
      setShowTransferModal(false);
      setTransferData({ targetPeriodId: '', reason: '' });
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer işlemi başarısız');
    }
  };

  const handleRecalculate = async (periodId) => {
    try {
      await axios.post(`/api/commission-periods/${periodId}/recalculate`);
      toast.success('İstatistikler yeniden hesaplandı');
      fetchPeriods();
    } catch (error) {
      toast.error('İstatistikler hesaplanırken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      salesStartDate: '',
      salesEndDate: '',
      commissionDueDate: '',
      description: ''
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'paid': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'active': return 'Aktif';
      case 'closed': return 'Kapalı';
      case 'paid': return 'Ödendi';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hakediş Dönemleri</h1>
          <p className="text-gray-600">
            Aylık hakediş dönemlerini yönetin
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={handleCreateNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={20} />
              Gelecek Dönem
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Calendar size={20} />
              Özel Dönem
            </button>
          </div>
        )}
      </div>

      {/* Aktif Dönem */}
      {activePeriod && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">Aktif Dönem: {activePeriod.periodName}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-blue-100">Satış Adedi</div>
                  <div className="text-lg font-semibold">{activePeriod.salesCount}</div>
                </div>
                <div>
                  <div className="text-blue-100">Toplam Satış</div>
                  <div className="text-lg font-semibold">₺{activePeriod.totalSales?.toLocaleString('tr-TR')}</div>
                </div>
                <div>
                  <div className="text-blue-100">Toplam Prim</div>
                  <div className="text-lg font-semibold">₺{activePeriod.totalCommission?.toLocaleString('tr-TR')}</div>
                </div>
                <div>
                  <div className="text-blue-100">Ödenmemiş Prim</div>
                  <div className="text-lg font-semibold">₺{activePeriod.totalUnpaidCommission?.toLocaleString('tr-TR')}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm">Hakediş Vadesi</div>
              <div className="text-lg font-semibold">
                {format(new Date(activePeriod.commissionDueDate), 'dd MMM yyyy', { locale: tr })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dönemler Listesi */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tüm Dönemler</h3>
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
                    Dönem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satış Tarihleri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İstatistikler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hakediş Vadesi
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period) => (
                  <tr key={period._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {period.periodName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(period.createdAt), 'dd MMM yyyy', { locale: tr })} tarihinde oluşturuldu
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                        {getStatusIcon(period.status)}
                        <span className="ml-1">{getStatusText(period.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{format(new Date(period.salesStartDate), 'dd MMM', { locale: tr })}</div>
                      <div className="text-gray-500">
                        {format(new Date(period.salesEndDate), 'dd MMM yyyy', { locale: tr })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {period.salesCount} satış
                      </div>
                      <div className="text-sm text-green-600">
                        ₺{period.totalCommission?.toLocaleString('tr-TR')} prim
                      </div>
                      {period.totalUnpaidCommission > 0 && (
                        <div className="text-sm text-orange-600">
                          ₺{period.totalUnpaidCommission?.toLocaleString('tr-TR')} ödenmemiş
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(period.commissionDueDate), 'dd MMM yyyy', { locale: tr })}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRecalculate(period._id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="İstatistikleri Yenile"
                          >
                            <RefreshCw size={16} />
                          </button>
                          
                          {period.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(period._id, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Aktif Yap"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          
                          {period.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(period._id, 'closed')}
                              className="text-orange-600 hover:text-orange-900"
                              title="Kapat"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                          
                          {period.status === 'closed' && period.totalUnpaidCommission > 0 && (
                            <button
                              onClick={() => {
                                setSelectedPeriod(period);
                                setShowTransferModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ödenmemiş Satışları Aktar"
                            >
                              <ArrowRight size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {periods.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Henüz dönem oluşturulmamış
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dönem Oluşturma Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Yeni Dönem Oluştur
              </h3>
              
              <form onSubmit={handleCreatePeriod}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yıl
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2050"
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ay
                    </label>
                    <select
                      required
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satış Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.salesStartDate}
                      onChange={(e) => setFormData({...formData, salesStartDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satış Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.salesEndDate}
                      onChange={(e) => setFormData({...formData, salesEndDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hakediş Vadesi
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.commissionDueDate}
                      onChange={(e) => setFormData({...formData, commissionDueDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Dönem açıklaması..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Dönem Oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
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

      {/* Transfer Modal */}
      {showTransferModal && selectedPeriod && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ödenmemiş Satışları Aktar
              </h3>
              
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-orange-800">
                  <AlertTriangle size={16} className="inline mr-2" />
                  {selectedPeriod.periodName} dönemindeki ödenmemiş satışlar hedef döneme aktarılacak.
                </p>
              </div>
              
              <form onSubmit={handleTransferUnpaid}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hedef Dönem
                  </label>
                  <select
                    required
                    value={transferData.targetPeriodId}
                    onChange={(e) => setTransferData({...transferData, targetPeriodId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Dönem seçin</option>
                    {periods
                      .filter(p => p._id !== selectedPeriod._id && ['draft', 'active'].includes(p.status))
                      .map((period) => (
                        <option key={period._id} value={period._id}>
                          {period.periodName} ({getStatusText(period.status)})
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Nedeni
                  </label>
                  <textarea
                    required
                    value={transferData.reason}
                    onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Transfer nedenini açıklayın..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Transfer Et
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferData({ targetPeriodId: '', reason: '' });
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
    </div>
  );
};

export default CommissionPeriods;
