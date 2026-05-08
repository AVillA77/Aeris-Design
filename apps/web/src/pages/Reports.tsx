import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { transactionsService, type Transaction } from '../services/transactions'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { toNum } from '../utils/format'

const COLORS = ['#3b5bdb', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4']

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

const tooltipStyle = {
  border: '1px solid #e4e4e7',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
}

export function Reports() {
  const [range, setRange] = useState(6)
  const { data: transactions, loading } = useTransactionData(range)

  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>()
  for (let i = range - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i)
    const key = format(d, 'yyyy-MM')
    monthlyMap.set(key, { month: format(d, 'MMM', { locale: es }), income: 0, expense: 0 })
  }
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7)
    const entry = monthlyMap.get(key)
    if (entry) entry[tx.type] += toNum(tx.amount)
  }
  const monthlyData = Array.from(monthlyMap.values())

  let cumulative = 0
  const balanceData = monthlyData.map((m) => {
    cumulative += m.income - m.expense
    return { month: m.month, balance: parseFloat(cumulative.toFixed(2)) }
  })

  const categoryMap = new Map<string, { name: string; color: string; value: number }>()
  for (const tx of transactions.filter((t) => t.type === 'expense')) {
    const existing = categoryMap.get(tx.category_id)
    if (existing) {
      existing.value += toNum(tx.amount)
    } else {
      categoryMap.set(tx.category_id, { name: tx.category_name, color: tx.category_color, value: toNum(tx.amount) })
    }
  }
  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + toNum(t.amount), 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + toNum(t.amount), 0)
  const balance = totalIncome - totalExpense

  const cardCls = 'bg-white rounded-2xl border border-zinc-100 p-5'
  const labelCls = 'text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3'

  return (
    <div className="p-7 space-y-6">
      {/* Range selector */}
      <div className="flex justify-end">
        <div className="flex gap-1 bg-white border border-zinc-100 rounded-xl p-1">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setRange(m)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === m ? 'bg-[#09090b] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className={cardCls}>
          <p className={labelCls}>Ingresos</p>
          <p className="font-display font-bold text-xl text-emerald-600 tabular-nums">${totalIncome.toFixed(2)}</p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Gastos</p>
          <p className="font-display font-bold text-xl text-red-500 tabular-nums">${totalExpense.toFixed(2)}</p>
        </div>
        <div className={cardCls}>
          <p className={labelCls}>Balance neto</p>
          <p className={`font-display font-bold text-xl tabular-nums ${balance >= 0 ? 'text-[#09090b]' : 'text-red-500'}`}>
            {balance >= 0 ? '+' : ''}${balance.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-16 text-zinc-400 text-sm">Cargando datos...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Bar chart */}
          <div className={cardCls}>
            <p className={labelCls}>Ingresos vs Gastos</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, '']} contentStyle={tooltipStyle} cursor={{ fill: '#fafafa' }} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart */}
          <div className={cardCls}>
            <p className={labelCls}>Tendencia de balance</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Balance']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b5bdb" strokeWidth={2} dot={{ r: 3, fill: '#3b5bdb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className={cardCls}>
            <p className={labelCls}>Gastos por categoría</p>
            {categoryData.length === 0 ? (
              <p className="text-center text-zinc-400 py-8 text-sm">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, '']} contentStyle={tooltipStyle} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category table */}
          <div className={cardCls}>
            <p className={labelCls}>Detalle por categoría</p>
            {categoryData.length === 0 ? (
              <p className="text-center text-zinc-400 py-8 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-3.5">
                {categoryData.map((cat, i) => {
                  const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                          <span className="text-zinc-700">{cat.name}</span>
                        </div>
                        <span className="font-semibold text-[#09090b] tabular-nums">${cat.value.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
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
