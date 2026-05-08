import { useState, useEffect } from 'react'
import { categoriesService, type Category } from '../services/categories'
import { toast } from '../store/toast'

const PRESET_COLORS = [
  '#09090b', '#3b5bdb', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4',
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
  const [color, setColor] = useState(initial?.color || PRESET_COLORS[1])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ name, color })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Nombre</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
          placeholder="Ej: Alimentación"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">Color</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors">
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

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await categoriesService.getAll()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (data: { name: string; color: string }) => {
    await categoriesService.create(data)
    toast.success('Categoría creada')
    setShowForm(false)
    fetchAll()
  }

  const handleUpdate = async (data: { name: string; color: string }) => {
    if (!editing) return
    await categoriesService.update(editing.id, data)
    toast.success('Categoría actualizada')
    setEditing(null)
    fetchAll()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleteError('')
    try {
      await categoriesService.delete(confirmDelete.id)
      toast.success('Categoría eliminada')
      setConfirmDelete(null)
      fetchAll()
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'No se puede eliminar')
    }
  }

  return (
    <div className="p-7">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-xs text-zinc-400 font-medium">{categories.length} categorías</p>
          {!showForm && !editing && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors text-xs font-medium"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 1v10M1 6h10" strokeLinecap="round" />
              </svg>
              Nueva categoría
            </button>
          )}
        </div>

        {showForm && (
          <CategoryForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}

        {loading ? (
          <p className="text-center py-12 text-zinc-400 text-sm">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {categories.length === 0 && !showForm && (
              <p className="text-center py-12 text-zinc-400 text-sm">Sin categorías. Crea una para empezar.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id}>
                {editing?.id === cat.id ? (
                  <CategoryForm initial={cat} onSave={handleUpdate} onCancel={() => setEditing(null)} />
                ) : (
                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4 py-3.5 group hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{cat.name}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {cat.transaction_count} transacciones
                        {cat.total_expenses ? ` · ${Number(cat.total_expenses).toFixed(2)} en gastos` : ''}
                      </p>
                    </div>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing(cat)} className="text-[11px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors">
                        Editar
                      </button>
                      <button onClick={() => { setConfirmDelete(cat); setDeleteError('') }} className="text-[11px] text-zinc-300 hover:text-red-500 font-medium transition-colors">
                        Borrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm mx-4 shadow-xl border border-zinc-100 dark:border-zinc-800">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-1">¿Eliminar "{confirmDelete.name}"?</p>
            {deleteError
              ? <p className="text-sm text-red-500 mb-4">{deleteError}</p>
              : <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Solo se puede eliminar si no tiene transacciones.</p>
            }
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
              {!deleteError && (
                <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-colors">Eliminar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
