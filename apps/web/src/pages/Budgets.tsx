import { useState, useEffect } from 'react'
import { budgetsService, type Budget } from '../services/budgets'
import { categoriesService, type Category } from '../services/categories'
import { fmt, toNum, useCurrencySymbol } from '../utils/format'
import { toast } from '../store/toast'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((toNum(value) / toNum(max)) * 100, 100) : 0
  const danger = pct >= 90
  const warning = pct >= 70

  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundColor: danger ? '#ef4444' : warning ? '#f59e0b' : color,
        }}
      />
    </div>
  )
}

function BudgetModal({ categories, budget, onSave, onClose }: {
  categories: Category[]
  budget?: Budget | null
  onSave: (data: { categoryId: string; limitAmount: number; period: 'monthly' | 'yearly' }) => Promise<void>
  onClose: () => void
}) {
  const sym = useCurrencySymbol()
  const [form, setForm] = useState({
    categoryId: budget?.category_id || categories[0]?.id || '',
    limitAmount: budget?.limit_amount || 0,
    period: (budget?.period || 'monthly') as 'monthly' | 'yearly',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors'
  const labelCls = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl border border-zinc-100 dark:border-zinc-800">
        <h2 className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
          {budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Categoría</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className={inputCls}
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Límite ({sym})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.limitAmount || ''}
              onChange={(e) => setForm((f) => ({ ...f, limitAmount: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelCls}>Período</label>
            <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
              {(['monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, period: p }))}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    form.period === p
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p === 'monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Budgets() {
  const sym = useCurrencySymbol()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [b, c] = await Promise.all([budgetsService.getAll(), categoriesService.getAll()])
      setBudgets(b.data)
      setCategories(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSave = async (data: Parameters<typeof budgetsService.create>[0]) => {
    try {
      if (editing) {
        await budgetsService.update(editing.id, data)
        toast.success('Presupuesto actualizado')
      } else {
        await budgetsService.create(data)
        toast.success('Presupuesto creado')
      }
      setEditing(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await budgetsService.delete(id)
      toast.success('Presupuesto eliminado')
      setConfirmDelete(null)
      fetchAll()
    } catch {
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <div className="p-7">
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-zinc-400 font-medium">{budgets.length} presupuestos</p>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors text-xs font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Nuevo presupuesto
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-zinc-400 text-sm">Cargando...</p>
      ) : budgets.length === 0 ? (
        <p className="text-center py-12 text-zinc-400 text-sm">Sin presupuestos. Crea uno para empezar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = toNum(b.limit_amount) > 0 ? Math.min((toNum(b.spent) / toNum(b.limit_amount)) * 100, 100) : 0
            const danger = pct >= 90
            const warning = pct >= 70

            return (
              <div key={b.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 group hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.category_color }} />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{b.category_name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
                    {b.period === 'monthly' ? 'Mensual' : 'Anual'}
                  </span>
                </div>

                <ProgressBar value={b.spent} max={b.limit_amount} color={b.category_color} />

                <div className="mt-3 flex justify-between text-xs">
                  <span className={`font-semibold tabular-nums ${danger ? 'text-red-500' : warning ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {sym}{fmt(b.spent)}
                  </span>
                  <span className="text-zinc-400">de {sym}{fmt(b.limit_amount)}</span>
                </div>

                <div className="mt-1.5 text-[11px] text-right">
                  {danger
                    ? <span className="text-red-500 font-medium">Límite superado</span>
                    : <span className="text-zinc-400">{sym}{fmt(b.remaining)} disponible</span>
                  }
                </div>

                <div className="flex gap-3 mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(b); setShowModal(true) }} className="text-[11px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors">
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(b.id)} className="text-[11px] text-zinc-300 hover:text-red-500 font-medium transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal categories={categories} budget={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm mx-4 shadow-xl border border-zinc-100 dark:border-zinc-800 text-center">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-1">¿Eliminar presupuesto?</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
