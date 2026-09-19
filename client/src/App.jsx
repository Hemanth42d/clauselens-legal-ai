import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
import HomePage   from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'

// Protected pages (require auth)
import DashboardPage  from './pages/DashboardPage'
import UploadPage     from './pages/UploadPage'
import AnalysisPage   from './pages/AnalysisPage'
import ComparisonPage from './pages/ComparisonPage'

/* Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Protect({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* ── Public shell ───────────────────────────────────────────── */}
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="signin" element={<SignInPage />} />
            <Route path="signup" element={<SignUpPage />} />
          </Route>

          {/* ── Protected app shell ────────────────────────────────────── */}
          <Route element={<Layout />}>
            <Route path="dashboard"  element={<Protect><DashboardPage /></Protect>} />
            <Route path="upload"     element={<Protect><UploadPage /></Protect>} />
            <Route path="comparison" element={<Protect><ComparisonPage /></Protect>} />
            <Route path="demo"       element={<Protect><Navigate to="/dashboard" replace /></Protect>} />
          </Route>

          {/* ── Analysis workspace ─────────────────────────────────────── */}
          <Route path="/analysis/:documentId" element={<Protect><AnalysisPage /></Protect>} />

          {/* ── Catch-all ──────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
