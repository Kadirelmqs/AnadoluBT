import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Package, Users, Clock, CheckCircle } from 'lucide-react';
import { getDashboardStats } from '../services/api';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Her 30 saniyede bir yenile
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getDashboardStats();
      setStats(statsData);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">İstatistikler</h2>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Bugünkü Gelir */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-600 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-green-700 mb-1">Bugünkü Gelir</h3>
            <p className="text-3xl font-bold text-green-900" data-testid="today-revenue">
              {stats?.today_revenue?.toFixed(2) || '0.00'} ₺
            </p>
          </div>

          {/* Bugünkü Siparişler */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-600 rounded-lg p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-700 mb-1">Bugünkü Siparişler</h3>
            <p className="text-3xl font-bold text-blue-900" data-testid="today-orders">
              {stats?.today_orders || 0}
            </p>
          </div>

          {/* Bekleyen Siparişler */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-yellow-600 rounded-lg p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-yellow-700 mb-1">Bekleyen</h3>
            <p className="text-3xl font-bold text-yellow-900" data-testid="pending-orders">
              {stats?.pending_orders || 0}
            </p>
          </div>

          {/* Hazırlanan Siparişler */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-purple-600 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-700 mb-1">Hazırlanıyor</h3>
            <p className="text-3xl font-bold text-purple-900" data-testid="preparing-orders">
              {stats?.preparing_orders || 0}
            </p>
          </div>

          {/* Dolu Masalar */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-red-600 rounded-lg p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-red-700 mb-1">Dolu Masalar</h3>
            <p className="text-3xl font-bold text-red-900" data-testid="occupied-tables">
              {stats?.occupied_tables || 0}
            </p>
          </div>

          {/* Müsait Kuryeler */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border-2 border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-teal-600 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-teal-700 mb-1">Müsait Kuryeler</h3>
            <p className="text-3xl font-bold text-teal-900" data-testid="available-couriers">
              {stats?.available_couriers || 0}
            </p>
          </div>

          {/* Toplam Siparişler */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-gray-600 rounded-lg p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Toplam Sipariş</h3>
            <p className="text-3xl font-bold text-gray-900" data-testid="total-orders">
              {stats?.total_orders || 0}
            </p>
          </div>
        </div>

        {/* Son Güncelleme */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>
    </div>
  );
}