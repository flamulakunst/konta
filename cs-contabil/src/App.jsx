import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import Login from './pages/Login'
import AppLayout from './components/Layout/AppLayout'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
          <i className="ti ti-loader-2" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
          Carregando...
        </div>
      </div>
    )
  }

  return user ? (
    <DataProvider>
      <AppLayout />
    </DataProvider>
  ) : (
    <Login />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
