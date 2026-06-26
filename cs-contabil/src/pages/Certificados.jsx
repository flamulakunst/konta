import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { diasPara, vidaUtil, certStatus, fmtD } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import { FormGrid, FormRow, Input, Select } from '../components/ui/FormField'

const EMPTY_FORM = { emp:'', tipo:'e-CNPJ A1', tit:'', emissao:'', venc:'', obs:'' }

function HeaderKPI({ icon, value, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 12, opacity: .8 }} />
      <span style={{ fontWeight: 600 }}>{value}</span>
      <span style={{ opacity: .75 }}>{label}</span>
    </div>
  )
}

export default function Certificados({ setTopbarActions, setHeaderKPIs }) {
  const { certs, addCert, delCert } = useData()
  const { user } = useAuth()
  const p = user?.perms || {}

  const [filter, setFilter] = useState('todos')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const stats = {
    vencidos: certs.filter(c => diasPara(c.venc) < 0).length,
    criticos: certs.filter(c => { const d = diasPara(c.venc); return d >= 0 && d <= 15 }).length,
    atencao:  certs.filter(c => { const d = diasPara(c.venc); return d > 15 && d <= 60 }).length,
    ok:       certs.filter(c => diasPara(c.venc) > 60).length,
  }

  useEffect(() => {
    setTopbarActions(
      p.canEdit ? <button onClick={() => setShowAdd(true)} style={btnPrimary}><i className="ti ti-plus" /> Cadastrar</button> : null
    )
    if (setHeaderKPIs) setHeaderKPIs([
      <HeaderKPI key="v" icon="ti-x-circle"       value={stats.vencidos} label="Vencidos"     />,
      <HeaderKPI key="c" icon="ti-alert-triangle"  value={stats.criticos} label="Críticos ≤15d" />,
      <HeaderKPI key="a" icon="ti-clock"           value={stats.atencao}  label="Atenção ≤60d" />,
      <HeaderKPI key="o" icon="ti-circle-check"    value={stats.ok}       label="Em dia"       />,
    ])
  }, [certs, p.canEdit])

  const filtered = certs.filter(c => {
    const dias = diasPara(c.venc)
    if (filter === 'vencidos') return dias < 0
    if (filter === 'criticos') return dias >= 0 && dias <= 15
    if (filter === 'atencao')  return dias > 15 && dias <= 60
    if (filter === 'ok')       return dias > 60
    return true
  })

  function handleAdd() {
    if (!form.emp || !form.venc || !form.emissao) return
    addCert({ ...form, emissao: new Date(form.emissao + 'T00:00:00'), venc: new Date(form.venc + 'T00:00:00') })
    setForm(EMPTY_FORM); setShowAdd(false)
  }

  const sortedFiltered = [...filtered].sort((a, b) => a.venc - b.venc)

  return (
    <div>
      {!p.canEdit && (
        <div style={{ background:'var(--blue-light)',color:'var(--blue-dark)',borderRadius:'var(--r)',padding:'9px 13px',fontSize:12,display:'flex',alignItems:'center',gap:7,marginBottom:14 }}>
          <i className="ti ti-eye" style={{ fontSize:15 }} /> Modo leitura — seu perfil não permite criar ou editar registros.
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { key:'vencidos', label:'Vencidos',      bg:'var(--red-light)',   co:'var(--red-dark)',   icon:'ti-x-circle'      },
          { key:'criticos', label:'Críticos (≤15d)',bg:'var(--amber-light)', co:'var(--amber-dark)', icon:'ti-alert-triangle' },
          { key:'atencao',  label:'Atenção (≤60d)', bg:'var(--blue-light)',  co:'var(--blue-dark)',  icon:'ti-clock'         },
          { key:'ok',       label:'Em dia',         bg:'var(--green-light)', co:'var(--green-dark)', icon:'ti-circle-check'  },
        ].map(s => (
          <div
            key={s.key}
            onClick={() => setFilter(filter === s.key ? 'todos' : s.key)}
            style={{ background: filter === s.key ? s.bg : 'var(--bg2)', borderRadius:'var(--r)', padding:'12px 14px', cursor:'pointer', border: filter===s.key ? `1px solid ${s.co}20` : '1px solid transparent', transition:'background .15s' }}
          >
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
              <i className={`ti ${s.icon}`} style={{ color: s.co }} /> {s.label}
            </div>
            <div style={{ fontSize:24, fontWeight:500, color: filter===s.key ? s.co : 'var(--text)', lineHeight:1 }}>{stats[s.key]}</div>
          </div>
        ))}
      </div>

      {/* Cert cards */}
      {sortedFiltered.map(c => {
        const dias = diasPara(c.venc)
        const st   = certStatus(dias)
        const pct  = vidaUtil(c.emissao, c.venc)

        return (
          <div
            key={c.id}
            style={{
              background:'var(--bg)', border:'0.5px solid var(--border)',
              borderLeft: st.cls ? `3px solid ${st.color}` : 'none',
              borderRadius: st.cls ? '0 var(--rl) var(--rl) 0' : 'var(--rl)',
              padding:'13px 15px', marginBottom:8, cursor:'pointer',
            }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{c.emp}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{c.tipo} · {c.tit}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ background:st.bg, color:st.tco, fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:500 }}>{st.label}</span>
                {p.canDelete && (
                  <button
                    onClick={e => { e.stopPropagation(); delCert(c.id) }}
                    style={{ marginLeft:8, background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:14 }}
                  >
                    <i className="ti ti-trash" />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display:'flex', gap:16, fontSize:11, color:'var(--text2)', marginBottom:8 }}>
              <span><i className="ti ti-calendar-plus" style={{ marginRight:3 }} />Emitido: {fmtD(c.emissao)}</span>
              <span><i className="ti ti-calendar-x"    style={{ marginRight:3 }} />Vence: {fmtD(c.venc)}</span>
            </div>

            <div style={{ width:'100%', height:5, background:'var(--bg2)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:st.barC, borderRadius:3, transition:'width .3s' }} />
            </div>

            {c.obs && (
              <div style={{ marginTop:8, fontSize:11, color:'var(--text2)' }}>
                <i className="ti ti-note" style={{ marginRight:4 }} />{c.obs}
              </div>
            )}
          </div>
        )
      })}

      {sortedFiltered.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 16px', color:'var(--text2)', fontSize:12 }}>
          <i className="ti ti-certificate" style={{ fontSize:28, display:'block', margin:'0 auto 10px', opacity:.3 }} />
          Nenhum certificado neste filtro
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
        title={<span><i className="ti ti-certificate" style={{ fontSize:15,verticalAlign:-2,marginRight:6,color:'var(--btn-primary)' }} />Cadastrar certificado</span>}
        footer={<>
          <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }} style={btnStyle}>Cancelar</button>
          <button onClick={handleAdd} style={btnPrimary}><i className="ti ti-plus" /> Cadastrar</button>
        </>}
      >
        <FormGrid>
          <FormRow label="Empresa"     full><Input value={form.emp}    onChange={e => set('emp',e.target.value)}    placeholder="Razão social" /></FormRow>
          <FormRow label="Tipo"><Select value={form.tipo} onChange={e => set('tipo',e.target.value)}>
            {['e-CNPJ A1','e-CNPJ A3','e-CPF A1','e-CPF A3','NF-e'].map(t=><option key={t}>{t}</option>)}
          </Select></FormRow>
          <FormRow label="Titular"><Input value={form.tit} onChange={e => set('tit',e.target.value)} placeholder="Nome do titular" /></FormRow>
          <FormRow label="Emissão"><Input type="date" value={form.emissao} onChange={e => set('emissao',e.target.value)} /></FormRow>
          <FormRow label="Vencimento"><Input type="date" value={form.venc} onChange={e => set('venc',e.target.value)} /></FormRow>
          <FormRow label="Observação" full><Input value={form.obs} onChange={e => set('obs',e.target.value)} placeholder="Ex: Token guardado no cofre..." /></FormRow>
        </FormGrid>
      </Modal>
    </div>
  )
}

const btnStyle   = { display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:'var(--r)',fontSize:11,fontWeight:500,cursor:'pointer',border:'0.5px solid var(--border2)',background:'transparent',color:'var(--text)' }
const btnPrimary = { ...btnStyle, background:'var(--btn-primary)',color:'#fff',border:'1px solid var(--btn-primary)' }
