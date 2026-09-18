import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Scale, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features',    href: '/#features-heading' },
  { label: 'How it works',href: '/#how-heading'      },
  { label: 'Security',    href: '/#trust-heading'     },
]

export default function LandingLayout() {
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100'
            : 'bg-transparent border-b border-transparent'
        }`}
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="ClauseLens home">
            {/* Multi-dot logo mark */}
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

          {/* ── Centre nav — only on homepage ── */}
          {isHome && (
            <nav className="hidden md:flex items-center gap-1" aria-label="Page sections">
              {NAV_LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          {/* ── Auth actions ── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/signin"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sign In
            </Link>

            {/* Divider */}
            <span className="hidden sm:block w-px h-5 bg-gray-200" aria-hidden="true" />

            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900" role="contentinfo">
        {/* Top accent bar */}
        <div className="h-0.5 flex" aria-hidden="true">
          <span className="flex-1 bg-blue-500" />
          <span className="flex-1 bg-red-400" />
          <span className="flex-1 bg-yellow-400" />
          <span className="flex-1 bg-green-500" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            {/* Brand */}
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

            {/* Links */}
            <div className="flex gap-12 text-sm">
              <div className="space-y-3">
                <p className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Product</p>
                <ul className="space-y-2">
                  <li><Link to="/signup" className="text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
                  <li><Link to="/signin" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Legal</p>
                <ul className="space-y-2">
                  <li><span className="text-gray-500 text-xs">Not legal advice</span></li>
                  <li><span className="text-gray-500 text-xs">Educational use only</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} ClauseLens. Fictional demo project.</p>
            <p className="text-xs text-gray-600">Educational assistance only · Not a substitute for legal counsel</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
