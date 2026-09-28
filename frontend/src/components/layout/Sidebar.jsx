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
  ChevronLeft,
  Menu,
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

export default function Sidebar({ userRole, collapsed = false, onToggle }) {
  const links = NAV_LINKS[userRole] || []

  return (
    <aside
      className={clsx(
        'bg-white border-r border-[var(--color-surface-border)] flex flex-col shrink-0 transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand & Toggle */}
      <div
        className={clsx(
          'h-16 flex items-center border-b border-[var(--color-surface-border)] shrink-0',
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        )}
      >
        {collapsed ? (
          /* When collapsed: show PX abbreviation centered */
          <span
            className="text-base font-bold text-primary-600 tracking-tight select-none"
            title="ProcureX"
          >
            PX
          </span>
        ) : (
          /* When expanded: brand on left, collapse button on right */
          <>
            <span
              className="text-lg font-bold text-primary-600 tracking-tight"
              title="ProcureX"
            >
              ProcureX
            </span>

            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx('flex-1 overflow-y-auto py-4 space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {/* Hamburger expand button at top of nav — visible only when collapsed */}
        {collapsed && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex w-full justify-center p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mb-1"
          >
            <Menu size={18} />
          </button>
        )}

        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center rounded-lg text-sm font-medium transition-colors duration-150',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={clsx('shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-[var(--color-surface-border)] text-xs text-gray-400 shrink-0">
          ProcureX v1.0
        </div>
      )}
    </aside>
  )
}
