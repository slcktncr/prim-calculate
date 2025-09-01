import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, salesResponse] = await Promise.all([
        axios.get('/api/reports/statistics'),
        axios.get('/api/sales?limit=5')
      ]);

      setStats(statsResponse.data.data);
      setRecentSales(salesResponse.data.data.sales);
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hoş geldin, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Bugün {format(new Date(), 'EEEE, d MMMM yyyy', { locale: tr })}
        </p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Toplam Satış"
          value={stats?.summary?.salesCount || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Toplam Satış Tutarı"
          value={formatCurrency(stats?.summary?.totalSales || 0)}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Toplam Prim"
          value={formatCurrency(stats?.summary?.totalCommission || 0)}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Ortalama Satış"
          value={formatCurrency(stats?.summary?.averageSalePrice || 0)}
          icon={BarChart3}
          color="bg-orange-500"
        />
      </div>

      {/* Grafik ve son satışlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık satış grafiği */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Satış Trendi</h3>
          {stats?.monthlyData && Object.keys(stats.monthlyData).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.monthlyData)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {format(new Date(month + '-01'), 'MMMM yyyy', { locale: tr })}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-900">
                        {data.count} satış
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(data.commission)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Henüz satış verisi bulunmuyor</p>
          )}
        </div>

        {/* Son satışlar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Satışlar</h3>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {sale.customerName} {sale.customerSurname}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sale.blockNumber}/{sale.apartmentNumber} - {sale.contractNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(sale.commission)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(sale.saleDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Henüz satış verisi bulunmuyor</p>
          )}
        </div>
      </div>

      {/* Temsilci performansı (sadece admin için) */}
      {isAdmin && stats?.userData && stats.userData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Temsilci Performansı</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Satış Sayısı</th>
                  <th>Toplam Satış</th>
                  <th>Toplam Prim</th>
                </tr>
              </thead>
              <tbody>
                {stats.userData.map((user) => (
                  <tr key={user.name}>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.count}</td>
                    <td>{formatCurrency(user.sales)}</td>
                    <td className="text-green-600 font-medium">
                      {formatCurrency(user.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hızlı işlemler */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/sales'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center cursor-pointer"
          >
            <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Yeni Satış Ekle</p>
            <p className="text-xs text-gray-500">Satış bilgilerini girin</p>
          </button>
          <button 
            onClick={() => window.location.href = '/reports'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center cursor-pointer"
          >
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Rapor Oluştur</p>
            <p className="text-xs text-gray-500">Excel veya PDF formatında</p>
          </button>
          <button 
            onClick={() => window.location.href = '/sales'}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center cursor-pointer"
          >
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Tarih Filtrele</p>
            <p className="text-xs text-gray-500">Belirli dönemleri inceleyin</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
