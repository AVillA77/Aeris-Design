import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { transactionsService, type Transaction } from '../services/transactions'
import { budgetsService, type Budget } from '../services/budgets'
import { useAuthStore } from '../store/auth'
import { usePrefsStore, CURRENCIES } from '../store/prefs'

function SummaryCard({ label, value, color, sym }: { label: string; value: number; color: string; sym: string }) {
  return (
    <View style={s.summaryCard}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, { color }]}>{sym}{Math.abs(value).toFixed(2)}</Text>
    </View>
  )
}

export function DashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user)
  const currency = usePrefsStore((s) => s.currency)
  const sym = CURRENCIES[currency].symbol
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`

    Promise.all([
      transactionsService.getAll({ from, to, limit: 100 }),
      budgetsService.getAll(),
    ]).then(([txRes, budgetRes]) => {
      setTransactions(txRes.data.data)
      setBudgets(budgetRes.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const alertBudgets = budgets.filter((b) => b.limit_amount > 0 && b.spent / b.limit_amount >= 0.8)
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  if (loading) return <View style={s.center}><Text style={s.loadingText}>Cargando...</Text></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>

      {/* Summary */}
      <View style={s.summaryRow}>
        <SummaryCard label="Ingresos" value={income} color="#16a34a" sym={sym} />
        <SummaryCard label="Gastos" value={expense} color="#dc2626" sym={sym} />
        <SummaryCard label="Balance" value={balance} color={balance >= 0 ? '#16a34a' : '#dc2626'} sym={sym} />
      </View>

      {/* Budget alerts */}
      {alertBudgets.length > 0 && (
        <View style={s.alertBox}>
          <Text style={s.alertTitle}>Presupuestos al límite</Text>
          {alertBudgets.map((b) => (
            <Text key={b.id} style={s.alertItem}>
              {b.category_name}: {Math.round((b.spent / b.limit_amount) * 100)}% usado
            </Text>
          ))}
        </View>
      )}

      {/* Recent transactions */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Últimas transacciones</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={s.sectionLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <Text style={s.empty}>Sin transacciones este mes</Text>
        ) : (
          recent.map((tx) => (
            <View key={tx.id} style={s.txRow}>
              <View style={[s.dot, { backgroundColor: tx.category_color }]} />
              <View style={s.txInfo}>
                <Text style={s.txDesc} numberOfLines={1}>{tx.description || tx.category_name}</Text>
                <Text style={s.txDate}>{tx.date}</Text>
              </View>
              <Text style={[s.txAmount, { color: tx.type === 'income' ? '#16a34a' : '#dc2626' }]}>
                {tx.type === 'income' ? '+' : '-'}{sym}{tx.amount.toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' },
  summaryValue: { fontSize: 15, fontWeight: '800' },
  alertBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fbbf24', borderRadius: 12, padding: 14, marginBottom: 16 },
  alertTitle: { color: '#92400e', fontWeight: '700', fontSize: 13, marginBottom: 6 },
  alertItem: { color: '#92400e', fontSize: 12, marginBottom: 2 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionLink: { fontSize: 13, color: '#3b5bdb', fontWeight: '600' },
  empty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 16, fontSize: 14 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, color: '#111827', fontWeight: '500' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
})
