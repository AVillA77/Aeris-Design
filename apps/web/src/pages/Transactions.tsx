import { useState, useEffect, useCallback } from 'react'
import { transactionsService, type Transaction } from '../services/transactions'
import { categoriesService, type Category } from '../services/categories'
import { TransactionModal } from '../components/TransactionModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { fmt, toNum } from '../utils/format'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro',
}

function exportToCSV(transactions: Transaction[]) {
  const header = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Método de pago', 'Monto']
  const rows = transactions.map((tx) => [
    tx.date,
    `"${tx.description || ''}"`,
    tx.category_name,
    tx.type === 'income' ? 'Ingreso' : 'Gasto',
    PAYMENT_LABELS[tx.payment_method],
    toNum(tx.amount).toFixed(2),
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transacciones-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '' as '' | 'income' | 'expense',
    categoryId: '',
    from: '',
    to: '',
  })

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      const { data } = await transactionsService.getAll(params)
      setTransactions(data.data)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => {
    categoriesService.getAll().then(({ data }) => setCategories(data))
  }, [])

  const handleSave = async (payload: Parameters<typeof transactionsService.create>[0]) => {
    if (editing) {
      await transactionsService.update(editing.id, payload)
    } else {
      await transactionsService.create(payload)
    }
    setEditing(null)
    fetchTransactions()
  }

  const handleDelete = async (id: string) => {
    await transactionsService.delete(id)
    setConfirmDelete(null)
    fetchTransactions()
  }

  const totalPages = Math.ceil(total / filters.limit)
  const inputCls = 'px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors'

  return (
    <div className="p-7 space-y-5">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-400 font-medium">{total} registros</p>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV(transactions)}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 border border-zinc-200 text-zinc-600 px-3.5 py-2 rounded-xl hover:bg-zinc-50 transition-colors text-xs font-medium disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exportar CSV
          </button>
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="flex items-center gap-1.5 bg-[#09090b] text-white px-3.5 py-2 rounded-xl hover:bg-zinc-800 transition-colors text-xs font-medium"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 1v10M1 6h10" strokeLinecap="round" />
            </svg>
            Nueva transacción
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as typeof f.type, page: 1 }))} className={inputCls}>
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <select value={filters.categoryId} onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value, page: 1 }))} className={inputCls}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))} className={inputCls} />
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))} className={inputCls} />
          <button onClick={() => setFilters({ page: 1, limit: 20, type: '', categoryId: '', from: '', to: '' })} className="px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-500 hover:bg-zinc-50 transition-colors font-medium">
            Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-zinc-400 text-sm">Cargando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm mb-1.5">Sin transacciones</p>
            <button onClick={() => { setEditing(null); setShowModal(true) }} className="text-xs text-zinc-600 hover:text-[#09090b] underline underline-offset-2">
              Agregar la primera
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Fecha', 'Descripción', 'Categoría', 'Método', 'Tipo', 'Monto', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/60 transition-colors group">
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap tabular-nums">
                    {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#09090b] max-w-[180px] truncate">
                    {tx.description || <span className="text-zinc-300 italic text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: tx.category_color }}>
                      {tx.category_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{PAYMENT_LABELS[tx.payment_method]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditing(tx); setShowModal(true) }} className="text-[11px] text-zinc-400 hover:text-[#09090b] font-medium transition-colors">
                        Editar
                      </button>
                      <button onClick={() => setConfirmDelete(tx.id)} className="text-[11px] text-zinc-300 hover:text-red-500 font-medium transition-colors">
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-100 text-xs text-zinc-400">
            <span>{total} registros</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1} className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors">←</button>
              <span className="px-3">{filters.page} / {totalPages}</span>
              <button onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} disabled={filters.page === totalPages} className="px-3 py-1.5 rounded-lg border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition-colors">→</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal transaction={editing} categories={categories} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl border border-zinc-100">
            <p className="font-display font-semibold text-[#09090b] mb-1">¿Eliminar transacción?</p>
            <p className="text-zinc-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
