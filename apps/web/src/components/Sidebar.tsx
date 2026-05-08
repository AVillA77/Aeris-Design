import { Link, useLocation } from 'react-router-dom'

const navigation = [
  {
    name: 'Dashboard', href: '/',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>),
  },
  {
    name: 'Transacciones', href: '/transactions',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    name: 'Categorías', href: '/categories',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 1.5V8l4.5 2.6" strokeLinecap="round" /></svg>),
  },
  {
    name: 'Presupuestos', href: '/budgets',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12V5a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1z" /><path d="M1 8h14M5 8v5M11 8v5" strokeLinecap="round" /></svg>),
  },
  {
    name: 'Metas', href: '/goals',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><circle cx="8" cy="8" r="3" /><path d="M8 1.5V5M8 11v3.5M1.5 8H5M11 8h3.5" strokeLinecap="round" /></svg>),
  },
  {
    name: 'Reportes', href: '/reports',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13V7M6 13V4M10 13V6M14 13V2" strokeLinecap="round" /></svg>),
  },
  {
    name: 'Ajustes', href: '/settings',
    icon: (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" strokeLinecap="round" /></svg>),
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-56 bg-[#09090b] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4 1.5 1.5 4 1.5 7s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M7 4.5V7l2 1.2" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm tracking-wide leading-none">AERIS</p>
            <p className="text-zinc-500 text-[10px] tracking-widest mt-0.5 leading-none">FINANCE</p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-zinc-800 mb-4" />

      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-2 text-[10px] font-medium text-zinc-600 tracking-widest uppercase mb-2">Menú</p>
        {navigation.map((item) => {
          const active = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-100 text-xs font-medium ${
                active ? 'bg-white text-[#09090b]' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <span className={active ? 'text-[#09090b]' : 'text-zinc-500'}>{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-5">
        <div className="h-px bg-zinc-800 mb-4" />
        <p className="text-zinc-600 text-[10px] tracking-wide">Aeris Finance · v1.0</p>
      </div>
    </aside>
  )
}
