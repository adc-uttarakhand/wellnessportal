import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NewApplicationPage from './pages/NewApplicationPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminBudgetPage from './pages/AdminBudgetPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import YogaCentreDirectoryPage from './pages/YogaCentreDirectoryPage';
import CapitalSubsidyApplicationPage from './pages/CapitalSubsidyApplicationPage';
import ResearchGrantPage from './pages/ResearchGrantPage';
import Layout from './components/shared/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  if (!user || !['STATE_ADMIN', 'DISTRICT_ADMIN'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/new/:scheme" element={<NewApplicationPage />} />
        <Route path="applications/apply/capital-subsidy" element={<CapitalSubsidyApplicationPage />} />
        <Route path="applications/apply/research-grant" element={<ResearchGrantPage />} />
        <Route path="applications/:id/status" element={<ApplicationStatusPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="registration" element={<RegistrationPage />} />
        <Route path="yoga-centres" element={<YogaCentreDirectoryPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="admin/budget" element={<AdminRoute><AdminBudgetPage /></AdminRoute>} />
        <Route path="admin/registrations" element={<AdminRoute><AdminRegistrationsPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
