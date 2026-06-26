import { useAuth } from '../../contexts/AuthContext'
import { useData } from '../../contexts/DataContext'
import { diasPara } from '../../utils/helpers'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',             icon: 'ti-layout-dashboard' },
  { id: 'clientes',  label: 'Base de clientes',      icon: 'ti-building'         },
  { id: 'jornada',   label: 'Jornada',               icon: 'ti-layout-kanban'    },
  { id: 'agenda',    label: 'Agenda & aniversários', icon: 'ti-calendar-event',  badge: 'agenda' },
  { id: 'certs',     label: 'Certificados digitais', icon: 'ti-certificate',     badge: 'certs'  },
]

const ADMIN_ITEMS = [
  { id: 'usuarios', label: 'Usuários & acesso', icon: 'ti-users-group' },
]

export default function Sidebar({ currentPage, onNavigate }) {
  const { user, logout } = useAuth()
  const { tasks, certs } = useData()
  if (!user) return null

  const items = user.perms?.canManageUsers ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS

  const agendaBadge = tasks.filter(t => !t.done && diasPara(t.data) <= 0).length
  const certsBadge  = certs.filter(c => diasPara(c.venc) <= 15).length

  const getBadge = (item) => {
    if (item.badge === 'agenda') return agendaBadge
    if (item.badge === 'certs')  return certsBadge
    return 0
  }

  return (
    <aside style={{ width: 56, minWidth: 56, background: '#0D2E52', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Logo */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: '#2E7DD1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
          <i className="ti ti-building-bank" />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, overflowY: 'auto' }}>
        {items.map(item => {
          const active = currentPage === item.id
          const badge  = getBadge(item)
          return (
            <div
              key={item.id}
              title={item.label}
              onClick={() => onNavigate(item.id)}
              style={{
                width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                background: active ? '#1B4F8A' : 'transparent',
                color: active ? '#fff' : '#6B9FD4',
                transition: 'background .12s, color .12s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B9FD4' } }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 19 }} />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, borderRadius: 7,
                  background: '#E24B4A', color: '#fff', fontSize: 8, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1,
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ paddingBottom: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div
          title={`${user.nome} · ${user.perfil}`}
          style={{ width: 32, height: 32, borderRadius: '50%', background: '#1B4F8A', color: '#B5D4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, userSelect: 'none' }}
        >
          {user.av}
        </div>
        <div
          title="Sair"
          onClick={logout}
          style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B9FD4', cursor: 'pointer', transition: 'background .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B9FD4' }}
        >
          <i className="ti ti-logout" style={{ fontSize: 17 }} />
        </div>
      </div>
    </aside>
  )
}
