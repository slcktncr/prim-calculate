import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, Shield } from 'lucide-react';

const SetupAdmin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(null);
  const { setupAdmin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');

  // Sayfa yüklendiğinde admin kontrolü yap
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch('/api/auth/check-admin-exists');
        const data = await response.json();
        setAdminExists(data.adminExists);
        
        // Admin hesabı varsa dashboard'a yönlendir
        if (data.adminExists) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Admin kontrol hatası:', error);
        // Hata durumunda güvenli tarafta kal
        navigate('/login', { replace: true });
      }
    };

    checkAdminExists();
  }, [navigate]);

  const onSubmit = async (data) => {
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

  // Admin kontrolü yapılana kadar loading göster
  if (adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  // Admin hesabı varsa bu sayfa gösterilmez
  if (adminExists) {
    return null;
  }

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
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  Ad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    className={`form-input pl-10 ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Adınız"
                    {...register('firstName', {
                      required: 'Ad alanı gereklidir',
                      minLength: {
                        value: 2,
                        message: 'Ad en az 2 karakter olmalıdır'
                      }
                    })}
                  />
                </div>
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
                  autoComplete="family-name"
                  className={`form-input ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Soyadınız"
                  {...register('lastName', {
                    required: 'Soyad alanı gereklidir',
                    minLength: {
                      value: 2,
                      message: 'Soyad en az 2 karakter olmalıdır'
                    }
                  })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Şifre Tekrar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  {...register('confirmPassword', {
                    required: 'Şifre tekrarı gereklidir',
                    validate: value => value === password || 'Şifreler eşleşmiyor'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors block"
            >
              Zaten hesabınız var mı? Giriş yapın
            </Link>
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
};

export default SetupAdmin;
