import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native'
import { useAuthStore } from '../store/auth'

export function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return setError('Completa todos los campos')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    if (form.password.length < 8) return setError('Mínimo 8 caracteres')
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Empieza a gestionar tus finanzas</Text>

          {!!error && <Text style={s.error}>{error}</Text>}

          {[
            { label: 'Nombre completo', field: 'name', keyboard: 'default', secure: false },
            { label: 'Email', field: 'email', keyboard: 'email-address', secure: false },
            { label: 'Contraseña', field: 'password', keyboard: 'default', secure: true },
            { label: 'Confirmar contraseña', field: 'confirm', keyboard: 'default', secure: true },
          ].map(({ label, field, keyboard, secure }) => (
            <View key={field}>
              <Text style={s.label}>{label}</Text>
              <TextInput
                style={s.input}
                placeholder={label}
                placeholderTextColor="#9ca3af"
                value={form[field as keyof typeof form]}
                onChangeText={set(field as keyof typeof form)}
                keyboardType={keyboard as any}
                autoCapitalize="none"
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Registrarse</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>¿Ya tienes cuenta? <Text style={s.linkBold}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1d4ed8' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  error: { backgroundColor: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 13, marginBottom: 12, fontSize: 15, color: '#111827' },
  button: { backgroundColor: '#1d4ed8', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: { textAlign: 'center', color: '#6b7280', marginTop: 16, fontSize: 14 },
  linkBold: { color: '#1d4ed8', fontWeight: '600' },
})
