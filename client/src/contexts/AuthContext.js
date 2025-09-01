import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Axios interceptor - her istekte token ekle
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Kullanıcı bilgilerini getir
  const fetchUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde kullanıcı bilgilerini getir
  useEffect(() => {
    fetchUser();
  }, [token]);

  // Giriş yap
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      
      toast.success('Giriş başarılı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Giriş yapılırken hata oluştu';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Kayıt ol
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { user: newUser, token: newToken } = response.data.data;
      
      setUser(newUser);
      setToken(newToken);
      
      toast.success('Kayıt başarılı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Kayıt olurken hata oluştu';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Admin kurulumu
  const setupAdmin = async (adminData) => {
    try {
      const response = await axios.post('/api/auth/setup-admin', adminData);
      const { user: adminUser, token: newToken } = response.data.data;
      
      setUser(adminUser);
      setToken(newToken);
      
      toast.success('Admin hesabı başarıyla oluşturuldu!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Admin hesabı oluşturulurken hata oluştu';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Çıkış yap
  const logout = () => {
    setUser(null);
    setToken(null);
    toast.success('Çıkış yapıldı');
  };

  // Kullanıcı güncelle
  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    setupAdmin,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
