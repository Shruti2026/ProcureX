import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Activity,
  FileText,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  CreditCard,
  BarChart2,
  Bell,
  Tag,
  Boxes,
} from 'lucide-react'
import { ROLES } from '../../constants/roles'

const NAV_LINKS = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard',   path: '/admin/dashboard',   icon: LayoutDashboard },
    { label: 'Users',       path: '/admin/users',        icon: Users },
    { label: 'Audit Logs',  path: '/admin/audit-logs',   icon: ClipboardList },
    { label: 'Health',      path: '/admin/health',       icon: Activity },
  ],
  [ROLES.PROCUREMENT_MANAGER]: [
    { label: 'Dashboard',       path: '/procurement/dashboard',    icon: LayoutDashboard },
    { label: 'Requisitions',    path: '/procurement/requisitions', icon: FileText },
    { label: 'RFQs',            path: '/procurement/rfqs',         icon: ShoppingCart },
    { label: 'Purchase Orders', path: '/procurement/orders',       icon: Package },
    { label: 'Analytics',       path: '/procurement/analytics',    icon: BarChart2 },
  ],
  [ROLES.INVENTORY_MANAGER]: [
    { label: 'Dashboard',    path: '/inventory/dashboard',     icon: LayoutDashboard },
    { label: 'Stock',        path: '/inventory/stock',         icon: Boxes },
    { label: 'Warehouses',   path: '/inventory/warehouses',    icon: Warehouse },
    { label: 'GRN',          path: '/inventory/grns',          icon: ClipboardList },
    { label: 'Transactions', path: '/inventory/transactions',  icon: Activity },
  ],
  [ROLES.FINANCE_MANAGER]: [
    { label: 'Dashboard', path: '/finance/dashboard', icon: LayoutDashboard },
    { label: 'Invoices',  path: '/finance/invoices',  icon: Receipt },
    { label: 'Budgets',   path: '/finance/budgets',   icon: Tag },
    { label: 'Payments',  path: '/finance/payments',  icon: CreditCard },
  ],
  [ROLES.VENDOR]: [
    { label: 'Dashboard',       path: '/vendor/dashboard',  icon: LayoutDashboard },
    { label: 'My RFQs',         path: '/vendor/rfqs',       icon: ShoppingCart },
    { label: 'My Quotations',   path: '/vendor/quotations', icon: FileText },
    { label: 'Purchase Orders', path: '/vendor/orders',     icon: Package },
    { label: 'Invoices',        path: '/vendor/invoices',   icon: Receipt },
    { label: 'Notifications',   path: '/notifications',     icon: Bell },
  ],
}

export default function Sidebar({ userRole }) {
  const links = NAV_LINKS[userRole] || []

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-700">
        <span className="text-lg font-bold text-white tracking-tight">ProcureX</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
        ProcureX v1.0
      </div>
    </aside>
  )
}
