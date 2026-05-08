import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { transactionsService, type Transaction } from '../services/transactions'
import { budgetsService, type Budget } from '../services/budgets'
import { useAuthStore } from '../store/auth'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { toNum, fmt, pct } from '../utils/format'

export function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const to = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    Promise.all([
      transactionsService.getAll({ from, to, limit: 100 }),
      budgetsService.getAll(),
    ]).then(([txRes, budgetRes]) => {
      setTransactions(txRes.data.data)
      setBudgets(budgetRes.data)
      setLoading(false)
    })
  }, [])

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + toNum(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + toNum(t.amount), 0)
  const balance = totalIncome - totalExpense

  const categoryMap = new Map<string, { name: string; color: string; value: number }>()
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const e = categoryMap.get(tx.category_id)
    if (e) e.value += toNum(tx.amount)
    else categoryMap.set(tx.category_id, { name: tx.category_name, color: tx.category_color, value: toNum(tx.amount) })
  }
  const categoryData = Array.from(categoryMap.values())

  const recentTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const alertBudgets = budgets.filter((b) => pct(b.spent, b.limit_amount) >= 80)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-zinc-400 text-sm">Cargando...</div>
      </div>
    )
  }

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: es })

  return (
    <div className="p-7 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-xl text-[#09090b]">
          Hola, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5 capitalize">{monthLabel}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Ingresos',
            value: totalIncome,
            positive: true,
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 12V2M3 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            label: 'Gastos',
            value: totalExpense,
            positive: false,
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 2v10M3 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            label: 'Balance',
            value: balance,
            positive: balance >= 0,
            icon: (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 7h12M7 1l5 6-5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
        ].map(({ label, value, positive, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {icon}
              </div>
            </div>
            <p className={`font-display font-bold text-2xl ${positive ? 'text-[#09090b]' : 'text-[#09090b]'}`}>
              {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
            </p>
            <p className={`text-xs mt-1 font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {positive ? '↑' : '↓'} este mes
            </p>
          </div>
        ))}
      </div>

      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-amber-800 font-medium text-xs uppercase tracking-wide mb-2.5">
            Presupuestos próximos al límite
          </p>
          <div className="flex flex-wrap gap-2">
            {alertBudgets.map((b) => (
              <span key={b.id} className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
                {b.category_name} · {Math.round(pct(b.spent, b.limit_amount))}%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Gastos por categoría</p>
          </div>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-400 text-sm mb-1">Sin gastos este mes</p>
              <Link to="/transactions" className="text-xs text-zinc-600 hover:text-[#09090b] underline underline-offset-2">
                Agregar transacción
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={2}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`$${fmt(v)}`, '']}
                  contentStyle={{ border: '1px solid #e4e4e7', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Últimas transacciones</p>
            <Link to="/transactions" className="text-xs text-zinc-400 hover:text-[#09090b] transition-colors">
              Ver todas →
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-zinc-400 text-sm mb-1">Sin transacciones</p>
              <Link to="/transactions" className="text-xs text-zinc-600 hover:text-[#09090b] underline underline-offset-2">
                Agregar una
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 px-1 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tx.category_color }} />
                    <div className="min-w-0">
                      <p className="text-sm text-[#09090b] truncate font-medium">{tx.description || tx.category_name}</p>
                      <p className="text-[11px] text-zinc-400">{format(new Date(tx.date), 'dd MMM', { locale: es })}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ml-3 whitespace-nowrap tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
