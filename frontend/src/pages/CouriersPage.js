import { useState, useEffect } from 'react';
import { Bike, Plus, Phone, Truck } from 'lucide-react';
import { getCouriers, createCourier, updateCourierAvailability } from '../services/api';
import { toast } from 'sonner';

export default function CouriersPage() {
  const [couriers, setCouriers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    vehicle_type: 'Bisiklet',
    vehicle_plate: '',
  });

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      const couriersData = await getCouriers();
      setCouriers(couriersData);
    } catch (error) {
      console.error('Kuryeler yüklenemedi:', error);
      toast.error('Kuryeler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCourier(formData);
      toast.success('Kurye eklendi');
      setShowAddForm(false);
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        vehicle_type: 'Bisiklet',
        vehicle_plate: '',
      });
      loadCouriers();
    } catch (error) {
      console.error('Kurye ekleme hatası:', error);
      toast.error('Kurye eklenemedi');
    }
  };

  const handleToggleAvailability = async (courierId, currentStatus) => {
    try {
      await updateCourierAvailability(courierId, !currentStatus);
      toast.success('Kurye durumu güncellendi');
      loadCouriers();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const getVehicleIcon = (vehicleType) => {
    if (vehicleType === 'Motosiklet') return '🏍️';
    if (vehicleType === 'Araba') return '🚗';
    return '🚲';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Kuryeler</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all flex items-center"
            data-testid="add-courier-btn"
          >
            <Plus className="h-5 w-5 mr-2" />
            Kurye Ekle
          </button>
        </div>

        {/* Kurye Ekleme Formu */}
        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">Yeni Kurye Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="courier-first-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Soyad</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="courier-last-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="courier-phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Araç Tipi</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  data-testid="courier-vehicle-type"
                >
                  <option>Bisiklet</option>
                  <option>Motosiklet</option>
                  <option>Araba</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Plaka (Opsiyonel)</label>
                <input
                  type="text"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  data-testid="courier-plate"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all"
                  data-testid="submit-courier"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-all"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kurye Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-12">
              <Bike className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Henüz kurye eklenmedi</p>
            </div>
          ) : (
            couriers.map((courier) => (
              <div
                key={courier.id}
                className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-all ${
                  courier.is_available ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                }`}
                data-testid={`courier-card-${courier.first_name.toLowerCase()}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="text-4xl mr-3">{getVehicleIcon(courier.vehicle_type)}</div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {courier.first_name} {courier.last_name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          courier.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {courier.is_available ? 'Müsait' : 'Meşgul'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-4 w-4 mr-2" />
                    {courier.phone_number}
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Truck className="h-4 w-4 mr-2" />
                    {courier.vehicle_type}
                    {courier.vehicle_plate && ` - ${courier.vehicle_plate}`}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAvailability(courier.id, courier.is_available)}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    courier.is_available
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  data-testid={`toggle-availability-${courier.first_name.toLowerCase()}`}
                >
                  {courier.is_available ? 'Meşgul Yap' : 'Müsait Yap'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}