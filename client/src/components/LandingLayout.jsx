import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features',     href: '/#features-heading' },
  { label: 'How it works', href: '/#how-heading'      },
  { label: 'Security',     href: '/#trust-heading'    },
]

export default function LandingLayout() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileMenu,  setMobileMenu]  = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close menu on route change
  useEffect(() => setMobileMenu(false), [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled || mobileMenu
            ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100'
            : 'bg-transparent border-b border-transparent'
        }`}
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="ClauseLens home">
            <div className="relative w-8 h-8 flex-shrink-0">
              <span className="absolute top-0 left-0 w-3.5 h-3.5 rounded-full bg-blue-500" />
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-red-400" />
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-yellow-400" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-gray-900 text-base tracking-tight block">ClauseLens</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Legal AI</span>
            </div>
          </Link>

          {/* Centre nav — desktop only */}
          {isHome && (
            <nav className="hidden md:flex items-center gap-1" aria-label="Page sections">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {/* Auth actions — desktop */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link to="/signin"
              className="items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              Sign In
            </Link>
            <span className="w-px h-5 bg-gray-200" aria-hidden="true" />
            <Link to="/signup"
              className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all">
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile: Get Started + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/signup"
              className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
              Get Started
            </Link>
            <button
              onClick={() => setMobileMenu(o => !o)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenu && (
          <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-sm">
            {isHome && NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                {l.label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
              <Link to="/signin" onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                Sign In
              </Link>
              <Link to="/signup" onClick={() => setMobileMenu(false)}
                className="block px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900" role="contentinfo">
        <div className="h-0.5 flex" aria-hidden="true">
          <span className="flex-1 bg-blue-500" />
          <span className="flex-1 bg-red-400" />
          <span className="flex-1 bg-yellow-400" />
          <span className="flex-1 bg-green-500" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 flex-shrink-0">
                  <span className="absolute top-0 left-0 w-3 h-3 rounded-full bg-blue-500" />
                  <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-400" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="font-bold text-white text-sm">ClauseLens</span>
              </div>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                AI-powered legal document intelligence. Understand the fine print.
              </p>
            </div>
            <div className="flex gap-10 sm:gap-12 text-sm">
              <div className="space-y-2.5">
                <p className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Product</p>
                <ul className="space-y-1.5">
                  <li><Link to="/signup" className="text-gray-400 hover:text-white transition-colors text-sm">Get Started</Link></li>
                  <li><Link to="/signin" className="text-gray-400 hover:text-white transition-colors text-sm">Sign In</Link></li>
                </ul>
              </div>
              <div className="space-y-2.5">
                <p className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Legal</p>
                <ul className="space-y-1.5">
                  <li><span className="text-gray-500 text-xs">Not legal advice</span></li>
                  <li><span className="text-gray-500 text-xs">Educational use only</span></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} ClauseLens. Fictional demo project.</p>
            <p className="text-xs text-gray-600 text-center sm:text-right">Educational assistance only · Not legal advice</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
