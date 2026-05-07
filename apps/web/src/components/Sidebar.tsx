import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', href: '/', icon: '◉' },
  { name: 'Transacciones', href: '/transactions', icon: '⇄' },
  { name: 'Categorías', href: '/categories', icon: '⊞' },
  { name: 'Presupuestos', href: '/budgets', icon: '◎' },
  { name: 'Reportes', href: '/reports', icon: '↗' },
  { name: 'Ajustes', href: '/settings', icon: '⚙' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">Aeris Finance</h1>
        <p className="text-slate-400 text-xs mt-0.5">Gestión financiera</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const active = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
