import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShoppingCart } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    vehicle_type: 'Bisiklet',
    vehicle_plate: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginForm.username, loginForm.password);
      
      // Yönlendir
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'courier') {
        navigate('/courier');
      }
    } catch (error) {
      // Toast zaten gösterildi
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerForm);
      setIsLogin(true);
      setRegisterForm({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        vehicle_type: 'Bisiklet',
        vehicle_plate: '',
      });
    } catch (error) {
      // Toast zaten gösterildi
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-orange-600 to-red-600 rounded-full p-4 mb-4">
            <div className="text-white font-bold text-2xl">AB</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Anadolu BT</h1>
          <p className="text-gray-600 mt-2">POS Sistemi</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              isLogin
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="tab-login"
          >
            <LogIn className="h-5 w-5 inline mr-2" />
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              !isLogin
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            data-testid="tab-register"
          >
            <UserPlus className="h-5 w-5 inline mr-2" />
            Kayıt Ol
          </button>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                data-testid="login-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Şifre</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                data-testid="login-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all"
              data-testid="login-submit"
            >
              {loading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          // Register Form
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ad</label>
                <input
                  type="text"
                  value={registerForm.first_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="register-firstname"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Soyad</label>
                <input
                  type="text"
                  value={registerForm.last_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  data-testid="register-lastname"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                data-testid="register-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Şifre</label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                data-testid="register-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon</label>
              <input
                type="tel"
                value={registerForm.phone_number}
                onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
                data-testid="register-phone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Araç Tipi</label>
                <select
                  value={registerForm.vehicle_type}
                  onChange={(e) => setRegisterForm({ ...registerForm, vehicle_type: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  data-testid="register-vehicle-type"
                >
                  <option>Bisiklet</option>
                  <option>Motosiklet</option>
                  <option>Araba</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Plaka</label>
                <input
                  type="text"
                  value={registerForm.vehicle_plate}
                  onChange={(e) => setRegisterForm({ ...registerForm, vehicle_plate: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Opsiyonel"
                  data-testid="register-plate"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all"
              data-testid="register-submit"
            >
              {loading ? 'İşleniyor...' : 'Kayıt Ol'}
            </button>
          </form>
        )}

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 font-semibold mb-1">Demo Giriş:</p>
          <p className="text-xs text-blue-600">Kullanıcı: admin | Şifre: admin123</p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-orange-600">Anadolu BT</span></p>
        </div>
      </div>
    </div>
  );
}