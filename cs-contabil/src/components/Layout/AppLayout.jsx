import { useState } from 'react'
import Sidebar from './Sidebar'
import Dashboard from '../../pages/Dashboard'
import Clientes from '../../pages/Clientes'
import Jornada from '../../pages/Jornada'
import Agenda from '../../pages/Agenda'
import Certificados from '../../pages/Certificados'
import Usuarios from '../../pages/Usuarios'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  clientes:  'Base de clientes',
  jornada:   'Jornada do cliente',
  agenda:    'Agenda & aniversários',
  certs:     'Certificados digitais',
  usuarios:  'Usuários & acesso',
}

const PAGE_SUBS = {
  dashboard: 'Bem-vindo · 24 de junho de 2026',
  clientes:  'Gerencie sua carteira de clientes',
  jornada:   'Arraste os cartões para mover entre estágios',
  agenda:    'Junho 2026',
  certs:     'Monitoramento de vencimentos',
  usuarios:  'Gerencie acessos e permissões',
}

export default function AppLayout() {
  const [page, setPage]               = useState('dashboard')
  const [topbarActions, setTopbarActions] = useState(null)
  const [headerKPIs, setHeaderKPIs]   = useState(null)

  const pages = {
    dashboard: <Dashboard    setTopbarActions={setTopbarActions} setHeaderKPIs={setHeaderKPIs} />,
    clientes:  <Clientes     setTopbarActions={setTopbarActions} />,
    jornada:   <Jornada      setTopbarActions={setTopbarActions} />,
    agenda:    <Agenda       setTopbarActions={setTopbarActions} setHeaderKPIs={setHeaderKPIs} />,
    certs:     <Certificados setTopbarActions={setTopbarActions} setHeaderKPIs={setHeaderKPIs} />,
    usuarios:  <Usuarios     setTopbarActions={setTopbarActions} />,
  }

  function navigate(p) {
    setTopbarActions(null)
    setHeaderKPIs(null)
    setPage(p)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar currentPage={page} onNavigate={navigate} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F4F6FA' }}>
        {/* Blue Header */}
        <div style={{ background: '#1B4F8A', flexShrink: 0 }}>
          <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{PAGE_TITLES[page]}</div>
              <div style={{ fontSize: 11, color: '#B5D4F4', marginTop: 2 }}>{PAGE_SUBS[page]}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>{topbarActions}</div>
          </div>
          {headerKPIs && (
            <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {headerKPIs}
            </div>
          )}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {pages[page] || pages.dashboard}
        </div>
      </main>
    </div>
  )
}
