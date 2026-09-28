import { Tag } from 'lucide-react'

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track departmental budgets, cost center allocations, and spend limits.
        </p>
      </div>

      {/* Content container */}
      <div className="bg-white rounded-xl border border-[var(--color-surface-border)] p-12 text-center shadow-xs">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
          <Tag className="w-6 h-6 text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Budget Allocations</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Departmental budget ledger and allocation tracking interface is ready for integration.
        </p>
      </div>
    </div>
  )
}
