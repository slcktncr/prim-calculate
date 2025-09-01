import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import UsersPage from './pages/Users';
import CommissionSettings from './pages/CommissionSettings';
import AgentCommissions from './pages/AgentCommissions';
import SetupAdmin from './pages/SetupAdmin';

// Protected Route bileşeni
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// SetupAdmin Route Koruması - Sadece admin hesabı yokken erişilebilir
const SetupAdminRoute = () => {
  const { user, loading } = useAuth();
  const [adminExists, setAdminExists] = useState(null);

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

    if (!loading) {
      checkAdminExists();
    }
  }, [loading]);

  if (loading || adminExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  // Admin hesabı varsa login'e yönlendir
  if (adminExists) {
    return <Navigate to="/login" replace />;
  }

  // Admin hesabı yoksa SetupAdmin sayfasını göster
  return <SetupAdmin />;
};

// Ana uygulama bileşeni
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup-admin" element={<SetupAdminRoute />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={
          <ProtectedRoute adminOnly>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/commission-settings" element={
          <ProtectedRoute adminOnly>
            <CommissionSettings />
          </ProtectedRoute>
        } />
        <Route path="/agent-commissions" element={
          <ProtectedRoute>
            <AgentCommissions />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

// Ana App bileşeni
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
