import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Code } from 'lucide-react';

export default function DeveloperLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.role === 'developer') {
        navigate('/developer');
      } else {
        alert('Bu panel sadece geliştirici yetkisi olan kullanıcılar içindir');
      }
    } catch (error) {
      // Toast zaten gösterildi
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-red-600 to-pink-600 rounded-full p-4 mb-4">
            <Code className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Geliştirici Giriş</h1>
          <p className="text-gray-600 mt-2">Anadolu BT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Şifre</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-800 font-semibold mb-1">Demo Giriş:</p>
          <p className="text-xs text-red-600">developer / dev123</p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Powered by <span className="font-semibold text-red-600">Anadolu BT</span></p>
        </div>
      </div>
    </div>
  );
}