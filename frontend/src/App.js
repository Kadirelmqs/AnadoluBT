import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, Users, Bike, Settings, BarChart3 } from 'lucide-react';
import POSScreen from './pages/POSScreen';
import OrdersPage from './pages/OrdersPage';
import CouriersPage from './pages/CouriersPage';
import ManagementPage from './pages/ManagementPage';
import DashboardPage from './pages/DashboardPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'POS' },
    { path: '/orders', icon: Package, label: 'Siparişler' },
    { path: '/couriers', icon: Bike, label: 'Kuryeler' },
    { path: '/dashboard', icon: BarChart3, label: 'İstatistikler' },
    { path: '/management', icon: Settings, label: 'Yönetim' },
  ];
  
  return (
    <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-8 w-8 text-white" />
            <span className="text-white font-bold text-xl">Döner Restoranı POS</span>
          </div>
          
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-orange-600 shadow-md'
                      : 'text-white hover:bg-white/20'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<POSScreen />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/couriers" element={<CouriersPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/management" element={<ManagementPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;