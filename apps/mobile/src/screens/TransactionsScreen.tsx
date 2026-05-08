import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { transactionsService, type Transaction, type TransactionPayload } from '../services/transactions'
import { categoriesService, type Category } from '../services/categories'
import { usePrefsStore, CURRENCIES } from '../store/prefs'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', other: 'Otro',
}

function TransactionForm({
  visible,
  transaction,
  categories,
  sym,
  onSave,
  onClose,
}: {
  visible: boolean
  transaction: Transaction | null
  categories: Category[]
  sym: string
  onSave: (p: TransactionPayload) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<TransactionPayload>({
    type: 'expense',
    amount: 0,
    description: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    categoryId: categories[0]?.id || '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        paymentMethod: transaction.payment_method,
        categoryId: transaction.category_id,
      })
    } else {
      setForm((f) => ({ ...f, categoryId: categories[0]?.id || '' }))
    }
  }, [transaction, categories, visible])

  const handleSave = async () => {
    if (!form.categoryId) return Alert.alert('Error', 'Selecciona una categoría')
    if (!form.amount || form.amount <= 0) return Alert.alert('Error', 'Ingresa un monto válido')
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancelBtn}>Cancelar</Text></TouchableOpacity>
          <Text style={s.modalTitle}>{transaction ? 'Editar' : 'Nueva transacción'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" /> : <Text style={s.saveBtn}>Guardar</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.modalContent}>
          <View style={s.toggleRow}>
            {(['expense', 'income'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.toggleBtn, form.type === t && (t === 'expense' ? s.toggleExpense : s.toggleIncome)]}
                onPress={() => setForm((f) => ({ ...f, type: t }))}
              >
                <Text style={[s.toggleText, form.type === t && s.toggleTextActive]}>
                  {t === 'expense' ? 'Gasto' : 'Ingreso'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Monto ({sym})</Text>
          <TextInput
            style={s.input}
            keyboardType="decimal-pad"
            value={form.amount ? String(form.amount) : ''}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: parseFloat(v) || 0 }))}
            placeholder="0.00"
          />

          <Text style={s.fieldLabel}>Descripción</Text>
          <TextInput
            style={s.input}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="Opcional"
          />

          <Text style={s.fieldLabel}>Fecha</Text>
          <TextInput
            style={s.input}
            value={form.date}
            onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
            placeholder="YYYY-MM-DD"
          />

          <Text style={s.fieldLabel}>Categoría</Text>
          <View style={s.categoryScroll}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.categoryChip, form.categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                onPress={() => setForm((f) => ({ ...f, categoryId: c.id }))}
              >
                <View style={[s.chipDot, { backgroundColor: c.color }]} />
                <Text style={[s.chipText, form.categoryId === c.id && { color: c.color, fontWeight: '700' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function TransactionsScreen() {
  const currency = usePrefsStore((s) => s.currency)
  const sym = CURRENCIES[currency].symbol
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<'' | 'income' | 'expense'>('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { limit: 50 }
      if (filter) params.type = filter
      const { data } = await transactionsService.getAll(params)
      setTransactions(data.data)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { categoriesService.getAll().then(({ data }) => setCategories(data)) }, [])

  const handleSave = async (payload: TransactionPayload) => {
    if (editing) await transactionsService.update(editing.id, payload)
    else await transactionsService.create(payload)
    setEditing(null)
    fetch()
  }

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await transactionsService.delete(id); fetch() },
      },
    ])
  }

  return (
    <View style={s.container}>
      <View style={s.filterBar}>
        {([['', 'Todos'], ['income', 'Ingresos'], ['expense', 'Gastos']] as const).map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[s.filterBtn, filter === val && s.filterBtnActive]}
            onPress={() => setFilter(val)}
          >
            <Text style={[s.filterText, filter === val && s.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#3b5bdb" /></View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.empty}>Sin transacciones</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.txCard}
              onLongPress={() => handleDelete(item.id)}
              onPress={() => { setEditing(item); setShowForm(true) }}
            >
              <View style={[s.typeBar, { backgroundColor: item.type === 'income' ? '#16a34a' : '#dc2626' }]} />
              <View style={[s.dot, { backgroundColor: item.category_color }]} />
              <View style={s.txInfo}>
                <Text style={s.txDesc} numberOfLines={1}>{item.description || item.category_name}</Text>
                <Text style={s.txMeta}>{item.category_name} · {PAYMENT_LABELS[item.payment_method]} · {item.date}</Text>
              </View>
              <Text style={[s.txAmount, { color: item.type === 'income' ? '#16a34a' : '#dc2626' }]}>
                {item.type === 'income' ? '+' : '-'}{sym}{item.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setShowForm(true) }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <TransactionForm
        visible={showForm}
        transaction={editing}
        categories={categories}
        sym={sym}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditing(null) }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterBtnActive: { backgroundColor: '#3b5bdb' },
  filterText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  typeBar: { width: 4, alignSelf: 'stretch' },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 12 },
  txInfo: { flex: 1, paddingVertical: 14 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800', paddingHorizontal: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b5bdb', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b5bdb', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cancelBtn: { fontSize: 15, color: '#6b7280' },
  saveBtn: { fontSize: 15, color: '#3b5bdb', fontWeight: '700' },
  modalContent: { padding: 20 },
  toggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  toggleExpense: { backgroundColor: '#dc2626' },
  toggleIncome: { backgroundColor: '#16a34a' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15, color: '#111827' },
  categoryScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: '#374151' },
})
