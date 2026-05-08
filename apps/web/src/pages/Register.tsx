import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    if (form.password.length < 8) return setError('Mínimo 8 caracteres')
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#fafafa]">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] bg-[#09090b] flex-col justify-between p-10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4 1.5 1.5 4 1.5 7s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M7 4.5V7l2 1.2" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm tracking-wide leading-none">AERIS</p>
            <p className="text-zinc-500 text-[10px] tracking-widest mt-0.5 leading-none">FINANCE</p>
          </div>
        </div>

        <div>
          <blockquote className="text-zinc-300 text-lg font-display font-medium leading-relaxed mb-4">
            "Tecnología que respira contigo."
          </blockquote>
          <p className="text-zinc-600 text-sm">— Aeris</p>
        </div>

        <p className="text-zinc-700 text-xs">Aeris Finance · Gestión consciente de tus finanzas</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl text-[#09090b] mb-1">Crear cuenta</h1>
            <p className="text-zinc-500 text-sm">Empieza tu gestión financiera consciente</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {[
              { label: 'Nombre completo', field: 'name', type: 'text', placeholder: 'Tu nombre' },
              { label: 'Email', field: 'email', type: 'email', placeholder: 'tu@email.com' },
              { label: 'Contraseña', field: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Confirmar contraseña', field: 'confirm', type: 'password', placeholder: '••••••••' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5 tracking-wide uppercase">
                  {label}
                </label>
                <input
                  type={type}
                  required
                  value={form[field as keyof typeof form]}
                  onChange={set(field as keyof typeof form)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-[#09090b] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#09090b] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xs mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#09090b] hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
