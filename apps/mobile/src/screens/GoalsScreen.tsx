import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native'
import { goalsService, type Goal, type GoalPayload } from '../services/goals'
import { usePrefsStore, CURRENCIES } from '../store/prefs'

const PRESET_COLORS = ['#3b5bdb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#09090b']

function GoalModal({
  visible,
  goal,
  sym,
  onSave,
  onClose,
}: {
  visible: boolean
  goal: Goal | null
  sym: string
  onSave: (data: GoalPayload) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goal) {
      setName(goal.name)
      setTarget(String(goal.target))
      setSaved(String(goal.saved))
      setColor(goal.color)
      setDeadline(goal.deadline?.slice(0, 10) || '')
    } else {
      setName('')
      setTarget('')
      setSaved('')
      setColor(PRESET_COLORS[0])
      setDeadline('')
    }
  }, [goal, visible])

  const handleSave = async () => {
    const t = parseFloat(target)
    if (!name.trim()) return Alert.alert('Error', 'Ingresa un nombre')
    if (!t || t <= 0) return Alert.alert('Error', 'Ingresa un objetivo válido')
    setLoading(true)
    try {
      await onSave({
        name: name.trim(),
        target: t,
        saved: parseFloat(saved) || 0,
        color,
        deadline: deadline || undefined,
      })
      onClose()
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={s.modalContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancelBtn}>Cancelar</Text></TouchableOpacity>
          <Text style={s.modalTitle}>{goal ? 'Editar meta' : 'Nueva meta'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" /> : <Text style={s.saveBtn}>Guardar</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.modalContent}>
          <Text style={s.fieldLabel}>Nombre</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ej: Vacaciones, Laptop..." />

          <Text style={s.fieldLabel}>Objetivo ({sym})</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={target} onChangeText={setTarget} placeholder="0.00" />

          <Text style={s.fieldLabel}>Ya ahorrado ({sym})</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={saved} onChangeText={setSaved} placeholder="0.00" />

          <Text style={s.fieldLabel}>Fecha límite (YYYY-MM-DD, opcional)</Text>
          <TextInput style={s.input} value={deadline} onChangeText={setDeadline} placeholder="2025-12-31" />

          <Text style={s.fieldLabel}>Color</Text>
          <View style={s.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Modal>
  )
}

export function GoalsScreen() {
  const currency = usePrefsStore((s) => s.currency)
  const sym = CURRENCIES[currency].symbol
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

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

  const handleSave = async (data: GoalPayload) => {
    if (editing) await goalsService.update(editing.id, data)
    else await goalsService.create(data)
    setEditing(null)
    fetchGoals()
  }

  const handleDelete = (g: Goal) => {
    Alert.alert('Eliminar', `¿Eliminar meta "${g.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => { await goalsService.delete(g.id); fetchGoals() },
      },
    ])
  }

  const handleDeposit = async () => {
    if (!depositGoal) return
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) return Alert.alert('Error', 'Ingresa un monto válido')
    const newSaved = Math.min(depositGoal.saved + amount, depositGoal.target)
    await goalsService.update(depositGoal.id, { saved: newSaved })
    setDepositGoal(null)
    setDepositAmount('')
    fetchGoals()
  }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)

  return (
    <View style={s.container}>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#3b5bdb" /></View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListHeaderComponent={goals.length > 0 ? (
            <View style={s.summaryRow}>
              {[
                { label: 'Objetivo', value: totalTarget, color: '#111827' },
                { label: 'Ahorrado', value: totalSaved, color: '#16a34a' },
                { label: 'Pendiente', value: totalTarget - totalSaved, color: '#6b7280' },
              ].map(({ label, value, color }) => (
                <View key={label} style={s.summaryCard}>
                  <Text style={s.summaryLabel}>{label}</Text>
                  <Text style={[s.summaryValue, { color }]}>{sym}{value.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          ListEmptyComponent={<Text style={s.empty}>Sin metas. Crea una con +</Text>}
          renderItem={({ item }) => {
            const pct = item.target > 0 ? Math.min((item.saved / item.target) * 100, 100) : 0
            const done = pct >= 100
            const daysLeft = item.deadline
              ? Math.ceil((new Date(item.deadline).getTime() - Date.now()) / 86400000)
              : null

            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View style={[s.dot, { backgroundColor: item.color }]} />
                    <Text style={s.goalName}>{item.name}</Text>
                    {done && <Text style={s.doneBadge}>✓</Text>}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => { setEditing(item); setShowModal(true) }}>
                      <Text style={s.editText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text style={s.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: done ? '#16a34a' : item.color }]} />
                </View>

                <View style={s.cardBottom}>
                  <Text style={s.savedText}>{sym}{item.saved.toFixed(2)}</Text>
                  <Text style={s.targetText}>de {sym}{item.target.toFixed(2)} · {Math.round(pct)}%</Text>
                </View>

                {daysLeft !== null && (
                  <Text style={[s.deadline, daysLeft < 0 ? s.deadlineOver : daysLeft < 30 ? s.deadlineSoon : s.deadlineOk]}>
                    {daysLeft < 0 ? `Venció hace ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}
                  </Text>
                )}

                {!done && (
                  <TouchableOpacity style={s.depositBtn} onPress={() => { setDepositGoal(item); setDepositAmount('') }}>
                    <Text style={s.depositText}>+ Añadir ahorro</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setShowModal(true) }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <GoalModal
        visible={showModal}
        goal={editing}
        sym={sym}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditing(null) }}
      />

      {/* Deposit modal */}
      <Modal visible={!!depositGoal} transparent animationType="fade" onRequestClose={() => setDepositGoal(null)}>
        <View style={s.depositOverlay}>
          <View style={s.depositBox}>
            <Text style={s.depositTitle}>Añadir a "{depositGoal?.name}"</Text>
            <TextInput
              style={s.depositInput}
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
              placeholder={`Monto en ${sym}`}
              autoFocus
            />
            <View style={s.depositActions}>
              <TouchableOpacity style={s.depositCancel} onPress={() => setDepositGoal(null)}>
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.depositConfirm} onPress={handleDeposit}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  goalName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  doneBadge: { fontSize: 12, color: '#16a34a', fontWeight: '700', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  editText: { color: '#3b5bdb', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 16 },
  progressBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  savedText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  targetText: { fontSize: 13, color: '#9ca3af' },
  deadline: { fontSize: 12, marginTop: 4 },
  deadlineOver: { color: '#dc2626', fontWeight: '600' },
  deadlineSoon: { color: '#d97706', fontWeight: '600' },
  deadlineOk: { color: '#9ca3af' },
  depositBtn: { marginTop: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  depositText: { fontSize: 13, color: '#3b5bdb', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b5bdb', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b5bdb', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cancelBtn: { fontSize: 15, color: '#6b7280' },
  saveBtn: { fontSize: 15, color: '#3b5bdb', fontWeight: '700' },
  modalContent: { padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15, color: '#111827' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#000', transform: [{ scale: 1.2 }] },
  // Deposit modal
  depositOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  depositBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  depositTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  depositInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 18, color: '#111827', marginBottom: 16 },
  depositActions: { flexDirection: 'row', gap: 10 },
  depositCancel: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  depositConfirm: { flex: 1, backgroundColor: '#3b5bdb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
})
