import { Outlet, useLocation } from 'react-router-dom'
import LandingLayout from './LandingLayout'
import AppLayout from './AppLayout'

// Public routes that use the marketing landing layout
const PUBLIC_ROUTES = new Set(['/', '/signin', '/signup'])

export default function Layout() {
  const { pathname } = useLocation()
  return PUBLIC_ROUTES.has(pathname) ? <LandingLayout /> : <AppLayout />
}
