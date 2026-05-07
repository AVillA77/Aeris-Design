import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { budgetsService, type Budget } from '../services/budgets'
import { categoriesService, type Category } from '../services/categories'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color
  return (
    <View style={s.progressBg}>
      <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
    </View>
  )
}

function BudgetModal({
  visible,
  budget,
  categories,
  onSave,
  onClose,
}: {
  visible: boolean
  budget: Budget | null
  categories: Category[]
  onSave: (d: { categoryId: string; limitAmount: number; period: 'monthly' | 'yearly' }) => Promise<void>
  onClose: () => void
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [limitAmount, setLimitAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.category_id)
      setLimitAmount(String(budget.limit_amount))
      setPeriod(budget.period)
    } else {
      setCategoryId(categories[0]?.id || '')
      setLimitAmount('')
      setPeriod('monthly')
    }
  }, [budget, visible, categories])

  const handleSave = async () => {
    const amount = parseFloat(limitAmount)
    if (!amount || amount <= 0) return Alert.alert('Error', 'Ingresa un monto válido')
    if (!categoryId) return Alert.alert('Error', 'Selecciona una categoría')
    setLoading(true)
    try {
      await onSave({ categoryId, limitAmount: amount, period })
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
          <Text style={s.modalTitle}>{budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" /> : <Text style={s.saveBtn}>Guardar</Text>}
          </TouchableOpacity>
        </View>
        <View style={s.modalContent}>
          <Text style={s.fieldLabel}>Categoría</Text>
          <View style={s.categoryGrid}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.catChip, categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                onPress={() => setCategoryId(c.id)}
              >
                <View style={[s.chipDot, { backgroundColor: c.color }]} />
                <Text style={[s.chipText, categoryId === c.id && { color: c.color, fontWeight: '700' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldLabel}>Límite</Text>
          <TextInput
            style={s.input}
            keyboardType="decimal-pad"
            value={limitAmount}
            onChangeText={setLimitAmount}
            placeholder="0.00"
          />

          <Text style={s.fieldLabel}>Período</Text>
          <View style={s.toggleRow}>
            {(['monthly', 'yearly'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.toggleBtn, period === p && s.toggleActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[s.toggleText, period === p && s.toggleTextActive]}>
                  {p === 'monthly' ? 'Mensual' : 'Anual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function BudgetsScreen() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [b, c] = await Promise.all([budgetsService.getAll(), categoriesService.getAll()])
      setBudgets(b.data)
      setCategories(c.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleSave = async (data: { categoryId: string; limitAmount: number; period: 'monthly' | 'yearly' }) => {
    if (editing) await budgetsService.update(editing.id, data)
    else await budgetsService.create(data)
    setEditing(null)
    fetch()
  }

  const handleDelete = (b: Budget) => {
    Alert.alert('Eliminar', `¿Eliminar presupuesto de "${b.category_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await budgetsService.delete(b.id); fetch() } },
    ])
  }

  return (
    <View style={s.container}>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.empty}>No hay presupuestos. Crea uno con +</Text>}
          renderItem={({ item }) => {
            const pct = item.limit_amount > 0 ? (item.spent / item.limit_amount) * 100 : 0
            const danger = pct >= 90
            const warning = pct >= 70
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={[s.dot, { backgroundColor: item.category_color }]} />
                    <Text style={s.catName}>{item.category_name}</Text>
                    <View style={s.periodBadge}>
                      <Text style={s.periodText}>{item.period === 'monthly' ? 'Mensual' : 'Anual'}</Text>
                    </View>
                  </View>
                  <View style={s.cardActions}>
                    <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true) }}>
                      <Text style={s.editText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text style={s.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ProgressBar value={item.spent} max={item.limit_amount} color={item.category_color} />

                <View style={s.cardBottom}>
                  <Text style={[s.spentText, danger && { color: '#dc2626' }, warning && !danger && { color: '#d97706' }]}>
                    ${item.spent.toFixed(2)} gastado
                  </Text>
                  <Text style={s.limitText}>de ${item.limit_amount.toFixed(2)}</Text>
                </View>

                {danger && <Text style={s.dangerText}>⚠ Límite superado</Text>}
              </View>
            )
          }}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setShowModal(true) }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <BudgetModal
        visible={showModal}
        budget={editing}
        categories={categories}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditing(null) }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  periodBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  periodText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  editText: { color: '#1d4ed8', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 16 },
  progressBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  spentText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  limitText: { fontSize: 13, color: '#9ca3af' },
  dangerText: { fontSize: 12, color: '#dc2626', fontWeight: '600', marginTop: 4 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center', shadowColor: '#1d4ed8', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cancelBtn: { fontSize: 15, color: '#6b7280' },
  saveBtn: { fontSize: 15, color: '#1d4ed8', fontWeight: '700' },
  modalContent: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 15 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 13, color: '#374151' },
  toggleRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  toggleActive: { backgroundColor: '#1d4ed8' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
})
