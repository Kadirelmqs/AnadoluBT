import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, XCircle, Download, TrendingUp, 
  DollarSign, Package, LogOut, Calendar, Lock, Bike
} from 'lucide-react';
import {
  getPendingCouriers, approveCourier, deleteCourier,
  getCouriers, getMonthlyStats, getYearlyStats, exportOrders,
  exportDailyAndClear, getCourierStats
} from '../services/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCouriers, setPendingCouriers] = useState([]);
  const [approvedCouriers, setApprovedCouriers] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [courierStats, setCourierStats] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'pending') {
        const data = await getPendingCouriers();
        setPendingCouriers(data);
      } else if (activeTab === 'approved') {
        const data = await getCouriers(false, true);
        setApprovedCouriers(data);
      } else if (activeTab === 'stats') {
        const [monthly, yearly, couriers] = await Promise.all([
          getMonthlyStats(),
          getYearlyStats(),
          getCourierStats()
        ]);
        setMonthlyStats(monthly);
        setYearlyStats(yearly);
        setCourierStats(couriers);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const checkPassword = () => {
    if (password === '1234') {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setPassword('');
      toast.success('Admin paneline erişim sağlandı');
    } else {
      toast.error('Hatalı şifre!');
      setPassword('');
    }
  };

  const handleTabClick = (tab) => {
    if (!isUnlocked) {
      setShowPasswordModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleApproveCourier = async (courierId) => {
    setLoading(true);
    try {
      await approveCourier(courierId);
      toast.success('Kurye onaylandı!');
      loadData();
    } catch (error) {
      toast.error('Onaylama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourier = async (courierId, courierName) => {
    if (!window.confirm(`${courierName} kuryesini silmek istediğinizden emin misiniz?`)) return;
    
    setLoading(true);
    try {
      await deleteCourier(courierId);
      toast.success('Kurye silindi');
      loadData();
    } catch (error) {
      toast.error('Silme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (month = null) => {
    try {
      const blob = await exportOrders(month);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `siparisler-${month || 'tum'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Rapor indirildi!');
    } catch (error) {
      toast.error('İndirme başarısız');
    }
  };

  const handleDailyExport = async () => {
    if (!window.confirm('Gün sonu raporunu indirip bugünün siparişlerini silmek istediğinizden emin misiniz?')) return;
    
    try {
      const blob = await exportDailyAndClear();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.download = `gun-sonu-${today}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Gün sonu raporu indirildi ve siparişler temizlendi!');
      loadData(); // Reload stats
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İndirme başarısız');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToPOS = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold">Admin Panel Şifresi</h2>
              <p className="text-gray-600 mt-2">Devam etmek için şifre girin</p>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              placeholder="Şifre"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              autoFocus
              data-testid="admin-password-input"
            />
            <div className="flex gap-2">
              <button
                onClick={checkPassword}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                data-testid="admin-password-submit"
              >
                Onayla
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
              >
                İptal
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Demo şifre: 1234
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-2xl font-bold">Yönetim Paneli</h1>
              <p className="text-white/90 text-sm">Hoş geldin, {user?.username}!</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGoToPOS}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
                data-testid="go-to-pos"
              >
                POS'a Git
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all flex items-center"
                data-testid="logout-btn"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-pending"
          >
            <Users className="h-5 w-5 inline mr-2" />
            Onay Bekleyenler ({pendingCouriers.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'approved'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-approved"
          >
            <CheckCircle className="h-5 w-5 inline mr-2" />
            Kuryeler ({approvedCouriers.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-stats"
          >
            <TrendingUp className="h-5 w-5 inline mr-2" />
            İstatistikler
          </button>
        </div>

        {/* Onay Bekleyenler */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingCouriers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Onay bekleyen kurye yok</p>
              </div>
            ) : (
              pendingCouriers.map((courier) => (
                <div
                  key={courier.id}
                  className="bg-white rounded-lg shadow-md p-6"
                  data-testid={`pending-${courier.first_name.toLowerCase()}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl">{courier.first_name} {courier.last_name}</h3>
                      <p className="text-gray-600">{courier.phone_number}</p>
                      <p className="text-sm text-gray-500">{courier.vehicle_type} {courier.vehicle_plate && `- ${courier.vehicle_plate}`}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Kayıt: {new Date(courier.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveCourier(courier.id)}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all flex items-center"
                        data-testid={`approve-${courier.first_name.toLowerCase()}`}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Onayla
                      </button>
                      <button
                        onClick={() => handleDeleteCourier(courier.id, `${courier.first_name} ${courier.last_name}`)}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all flex items-center"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onaylı Kuryeler */}
        {activeTab === 'approved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedCouriers.map((courier) => (
              <div
                key={courier.id}
                className="bg-white rounded-lg shadow-md p-6"
                data-testid={`courier-${courier.first_name.toLowerCase()}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{courier.first_name} {courier.last_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      courier.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {courier.is_available ? 'Müsait' : 'Meşgul'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCourier(courier.id, `${courier.first_name} ${courier.last_name}`)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800"
                    data-testid={`delete-${courier.first_name.toLowerCase()}`}
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{courier.phone_number}</p>
                <p className="text-sm text-gray-500">{courier.vehicle_type}</p>
                {courier.vehicle_plate && <p className="text-sm text-gray-500">Plaka: {courier.vehicle_plate}</p>}
              </div>
            ))}
          </div>
        )}

        {/* İstatistikler */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Aylık & Yıllık İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aylık */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Aylık Rapor
                  </h3>
                  <span className="text-sm text-gray-500">{monthlyStats?.month}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Toplam Sipariş</p>
                        <p className="text-2xl font-bold">{monthlyStats?.total_orders || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Toplam Ciro</p>
                        <p className="text-2xl font-bold text-green-600">
                          {monthlyStats?.total_revenue?.toFixed(2) || '0.00'} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Ortalama Sipariş</p>
                        <p className="text-xl font-bold">
                          {monthlyStats?.average_order?.toFixed(2) || '0.00'} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(monthlyStats?.month)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center"
                  data-testid="export-monthly"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Excel İndir
                </button>
              </div>

              {/* Yıllık */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                    Yıllık Rapor
                  </h3>
                  <span className="text-sm text-gray-500">{yearlyStats?.year}</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Toplam Sipariş</p>
                        <p className="text-2xl font-bold">{yearlyStats?.total_orders || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Toplam Ciro</p>
                        <p className="text-2xl font-bold text-green-600">
                          {yearlyStats?.total_revenue?.toFixed(2) || '0.00'} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Ortalama Sipariş</p>
                        <p className="text-xl font-bold">
                          {yearlyStats?.average_order?.toFixed(2) || '0.00'} ₺
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(null)}
                  className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-all flex items-center justify-center"
                  data-testid="export-yearly"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Tüm Zamanlar (Excel)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
