import { useState, useEffect } from 'react';
import { Bike, Phone, Truck } from 'lucide-react';
import { getCouriers } from '../services/api';
import { toast } from 'sonner';

export default function CouriersPage() {
  const [couriers, setCouriers] = useState([]);

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      const couriersData = await getCouriers(false, true);
      setCouriers(couriersData);
    } catch (error) {
      console.error('Kuryeler yüklenemedi:', error);
      toast.error('Kuryeler yüklenemedi');
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
          <p className="text-gray-600">Toplam {couriers.length} kurye</p>
        </div>

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

                <div className="space-y-2 text-sm">
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
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Not:</strong> Kurye onaylama ve silme işlemleri için <strong>Admin Panel</strong> sayfasını kullanın.
          </p>
        </div>
      </div>
    </div>
  );
}
