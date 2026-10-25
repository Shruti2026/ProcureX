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
    { label: 'Dashboard', path: '/finance/dashboard',        icon: LayoutDashboard },
    { label: 'Invoices',  path: '/finance/invoices',         icon: Receipt },
    { label: 'Budgets',   path: '/finance/budgets',          icon: Tag },
    { label: 'Payments',  path: '/finance/payments',         icon: CreditCard },
    { label: 'Analytics', path: '/procurement/analytics',    icon: BarChart2 },
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
        'flex flex-col shrink-0 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
      style={{
        background: 'linear-gradient(180deg, #1E1B4B 0%, #2D1B69 50%, #4C1D95 100%)',
        transition: 'width 200ms cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {/* Brand & Toggle */}
      <div
        className={clsx(
          'h-16 flex items-center shrink-0 border-b border-white/10',
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        )}
      >
        {collapsed ? (
          <span
            className="text-base font-bold text-white tracking-tight select-none"
            title="ProcureX"
          >
            PX
          </span>
        ) : (
          <>
            <span
              className="text-lg font-bold text-white tracking-tight select-none"
              title="ProcureX"
            >
              ProcureX
            </span>
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="p-1.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors duration-150"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={clsx('flex-1 overflow-y-auto py-4 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
        {/* Hamburger expand button — visible only when collapsed */}
        {collapsed && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex w-full justify-center p-2.5 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors duration-150 mb-1"
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
                'relative flex items-center rounded-lg text-sm font-medium transition-colors duration-150 overflow-hidden',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Left accent bar for active link */}
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#A78BFA]"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  size={18}
                  className={clsx(
                    'shrink-0 transition-colors duration-150',
                    isActive ? 'text-white' : 'text-white/60'
                  )}
                />
                {!collapsed && (
                  <span
                    className="truncate"
                    style={{
                      opacity: collapsed ? 0 : 1,
                      transition: 'opacity 100ms ease',
                    }}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/40 dark:text-white/30 shrink-0">
          ProcureX v1.0
        </div>
      )}
    </aside>
  )
}
