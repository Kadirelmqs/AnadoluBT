import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Package, Bike, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function POSNavigation() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/pos', icon: Home, label: 'POS' },
    { path: '/pos/orders', icon: Package, label: 'Siparişler' },
    { path: '/pos/couriers', icon: Bike, label: 'Kuryeler' },
    { path: '/pos/dashboard', icon: BarChart3, label: 'İstatistikler' },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login/pos');
  };
  
  return (
    <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-full p-2">
              <span className="text-orange-600 font-bold text-lg">POS</span>
            </div>
            <span className="text-white font-bold text-xl">Anadolu BT POS</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-white text-orange-600 shadow-md' : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium hidden md:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function POSLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <POSNavigation />
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {children}
      </div>
      <footer className="bg-white border-t py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-orange-600">Anadolu BT</span></p>
        </div>
      </footer>
    </div>
  );
}