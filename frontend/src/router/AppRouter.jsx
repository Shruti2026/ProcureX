import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProtectedRoute from './ProtectedRoute'

// Auth
import LoginPage from '../pages/auth/LoginPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

// Dashboards (placeholders — filled in each day)
import AdminDashboard from '../pages/admin/AdminDashboard'
import ProcurementDashboard from '../pages/procurement/ProcurementDashboard'
import InventoryDashboard from '../pages/inventory/InventoryDashboard'
import FinanceDashboard from '../pages/finance/FinanceDashboard'
import VendorDashboard from '../pages/vendor/VendorDashboard'

import { ROLES } from '../constants/roles'

/**
 * user and loading are passed from App.jsx until AuthContext is wired in Day 2.
 * After Day 2, ProtectedRoute reads these directly from useAuth().
 */
export default function AppRouter({ user, loading, onLogout }) {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authenticated routes — all share DashboardLayout */}
        <Route element={<DashboardLayout user={user} onLogout={onLogout} />}>

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute user={user} loading={loading} allowedRoles={[ROLES.ADMIN]}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Procurement Manager */}
          <Route
            path="/procurement/*"
            element={
              <ProtectedRoute
                user={user}
                loading={loading}
                allowedRoles={[ROLES.PROCUREMENT_MANAGER, ROLES.ADMIN]}
              >
                <Routes>
                  <Route path="dashboard" element={<ProcurementDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Inventory Manager */}
          <Route
            path="/inventory/*"
            element={
              <ProtectedRoute
                user={user}
                loading={loading}
                allowedRoles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}
              >
                <Routes>
                  <Route path="dashboard" element={<InventoryDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Finance Manager */}
          <Route
            path="/finance/*"
            element={
              <ProtectedRoute
                user={user}
                loading={loading}
                allowedRoles={[ROLES.FINANCE_MANAGER, ROLES.ADMIN]}
              >
                <Routes>
                  <Route path="dashboard" element={<FinanceDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Vendor */}
          <Route
            path="/vendor/*"
            element={
              <ProtectedRoute
                user={user}
                loading={loading}
                allowedRoles={[ROLES.VENDOR]}
              >
                <Routes>
                  <Route path="dashboard" element={<VendorDashboard />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
