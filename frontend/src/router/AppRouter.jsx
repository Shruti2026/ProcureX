import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

// Auth
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersPage from "../pages/admin/UsersPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";
import HealthPage from "../pages/admin/HealthPage";

// Procurement Pages
import ProcurementDashboard from "../pages/procurement/ProcurementDashboard";
import RequisitionsPage from "../pages/procurement/RequisitionsPage";
import RequisitionDetailPage from "../pages/procurement/RequisitionDetailPage";
import RfqsPage from "../pages/procurement/RfqsPage";
import OrdersPage from "../pages/procurement/OrdersPage";
import AnalyticsPage from "../pages/procurement/AnalyticsPage";

// Inventory Pages
import InventoryDashboard from "../pages/inventory/InventoryDashboard";
import StockPage from "../pages/inventory/StockPage";
import WarehousesPage from "../pages/inventory/WarehousesPage";
import GrnsPage from "../pages/inventory/GrnsPage";
import TransactionsPage from "../pages/inventory/TransactionsPage";

// Finance Pages
import FinanceDashboard from "../pages/finance/FinanceDashboard";
import InvoicesPage from "../pages/finance/InvoicesPage";
import BudgetsPage from "../pages/finance/BudgetsPage";
import PaymentsPage from "../pages/finance/PaymentsPage";

// Vendor Pages
import VendorDashboard from "../pages/vendor/VendorDashboard";
import VendorRfqsPage from "../pages/vendor/VendorRfqsPage";
import VendorQuotationsPage from "../pages/vendor/VendorQuotationsPage";
import VendorOrdersPage from "../pages/vendor/VendorOrdersPage";
import VendorInvoicesPage from "../pages/vendor/VendorInvoicesPage";

// Shared Pages
import NotificationsPage from "../pages/NotificationsPage";

import { ROLES } from "../constants/roles";

/**
 * Resolves the home dashboard path for a given role.
 * Returns null if the role is unrecognised.
 */
function getDashboardPath(role) {
  switch (role) {
    case ROLES.ADMIN:               return "/admin/dashboard";
    case ROLES.PROCUREMENT_MANAGER: return "/procurement/dashboard";
    case ROLES.INVENTORY_MANAGER:   return "/inventory/dashboard";
    case ROLES.FINANCE_MANAGER:     return "/finance/dashboard";
    case ROLES.VENDOR:              return "/vendor/dashboard";
    default:                        return null;
  }
}

export default function AppRouter({ user, onLogout }) {
  // Redirect already-authenticated users away from the login page.
  const loginElement = user
    ? <Navigate to={getDashboardPath(user.role) ?? "/unauthorized"} replace />
    : <LoginPage />;

  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={loginElement} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={getDashboardPath(user.role) ?? "/unauthorized"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Layout */}
        <Route
          element={
            <DashboardLayout
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
                    path="users"
                    element={<UsersPage />}
                  />
                  <Route
                    path="audit-logs"
                    element={<AuditLogsPage />}
                  />
                  <Route
                    path="health"
                    element={<HealthPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/admin/dashboard" replace />}
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
                    path="requisitions"
                    element={<RequisitionsPage />}
                  />
                  <Route
                    path="requisitions/:requisitionId"
                    element={<RequisitionDetailPage />}
                  />
                  <Route
                    path="rfqs"
                    element={<RfqsPage />}
                  />
                  <Route
                    path="orders"
                    element={<OrdersPage />}
                  />
                  <Route
                    path="analytics"
                    element={<AnalyticsPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/procurement/dashboard" replace />}
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
                    path="stock"
                    element={<StockPage />}
                  />
                  <Route
                    path="warehouses"
                    element={<WarehousesPage />}
                  />
                  <Route
                    path="grns"
                    element={<GrnsPage />}
                  />
                  <Route
                    path="transactions"
                    element={<TransactionsPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/inventory/dashboard" replace />}
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
                    path="invoices"
                    element={<InvoicesPage />}
                  />
                  <Route
                    path="budgets"
                    element={<BudgetsPage />}
                  />
                  <Route
                    path="payments"
                    element={<PaymentsPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/finance/dashboard" replace />}
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
                    path="rfqs"
                    element={<VendorRfqsPage />}
                  />
                  <Route
                    path="quotations"
                    element={<VendorQuotationsPage />}
                  />
                  <Route
                    path="orders"
                    element={<VendorOrdersPage />}
                  />
                  <Route
                    path="invoices"
                    element={<VendorInvoicesPage />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/vendor/dashboard" replace />}
                  />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Shared Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={Object.values(ROLES)}>
                <NotificationsPage />
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