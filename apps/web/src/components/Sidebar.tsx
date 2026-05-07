import { Link, useLocation } from 'react-router-dom'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Categories', href: '/categories' },
  { name: 'Budgets', href: '/budgets' },
  { name: 'Reports', href: '/reports' },
  { name: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-8">Aeris Finance</h1>
      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              location.pathname === item.href
                ? 'bg-blue-600'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
