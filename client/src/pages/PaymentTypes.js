import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const PaymentTypes = () => {
  const { user, isAdmin } = useAuth();
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchPaymentTypes();
    }
  }, [isAdmin]);

  const fetchPaymentTypes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/payment-types/admin');
      setPaymentTypes(response.data.data || []);
    } catch (error) {
      toast.error('Ödeme tipleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(`/api/payment-types/${editingType._id}`, formData);
        toast.success('Ödeme tipi güncellendi');
      } else {
        await axios.post('/api/payment-types', formData);
        toast.success('Ödeme tipi eklendi');
      }
      
      resetForm();
      fetchPaymentTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      sortOrder: type.sortOrder || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (typeId) => {
    if (window.confirm('Bu ödeme tipini silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`/api/payment-types/${typeId}`);
        toast.success('Ödeme tipi silindi');
        fetchPaymentTypes();
      } catch (error) {
        toast.error('Silme işlemi başarısız');
      }
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await axios.post('/api/payment-types/create-defaults');
      toast.success('Varsayılan ödeme tipleri oluşturuldu');
      fetchPaymentTypes();
    } catch (error) {
      toast.error('Varsayılan tipler oluşturulamadı');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sortOrder: 0
    });
    setEditingType(null);
    setShowForm(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Erişim Yetkisi Yok</h2>
          <p className="text-gray-600 mt-2">Bu sayfaya sadece admin kullanıcılar erişebilir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ödeme Tipleri Yönetimi</h1>
          <p className="text-gray-600">Satış formunda kullanılacak ödeme tiplerini yönetin</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCreateDefaults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Varsayılan Tipleri Oluştur
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Yeni Ödeme Tipi
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingType ? 'Ödeme Tipi Düzenle' : 'Yeni Ödeme Tipi Ekle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Tipi Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: Kredi Kartı 6 Taksit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sıralama No
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
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
                placeholder="Ödeme tipi hakkında açıklama..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                <Save size={16} />
                {editingType ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                <X size={16} />
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Mevcut Ödeme Tipleri</h3>
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
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödeme Tipi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentTypes.map((type) => (
                  <tr key={type._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {type.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {type.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {type.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {type.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.createdBy?.firstName} {type.createdBy?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(type._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {paymentTypes.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Henüz ödeme tipi eklenmemiş
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTypes;
