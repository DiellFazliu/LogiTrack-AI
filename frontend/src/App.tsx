// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { Layout } from './components/shared/Layout';
import { RoleBasedDashboard } from './components/RoleBaseDashboard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CreateShipment as CustomerCreateShipment } from './pages/customer/CreateShipment';
import { TrackShipment } from './pages/customer/TrackShipment';
import { ShipmentHistory } from './pages/customer/ShipmentHistory';

// Driver Pages
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { MyShipments } from './pages/driver/MyShipments';
import DriverShipmentDetails from './pages/driver/ShipmentDetails';
import { UpdateLocation } from './pages/driver/UpdateLocation';
import { RouteOptimizerPage } from './pages/driver/RouteOptimizerPage';
import { DriverProfilePage } from './pages/driver/DriverProfilePage';
import { DriverDailyReport } from './pages/driver/DriverDailyReport';

// Dispatcher Pages
import { DispatcherDashboard } from './pages/dispatcher/DispatcherDashboard';
import { ShipmentList } from './pages/dispatcher/ShipmentList';
import { AssignDriver } from './pages/dispatcher/AssignDriver';
import { CreateShipment as DispatcherCreateShipment } from './pages/dispatcher/CreateShipment';
import { ShipmentDetails as DispatcherShipmentDetails } from './pages/dispatcher/ShipmentDetails';
import { DispatcherReports } from './pages/dispatcher/DispatcherReports';
import { DriverLocationMap } from './pages/dispatcher/DriverLocationMap';

// Company Admin Pages
import { CompanyDashboard } from './pages/company-admin/CompanyDashboard';
import { CompanyUsersList } from './pages/company-admin/CompanyUsersList';
import { CompanyDriversList } from './pages/company-admin/CompanyDriversList';
import { CompanyVehiclesList } from './pages/company-admin/CompanyVehiclesList';
import { CompanyWarehousesList } from './pages/company-admin/CompanyWarehousesList';
import { CompanyProductsList } from './pages/company-admin/CompanyProductsList';
import { CompanyShipmentsList } from './pages/company-admin/CompanyShipmentsList';
import CompanyReports from './pages/company-admin/CompanyReports';
import { CompanySettings } from './pages/company-admin/CompanySettings';

// Super Admin Pages
import { SuperAdminDashboard } from './pages/super-admin/SuperAdminDashboard';
import { OrganizationsList } from './pages/super-admin/OrganizationsList';
import { UsersList } from './pages/super-admin/UsersList';
import { SystemSettings } from './pages/super-admin/SystemSettings';
import { PlansManagement } from './pages/super-admin/PlansManagement';
import { CreateOrganization } from './pages/super-admin/CreateOrganization';
import { CreateUser } from './pages/super-admin/CreateUser';
import { SuperAdminShipments } from './pages/super-admin/SuperAdminShipments';
import { SuperAdminShipmentDetails } from './pages/super-admin/SuperAdminShipmentDetails';
import { SubscriptionsPage } from './pages/super-admin/SubscriptionsPage';
import { EditOrganizationPage } from './pages/super-admin/EditOrganizationPage';
import { BillingPage } from './pages/super-admin/BillingPage';
import SuperAdminDrivers from './pages/super-admin/SuperAdminDrivers';
import SuperAdminVehicles from './pages/super-admin/SuperAdminVehicles';
import { OrganizationDetails } from './pages/super-admin/OrganizationDetails';

