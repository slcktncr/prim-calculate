import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Settings, TrendingUp, History, Shield } from 'lucide-react';

const CommissionSettings = () => {
  const { user, isAdmin } = useAuth();
  const [currentRate, setCurrentRate] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rate: '',
    description: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchCurrentRate();
      fetchRateHistory();
    }
  }, [isAdmin]);

  const fetchCurrentRate = async () => {
    try {
      const response = await axios.get('/api/commission/current');
      setCurrentRate(response.data.data);
    } catch (error) {
      toast.error('Mevcut prim oranı alınırken hata oluştu');
    }
  };

  const fetchRateHistory = async () => {
    try {
      const response = await axios.get('/api/commission/history');
      setRateHistory(response.data.data);
    } catch (error) {
      toast.error('Prim oranı geçmişi alınırken hata oluştu');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.rate || formData.rate < 0.1 || formData.rate > 100) {
      toast.error('Geçerli bir prim oranı giriniz (0.1 - 100)');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/commission', formData);
      toast.success('Prim oranı başarıyla güncellendi');
      setShowForm(false);
      setFormData({ rate: '', description: '' });
      fetchCurrentRate();
      fetchRateHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Prim oranı güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erişim Reddedildi
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Prim Oranı Ayarları</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Settings size={24} />
          <span className="text-lg">Sistem Ayarları</span>
        </div>
      </div>

      {/* Mevcut Oran */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Mevcut Prim Oranı
        </h2>
        {currentRate ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              %{currentRate.rate}
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Açıklama:</strong> {currentRate.description}</p>
              <p><strong>Geçerlilik Tarihi:</strong> {new Date(currentRate.effectiveDate).toLocaleDateString('tr-TR')}</p>
              <p><strong>Güncelleyen:</strong> {currentRate.createdBy?.firstName} {currentRate.createdBy?.lastName}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Prim oranı yükleniyor...</p>
        )}
      </div>

      {/* Yeni Oran Ekleme */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Yeni Prim Oranı Ekle</h2>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Yeni Oran Ekle
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prim Oranı (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                required
                value={formData.rate}
                onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Örn: 1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Geçerli aralık: 0.1 - 100.0
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Bu oran değişikliğinin nedenini açıklayın..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ rate: '', description: '' });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
              >
                İptal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Oran Geçmişi */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600" />
          Prim Oranı Geçmişi
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geçerlilik Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Güncelleyen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rateHistory.map((rate) => (
                <tr key={rate._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-blue-600">
                      %{rate.rate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{rate.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(rate.effectiveDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.createdBy?.firstName} {rate.createdBy?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rate.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rate.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex">
          <Shield className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Önemli Bilgi
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>• Prim oranı değişikliği sadece yeni satışlara yansır</p>
              <p>• Eski satışların prim hesaplamaları etkilenmez</p>
              <p>• Oran değişikliği geri alınamaz, dikkatli olun</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettings;
