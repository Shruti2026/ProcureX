import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { budgetService } from '../../services/budgetService'

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLUMNS = ['Department', 'Fiscal Year', 'Allocated', 'Used', 'Committed', 'Available', 'Utilization']

// ---------------------------------------------------------------------------
// Create Budget Modal
// ---------------------------------------------------------------------------
function CreateBudgetModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ departmentName: '', fiscalYear: new Date().getFullYear(), allocatedAmount: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.departmentName.trim()) e.departmentName = 'Department name is required'
    if (!form.fiscalYear || form.fiscalYear < 2020) e.fiscalYear = 'Fiscal year must be 2020 or later'
    if (!form.allocatedAmount || parseFloat(form.allocatedAmount) <= 0) e.allocatedAmount = 'Amount must be greater than 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await budgetService.createBudget({
        departmentName: form.departmentName,
        fiscalYear: parseInt(form.fiscalYear),
        allocatedAmount: parseFloat(form.allocatedAmount),
      })
      toast.success('Budget created')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Budget</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              type="text"
              value={form.departmentName}
              onChange={e => setForm(f => ({ ...f, departmentName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Engineering"
            />
            {errors.departmentName && <p className="text-xs text-red-500 mt-1">{errors.departmentName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
            <input
              type="number"
              value={form.fiscalYear}
              onChange={e => setForm(f => ({ ...f, fiscalYear: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="2020"
            />
            {errors.fiscalYear && <p className="text-xs text-red-500 mt-1">{errors.fiscalYear}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount</label>
            <input
              type="number"
              value={form.allocatedAmount}
              onChange={e => setForm(f => ({ ...f, allocatedAmount: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            />
            {errors.allocatedAmount && <p className="text-xs text-red-500 mt-1">{errors.allocatedAmount}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>Create Budget</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------
function UtilizationBar({ used, allocated }) {
  const pct = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { loadBudgets() }, [page])

  const loadBudgets = async () => {
    setLoading(true)
    try {
      const res = await budgetService.getBudgets({ page, size: 20 })
      const data = res.data?.data
      setBudgets(data?.content ?? [])
      setTotalPages(data?.totalPages ?? 0)
    } catch {
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="mt-1 text-sm text-gray-500">Track departmental budgets and spend limits.</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Create Budget
        </Button>
      </div>

      <Table
        columns={COLUMNS}
        loading={loading}
        empty={!loading && budgets.length === 0}
        emptyMessage="No budgets found. Create one to get started."
      >
        {budgets.map((b, i) => (
          <tr
            key={b.budgetId}
            className="hover:bg-gray-50 transition-colors duration-100 animate-fade-slide-up"
            style={{ animationDelay: reducedMotion ? '0ms' : `${i * 50}ms` }}
          >
            <Table.Td className="font-medium text-gray-900">{b.departmentName}</Table.Td>
            <Table.Td>{b.fiscalYear}</Table.Td>
            <Table.Td>{formatCurrency(b.allocatedAmount)}</Table.Td>
            <Table.Td>{formatCurrency(b.usedAmount)}</Table.Td>
            <Table.Td>{formatCurrency(b.committedAmount)}</Table.Td>
            <Table.Td className="font-medium text-gray-900">{formatCurrency(b.availableAmount)}</Table.Td>
            <Table.Td>
              <UtilizationBar
                used={parseFloat(b.usedAmount) || 0}
                allocated={parseFloat(b.allocatedAmount) || 1}
              />
            </Table.Td>
          </tr>
        ))}
      </Table>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); loadBudgets() }}
        />
      )}

      {showModal && (
        <CreateBudgetModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setPage(0); loadBudgets() }}
        />
      )}
    </div>
  )
}
