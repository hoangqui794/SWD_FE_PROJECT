import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SitesPage from './pages/SitesPage';
import HubsPage from './pages/HubsPage';
import SensorsPage from './pages/SensorsPage';
import AlertsPage from './pages/AlertsPage';
import UsersPage from './pages/UsersPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes - Accessible by all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Role Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STAFF']} />}>
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/hubs" element={<HubsPage />} />
            <Route path="/sensors" element={<SensorsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
