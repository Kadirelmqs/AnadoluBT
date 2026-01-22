import { useState, useEffect } from 'react';
import { Users, Settings, Database, Shield } from 'lucide-react';
import { getPendingCouriers, approveCourier, deleteCourier, getCouriers } from '../services/api';
import { toast } from 'sonner';

export default function DeveloperDashboard() {
  const [pendingCouriers, setPendingCouriers] = useState([]);
  const [allCouriers, setAllCouriers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'pending') {
        const data = await getPendingCouriers();
        setPendingCouriers(data);
      } else {
        const data = await getCouriers(false, true);
        setAllCouriers(data);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veri yüklenemedi');
    }
  };

  const handleApprove = async (courierId) => {
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

  const handleDelete = async (courierId, name) => {
    if (!window.confirm(`${name} kuryesini silmek istediğinizden emin misiniz?`)) return;
    
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Onay Bekleyen</p>
              <p className="text-3xl font-bold text-red-700">{pendingCouriers.length}</p>
            </div>
            <Users className="h-12 w-12 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Aktif Kuryeler</p>
              <p className="text-3xl font-bold text-blue-700">{allCouriers.length}</p>
            </div>
            <Shield className="h-12 w-12 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Sistem</p>
              <p className="text-lg font-bold text-purple-700">Online</p>
            </div>
            <Database className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Onay Bekleyenler
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Tüm Kuryeler
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'pending' ? (
          <div className="space-y-4">
            {pendingCouriers.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Onay bekleyen kurye yok</p>
            ) : (
              pendingCouriers.map((courier) => (
                <div key={courier.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-bold">{courier.first_name} {courier.last_name}</h3>
                    <p className="text-sm text-gray-600">{courier.phone_number} - {courier.vehicle_type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(courier.id)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleDelete(courier.id, `${courier.first_name} ${courier.last_name}`)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCouriers.map((courier) => (
              <div key={courier.id} className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-bold">{courier.first_name} {courier.last_name}</h3>
                <p className="text-sm text-gray-600">{courier.phone_number}</p>
                <p className="text-sm text-gray-600">{courier.vehicle_type}</p>
                <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                  courier.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {courier.is_available ? 'Müsait' : 'Meşgul'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
