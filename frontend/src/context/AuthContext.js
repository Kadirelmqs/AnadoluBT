import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin, register as apiRegister } from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await apiLogin({ username, password });
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
      toast.success('Giriş başarılı');
      return data.user;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Giriş başarısız');
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      await apiRegister(formData);
      toast.success('Kayıt başarılı! Yönetici onayı bekleniyor.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Çıkış yapıldı');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};