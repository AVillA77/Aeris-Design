import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { transactionsService, type Transaction } from '../services/transactions'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6']

function useTransactionData(months: number) {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = format(startOfMonth(subMonths(new Date(), months - 1)), 'yyyy-MM-dd')
    const to = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    setLoading(true)
    transactionsService.getAll({ from, to, limit: 1000 }).then(({ data: res }) => {
      setData(res.data)
      setLoading(false)
    })
  }, [months])

  return { data, loading }
}

export function Reports() {
  const [range, setRange] = useState(6)
  const { data: transactions, loading } = useTransactionData(range)

  // Monthly income vs expense
  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>()
  for (let i = range - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const key = format(d, 'yyyy-MM')
    monthlyMap.set(key, { month: format(d, 'MMM yy', { locale: es }), income: 0, expense: 0 })
  }
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7)
    const entry = monthlyMap.get(key)
    if (entry) entry[tx.type] += tx.amount
  }
  const monthlyData = Array.from(monthlyMap.values())

  // Balance trend (cumulative)
  let cumulative = 0
  const balanceData = monthlyData.map((m) => {
    cumulative += m.income - m.expense
    return { month: m.month, balance: parseFloat(cumulative.toFixed(2)) }
  })

  // Category breakdown (expenses only)
  const categoryMap = new Map<string, { name: string; color: string; value: number }>()
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const existing = categoryMap.get(tx.category_id)
    if (existing) {
      existing.value += tx.amount
    } else {
      categoryMap.set(tx.category_id, { name: tx.category_name, color: tx.category_color, value: tx.amount })
    }
  }
  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setRange(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Ingresos totales</p>
          <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Gastos totales</p>
          <p className="text-2xl font-bold text-red-600">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-500 mb-1">Balance neto</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-16 text-gray-400">Cargando datos...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Income vs Expense bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Ingresos vs Gastos</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Balance trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Tendencia de balance</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Gastos por categoría</h2>
            {categoryData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-4">Detalle por categoría</h2>
            {categoryData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {categoryData.map((cat, i) => {
                  const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                          <span className="text-gray-700">{cat.name}</span>
                        </div>
                        <span className="font-medium text-gray-800">${cat.value.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cat.color || COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
