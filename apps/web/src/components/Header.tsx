import { useAuthStore } from '../store/auth'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../store/theme'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transacciones',
  '/categories': 'Categorías',
  '/budgets': 'Presupuestos',
  '/goals': 'Metas de ahorro',
  '/reports': 'Reportes',
  '/settings': 'Ajustes',
}

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { isDark, toggle } = useThemeStore()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const title = PAGE_TITLES[location.pathname] ?? ''

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 h-14 flex items-center justify-between flex-shrink-0">
      <h2 className="font-display font-medium text-zinc-900 dark:text-zinc-100 text-sm tracking-wide">
        {title}
      </h2>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7.5" cy="7.5" r="3" />
              <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1 1M10.8 10.8l1 1M3.2 11.8l1-1M10.8 4.2l1-1" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12.5 8.5A5.5 5.5 0 016 2a5.5 5.5 0 100 11 5.5 5.5 0 006.5-4.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

        <Link
          to="/settings"
          className="flex items-center gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-semibold flex items-center justify-center tracking-wide flex-shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-none">{user?.name}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{user?.email}</p>
          </div>
        </Link>

        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium transition-colors px-2 py-1.5"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
