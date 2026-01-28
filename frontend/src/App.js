import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PoliciesPage from './pages/PoliciesPage';
import StaffPage from './pages/StaffPage';
import TrainingPage from './pages/TrainingPage';
import SupervisionPage from './pages/SupervisionPage';
import IncidentsPage from './pages/IncidentsPage';
import EmergencyPage from './pages/EmergencyPage';
import OnCallPage from './pages/OnCallPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';

// Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={['admin', 'qp']}>
            <StaffPage />
          </ProtectedRoute>
        } />
        <Route path="/training" element={
          <ProtectedRoute allowedRoles={['admin', 'qp']}>
            <TrainingPage />
          </ProtectedRoute>
        } />
        <Route path="/supervision" element={
          <ProtectedRoute allowedRoles={['admin', 'qp']}>
            <SupervisionPage />
          </ProtectedRoute>
        } />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/oncall" element={<OnCallPage />} />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'qp']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
