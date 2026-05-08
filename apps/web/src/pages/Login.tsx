import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales inválidas')
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
            "En la simplicidad habita la sofisticación."
          </blockquote>
          <p className="text-zinc-600 text-sm">— Steve Jobs</p>
        </div>

        <p className="text-zinc-700 text-xs">Aeris Finance · Gestión consciente de tus finanzas</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl text-[#09090b] mb-1">Bienvenido</h1>
            <p className="text-zinc-500 text-sm">Ingresa a tu cuenta de Aeris</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-[#09090b] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5 tracking-wide uppercase">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-[#09090b] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#09090b] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xs mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[#09090b] hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
