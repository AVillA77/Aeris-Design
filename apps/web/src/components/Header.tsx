import { useAuthStore } from '../store/auth'
import { useNavigate, Link } from 'react-router-dom'

export function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex justify-between items-center">
      <div className="text-sm text-gray-500">
        Bienvenido, <span className="font-semibold text-gray-800">{user?.name || 'Usuario'}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
