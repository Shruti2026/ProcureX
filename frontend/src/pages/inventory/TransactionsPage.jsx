import { Activity } from 'lucide-react'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Audit material movements, stock transfers, adjustments, and write-offs.
        </p>
      </div>

      {/* Content container */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
          <Activity className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Transaction History</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Stock ledger and transfer audit trail interface is ready for integration.
        </p>
      </div>
    </div>
  )
}
