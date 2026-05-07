import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { transactionsService, type Transaction } from '../services/transactions'
import { budgetsService, type Budget } from '../services/budgets'
import { useAuthStore } from '../store/auth'
import { format, startOfMonth, endOfMonth } from 'date-fns'
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

  const recentTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const alertBudgets = budgets.filter((b) => pct(b.spent, b.limit_amount) >= 80)

  if (loading) return <div className="p-6 text-center text-gray-400">Cargando...</div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Ingresos del mes', value: totalIncome, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Gastos del mes', value: totalExpense, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Balance', value: balance, color: balance >= 0 ? 'text-green-600' : 'text-red-600', bg: balance >= 0 ? 'bg-green-50' : 'bg-red-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>
              {value >= 0 ? '' : '-'}${Math.abs(value).toFixed(2)}

            </p>
          </div>
        ))}
      </div>

      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 font-medium text-sm mb-2">⚠ Presupuestos próximos al límite</p>
          <div className="flex flex-wrap gap-2">
            {alertBudgets.map((b) => (
              <span key={b.id} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                {b.category_name}: {Math.round(pct(b.spent, b.limit_amount))}%
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Gastos por categoría</h2>
          {categoryData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Sin gastos este mes</p>
              <Link to="/transactions" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
                Agregar transacción →
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name">
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `$${fmt(v)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Últimas transacciones</h2>
            <Link to="/transactions" className="text-sm text-blue-500 hover:underline">Ver todas</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Sin transacciones este mes</p>
              <Link to="/transactions" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
                Agregar transacción →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tx.category_color }} />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{tx.description || tx.category_name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(tx.date), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ml-3 whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
