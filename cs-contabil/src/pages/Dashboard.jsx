import { useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COL_NAMES, COL_DOTS, MONTHS, TODAY } from '../data/mockData'
import { diasPara, certStatus, prioColor, prioLabel } from '../utils/helpers'

function HeaderKPI({ icon, value, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 12, opacity: .8 }} />
      <span style={{ fontWeight: 600 }}>{value}</span>
      <span style={{ opacity: .75 }}>{label}</span>
    </div>
  )
}

export default function Dashboard({ setTopbarActions, setHeaderKPIs }) {
  const { clients, kanban, tasks, birthdays, certs } = useData()
  const { user } = useAuth()

  const certVenc  = certs.filter(c => diasPara(c.venc) <= 30).length
  const rescisao  = kanban.filter(c => c.col === 4).length
  const onb       = kanban.filter(c => c.col <= 2).length
  const openTasks = tasks.filter(t => !t.done)
  const bdaysWeek = birthdays.filter(b => {
    let d = new Date(TODAY.getFullYear(), b.mes, b.dia)
    if (d < TODAY) d.setFullYear(d.getFullYear() + 1)
    return (d - TODAY) / 86400000 <= 7
  })

  useEffect(() => {
    setTopbarActions(null)
    if (setHeaderKPIs) setHeaderKPIs([
      <HeaderKPI key="cli"   icon="ti-building"       value={clients.length} label="Clientes ativos"  />,
      <HeaderKPI key="onb"   icon="ti-clock"           value={onb}            label="Em onboarding"    />,
      <HeaderKPI key="resc"  icon="ti-alert-triangle"  value={rescisao}       label="Em rescisão"      />,
      <HeaderKPI key="cert"  icon="ti-certificate"     value={certVenc}       label="Cert. expirando"  />,
    ])
  }, [clients.length, onb, rescisao, certVenc])

  const card      = { background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--rl)', padding: 16 }
  const cardTitle = { fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }

  return (
    <div>
      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Clientes por estágio */}
        <div style={card}>
          <div style={cardTitle}>Clientes por estágio</div>
          {COL_NAMES.map((n, i) => {
            const cnt = kanban.filter(c => c.col === i).length
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COL_DOTS[i], display: 'inline-block' }} />
                  {n}
                </span>
                <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{cnt}</span>
              </div>
            )
          })}
        </div>

        {/* Mini bar chart */}
        <div style={card}>
          <div style={cardTitle}>Novos clientes · 2026</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {['jan','fev','mar','abr','mai','jun'].map((m, i) => {
              const h      = [40,55,30,65,45,70][i]
              const active = i === 5
              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: '100%', height: h, background: active ? 'var(--green)' : '#9FE1CB', borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: 10, color: active ? 'var(--green)' : 'var(--text2)', fontWeight: active ? 500 : 400 }}>{m}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Aniversários */}
        <div style={card}>
          <div style={cardTitle}>
            Aniversários esta semana <i className="ti ti-cake" style={{ fontSize: 13, color: 'var(--amber)' }} /> <i className="ti ti-building-bank" style={{ fontSize: 13, color: 'var(--blue)' }} />
          </div>
          {bdaysWeek.length ? bdaysWeek.map((b, i) => {
            const d         = new Date(TODAY.getFullYear(), b.mes, b.dia)
            const diff      = Math.round((d - TODAY) / 86400000)
            const isEmpresa = b.tipo === 'empresa'
            const hiColor   = isEmpresa ? 'var(--blue)'       : 'var(--amber)'
            const hiLight   = isEmpresa ? 'var(--blue-light)'  : 'var(--amber-light)'
            const hiDark    = isEmpresa ? 'var(--blue-dark)'   : 'var(--amber-dark)'
            const icon      = isEmpresa ? 'ti-building-bank'   : 'ti-cake'
            const empText   = isEmpresa && b.anoAbertura
              ? `${d.getFullYear() - b.anoAbertura} anos de fundação`
              : b.emp
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ minWidth: 38, textAlign: 'center', background: diff === 0 ? hiLight : 'var(--bg2)', borderRadius: 6, padding: '4px 0' }}>
                  <span style={{ fontSize: 16, fontWeight: 500, display: 'block', lineHeight: 1, color: diff === 0 ? hiDark : 'var(--text)' }}>{b.dia}</span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)' }}>{MONTHS[b.mes].slice(0,3)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 12, color: hiColor }} />
                    {b.nome}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{empText}</div>
                </div>
                {diff === 0
                  ? <span style={{ background: hiLight, color: hiDark, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Hoje</span>
                  : <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{diff}d</span>
                }
              </div>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text2)', fontSize: 12 }}>
              <i className="ti ti-cake" style={{ fontSize: 22, display: 'block', margin: '0 auto 8px', opacity: .4 }} />
              Nenhum aniversário esta semana
            </div>
          )}
        </div>

        {/* Tarefas abertas */}
        <div style={card}>
          <div style={cardTitle}>
            Tarefas abertas
            <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{openTasks.length}</span>
          </div>
          {openTasks.slice(0,4).map(t => {
            const diff = diasPara(t.data)
            const prio = prioColor(t.prio)
            return (
              <div key={t.id} style={{ padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{t.desc}</div>
                <div style={{ color: 'var(--text2)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {t.cli}
                  <span style={{ background: prio.bg, color: prio.co, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{prioLabel(t.prio)}</span>
                  {diff < 0
                    ? <span style={{ background: 'var(--red-light)', color: 'var(--red-dark)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Vencida há {Math.abs(diff)}d</span>
                    : diff === 0
                    ? <span style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Vence hoje</span>
                    : <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{t.data.toLocaleDateString('pt-BR')}</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
