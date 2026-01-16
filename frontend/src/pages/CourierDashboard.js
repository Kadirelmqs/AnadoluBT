import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Package, CheckCircle, XCircle, MapPin, Phone, User, LogOut, TrendingUp, DollarSign } from 'lucide-react';
import { getPackages, getMyOrders, takeOrder, deliverOrder, cancelOrderCourier, getMyStats } from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function CourierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('packages');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadStats();
    // Her 30 saniyede bir yenile
    const interval = setInterval(() => {
      loadData();
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'packages') {
        const packagesData = await getPackages();
        setPackages(packagesData);
      } else {
        const ordersData = await getMyOrders();
        setMyOrders(ordersData);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getMyStats();
      setStats(statsData);
    } catch (error) {
      console.error('İstatistik yükleme hatası:', error);
    }
  };

  const handleTakeOrder = async (orderId) => {
    setLoading(true);
    try {
      await takeOrder(orderId);
      toast.success('Sipariş alındı!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Sipariş alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverOrder = async (orderId) => {
    setLoading(true);
    try {
      await deliverOrder(orderId);
      toast.success('Sipariş teslim edildi!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return;
    
    setLoading(true);
    try {
      await cancelOrderCourier(orderId);
      toast.success('Sipariş iptal edildi');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İptal başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-white text-2xl font-bold">Kurye Paneli</h1>
              <p className="text-white/90 text-sm">Hoş geldin, {user?.username}!</p>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* İstatistikler */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg p-3 mr-3">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bugünkü Teslimat</p>
                <p className="text-2xl font-bold text-green-600" data-testid="deliveries-today">
                  {stats?.deliveries_today || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg p-3 mr-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bugünkü Gelir</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="revenue-today">
                  {stats?.revenue_today?.toFixed(2) || '0.00'} ₺
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'packages'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-packages"
          >
            <Package className="h-5 w-5 inline mr-2" />
            Paketler ({packages.length})
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'my-orders'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            data-testid="tab-my-orders"
          >
            <CheckCircle className="h-5 w-5 inline mr-2" />
            Siparişlerim ({myOrders.length})
          </button>
        </div>

        {/* Paketler */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            {packages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Henüz müsait paket yok</p>
              </div>
            ) : (
              packages.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all"
                  data-testid={`package-${order.order_number}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-orange-600">{order.order_number}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {order.total_amount.toFixed(2)} ₺
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Paket
                      </span>
                    </div>
                  </div>

                  {/* Müşteri Bilgileri */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{order.customer_name || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{order.customer_phone || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-start text-gray-700">
                      <MapPin className="h-4 w-4 mr-2 mt-1" />
                      <span>{order.customer_address || 'Adres belirtilmemiş'}</span>
                    </div>
                  </div>

                  {/* Ürünler */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Ürünler:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-medium">{(item.quantity * item.price).toFixed(2)} ₺</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                      <p className="text-sm text-yellow-800"><strong>Not:</strong> {order.notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleTakeOrder(order.id)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all"
                    data-testid={`take-order-${order.order_number}`}
                  >
                    {loading ? 'İşleniyor...' : 'Siparişi Al'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Siparişlerim */}
        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Henüz aktif siparişin yok</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-orange-300"
                  data-testid={`my-order-${order.order_number}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-orange-600">{order.order_number}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {order.total_amount.toFixed(2)} ₺
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {order.status === 'preparing' ? 'Hazırlanıyor' : 'Hazır'}
                      </span>
                    </div>
                  </div>

                  {/* Müşteri Bilgileri */}
                  <div className="bg-orange-50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{order.customer_name || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{order.customer_phone || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-start text-gray-700">
                      <MapPin className="h-4 w-4 mr-2 mt-1" />
                      <span>{order.customer_address || 'Adres belirtilmemiş'}</span>
                    </div>
                  </div>

                  {/* Ürünler */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Ürünler:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span className="font-medium">{(item.quantity * item.price).toFixed(2)} ₺</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                      <p className="text-sm text-yellow-800"><strong>Not:</strong> {order.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeliverOrder(order.id)}
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center"
                      data-testid={`deliver-${order.order_number}`}
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {loading ? 'İşleniyor...' : 'Teslim Edildi'}
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={loading}
                      className="px-4 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center"
                      data-testid={`cancel-${order.order_number}`}
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
