import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Shield } from 'lucide-react';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const { login, setupAdmin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Admin hesabı var mı kontrol et
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch('/api/auth/check-admin-exists');
        const data = await response.json();
        setAdminExists(data.adminExists);
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        setAdminExists(true); // Hata durumunda güvenli tarafta kal
      }
    };

    checkAdminExists();
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await setupAdmin(data);
      if (result.success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Admin kayıt formu
  if (showAdminForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Admin Hesabı Oluştur
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sistem için ilk admin hesabını oluşturun
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                Bu sayfa sadece sistemde hiç admin hesabı yokken kullanılabilir.
                Admin hesabı oluşturduktan sonra bu sayfa erişilemez olacaktır.
              </p>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onAdminSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  Ad
                </label>
                <input
                  id="firstName"
                  type="text"
                  className={`form-input ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Adınız"
                  {...register('firstName', {
                    required: 'Ad gereklidir'
                  })}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Soyad
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Soyadınız"
                  {...register('lastName', {
                    required: 'Soyad gereklidir'
                  })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="adminEmail" className="form-label">
                  Email Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="adminEmail"
                    type="email"
                    className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="admin@email.com"
                    {...register('email', {
                      required: 'Email adresi gereklidir',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Geçerli bir email adresi giriniz'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="adminPassword" className="form-label">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Şifre gereklidir',
                      minLength: {
                        value: 8,
                        message: 'Şifre en az 8 karakter olmalıdır'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Admin Yetkileri
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tüm satış verilerine erişim</li>
                      <li>Kullanıcı yönetimi</li>
                      <li>Sistem ayarları</li>
                      <li>Rapor oluşturma</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="spinner h-5 w-5 mr-2"></div>
                ) : null}
                {isLoading ? 'Admin hesabı oluşturuluyor...' : 'Admin Hesabı Oluştur'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowAdminForm(false)}
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors block"
              >
                ← Giriş sayfasına dön
              </button>
              <Link
                to="/register"
                className="text-sm text-gray-500 hover:text-gray-400 transition-colors block"
              >
                Normal kullanıcı hesabı oluştur
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Prim hesaplama sistemine hoş geldiniz
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="ornek@email.com"
                  {...register('email', {
                    required: 'Email adresi gereklidir',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir email adresi giriniz'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <div className="spinner h-5 w-5 mr-2"></div>
              ) : null}
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors block"
            >
              Hesabınız yok mu? Kayıt olun
            </Link>
            
            {/* Admin hesabı yoksa admin kayıt linki göster */}
            {adminExists === false && (
              <button
                type="button"
                onClick={() => setShowAdminForm(true)}
                className="text-sm text-purple-600 hover:text-purple-500 transition-colors block"
              >
                Admin hesabı oluştur
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
