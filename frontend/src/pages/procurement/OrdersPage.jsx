import { Package } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Generate, issue, and manage purchase orders to suppliers.
        </p>
      </div>

      {/* Content container */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm rounded-xl border border-[var(--color-surface-border)] dark:border-white/10 p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 dark:bg-white/10 flex items-center justify-center text-primary-600 mb-4">
          <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Purchase Order Management</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-white/60 max-w-md mx-auto">
          PO generation and fulfillment tracking interface is ready for integration.
        </p>
      </div>
    </div>
  )
}
