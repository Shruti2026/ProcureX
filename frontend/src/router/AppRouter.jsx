import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import Spinner from "../components/ui/Spinner";

// Auth — kept eager since they are the entry point before the app loads
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const UsersPage      = lazy(() => import("../pages/admin/UsersPage"));
const AuditLogsPage  = lazy(() => import("../pages/admin/AuditLogsPage"));
const HealthPage     = lazy(() => import("../pages/admin/HealthPage"));

// Procurement Pages
const ProcurementDashboard    = lazy(() => import("../pages/procurement/ProcurementDashboard"));
const RequisitionsPage        = lazy(() => import("../pages/procurement/RequisitionsPage"));
const RequisitionDetailPage   = lazy(() => import("../pages/procurement/RequisitionDetailPage"));
const RfqsPage                = lazy(() => import("../pages/procurement/RfqsPage"));
const PurchaseOrdersPage      = lazy(() => import("../pages/procurement/PurchaseOrdersPage"));
const PurchaseOrderDetailPage = lazy(() => import("../pages/procurement/PurchaseOrderDetailPage"));
const AnalyticsPage           = lazy(() => import("../pages/procurement/AnalyticsPage"));

// Inventory Pages
const InventoryDashboard = lazy(() => import("../pages/inventory/InventoryDashboard"));
const StockPage          = lazy(() => import("../pages/inventory/StockPage"));
const WarehousesPage     = lazy(() => import("../pages/inventory/WarehousesPage"));
const GrnsPage           = lazy(() => import("../pages/inventory/GrnsPage"));
const GrnDetailPage      = lazy(() => import("../pages/inventory/GrnDetailPage"));
const TransactionsPage   = lazy(() => import("../pages/inventory/TransactionsPage"));

// Finance Pages
const FinanceDashboard  = lazy(() => import("../pages/finance/FinanceDashboard"));
const InvoicesPage      = lazy(() => import("../pages/finance/InvoicesPage"));
const InvoiceDetailPage = lazy(() => import("../pages/finance/InvoiceDetailPage"));
const BudgetsPage       = lazy(() => import("../pages/finance/BudgetsPage"));
const PaymentsPage      = lazy(() => import("../pages/finance/PaymentsPage"));

// Vendor Pages
const VendorDashboard      = lazy(() => import("../pages/vendor/VendorDashboard"));
const VendorRfqsPage       = lazy(() => import("../pages/vendor/VendorRfqsPage"));
const VendorQuotationsPage = lazy(() => import("../pages/vendor/VendorQuotationsPage"));
const VendorOrdersPage     = lazy(() => import("../pages/vendor/VendorOrdersPage"));
const VendorInvoicesPage   = lazy(() => import("../pages/vendor/VendorInvoicesPage"));

// Shared Pages
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));

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

/** Full-page spinner shown while a lazy chunk is loading */
function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-50 dark:bg-transparent">
      <Spinner size="lg" />
    </div>
  );
}

export default function AppRouter({ user, onLogout }) {
  // Redirect already-authenticated users away from the login page.
  const loginElement = user
    ? <Navigate to={getDashboardPath(user.role) ?? "/unauthorized"} replace />
    : <LoginPage />;

  return (
    <Suspense fallback={<PageLoadingFallback />}>
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
                  ROLES.FINANCE_MANAGER,
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
                    element={<PurchaseOrdersPage />}
                  />
                  <Route
                    path="orders/:poId"
                    element={<PurchaseOrderDetailPage />}
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
                    path="grns/:grnId"
                    element={<GrnDetailPage />}
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
                    path="invoices/:invoiceId"
                    element={<InvoiceDetailPage />}
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
    </Suspense>
  );
}
