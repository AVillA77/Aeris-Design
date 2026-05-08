import { useState, useEffect } from 'react'
import { goalsService, type Goal } from '../services/goals'
import { toNum, fmt } from '../utils/format'
import { useCurrencySymbol } from '../utils/format'
import { toast } from '../store/toast'

const PRESET_COLORS = ['#3b5bdb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#09090b']

function GoalModal({ goal, onSave, onClose }: {
  goal?: Goal | null
  onSave: (data: any) => Promise<void>
  onClose: () => void
}) {
  const sym = useCurrencySymbol()
  const [form, setForm] = useState({
    name: goal?.name || '',
    target: goal?.target || 0,
    saved: goal?.saved || 0,
    color: goal?.color || PRESET_COLORS[0],
    deadline: goal?.deadline?.slice(0, 10) || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({ ...form, deadline: form.deadline || undefined })
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 w-full max-w-md mx-4 p-6">
        <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-5">
          {goal ? 'Editar meta' : 'Nueva meta de ahorro'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Ej: Vacaciones, Laptop..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Objetivo ({sym})</label>
              <input type="number" min="0.01" step="0.01" required value={form.target || ''} onChange={(e) => setForm((f) => ({ ...f, target: parseFloat(e.target.value) || 0 }))} className={inputCls} placeholder="0.00" />
            </div>
            <div>
              <label className={labelCls}>Ahorrado ({sym})</label>
              <input type="number" min="0" step="0.01" value={form.saved || ''} onChange={(e) => setForm((f) => ({ ...f, saved: parseFloat(e.target.value) || 0 }))} className={inputCls} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Fecha límite (opcional)</label>
            <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-zinc-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Goals() {
  const sym = useCurrencySymbol()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const { data } = await goalsService.getAll()
      setGoals(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGoals() }, [])

  const handleSave = async (data: any) => {
    if (editing) {
      await goalsService.update(editing.id, data)
      toast.success('Meta actualizada')
    } else {
      await goalsService.create(data)
      toast.success('Meta creada')
    }
    setEditing(null)
    fetchGoals()
  }

  const handleDelete = async (id: string) => {
    await goalsService.delete(id)
    toast.success('Meta eliminada')
    setConfirmDelete(null)
    fetchGoals()
  }

  const handleDeposit = async (goal: Goal, amount: number) => {
    const newSaved = Math.min(toNum(goal.saved) + amount, toNum(goal.target))
    await goalsService.update(goal.id, { saved: newSaved })
    toast.success(`${sym}${amount.toFixed(2)} añadido a "${goal.name}"`)
    fetchGoals()
  }

  const totalTarget = goals.reduce((s, g) => s + toNum(g.target), 0)
  const totalSaved = goals.reduce((s, g) => s + toNum(g.saved), 0)

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs text-zinc-400 font-medium">{goals.length} metas</p>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3.5 py-2 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors text-xs font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Nueva meta
        </button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Objetivo total', value: totalTarget, color: 'text-zinc-900 dark:text-zinc-100' },
            { label: 'Total ahorrado', value: totalSaved, color: 'text-emerald-600' },
            { label: 'Pendiente', value: totalTarget - totalSaved, color: 'text-zinc-500 dark:text-zinc-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
              <p className={`font-display font-bold text-xl tabular-nums ${color}`}>{sym}{fmt(value)}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-center py-12 text-zinc-400 text-sm">Cargando...</p>
      ) : goals.length === 0 ? (
        <p className="text-center py-12 text-zinc-400 text-sm">Sin metas. Crea una para empezar.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map((g) => {
            const p = pct(g.saved, g.target)
            const done = p >= 100
            const daysLeft = g.deadline
              ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000)
              : null

            return (
              <div key={g.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 group hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{g.name}</span>
                  </div>
                  {done && (
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">✓ Completada</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mb-3">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: done ? '#10b981' : g.color }} />
                </div>

                <div className="flex justify-between text-xs mb-3">
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{sym}{fmt(g.saved)}</span>
                  <span className="text-zinc-400">de {sym}{fmt(g.target)} · {Math.round(p)}%</span>
                </div>

                {daysLeft !== null && (
                  <p className={`text-[11px] mb-3 ${daysLeft < 0 ? 'text-red-500' : daysLeft < 30 ? 'text-amber-500' : 'text-zinc-400'}`}>
                    {daysLeft < 0 ? `Venció hace ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}
                  </p>
                )}

                {!done && (
                  <DepositBar goal={g} onDeposit={handleDeposit} sym={sym} />
                )}

                <div className="flex gap-3 mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(g); setShowModal(true) }} className="text-[11px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors">Editar</button>
                  <button onClick={() => setConfirmDelete(g.id)} className="text-[11px] text-zinc-300 hover:text-red-500 font-medium transition-colors">Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <GoalModal goal={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm mx-4 shadow-xl border border-zinc-100 dark:border-zinc-800 text-center">
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100 mb-1">¿Eliminar meta?</p>
            <p className="text-sm text-zinc-500 mb-5">Esta acción no se puede deshacer.</p>
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

function DepositBar({ goal, onDeposit, sym }: { goal: Goal; onDeposit: (g: Goal, amount: number) => void; sym: string }) {
  const [amount, setAmount] = useState('')
  return (
    <div className="flex gap-2">
      <input
        type="number" min="0.01" step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={`Añadir ${sym}...`}
        className="flex-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
      />
      <button
        onClick={() => { const n = parseFloat(amount); if (n > 0) { onDeposit(goal, n); setAmount('') } }}
        className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 transition-colors"
      >
        +
      </button>
    </div>
  )
}

function pct(value: unknown, total: unknown): number {
  const t = Number(total)
  return t > 0 ? Math.min((Number(value) / t) * 100, 100) : 0
}
