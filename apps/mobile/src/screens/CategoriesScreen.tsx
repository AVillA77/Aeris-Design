import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { categoriesService, type Category } from '../services/categories'

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#14b8a6','#3b82f6','#06b6d4']

function CategoryForm({
  visible,
  category,
  onSave,
  onClose,
}: {
  visible: boolean
  category: Category | null
  onSave: (d: { name: string; color: string }) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(category?.name || '')
    setColor(category?.color || COLORS[0])
  }, [category, visible])

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Ingresa un nombre')
    setLoading(true)
    try {
      await onSave({ name: name.trim(), color })
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
          <Text style={s.modalTitle}>{category ? 'Editar categoría' : 'Nueva categoría'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" /> : <Text style={s.saveBtn}>Guardar</Text>}
          </TouchableOpacity>
        </View>
        <View style={s.modalContent}>
          <Text style={s.fieldLabel}>Nombre</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Comida, Transporte..."
            autoFocus
          />
          <Text style={s.fieldLabel}>Color</Text>
          <View style={s.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotSelected]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <View style={[s.preview, { backgroundColor: color + '20', borderColor: color }]}>
            <View style={[s.previewDot, { backgroundColor: color }]} />
            <Text style={[s.previewText, { color }]}>{name || 'Nombre de categoría'}</Text>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await categoriesService.getAll()
      setCategories(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleSave = async (data: { name: string; color: string }) => {
    if (editing) await categoriesService.update(editing.id, data)
    else await categoriesService.create(data)
    setEditing(null)
    fetch()
  }

  const handleDelete = (cat: Category) => {
    if (cat.transaction_count > 0) {
      return Alert.alert('No se puede eliminar', 'Esta categoría tiene transacciones asociadas.')
    }
    Alert.alert('Eliminar', `¿Eliminar "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await categoriesService.delete(cat.id); fetch() } },
    ])
  }

  return (
    <View style={s.container}>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.empty}>No hay categorías</Text>}
          renderItem={({ item }) => (
            <View style={s.catCard}>
              <View style={[s.colorBadge, { backgroundColor: item.color }]} />
              <View style={s.catInfo}>
                <Text style={s.catName}>{item.name}</Text>
                <Text style={s.catMeta}>{item.transaction_count} transacciones · ${(item.total_expenses || 0).toFixed(2)} en gastos</Text>
              </View>
              <TouchableOpacity style={s.editBtn} onPress={() => { setEditing(item); setShowForm(true) }}>
                <Text style={s.editBtnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={s.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={s.fab} onPress={() => { setEditing(null); setShowForm(true) }}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <CategoryForm
        visible={showForm}
        category={editing}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditing(null) }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15 },
  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  colorBadge: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  catMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  editBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 10 },
  editBtnText: { color: '#1d4ed8', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 16, padding: 4 },
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
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1.5 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewText: { fontSize: 14, fontWeight: '600' },
})
