import { useAuthStore } from '../store/auth'
import { useNavigate, Link, useLocation } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transacciones',
  '/categories': 'Categorías',
  '/budgets': 'Presupuestos',
  '/reports': 'Reportes',
  '/settings': 'Ajustes',
}

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const title = PAGE_TITLES[location.pathname] ?? ''

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-zinc-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
      <h2 className="font-display font-medium text-[#09090b] text-sm tracking-wide">
        {title}
      </h2>

      <div className="flex items-center gap-2">
        <Link
          to="/settings"
          className="flex items-center gap-2.5 hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-[#09090b] text-white text-[10px] font-semibold flex items-center justify-center tracking-wide flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-zinc-800 leading-none">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{user?.email}</p>
          </div>
        </Link>
        <div className="w-px h-5 bg-zinc-200" />
        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-zinc-700 font-medium transition-colors px-2 py-1.5"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
