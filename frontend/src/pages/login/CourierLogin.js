import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bike, UserPlus } from 'lucide-react';

export default function CourierLogin() {
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
      if (user.role === 'courier') {
        navigate('/courier');
      } else {
        alert('Bu panel sadece kurye yetkisi olan kullanıcılar içindir');
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
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-600 to-teal-600 rounded-full p-4 mb-4">
            <Bike className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Kurye Giriş</h1>
          <p className="text-gray-600 mt-2">Anadolu BT</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              isLogin
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-semibold ${
              !isLogin
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <UserPlus className="h-5 w-5 inline mr-2" />
            Kayıt Ol
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Ad" value={registerForm.first_name} onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
              <input type="text" placeholder="Soyad" value={registerForm.last_name} onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
            </div>
            <input type="text" placeholder="Kullanıcı Adı" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
            <input type="password" placeholder="Şifre" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
            <input type="tel" placeholder="Telefon" value={registerForm.phone_number} onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" required />
            <select value={registerForm.vehicle_type} onChange={(e) => setRegisterForm({ ...registerForm, vehicle_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"><option>Bisiklet</option><option>Motosiklet</option><option>Araba</option></select>
            <input type="text" placeholder="Plaka (Opsiyonel)" value={registerForm.vehicle_plate} onChange={(e) => setRegisterForm({ ...registerForm, vehicle_plate: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" />
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">{loading ? 'İşleniyor...' : 'Kayıt Ol'}</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-green-600">Anadolu BT</span></p>
        </div>
      </div>
    </div>
  );
}