import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { useAuthStore } from '../store/auth'
import { usePrefsStore, CURRENCIES, type CurrencyCode } from '../store/prefs'
import { api } from '../services/api'

const CURRENCY_LIST = Object.entries(CURRENCIES) as [CurrencyCode, { symbol: string; name: string }][]

export function SettingsScreen() {
  const { user, logout } = useAuthStore()
  const { currency, setCurrency } = usePrefsStore()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', { name, email })
      Alert.alert('Éxito', 'Perfil actualizado')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) return Alert.alert('Error', 'Las contraseñas no coinciden')
    if (newPw.length < 8) return Alert.alert('Error', 'Mínimo 8 caracteres')
    setSaving(true)
    try {
      await api.put('/users/me', { password: newPw })
      Alert.alert('Éxito', 'Contraseña actualizada')
      setNewPw('')
      setConfirmPw('')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ])
  }

  const handleCurrencyChange = () => {
    const options = CURRENCY_LIST.map(([code, { symbol, name }]) => ({
      text: `${symbol} — ${name} (${code})`,
      onPress: () => setCurrency(code),
    }))
    Alert.alert('Seleccionar moneda', '', [
      ...options,
      { text: 'Cancelar', style: 'cancel' as const },
    ])
  }

  const currentCurrency = CURRENCIES[currency]

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Preferences */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Preferencias</Text>
        <Text style={s.label}>Moneda</Text>
        <TouchableOpacity style={s.currencyBtn} onPress={handleCurrencyChange}>
          <Text style={s.currencySymbol}>{currentCurrency.symbol}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.currencyName}>{currentCurrency.name}</Text>
            <Text style={s.currencyCode}>{currency}</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Profile */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Perfil</Text>
        <Text style={s.label}>Nombre</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} />
        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TouchableOpacity style={s.button} onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.buttonText}>Guardar cambios</Text>}
        </TouchableOpacity>
      </View>

      {/* Password */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Cambiar contraseña</Text>
        <Text style={s.label}>Nueva contraseña</Text>
        <TextInput style={s.input} value={newPw} onChangeText={setNewPw} secureTextEntry />
        <Text style={s.label}>Confirmar contraseña</Text>
        <TextInput style={s.input} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
        <TouchableOpacity style={s.button} onPress={handleChangePassword} disabled={saving}>
          <Text style={s.buttonText}>Cambiar contraseña</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Cuenta</Text>
        <Text style={s.infoText}>{user?.name}</Text>
        <Text style={s.infoSubText}>{user?.email}</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 15, color: '#111827' },
  button: { backgroundColor: '#3b5bdb', borderRadius: 10, padding: 13, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  currencyBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 12 },
  currencySymbol: { fontSize: 22, fontWeight: '800', color: '#111827', width: 30, textAlign: 'center' },
  currencyName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  currencyCode: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  chevron: { fontSize: 22, color: '#d1d5db' },
  infoText: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  infoSubText: { fontSize: 13, color: '#6b7280', marginBottom: 14 },
  logoutBtn: { borderWidth: 1, borderColor: '#fca5a5', borderRadius: 10, padding: 13, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
})
