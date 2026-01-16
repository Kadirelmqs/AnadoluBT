import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Bike } from 'lucide-react';
import { getOrders, updateOrderStatus, assignCourierToOrder, getCouriers, downloadReceipt } from '../services/api';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOrders();
    loadCouriers();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const ordersData = await getOrders(statusFilter);
      setOrders(ordersData);
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
      toast.error('Siparişler yüklenemedi');
    }
  };

  const loadCouriers = async () => {
    try {
      const couriersData = await getCouriers(true);
      setCouriers(couriersData);
    } catch (error) {
      console.error('Kuryeler yüklenemedi:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success('Sipariş durumu güncellendi');
      loadOrders();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourier = async (orderId, courierId) => {
    try {
      await assignCourierToOrder(orderId, courierId);
      toast.success('Kurye atandı');
      setSelectedOrderForCourier(null);
      loadOrders();
      loadCouriers();
    } catch (error) {
      console.error('Kurye atama hatası:', error);
      toast.error(error.response?.data?.detail || 'Kurye atanamadı');
    }
  };

  const handleDownloadReceipt = async (orderId) => {
    try {
      const pdfBlob = await downloadReceipt(orderId);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fis-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Fiş indirildi');
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      toast.error('Fiş indirilemedi');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Bekliyor',
      preparing: 'Hazırlanıyor',
      ready: 'Hazır',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Siparişler</h2>
        
        {/* Durum Filtreleri */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === null
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="filter-all"
          >
            Tümü
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="filter-pending"
          >
            Bekliyor
          </button>
          <button
            onClick={() => setStatusFilter('preparing')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'preparing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="filter-preparing"
          >
            Hazırlanıyor
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === 'ready'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="filter-ready"
          >
            Hazır
          </button>
        </div>

        {/* Sipariş Listesi */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Sipariş bulunamadı</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all"
                data-testid={`order-${order.order_number}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Sipariş Detayları */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tip:</span>
                    <span className="ml-2 font-medium">{order.order_type === 'dine-in' ? 'İçeride' : order.order_type === 'takeaway' ? 'Paket' : 'Gel-Al'}</span>
                  </div>
                  {order.table_name && (
                    <div>
                      <span className="text-gray-600">Masa:</span>
                      <span className="ml-2 font-medium">{order.table_name}</span>
                    </div>
                  )}
                  {order.courier_name && (
                    <div>
                      <span className="text-gray-600">Kurye:</span>
                      <span className="ml-2 font-medium">{order.courier_name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Toplam:</span>
                    <span className="ml-2 font-bold text-orange-600">{order.total_amount.toFixed(2)} ₺</span>
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

                {/* Aksiyonlar */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                      data-testid={`start-preparing-${order.order_number}`}
                    >
                      Hazırlanmaya Başla
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready')}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                      data-testid={`mark-ready-${order.order_number}`}
                    >
                      Hazır Olarak İşaretle
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'delivered')}
                      disabled={loading}
                      className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all disabled:opacity-50"
                      data-testid={`mark-delivered-${order.order_number}`}
                    >
                      Teslim Edildi
                    </button>
                  )}
                  {['pending', 'preparing'].includes(order.status) && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                      data-testid={`cancel-${order.order_number}`}
                    >
                      İptal Et
                    </button>
                  )}
                  {order.order_type === 'delivery' && !order.courier_id && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => setSelectedOrderForCourier(order.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center"
                      data-testid={`assign-courier-${order.order_number}`}
                    >
                      <Bike className="h-4 w-4 mr-2" />
                      Kurye Ata
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadReceipt(order.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                    data-testid={`download-receipt-${order.order_number}`}
                  >
                    Fiş İndir
                  </button>
                </div>

                {/* Kurye Seçim Modal */}
                {selectedOrderForCourier === order.id && (
                  <div className="mt-4 bg-white border-2 border-purple-600 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Kurye Seçin:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {couriers.map((courier) => (
                        <button
                          key={courier.id}
                          onClick={() => handleAssignCourier(order.id, courier.id)}
                          className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-all text-left"
                          data-testid={`select-courier-${courier.first_name.toLowerCase()}`}
                        >
                          <div className="font-medium">{courier.first_name} {courier.last_name}</div>
                          <div className="text-xs">{courier.vehicle_type}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedOrderForCourier(null)}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      İptal
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}