// Shared/Common Pages
import { ProfilePage } from './pages/common/ProfilePage';
import { NotFoundPage } from './pages/common/NotFoundPage';
import { SettingsPage } from './pages/common/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minuta
    },
  },
});

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
      {/* ==================== PUBLIC ROUTES ==================== */}
      <Route path="/track/:trackingNumber" element={<TrackShipment />} />
      <Route path="/track" element={<TrackShipment />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ==================== PROTECTED ROUTES ==================== */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Common Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* ==================== CUSTOMER ROUTES ==================== */}
        <Route path="/customer/dashboard" element={
          <ProtectedRoute roles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/create-shipment" element={
          <ProtectedRoute roles={['customer']}>
            <CustomerCreateShipment />
          </ProtectedRoute>
        } />
        <Route path="/customer/track" element={
          <ProtectedRoute roles={['customer']}>
            <TrackShipment />
          </ProtectedRoute>
        } />
        <Route path="/customer/track/:trackingNumber" element={
          <ProtectedRoute roles={['customer']}>
            <TrackShipment />
          </ProtectedRoute>
        } />
        <Route path="/customer/history" element={
          <ProtectedRoute roles={['customer']}>
            <ShipmentHistory />
          </ProtectedRoute>
        } />

        {/* ==================== DRIVER ROUTES ==================== */}
        <Route path="/driver/dashboard" element={
          <ProtectedRoute roles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/driver/shipments" element={
          <ProtectedRoute roles={['driver']}>
            <MyShipments />
          </ProtectedRoute>
        } />
        <Route path="/driver/shipments/:id" element={
          <ProtectedRoute roles={['driver']}>
            <DriverShipmentDetails />
          </ProtectedRoute>
        } />
        <Route path="/driver/update-location" element={
          <ProtectedRoute roles={['driver']}>
            <UpdateLocation />
          </ProtectedRoute>
        } />
        <Route path="/driver/route-optimizer" element={
          <ProtectedRoute roles={['driver', 'super_admin']}>
            <RouteOptimizerPage />
          </ProtectedRoute>
        } />
        <Route path="/driver/profile" element={
          <ProtectedRoute roles={['driver']}>
            <DriverProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/driver/daily-report" element={
          <ProtectedRoute roles={['driver']}>
            <DriverDailyReport />
          </ProtectedRoute>
        } />

        {/* ==================== DISPATCHER ROUTES ==================== */}
        <Route path="/dispatcher/dashboard" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <DispatcherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/shipments" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <ShipmentList />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/shipments/:id" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <DispatcherShipmentDetails />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/create-shipment" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <DispatcherCreateShipment />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/assign-driver" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <AssignDriver />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/reports" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <DispatcherReports />
          </ProtectedRoute>
        } />
        <Route path="/dispatcher/driver-locations" element={
          <ProtectedRoute roles={['dispatcher', 'company_admin']}>
            <DriverLocationMap />
          </ProtectedRoute>
        } />

        {/* ==================== COMPANY ADMIN ROUTES ==================== */}
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
            <CompanyDriversList />
          </ProtectedRoute>
        } />
        <Route path="/company/vehicles" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyVehiclesList />
          </ProtectedRoute>
        } />
        <Route path="/company/warehouses" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyWarehousesList />
          </ProtectedRoute>
        } />
        <Route path="/company/products" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyProductsList />
          </ProtectedRoute>
        } />
        <Route path="/company/shipments" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyShipmentsList />
          </ProtectedRoute>
        } />
        <Route path="/company/shipments/:id" element={
          <ProtectedRoute roles={['company_admin', 'dispatcher']}>
            <DispatcherShipmentDetails />
          </ProtectedRoute>
        } />
        <Route path="/company/reports" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanyReports />
          </ProtectedRoute>
        } />
        <Route path="/company/settings" element={
          <ProtectedRoute roles={['company_admin']}>
            <CompanySettings />
          </ProtectedRoute>
        } />

        {/* ==================== SUPER ADMIN ROUTES ==================== */}
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
        <Route path="/super-admin/organizations/create" element={
          <ProtectedRoute roles={['super_admin']}>
            <CreateOrganization />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/organizations/:id" element={
          <ProtectedRoute roles={['super_admin']}>
            <OrganizationDetails />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/organizations/:id/edit" element={
          <ProtectedRoute roles={['super_admin']}>
            <EditOrganizationPage />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/organizations/:id/billing" element={
          <ProtectedRoute roles={['super_admin']}>
            <BillingPage />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/users" element={
          <ProtectedRoute roles={['super_admin']}>
            <UsersList />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/users/create" element={
          <ProtectedRoute roles={['super_admin']}>
            <CreateUser />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/shipments" element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminShipments />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/shipments/:id" element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminShipmentDetails />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/subscriptions" element={
          <ProtectedRoute roles={['super_admin']}>
            <SubscriptionsPage />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/plans" element={
          <ProtectedRoute roles={['super_admin']}>
            <PlansManagement />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/drivers" element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminDrivers />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/vehicles" element={
          <ProtectedRoute roles={['super_admin']}>
            <SuperAdminVehicles />
          </ProtectedRoute>
        } />
        <Route path="/super-admin/settings" element={
          <ProtectedRoute roles={['super_admin']}>
            <SystemSettings />
          </ProtectedRoute>
        } />

        {/* ==================== AI ROUTES ==================== */}
        <Route path="/ai/optimize-route" element={
          <ProtectedRoute roles={['company_admin', 'dispatcher']}>
            <RouteOptimizerPage />
          </ProtectedRoute>
        } />
        <Route path="/ai/chatbot" element={
          <ProtectedRoute roles={['company_admin', 'dispatcher', 'driver']}>
            <div>AI Chatbot - Coming Soon</div>
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error: { duration: 4000, iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;