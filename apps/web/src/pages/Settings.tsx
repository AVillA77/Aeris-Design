import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">{title}</h2>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-[#09090b] bg-white focus:outline-none focus:border-zinc-400 transition-colors placeholder-zinc-400'
const labelCls = 'block text-xs font-medium text-zinc-600 mb-1.5 uppercase tracking-wide'

export function Settings() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ next: '', confirm: '' })
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
      setProfileMsg({ type: 'ok', text: 'Perfil actualizado' })
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
      setPasswords({ next: '', confirm: '' })
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.response?.data?.error || 'Error al actualizar' })
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="p-7">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#09090b] text-white font-display font-bold text-lg flex items-center justify-center flex-shrink-0 tracking-wide">
            {initials}
          </div>
          <div>
            <p className="font-display font-semibold text-[#09090b]">{user?.name}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            <p className="text-[11px] text-zinc-300 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Profile */}
        <Card title="Perfil">
          <form onSubmit={handleProfileSave} className="space-y-4">
            {profileMsg && (
              <p className={`text-xs px-4 py-2.5 rounded-xl ${profileMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {profileMsg.text}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input type="text" required value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" required value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#09090b] text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card title="Cambiar contraseña">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {pwMsg && (
              <p className={`text-xs px-4 py-2.5 rounded-xl ${pwMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {pwMsg.text}
              </p>
            )}
            {[
              { label: 'Nueva contraseña', key: 'next' },
              { label: 'Confirmar contraseña', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input
                  type="password"
                  required
                  value={passwords[key as keyof typeof passwords]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  className={inputCls}
                  placeholder="••••••••"
                />
              </div>
            ))}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#09090b] text-white rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </Card>

        {/* Account */}
        <Card title="Sesión">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500">Cerrar sesión en este dispositivo</p>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
