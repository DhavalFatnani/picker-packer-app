import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, hasAnyRole } from './utils/auth';
import type { Role } from '@pp/shared';
import LoginPage from './pages/LoginPage';
import OpsAdminLoginPage from './pages/OpsAdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import PickerPackerDashboardPage from './pages/PickerPackerDashboardPage';
import ASMDashboardPage from './pages/ASMDashboardPage';
import GuardDashboardPage from './pages/GuardDashboardPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import GeofenceManagementPage from './pages/GeofenceManagementPage';

/**
 * Protected route component
 */
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: Role[] 
}) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<OpsAdminLoginPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/picker-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['PickerPacker']}>
            <PickerPackerDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/asm-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ASM']}>
            <ASMDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/guard-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['Guard']}>
            <GuardDashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['StoreManager', 'OpsAdmin']}>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/approvals" 
        element={
          <ProtectedRoute allowedRoles={['ASM', 'OpsAdmin']}>
            <PendingApprovalsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/geofence" 
        element={
          <ProtectedRoute allowedRoles={['OpsAdmin']}>
            <GeofenceManagementPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
