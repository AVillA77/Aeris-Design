import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/theme'
import { usePrefsStore, CURRENCIES } from '../store/prefs'
import { toast } from '../store/toast'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">{title}</h2>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:border-zinc-400 transition-colors placeholder-zinc-400'
const labelCls = 'block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wide'

export function Settings() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const { isDark, toggle } = useThemeStore()
  const { currency, setCurrency } = usePrefsStore()

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ next: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/users/me', { name: profile.name, email: profile.email })
      setUser({ name: data.name, email: data.email })
      toast.success('Perfil actualizado')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (passwords.next.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setSaving(true)
    try {
      await api.put('/users/me', { password: passwords.next })
      toast.success('Contraseña actualizada')
      setPasswords({ next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?'

  return (
    <div className="p-7">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Avatar */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-display font-bold text-lg flex items-center justify-center flex-shrink-0 tracking-wide">
            {initials}
          </div>
          <div>
            <p className="font-display font-semibold text-zinc-900 dark:text-zinc-100">{user?.name}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            <p className="text-[11px] text-zinc-300 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Preferences */}
        <Card title="Preferencias">
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Modo oscuro</p>
                <p className="text-xs text-zinc-400 mt-0.5">Cambia la apariencia de la aplicación</p>
              </div>
              <button
                onClick={toggle}
                className={`relative w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm ${isDark ? 'left-6 bg-white dark:bg-zinc-900' : 'left-1 bg-white'}`} />
              </button>
            </div>

            <div>
              <label className={labelCls}>Moneda</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className={inputCls}>
                {Object.entries(CURRENCIES).map(([code, { symbol, name }]) => (
                  <option key={code} value={code}>{symbol} — {name} ({code})</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card title="Perfil">
          <form onSubmit={handleProfileSave} className="space-y-4">
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
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card title="Cambiar contraseña">
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {[{ label: 'Nueva contraseña', key: 'next' }, { label: 'Confirmar contraseña', key: 'confirm' }].map(({ label, key }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="password" required value={passwords[key as keyof typeof passwords]} onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))} className={inputCls} placeholder="••••••••" />
              </div>
            ))}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-100 disabled:opacity-50 transition-colors">
                {saving ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </Card>

        {/* Session */}
        <Card title="Sesión">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cerrar sesión en este dispositivo</p>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
