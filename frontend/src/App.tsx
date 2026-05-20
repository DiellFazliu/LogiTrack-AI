// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { Layout } from './components/shared/Layout';
import { RoleBasedDashboard } from './components/RoleBaseDashboard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { CustomerDashboard } from './pages/costumer/CostumerDashboard';
import { CreateShipment } from './pages/costumer/CreateShipment';
import { TrackShipment } from './pages/costumer/TrackShipment';
import { ShipmentHistory } from './pages/costumer/ShipmentHistory';

// Driver Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { MyShipments } from './pages/driver/MyShipments';
import { UpdateLocation } from './pages/driver/UpdateLocation';

// Dispatcher Pages
import { DispatcherDashboard } from './pages/dispatcher/DispatcherDashboard';
import { ShipmentList } from './pages/dispatcher/ShipmentList';
import { AssignDriver } from './pages/dispatcher/AssignDriver';

// Company Admin Pages
import { CompanyDashboard } from './pages/company-admin/CompanyDashboard';
import { CompanyUsersList } from './pages/company-admin/CompanyUsersList';
import { DriversList } from './pages/company-admin/DriversList';

// Super Admin Pages
import { SuperAdminDashboard } from './pages/super_admin/SuperAdminDashboard';
import { OrganizationsList } from './pages/super_admin/OrganizationList';

import { RouteOptimizerPage } from './pages/driver/RouteOptimizerPage';


function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>

      <Route 
        path="/driver/route-optimizer" 
        element={
          <ProtectedRoute roles={['driver', 'super_admin']}>
            <RouteOptimizerPage />
          </ProtectedRoute>
        } 
      />

      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/track/:trackingNumber" element={<TrackShipment />} />

      {/* Protected Routes with Layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard - përdor RoleBasedDashboard */}
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Customer Routes */}
        <Route path="/shipments/create" element={
          <ProtectedRoute roles={['customer']}>
            <CreateShipment />
          </ProtectedRoute>
        } />
        <Route path="/track" element={
          <ProtectedRoute roles={['customer']}>
            <TrackShipment />
          </ProtectedRoute>
        } />
        <Route path="/shipments/history" element={
          <ProtectedRoute roles={['customer']}>
            <ShipmentHistory />
          </ProtectedRoute>
        } />

        {/* Driver Routes */}
        <Route path="/driver/shipments" element={
          <ProtectedRoute roles={['driver']}>
            <MyShipments />
          </ProtectedRoute>
        } />
        <Route path="/driver/update-location" element={
          <ProtectedRoute roles={['driver']}>
            <UpdateLocation />
          </ProtectedRoute>
        } />

        {/* Dispatcher Routes */}
        <Route path="/dispatcher/dashboard" element={
          <ProtectedRoute roles={['dispatcher']}>
            <DispatcherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/shipments" element={
          <ProtectedRoute roles={['dispatcher']}>
            <ShipmentList />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/assign-driver" element={
          <ProtectedRoute roles={['dispatcher']}>
            <AssignDriver />
          </ProtectedRoute>
        } />

        {/* Company Admin Routes */}
        <Route path="/company/dashboard" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/company/users" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyUsersList />
          </ProtectedRoute>
        } />
        <Route path="/company/drivers" element={
          <ProtectedRoute roles={['company_admin']}>
            <DriversList />
          </ProtectedRoute>
        } />

        {/* Super Admin Routes */}
        <Route path="/super-admin/dashboard" element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/organizations" element={
          <ProtectedRoute roles={['super_admin']}>
            <OrganizationsList />
          </ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;