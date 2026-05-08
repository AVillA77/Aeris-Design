import { useState, useEffect } from 'react'
import type { Transaction, TransactionPayload } from '../services/transactions'
import type { Category } from '../services/categories'
import { useCurrencySymbol } from '../utils/format'

interface Props {
  transaction?: Transaction | null
  categories: Category[]
  onSave: (payload: TransactionPayload) => Promise<void>
  onClose: () => void
}

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'other'] as const
const PAYMENT_LABELS = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro' }

export function TransactionModal({ transaction, categories, onSave, onClose }: Props) {
  const sym = useCurrencySymbol()
  const [form, setForm] = useState<TransactionPayload>({
    type: 'expense',
    amount: 0,
    description: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    categoryId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        paymentMethod: transaction.payment_method,
        categoryId: transaction.category_id,
      })
    }
  }, [transaction])

  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm((f) => ({ ...f, categoryId: categories[0].id }))
    }
  }, [categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors'
  const labelCls = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide'

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 w-full max-w-md mx-4 p-6">
        <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
          {transaction ? 'Editar transacción' : 'Nueva transacción'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                }`}
              >
                {t === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Monto ({sym})</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount || ''}
              onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              className={inputCls}
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Opcional"
              className={inputCls}
            />
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Fecha</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Categoría</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className={inputCls}
            >
              <option value="">Seleccionar...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className={labelCls}>Método de pago</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as typeof form.paymentMethod }))}
              className={inputCls}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
