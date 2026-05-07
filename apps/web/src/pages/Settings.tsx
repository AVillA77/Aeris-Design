import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

interface Section {
  title: string
  children: React.ReactNode
}

function Card({ title, children }: Section) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export function Settings() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileMsg(null)
    try {
      const { data } = await api.put('/users/me', { name: profile.name, email: profile.email })
      setUser({ name: data.name, email: data.email })
      setProfileMsg({ type: 'ok', text: 'Perfil actualizado correctamente' })
    } catch (err: any) {
      setProfileMsg({ type: 'err', text: err.response?.data?.error || 'Error al actualizar' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) {
      setPwMsg({ type: 'err', text: 'Las contraseñas no coinciden' })
      return
    }
    if (passwords.next.length < 8) {
      setPwMsg({ type: 'err', text: 'Mínimo 8 caracteres' })
      return
    }
    setSaving(true)
    setPwMsg(null)
    try {
      await api.put('/users/me', { password: passwords.next })
      setPwMsg({ type: 'ok', text: 'Contraseña actualizada' })
      setPasswords({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.response?.data?.error || 'Error al actualizar' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      {/* Profile */}
      <Card title="Perfil">
        <form onSubmit={handleProfileSave} className="space-y-4">
          {profileMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${profileMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {profileMsg.text}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card title="Cambiar contraseña">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.text}
            </p>
          )}
          {[
            { label: 'Nueva contraseña', key: 'next' },
            { label: 'Confirmar contraseña', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                required
                value={passwords[key as keyof typeof passwords]}
                onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </Card>

      {/* Account */}
      <Card title="Cuenta">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-700 font-medium">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </Card>
    </div>
  )
}
