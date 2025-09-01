import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Download, BarChart3, TrendingUp, DollarSign, Users, Calendar, Trophy, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Reports = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportType, setReportType] = useState('all');

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, reportType]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/statistics';
      const params = new URLSearchParams();
      
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);
      if (reportType !== 'all') params.append('type', reportType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

             const response = await axios.get(url);
       setStatistics(response.data.data);
    } catch (error) {
      toast.error('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    try {
      let url = `/api/reports/${format}`;
      const params = new URLSearchParams();
      
      if (dateRange.start) params.append('start', dateRange.start);
      if (dateRange.end) params.append('end', dateRange.end);
      if (reportType !== 'all') params.append('type', reportType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, { responseType: 'blob' });
      
      const url2 = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url2;
      
      // Dosya uzantısını format'a göre ayarla
      const fileExtension = format === 'excel' ? 'xls' : format;
      const fileName = `prim-raporu-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`${format === 'excel' ? 'Excel' : format.toUpperCase()} raporu indirildi`);
    } catch (error) {
      toast.error('Rapor indirme başarısız');
    }
  };

  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Raporlar ve İstatistikler</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadReport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={20} />
            Excel İndir
          </button>
          <button
            onClick={() => downloadReport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={20} />
            PDF İndir
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Tipi</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">Tüm Veriler</option>
              <option value="weekly">Haftalık</option>
              <option value="monthly">Aylık</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {statistics && (
        <>
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Satış</p>
                                     <p className="text-2xl font-semibold text-gray-900">
                     ₺{parseFloat(statistics?.summary?.totalSales || 0).toLocaleString('tr-TR')}
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Prim</p>
                                     <p className="text-2xl font-semibold text-gray-900">
                     ₺{parseFloat(statistics?.summary?.totalCommission || 0).toLocaleString('tr-TR')}
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Satış Adedi</p>
                                     <p className="text-2xl font-semibold text-gray-900">
                     {statistics?.summary?.salesCount || 0}
                   </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ortalama Satış</p>
                                     <p className="text-2xl font-semibold text-gray-900">
                     ₺{parseFloat(statistics?.summary?.averageSalePrice || 0).toLocaleString('tr-TR')}
                   </p>
                </div>
              </div>
            </div>

            {/* İPTAL SİSTEMİ KALDIRILDI */}
          </div>

        {/* Şampiyonlar */}
        {statistics?.topSalesChampion || statistics?.topCommissionChampion ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Satış Şampiyonu
              </h3>
              {statistics.topSalesChampion ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-2">
                    {statistics.topSalesChampion.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Toplam Satış: ₺{parseFloat(statistics.topSalesChampion.sales).toLocaleString('tr-TR')}</p>
                    <p>Satış Adedi: {statistics.topSalesChampion.count}</p>
                    <p>Toplam Prim: ₺{parseFloat(statistics.topSalesChampion.commission).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">Henüz veri yok</p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" />
                Prim Şampiyonu
              </h3>
              {statistics.topCommissionChampion ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {statistics.topCommissionChampion.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Toplam Prim: ₺{parseFloat(statistics.topCommissionChampion.commission).toLocaleString('tr-TR')}</p>
                    <p>Satış Adedi: {statistics.topCommissionChampion.count}</p>
                    <p>Toplam Satış: ₺{parseFloat(statistics.topCommissionChampion.sales).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center">Henüz veri yok</p>
              )}
            </div>
          </div>
        ) : null}

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                         {/* Aylık Satış Dağılımı */}
             <div className="bg-white p-6 rounded-lg shadow-sm">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Satış Dağılımı</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={statistics?.monthlyData ? Object.entries(statistics.monthlyData).map(([month, data]) => ({
                       name: format(new Date(month + '-01'), 'MMM yyyy', { locale: tr }),
                       value: data.sales,
                       count: data.count,
                       commission: data.commission
                     })) : []}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     outerRadius={80}
                     fill="#8884d8"
                     dataKey="value"
                   >
                     {statistics?.monthlyData ? Object.entries(statistics.monthlyData).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     )) : []}
                   </Pie>
                   <Tooltip 
                     formatter={(value, name, props) => [
                       `₺${parseFloat(value).toLocaleString('tr-TR')}`, 
                       `${props.payload.name}\n${props.payload.count} satış\n₺${parseFloat(props.payload.commission).toLocaleString('tr-TR')} prim`
                     ]} 
                   />
                 </PieChart>
               </ResponsiveContainer>
               
               {/* Renk Açıklamaları */}
               <div className="mt-4 flex flex-wrap gap-3 justify-center">
                 {statistics?.monthlyData ? Object.entries(statistics.monthlyData).map(([month, data], index) => (
                   <div key={month} className="flex items-center gap-2 text-sm">
                     <div 
                       className="w-4 h-4 rounded"
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}
                     />
                     <span className="font-medium">{format(new Date(month + '-01'), 'MMM yyyy', { locale: tr })}</span>
                     <span className="text-gray-600">₺{parseFloat(data.sales).toLocaleString('tr-TR')}</span>
                   </div>
                 )) : null}
               </div>
             </div>

                         {/* Prim Dağılımı */}
             <div className="bg-white p-6 rounded-lg shadow-sm">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Prim Dağılımı</h3>
               <ResponsiveContainer width="100%" height={300}>
                 <PieChart>
                   <Pie
                     data={statistics?.userData ? statistics.userData.map((user, index) => ({
                       name: user.name,
                       value: user.commission,
                       sales: user.sales,
                       count: user.count
                     })) : []}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     outerRadius={80}
                     fill="#8884d8"
                     dataKey="value"
                   >
                     {statistics?.userData ? statistics.userData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     )) : []}
                   </Pie>
                   <Tooltip 
                     formatter={(value, name, props) => [
                       `₺${parseFloat(value).toLocaleString('tr-TR')}`, 
                       `${props.payload.name}\n${props.payload.count} satış\n₺${parseFloat(props.payload.sales).toLocaleString('tr-TR')} satış`
                     ]} 
                   />
                 </PieChart>
               </ResponsiveContainer>
               
               {/* Renk Açıklamaları */}
               <div className="mt-4 flex flex-wrap gap-3 justify-center">
                 {statistics?.userData ? statistics.userData.map((user, index) => (
                   <div key={user.name} className="flex items-center gap-2 text-sm">
                     <div 
                       className="w-4 h-4 rounded"
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}
                     />
                     <span className="font-medium">{user.name}</span>
                     <span className="text-gray-600">₺{parseFloat(user.commission).toLocaleString('tr-TR')}</span>
                     <span className="text-gray-500">({user.count} satış)</span>
                   </div>
                 )) : null}
               </div>
             </div>
          </div>

          {/* Detaylı İstatistikler */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detaylı İstatistikler</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                 <h4 className="font-medium text-gray-700 mb-2">En Yüksek Satış</h4>
                 <p className="text-2xl font-bold text-green-600">
                   ₺{parseFloat(statistics?.summary?.highestSale || 0).toLocaleString('tr-TR')}
                 </p>
                 <p className="text-sm text-gray-500">
                   {statistics?.summary?.highestSaleCustomer || 'N/A'}
                 </p>
               </div>
               
               <div>
                 <h4 className="font-medium text-gray-700 mb-2">En Düşük Satış</h4>
                 <p className="text-2xl font-bold text-red-600">
                   ₺{parseFloat(statistics?.summary?.lowestSale || 0).toLocaleString('tr-TR')}
                 </p>
                 <p className="text-sm text-gray-500">
                   {statistics?.summary?.lowestSaleCustomer || 'N/A'}
                 </p>
               </div>
               
               <div>
                 <h4 className="font-medium text-gray-700 mb-2">Ortalama Prim</h4>
                 <p className="text-2xl font-bold text-blue-600">
                   ₺{parseFloat(statistics?.summary?.averageCommission || 0).toLocaleString('tr-TR')}
                 </p>
                 <p className="text-sm text-gray-500">Satış başına</p>
               </div>
            </div>
          </div>

          {/* Kullanıcı Performansı (Sadece Admin) */}
          {user.role === 'admin' && statistics.userPerformance && (
            <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Performansı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statistics.userPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₺${parseFloat(value).toLocaleString('tr-TR')}`, 'Satış']} />
                  <Legend />
                  <Bar dataKey="sales" fill="#3B82F6" />
                  <Bar dataKey="commission" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
