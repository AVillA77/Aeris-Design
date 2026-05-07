import { useState, useEffect } from 'react'
import { categoriesService, type Category } from '../services/categories'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#14b8a6', '#3b82f6', '#06b6d4',
]

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>
  onSave: (data: { name: string; color: string }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSave({ name, color })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await categoriesService.getAll()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async (data: { name: string; color: string }) => {
    await categoriesService.create(data)
    setShowForm(false)
    fetch()
  }

  const handleUpdate = async (data: { name: string; color: string }) => {
    if (!editing) return
    await categoriesService.update(editing.id, data)
    setEditing(null)
    fetch()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleteError('')
    try {
      await categoriesService.delete(confirmDelete.id)
      setConfirmDelete(null)
      fetch()
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'No se puede eliminar')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Nueva categoría
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4">
          <CategoryForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-center py-12 text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {categories.length === 0 && !showForm && (
            <p className="text-center py-12 text-gray-400">No hay categorías. Crea una para empezar.</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id}>
              {editing?.id === cat.id ? (
                <CategoryForm
                  initial={cat}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      {cat.transaction_count} transacciones · ${cat.total_expenses?.toFixed(2) || '0.00'} en gastos
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(cat)} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                      Editar
                    </button>
                    <button onClick={() => { setConfirmDelete(cat); setDeleteError('') }} className="text-sm text-red-400 hover:text-red-600 font-medium">
                      Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <p className="font-medium text-gray-800 mb-1">¿Eliminar "{confirmDelete.name}"?</p>
            {deleteError
              ? <p className="text-sm text-red-600 mb-4">{deleteError}</p>
              : <p className="text-sm text-gray-500 mb-4">Solo se puede eliminar si no tiene transacciones.</p>
            }
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              {!deleteError && (
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
