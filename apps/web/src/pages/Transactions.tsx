import { useState, useEffect, useCallback } from 'react'
import { transactionsService, type Transaction } from '../services/transactions'
import { categoriesService, type Category } from '../services/categories'
import { TransactionModal } from '../components/TransactionModal'
import { format } from 'date-fns'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro',
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Nueva transacción
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as typeof f.type, page: 1 }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>

        <select
          value={filters.categoryId}
          onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="Desde"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="Hasta"
        />

        <button
          onClick={() => setFilters({ page: 1, limit: 20, type: '', categoryId: '', from: '', to: '' })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Sin transacciones</p>
            <p className="text-sm mt-1">Agrega una nueva para empezar</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Fecha', 'Descripción', 'Categoría', 'Método', 'Tipo', 'Monto', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {format(new Date(tx.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {tx.description || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tx.category_color }}
                    >
                      {tx.category_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{PAYMENT_LABELS[tx.payment_method]}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                    tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(tx); setShowModal(true) }}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(tx.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{total} registros</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ←
              </button>
              <span className="px-3 py-1">{filters.page} / {totalPages}</span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page === totalPages}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          transaction={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center shadow-xl">
            <p className="text-gray-800 font-medium mb-1">¿Eliminar transacción?</p>
            <p className="text-gray-500 text-sm mb-5">Esta acción no se puede deshacer.</p>
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
