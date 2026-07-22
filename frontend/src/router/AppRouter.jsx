import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Dashboards
import AdminDashboard from "../pages/admin/AdminDashboard";
import ProcurementDashboard from "../pages/procurement/ProcurementDashboard";
import InventoryDashboard from "../pages/inventory/InventoryDashboard";
import FinanceDashboard from "../pages/finance/FinanceDashboard";
import VendorDashboard from "../pages/vendor/VendorDashboard";

import { ROLES } from "../constants/roles";

export default function AppRouter({ user, onLogout }) {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Layout */}
        <Route
          element={
            <DashboardLayout
              user={user}
              onLogout={onLogout}
            />
          }
        >
          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Procurement */}
          <Route
            path="/procurement/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.PROCUREMENT_MANAGER,
                  ROLES.ADMIN,
                ]}
              >
                <Routes>
                  <Route
                    path="dashboard"
                    element={<ProcurementDashboard />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Inventory */}
          <Route
            path="/inventory/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.INVENTORY_MANAGER,
                  ROLES.ADMIN,
                ]}
              >
                <Routes>
                  <Route
                    path="dashboard"
                    element={<InventoryDashboard />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Finance */}
          <Route
            path="/finance/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.FINANCE_MANAGER,
                  ROLES.ADMIN,
                ]}
              >
                <Routes>
                  <Route
                    path="dashboard"
                    element={<FinanceDashboard />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Vendor */}
          <Route
            path="/vendor/*"
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.VENDOR]}
              >
                <Routes>
                  <Route
                    path="dashboard"
                    element={<VendorDashboard />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch All */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
  );
}