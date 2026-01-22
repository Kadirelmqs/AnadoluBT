import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AdminNavigation() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/admin', icon: Users, label: 'Admin Panel' },
    { path: '/admin/management', icon: Settings, label: 'Yönetim' },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-white" />
            <span className="text-white font-bold text-xl">Admin Panel - Anadolu BT</span>
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
                    isActive ? 'bg-white text-blue-600 shadow-md' : 'text-white hover:bg-white/20'
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

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {children}
      </div>
      <footer className="bg-white border-t py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-blue-600">Anadolu BT</span></p>
        </div>
      </footer>
    </div>
  );
}