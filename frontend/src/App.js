import { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, ShoppingCart, Package, Users, Bike, Settings, BarChart3 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import POSScreen from './pages/POSScreen';
import OrdersPage from './pages/OrdersPage';
import CouriersPage from './pages/CouriersPage';
import ManagementPage from './pages/ManagementPage';
import DashboardPage from './pages/DashboardPage';
import CourierDashboard from './pages/CourierDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-500">Yükleniyor...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Navigation for Admin
function AdminNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'POS' },
    { path: '/orders', icon: Package, label: 'Siparişler' },
    { path: '/couriers', icon: Bike, label: 'Kuryeler' },
    { path: '/dashboard', icon: BarChart3, label: 'İstatistikler' },
    { path: '/management', icon: Settings, label: 'Yönetim' },
    { path: '/admin', icon: Users, label: 'Admin Panel' },
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

// Admin Routes Layout
function AdminLayout({ children }) {
  return (
    <div className="App min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Courier Routes */}
      <Route
        path="/courier"
        element={
          <ProtectedRoute allowedRoles={['courier']}>
            <CourierDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* POS Routes (Admin only) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <POSScreen />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <OrdersPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/couriers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <CouriersPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout>
              <ManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      
      {/* Default Redirect */}
      <Route
        path="*"
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/" replace /> : <Navigate to="/courier" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
