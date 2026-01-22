import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Login Pages
import POSLogin from './pages/login/POSLogin';
import AdminLogin from './pages/login/AdminLogin';
import CourierLogin from './pages/login/CourierLogin';
import DeveloperLogin from './pages/login/DeveloperLogin';

// POS Pages
import POSLayout from './layouts/POSLayout';
import POSScreen from './pages/POSScreen';
import OrdersPage from './pages/OrdersPage';
import CouriersPage from './pages/CouriersPage';
import DashboardPage from './pages/DashboardPage';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import ManagementPage from './pages/ManagementPage';

// Courier Pages
import CourierDashboard from './pages/CourierDashboard';

// Developer Pages
import DeveloperLayout from './layouts/DeveloperLayout';
import DeveloperDashboard from './pages/DeveloperDashboard';

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
    return <Navigate to="/login/pos" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login/pos" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login Routes */}
      <Route path="/login/pos" element={<POSLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/login/courier" element={<CourierLogin />} />
      <Route path="/login/developer" element={<DeveloperLogin />} />
      
      {/* POS Routes */}
      <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin']}><POSLayout><POSScreen /></POSLayout></ProtectedRoute>} />
      <Route path="/pos/orders" element={<ProtectedRoute allowedRoles={['admin']}><POSLayout><OrdersPage /></POSLayout></ProtectedRoute>} />
      <Route path="/pos/couriers" element={<ProtectedRoute allowedRoles={['admin']}><POSLayout><CouriersPage /></POSLayout></ProtectedRoute>} />
      <Route path="/pos/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><POSLayout><DashboardPage /></POSLayout></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/management" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><ManagementPage /></AdminLayout></ProtectedRoute>} />
      
      {/* Courier Routes */}
      <Route path="/courier" element={<ProtectedRoute allowedRoles={['courier']}><CourierDashboard /></ProtectedRoute>} />
      
      {/* Developer Routes */}
      <Route path="/developer" element={<ProtectedRoute allowedRoles={['developer']}><DeveloperLayout><DeveloperDashboard /></DeveloperLayout></ProtectedRoute>} />
      
      {/* Default Redirects */}
      <Route path="/" element={<Navigate to="/login/pos" replace />} />
      <Route path="*" element={<Navigate to="/login/pos" replace />} />
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
