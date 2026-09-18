import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Scale, LayoutDashboard, Upload, GitCompare,
  LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/upload',     label: 'Upload',    Icon: Upload           },
  { to: '/comparison', label: 'Compare',   Icon: GitCompare       },
]

function Sidebar({ user, onLogout, onClose }) {
  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-60">

      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500"   aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-red-400"    aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-green-500"  aria-hidden="true" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">ClauseLens</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500 lg:hidden" aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5" aria-label="Application navigation">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout pinned to bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 px-3 py-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4 text-gray-400" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen" aria-label="Sidebar navigation">
        <Sidebar user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="relative z-10">
            <Sidebar user={user} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"   aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-red-400"    aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" />
            <span className="w-2 h-2 rounded-full bg-green-500"  aria-hidden="true" />
            <span className="font-semibold text-gray-900 text-sm ml-1">ClauseLens</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
