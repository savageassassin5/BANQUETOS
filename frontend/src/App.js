import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TenantConfigProvider, useTenantConfig } from "./context/TenantConfigContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BookingsPage from "./pages/BookingsPage";
import BookingFormPage from "./pages/BookingFormPage";
import CalendarPage from "./pages/CalendarPage";
import HallsPage from "./pages/HallsPage";
import MenuPage from "./pages/MenuPage";
import CustomersPage from "./pages/CustomersPage";
import PaymentsPage from "./pages/PaymentsPage";
import EnquiriesPage from "./pages/EnquiriesPage";
import ReportsPage from "./pages/ReportsPage";
import VendorsPage from "./pages/VendorsPage";
import AlertsPage from "./pages/AlertsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ExpensesPage from "./pages/ExpensesPage";
import PartyPlanningPage from "./pages/PartyPlanningPage";

// Super Admin Pages (lazy loaded later)
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import TenantsPage from "./pages/superadmin/TenantsPage";
import TenantDetailPage from "./pages/superadmin/TenantDetailPage";
import PlansPage from "./pages/superadmin/PlansPage";
import FeatureFlagsPage from "./pages/superadmin/FeatureFlagsPage";
import WorkflowRulesPage from "./pages/superadmin/WorkflowRulesPage";
import PermissionsPage from "./pages/superadmin/PermissionsPage";
import TemplatesPage from "./pages/superadmin/TemplatesPage";
import CustomFieldsPage from "./pages/superadmin/CustomFieldsPage";
import UIControlsPage from "./pages/superadmin/UIControlsPage";
import FinancialPage from "./pages/superadmin/FinancialPage";
import DataGovernancePage from "./pages/superadmin/DataGovernancePage";

// Layout
import DashboardLayout from "./components/DashboardLayout";
import SuperAdminLayout from "./components/SuperAdminLayout";

// ==================== ROUTE GUARDS ====================

// Protected Route - requires authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if tenant is suspended (for non-super_admin users)
  if (user.role !== 'super_admin' && user.tenant_status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-4">Your organization's account has been suspended. Please contact support for assistance.</p>
          <a href="mailto:support@banquetos.com" className="text-violet-600 hover:underline">Contact Support</a>
        </div>
      </div>
    );
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Role Route - requires specific roles
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Super Admin Route - only super_admin can access
const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
};

// Feature Route - requires specific feature to be enabled (uses user's effective_features)
const FeatureRoute = ({ children, feature }) => {
  const { user, loading, hasFeature } = useAuth();
  const { loading: configLoading, error: configError } = useTenantConfig();
  
  if (loading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Super admin has all features
  if (user.role === 'super_admin') {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  
  // Config error - fail closed with message
  if (configError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="max-w-md p-8 bg-white rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Configuration Error</h2>
            <p className="text-gray-600 mb-4">Unable to load tenant configuration. Please try refreshing the page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Check if feature is enabled via user's effective_features
  if (feature && !hasFeature(feature)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="max-w-md p-8 bg-white rounded-2xl shadow-lg text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Module Not Enabled</h2>
            <p className="text-gray-600 mb-4">This feature is not available on your current plan. Contact your administrator to enable it.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Login Route - ALWAYS shows login page, even for logged-in users clicking "Get Started"
// After successful login, redirects based on role
const LoginRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon" />
      </div>
    );
  }
  
  // If user is logged in and came here normally (not from "Get Started"), redirect
  // The login page will handle post-login routing
  if (user && !location.state?.fromGetStarted) {
    // Route based on role
    if (user.role === 'super_admin') {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LoginPage />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<LoginRoute />} />

      {/* Super Admin Routes */}
      <Route path="/superadmin" element={
        <SuperAdminRoute>
          <SuperAdminDashboard />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/tenants" element={
        <SuperAdminRoute>
          <TenantsPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/tenants/new" element={
        <SuperAdminRoute>
          <TenantDetailPage isNew />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/tenants/:id" element={
        <SuperAdminRoute>
          <TenantDetailPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/feature-flags" element={
        <SuperAdminRoute>
          <FeatureFlagsPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/workflow-rules" element={
        <SuperAdminRoute>
          <WorkflowRulesPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/permissions" element={
        <SuperAdminRoute>
          <PermissionsPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/templates" element={
        <SuperAdminRoute>
          <TemplatesPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/custom-fields" element={
        <SuperAdminRoute>
          <CustomFieldsPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/ui-controls" element={
        <SuperAdminRoute>
          <UIControlsPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/financial" element={
        <SuperAdminRoute>
          <FinancialPage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/data-governance" element={
        <SuperAdminRoute>
          <DataGovernancePage />
        </SuperAdminRoute>
      } />
      <Route path="/superadmin/plans" element={
        <SuperAdminRoute>
          <PlansPage />
        </SuperAdminRoute>
      } />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/bookings" element={
        <FeatureRoute feature="bookings">
          <BookingsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/bookings/new" element={
        <FeatureRoute feature="bookings">
          <BookingFormPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/bookings/:id/edit" element={
        <FeatureRoute feature="bookings">
          <BookingFormPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/calendar" element={
        <FeatureRoute feature="calendar">
          <CalendarPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/halls" element={
        <FeatureRoute feature="halls">
          <HallsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/menu" element={
        <FeatureRoute feature="menu">
          <MenuPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/customers" element={
        <FeatureRoute feature="customers">
          <CustomersPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/payments" element={
        <FeatureRoute feature="payments">
          <PaymentsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/enquiries" element={
        <FeatureRoute feature="enquiries">
          <EnquiriesPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/reports" element={
        <FeatureRoute feature="reports">
          <ReportsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/vendors" element={
        <FeatureRoute feature="vendors">
          <VendorsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/alerts" element={
        <ProtectedRoute>
          <AlertsPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/analytics" element={
        <FeatureRoute feature="analytics">
          <AnalyticsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/notifications" element={
        <FeatureRoute feature="notifications">
          <NotificationsPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/expenses" element={
        <FeatureRoute feature="profit_tracking">
          <ExpensesPage />
        </FeatureRoute>
      } />
      <Route path="/dashboard/party-planning" element={
        <FeatureRoute feature="party_planning">
          <PartyPlanningPage />
        </FeatureRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <TenantConfigProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </TenantConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
