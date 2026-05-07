import { useState, useEffect } from 'react'
import { budgetsService, type Budget } from '../services/budgets'
import { categoriesService, type Category } from '../services/categories'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const danger = pct >= 90
  const warning = pct >= 70

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: danger ? '#ef4444' : warning ? '#f59e0b' : color,
        }}
      />
    </div>
  )
}

function BudgetModal({
  categories,
  budget,
  onSave,
  onClose,
}: {
  categories: Category[]
  budget?: Budget | null
  onSave: (data: { categoryId: string; limitAmount: number; period: 'monthly' | 'yearly' }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    categoryId: budget?.category_id || categories[0]?.id || '',
    limitAmount: budget?.limit_amount || 0,
    period: (budget?.period || 'monthly') as 'monthly' | 'yearly',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-5">{budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Límite</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.limitAmount || ''}
              onChange={(e) => setForm((f) => ({ ...f, limitAmount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300">
              {(['monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, period: p }))}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p === 'monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [b, c] = await Promise.all([budgetsService.getAll(), categoriesService.getAll()])
      setBudgets(b.data)
      setCategories(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleSave = async (data: Parameters<typeof budgetsService.create>[0]) => {
    if (editing) {
      await budgetsService.update(editing.id, data)
    } else {
      await budgetsService.create(data)
    }
    setEditing(null)
    fetch()
  }

  const handleDelete = async (id: string) => {
    await budgetsService.delete(id)
    setConfirmDelete(null)
    fetch()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Nuevo presupuesto
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-400">Cargando...</p>
      ) : budgets.length === 0 ? (
        <p className="text-center py-12 text-gray-400">No hay presupuestos. Crea uno para empezar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.limit_amount > 0 ? Math.min((b.spent / b.limit_amount) * 100, 100) : 0
            const danger = pct >= 90
            const warning = pct >= 70

            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color }} />
                    <span className="font-semibold text-gray-800">{b.category_name}</span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {b.period === 'monthly' ? 'Mensual' : 'Anual'}
                  </span>
                </div>

                <ProgressBar value={b.spent} max={b.limit_amount} color={b.category_color} />

                <div className="mt-3 flex justify-between text-sm">
                  <span className={`font-medium ${danger ? 'text-red-600' : warning ? 'text-amber-600' : 'text-gray-700'}`}>
                    ${b.spent.toFixed(2)} gastado
                  </span>
                  <span className="text-gray-400">de ${b.limit_amount.toFixed(2)}</span>
                </div>

                <div className="mt-1 text-xs font-medium text-right">
                  {danger
                    ? <span className="text-red-500">⚠ Límite superado</span>
                    : <span className="text-gray-400">${b.remaining.toFixed(2)} disponible</span>
                  }
                </div>

                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-50">
                  <button onClick={() => { setEditing(b); setShowModal(true) }} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(b.id)} className="text-sm text-red-400 hover:text-red-600 font-medium">
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          categories={categories}
          budget={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl text-center">
            <p className="font-medium text-gray-800 mb-1">¿Eliminar presupuesto?</p>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
