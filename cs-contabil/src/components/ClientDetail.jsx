import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { COL_NAMES, TODAY } from '../data/mockData'
import { avInitials, avColors, fmtD, diasPara, certStatus, vidaUtil, getMainContact } from '../utils/helpers'
import Modal from './ui/Modal'
import { Input, Select } from './ui/FormField'
import Tag from './ui/Tag'

// ── Constantes ─────────────────────────────────────────────────────────────

const SETORES = [
  { id: 'dp',         label: 'Depto. Pessoal (DP)',  icon: 'ti-users',           bg: 'var(--blue-light)',   co: 'var(--blue-dark)'  },
  { id: 'fiscal',     label: 'Fiscal',               icon: 'ti-receipt-tax',     bg: 'var(--green-light)',  co: 'var(--green-dark)' },
  { id: 'financeiro', label: 'Financeiro',           icon: 'ti-currency-dollar', bg: 'var(--amber-light)',  co: 'var(--amber-dark)' },
]

const TABS = [
  { id: 'dados',    label: 'Dados da empresa', icon: 'ti-building'      },
  { id: 'contatos', label: 'Contatos',          icon: 'ti-address-book'  },
  { id: 'socios',   label: 'Sócios e donos',    icon: 'ti-users'         },
]

const EMPTY_CONTACT  = { nome: '', email: '', telefone: '', cargo: '' }
const EMPTY_CONTACTS = { dp: { ...EMPTY_CONTACT }, fiscal: { ...EMPTY_CONTACT }, financeiro: { ...EMPTY_CONTACT } }
const EMPTY_SOCIO    = { nome: '', cpf: '', rg: '', nascimento: '', email: '', celular: '' }

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtNasc(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

// ── PDF generation ──────────────────────────────────────────────────────────

function generatePDF(client, sections, allCerts, allTasks) {
  const contacts = client.contacts || EMPTY_CONTACTS
  const socios   = client.socios   || []
  const clientCerts = allCerts.filter(c => c.emp.toLowerCase().includes(client.nome.split(' ')[0].toLowerCase()))
  const clientTasks = allTasks.filter(t => t.cli.toLowerCase().includes(client.nome.split(/\s|&/)[0].toLowerCase()))
  const dt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const fr = (label, value) => value
    ? `<div class="fr"><span class="fl">${label}</span><span class="fv">${value}</span></div>`
    : ''

  const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  let body = `
    <div class="rh">
      <div class="logo">CS</div>
      <div>
        <div class="cs-label">Konta — Customer Success</div>
        <h1>${client.nome}</h1>
        <div class="meta">CNPJ: ${client.cnpj || '—'} &nbsp;·&nbsp; Gerado em ${dt}</div>
      </div>
    </div>`

  // Contato principal em destaque
  const mc = getMainContact(client)
  if (mc) {
    body += `
    <div class="pc-box">
      <div class="pc-hd">&#9733; Contato Principal <span class="pc-badge">Principal</span></div>
      <div class="pc-grid">
        <div class="pc-item"><span class="pk">Nome</span><span class="pv">${esc(mc.nome)}</span></div>
        <div class="pc-item"><span class="pk">Cargo / Setor</span><span class="pv">${esc(mc.cargo ? `${mc.cargo} · ${mc.setor}` : mc.setor)}</span></div>
        ${mc.telefone ? `<div class="pc-item"><span class="pk">Telefone / WhatsApp</span><span class="pv">${esc(mc.telefone)}</span></div>` : ''}
        ${mc.email    ? `<div class="pc-item"><span class="pk">E-mail</span><span class="pv">${esc(mc.email)}</span></div>` : ''}
      </div>
    </div>`
  }

  if (sections.dados) {
    body += `<h2>Dados da Empresa</h2>
    <div class="grid2">
      ${fr('Segmento', client.seg)}
      ${fr('Regime tributário', client.regime)}
      ${fr('Cidade / UF', client.cidade)}
      ${fr('CS responsável', client.cs)}
      ${fr('Honorário mensal', client.hon)}
      ${fr('Estágio atual', COL_NAMES[client.col])}
      ${fr('Cliente desde', client.desde)}
    </div>
    ${client.obs ? `<div class="obs"><strong>Obs:</strong> ${client.obs}</div>` : ''}`
  }

  if (sections.contatos) {
    const hasAny = SETORES.some(s => (contacts[s.id] || {}).nome)
    body += `<h2>Contatos por Setor</h2>`
    if (!hasAny) { body += `<p class="empty-note">Nenhum contato cadastrado.</p>` }
    else SETORES.forEach(s => {
      const ct = contacts[s.id] || EMPTY_CONTACT
      if (!ct.nome) return
      body += `<div class="block"><div class="block-title">${s.label}</div>
      <div class="grid2">
        ${fr('Responsável', ct.nome)}${fr('Cargo', ct.cargo)}${fr('E-mail', ct.email)}${fr('Telefone / WhatsApp', ct.telefone)}
      </div></div>`
    })
  }

  if (sections.socios && socios.length > 0) {
    body += `<h2>Sócios e Donos</h2>`
    socios.forEach(s => {
      body += `<div class="block"><div class="block-title">${s.nome}</div>
      <div class="grid2">
        ${fr('CPF', s.cpf)}${fr('RG', s.rg)}${fr('Data de nascimento', fmtNasc(s.nascimento))}${fr('E-mail pessoal', s.email)}${fr('Celular', s.celular)}
      </div></div>`
    })
  }

  if (sections.historico && clientTasks.length > 0) {
    body += `<h2>Histórico de Tarefas</h2>
    <table><thead><tr><th>Descrição</th><th>Tipo</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>
    ${clientTasks.map(t => {
      const done = t.done
      const tag  = done
        ? `<span class="tag tg">Concluída</span>`
        : `<span class="tag tr">Pendente</span>`
      return `<tr><td>${t.desc}</td><td>${t.tipo}</td><td>${t.data.toLocaleDateString('pt-BR')}</td><td>${tag}</td></tr>`
    }).join('')}
    </tbody></table>`
  }

  if (sections.certificados && clientCerts.length > 0) {
    body += `<h2>Certificados Digitais</h2>
    <table><thead><tr><th>Tipo</th><th>Titular</th><th>Emissão</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>
    ${clientCerts.map(c => {
      const st  = certStatus(diasPara(c.venc))
      const tag = `<span class="tag" style="background:${st.bg};color:${st.tco}">${st.label}</span>`
      return `<tr><td>${c.tipo}</td><td>${c.tit}</td><td>${fmtD(c.emissao)}</td><td>${fmtD(c.venc)}</td><td>${tag}</td></tr>`
    }).join('')}
    </tbody></table>`
  }

  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#1a1a18;padding:40px;max-width:800px;margin:0 auto}
    .rh{display:flex;align-items:flex-start;gap:16px;padding-bottom:20px;margin-bottom:24px;border-bottom:2.5px solid #0F6E56}
    .logo{width:44px;height:44px;border-radius:10px;background:#0F6E56;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0}
    .cs-label{font-size:10px;color:#9d9c97;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}
    h1{font-size:20px;font-weight:500;margin-bottom:4px}
    .meta{font-size:11px;color:#9d9c97}
    h2{font-size:10px;font-weight:600;color:#6b6a65;text-transform:uppercase;letter-spacing:.08em;margin:26px 0 10px;padding-bottom:5px;border-bottom:1px solid #e8e8e6}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
    .fr{padding:5px 0;border-bottom:.5px solid #f0f0ee;font-size:12px;display:flex;justify-content:space-between;align-items:baseline}
    .fl{color:#6b6a65}
    .fv{font-weight:500;text-align:right;max-width:60%}
    .block{background:#f9f9f7;border-radius:8px;padding:12px 14px;margin-bottom:10px}
    .block-title{font-size:10px;font-weight:600;color:#6b6a65;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
    .obs{background:#f5f5f4;border-radius:6px;padding:10px 12px;margin-top:8px;font-size:12px;color:#6b6a65}
    .empty-note{font-size:12px;color:#9d9c97;font-style:italic;margin-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th{text-align:left;padding:7px 10px;background:#f5f5f4;border-bottom:1px solid #e8e8e6;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6b6a65}
    td{padding:7px 10px;border-bottom:.5px solid #f0f0ee;font-size:12px}
    .tag{display:inline-flex;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500}
    .tg{background:#E1F5EE;color:#085041}
    .tr{background:#f5f5f4;color:#6b6a65}
    .footer{margin-top:36px;padding-top:10px;border-top:1px solid #e8e8e6;font-size:10px;color:#9d9c97;display:flex;justify-content:space-between}
    .pc-box{background:#E1F5EE;border:1.5px solid #9FE1CB;border-radius:8px;padding:12px 16px;margin-bottom:22px}
    .pc-hd{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#085041;margin-bottom:9px;display:flex;align-items:center;gap:7px}
    .pc-badge{background:#0F6E56;color:#fff;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:600;letter-spacing:.04em}
    .pc-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}
    .pc-item .pk{display:block;font-size:9.5px;color:#085041;text-transform:uppercase;letter-spacing:.05em}
    .pc-item .pv{display:block;font-size:11.5px;font-weight:500;color:#1a1a18;margin-top:2px}
    @media print{@page{margin:1.5cm}body{padding:0}.logo,.block,.obs,.pc-box,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — ${client.nome}</title><style>${css}</style></head>
  <body>${body}
  <div class="footer"><span>Konta — Customer Success</span><span>Gerado em ${dt}</span></div>
  </body></html>`

  const win = window.open('', '_blank', 'width=880,height=960')
  if (!win) { alert('Permita pop-ups para gerar o PDF.'); return }
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

// ── ReportPanel ─────────────────────────────────────────────────────────────

function ReportPanel({ open, onClose, client, certs, tasks }) {
  const [sections, setSections] = useState({
    dados: true, contatos: true, socios: true, historico: false, certificados: true,
  })
  const toggle = (k) => setSections(p => ({ ...p, [k]: !p[k] }))

  const SECTION_OPTIONS = [
    { id: 'dados',        label: 'Dados da empresa',     icon: 'ti-building'        },
    { id: 'contatos',     label: 'Contatos por setor',   icon: 'ti-address-book'    },
    { id: 'socios',       label: 'Sócios e donos',       icon: 'ti-users'           },
    { id: 'historico',    label: 'Histórico de tarefas', icon: 'ti-clipboard-list'  },
    { id: 'certificados', label: 'Certificados digitais',icon: 'ti-certificate'     },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
      display: open ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--rl)', padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <i className="ti ti-file-description" style={{ fontSize: 15 }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Gerar relatório</span>
          </div>
          <button onClick={onClose} style={sBtn}><i className="ti ti-x" style={{ fontSize: 13 }} /></button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
          Escolha as seções a incluir no PDF de <strong>{client?.nome}</strong>:
        </p>

        {SECTION_OPTIONS.map(s => (
          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--r)', cursor: 'pointer', marginBottom: 4, background: sections[s.id] ? 'var(--green-light)' : 'var(--bg2)', transition: 'background .12s' }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${sections[s.id] ? 'var(--green)' : 'var(--border2)'}`, background: sections[s.id] ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              {sections[s.id] && <i className="ti ti-check" style={{ fontSize: 11 }} />}
            </div>
            <input type="checkbox" checked={sections[s.id]} onChange={() => toggle(s.id)} style={{ display: 'none' }} />
            <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: sections[s.id] ? 'var(--green)' : 'var(--text3)' }} />
            <span style={{ fontSize: 12, color: sections[s.id] ? 'var(--green-dark)' : 'var(--text)', fontWeight: sections[s.id] ? 500 : 400 }}>{s.label}</span>
          </label>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
          <button onClick={onClose} style={sBtn}>Cancelar</button>
          <button
            onClick={() => { generatePDF(client, sections, certs, tasks); onClose() }}
            style={{ ...sBtnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="ti ti-file-download" style={{ fontSize: 14 }} />
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SectorCard ──────────────────────────────────────────────────────────────

function SectorCard({ setor, contact, editing, onStartEdit, onSave, onCancel, canEdit, isMain, onSetMain }) {
  const [form, setForm] = useState({ ...contact })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const empty = !contact.nome && !contact.email

  return (
    <div style={{ background: isMain ? 'var(--green-light)' : 'var(--bg2)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 10, border: isMain ? '1px solid var(--green-mid)' : '1px solid transparent', transition: 'all .15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editing ? 12 : empty ? 0 : 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ width: 26, height: 26, borderRadius: 6, background: setor.bg, color: setor.co, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            <i className={`ti ${setor.icon}`} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{setor.label}</span>
          {isMain && (
            <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--green)', color: '#fff', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <i className="ti ti-star-filled" style={{ fontSize: 9 }} /> Principal
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {!empty && !isMain && !editing && canEdit && (
            <button onClick={onSetMain} style={{ ...sBtn, color: 'var(--amber)' }} title="Definir como contato principal">
              <i className="ti ti-star" style={{ fontSize: 12 }} />
            </button>
          )}
          {canEdit && !editing && (
            <button onClick={onStartEdit} style={sBtn}>
              <i className={`ti ti-${empty ? 'plus' : 'pencil'}`} style={{ fontSize: 12 }} />
              {empty ? 'Adicionar' : 'Editar'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbStyle}>Nome do responsável</label>
              <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <label style={lbStyle}>Cargo</label>
              <Input value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Gerente" />
            </div>
            <div>
              <label style={lbStyle}>Telefone / WhatsApp</label>
              <Input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbStyle}>E-mail</label>
              <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button onClick={onCancel} style={sBtn}>Cancelar</button>
            <button onClick={() => onSave(form)} style={sBtnPrimary}>Salvar</button>
          </div>
        </>
      ) : empty ? (
        <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', margin: 0 }}>Nenhum contato cadastrado</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          {[['Responsável', contact.nome], ['Cargo', contact.cargo], ['E-mail', contact.email], ['Telefone', contact.telefone]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} style={{ padding: '5px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div>
              <div style={{ color: 'var(--text)', fontWeight: 500, marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SocioForm ───────────────────────────────────────────────────────────────

function SocioForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_SOCIO, ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbStyle}>Nome completo</label>
          <Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo do sócio" />
        </div>
        <div>
          <label style={lbStyle}>CPF</label>
          <Input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div>
          <label style={lbStyle}>RG</label>
          <Input value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="00.000.000-0" />
        </div>
        <div>
          <label style={lbStyle}>Data de nascimento</label>
          <Input type="date" value={form.nascimento} onChange={e => set('nascimento', e.target.value)} />
        </div>
        <div>
          <label style={lbStyle}>Celular</label>
          <Input value={form.celular} onChange={e => set('celular', e.target.value)} placeholder="(11) 99999-0000" />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbStyle}>E-mail pessoal</label>
          <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="nome@email.com" />
        </div>
      </div>
      {form.nascimento && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green-dark)', background: 'var(--green-light)', borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-cake" style={{ fontSize: 13 }} />
          O aniversário ({fmtNasc(form.nascimento)}) será adicionado automaticamente à agenda.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
        <button onClick={onCancel} style={sBtn}>Cancelar</button>
        <button onClick={() => form.nome && onSave(form)} style={sBtnPrimary}><i className="ti ti-check" style={{ fontSize: 12 }} /> Salvar sócio</button>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ClientDetail({ clientId, open, onClose, canEdit, canDelete }) {
  const { clients, editClient, delClient, certs, tasks } = useData()
  const client = clients.find(c => c.id === clientId)

  const [tab,           setTab]           = useState('dados')
  const [editingSector, setEditingSector] = useState(null)
  const [addingSocio,   setAddingSocio]   = useState(false)
  const [editingSocioId,setEditingSocioId]= useState(null)
  const [showReport,    setShowReport]    = useState(false)

  useEffect(() => {
    if (!open) { setTab('dados'); setEditingSector(null); setAddingSocio(false); setEditingSocioId(null); setShowReport(false) }
  }, [open])

  if (!client) return null

  const contacts = client.contacts || EMPTY_CONTACTS
  const socios   = client.socios   || []
  const { bg, co } = avColors(client.nome)
  const mainCt   = getMainContact(client)

  function saveSector(sectorId, contact) {
    editClient({ ...client, contacts: { ...contacts, [sectorId]: contact } })
    setEditingSector(null)
  }

  function saveNewSocio(form) {
    const newSocio = { ...form, id: Math.max(...socios.map(s => s.id), 0) + 1 }
    editClient({ ...client, socios: [...socios, newSocio] })
    setAddingSocio(false)
  }

  function saveEditSocio(form) {
    editClient({ ...client, socios: socios.map(s => s.id === form.id ? form : s) })
    setEditingSocioId(null)
  }

  function removeSocio(id) {
    const wasmain = client.mainContact?.type === 'socio' && client.mainContact?.id === id
    editClient({ ...client, socios: socios.filter(s => s.id !== id), mainContact: wasmain ? null : client.mainContact })
  }

  function setMainContact(mc) {
    editClient({ ...client, mainContact: mc })
  }

  const isSocioMain = (id) => client.mainContact?.type === 'socio' && client.mainContact?.id === id

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        maxWidth={620}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, background: bg, color: co, flexShrink: 0 }}>
              {avInitials(client.nome)}
            </span>
            <span>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{client.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400, marginTop: 1 }}>{client.cnpj}</div>
            </span>
          </span>
        }
        footer={
          <>
            {canDelete && (
              <button onClick={() => { delClient(client.id); onClose() }} style={sBtnDanger}>
                <i className="ti ti-trash" style={{ fontSize: 13 }} /> Remover
              </button>
            )}
            <button
              onClick={() => setShowReport(true)}
              style={{ ...sBtn, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <i className="ti ti-file-description" style={{ fontSize: 13, color: 'var(--green)' }} /> Gerar relatório
            </button>
            <button onClick={onClose} style={sBtn}>Fechar</button>
          </>
        }
      >
        {/* Tags header */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <Tag variant="green"><i className="ti ti-circle-check" style={{ fontSize: 11, marginRight: 3 }} />Ativo</Tag>
          <Tag variant="gray">Cliente desde {client.desde}</Tag>
          <Tag variant="gray">{COL_NAMES[client.col]}</Tag>
          {client.status === 'Em risco' && <Tag variant="red">{client.status}</Tag>}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16, gap: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditingSector(null); setAddingSocio(false); setEditingSocioId(null) }}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: tab === t.id ? 500 : 400,
                cursor: 'pointer', background: 'none', border: 'none', outline: 'none',
                color: tab === t.id ? 'var(--green)' : 'var(--text2)',
                borderBottom: `2px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`,
                marginBottom: -1, transition: 'color .12s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />
              {t.label}
              {t.id === 'socios' && socios.length > 0 && (
                <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 500 }}>{socios.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: DADOS ─────────────────────────────────── */}
        {tab === 'dados' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {[
                ['Segmento', client.seg], ['Regime', client.regime],
                ['Cidade / UF', client.cidade], ['CS responsável', client.cs],
                ['Honorário mensal', client.hon], ['Cliente desde', client.desde],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>{l}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                </div>
              ))}
            </div>
            {client.obs && (
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: 10, marginTop: 12, fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                <i className="ti ti-note" style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }} />{client.obs}
              </div>
            )}

            {/* Data de abertura */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-calendar-event" style={{ fontSize: 12, color: 'var(--blue)' }} /> Data de abertura
                </span>
                {client.abertura && (() => {
                  const [y] = client.abertura.split('-').map(Number)
                  const anos = TODAY.getFullYear() - y
                  return <span style={{ fontSize: 11, color: 'var(--text3)' }}>{anos} anos</span>
                })()}
              </div>
              {canEdit ? (
                <div>
                  {/* CNPJ Integration Hook: futura integração com BrasilAPI (brasilapi.com.br/api/cnpj/v1/{cnpj})
                      ou ReceitaWS (receitaws.com.br/v1/cnpj/{cnpj}) para preencher automaticamente:
                      data_inicio_atividade → abertura, nome/razao_social → nome, municipio+uf → cidade */}
                  <Input
                    type="date"
                    value={client.abertura || ''}
                    onChange={e => editClient({ ...client, abertura: e.target.value || null })}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-plug-connected" style={{ fontSize: 11 }} />
                    Futuramente sincronizado automaticamente via Receita Federal
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 500, color: client.abertura ? 'var(--text)' : 'var(--text3)' }}>
                  {client.abertura ? fmtNasc(client.abertura) : 'Não informada'}
                </span>
              )}
            </div>

            {/* ── Contato principal ── */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-star-filled" style={{ fontSize: 11, color: 'var(--green)' }} /> Contato principal
              </div>
              {mainCt ? (
                <div style={{ background: 'var(--green-light)', borderRadius: 'var(--r)', padding: '12px 14px', border: '1px solid var(--green-mid)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        {mainCt.nome}
                        <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--green)', color: '#fff', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <i className="ti ti-star-filled" style={{ fontSize: 9 }} /> Principal
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--green-dark)', marginTop: 3 }}>{mainCt.cargo ? `${mainCt.cargo} · ` : ''}{mainCt.setor}</div>
                    </div>
                    <button onClick={() => setTab('contatos')} style={{ ...sBtn, fontSize: 10, flexShrink: 0 }}>
                      <i className="ti ti-pencil" style={{ fontSize: 11 }} /> Editar contatos
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
                    {mainCt.telefone && (
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Telefone / WhatsApp</div>
                        <div style={{ fontWeight: 500, color: 'var(--text)', marginTop: 1 }}>{mainCt.telefone}</div>
                      </div>
                    )}
                    {mainCt.email && (
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontSize: 10, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '.05em' }}>E-mail</div>
                        <div style={{ fontWeight: 500, color: 'var(--text)', marginTop: 1, wordBreak: 'break-all' }}>{mainCt.email}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2)' }}>
                    <i className="ti ti-user-question" style={{ fontSize: 15, opacity: .45 }} />
                    Nenhum contato principal definido
                  </div>
                  <button onClick={() => setTab('contatos')} style={sBtn}>
                    <i className="ti ti-arrow-right" style={{ fontSize: 11 }} /> Ir para Contatos
                  </button>
                </div>
              )}
            </div>

            {canEdit && (
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={sBtnPrimary}><i className="ti ti-edit" style={{ fontSize: 12 }} /> Editar dados</button>
              </div>
            )}
          </>
        )}

        {/* ─── TAB: CONTATOS ──────────────────────────────── */}
        {tab === 'contatos' && (
          <>
            {SETORES.map(setor => (
              <SectorCard
                key={`${setor.id}-${editingSector === setor.id}`}
                setor={setor}
                contact={contacts[setor.id] || EMPTY_CONTACT}
                editing={editingSector === setor.id}
                onStartEdit={() => setEditingSector(setor.id)}
                onSave={(form) => saveSector(setor.id, form)}
                onCancel={() => setEditingSector(null)}
                canEdit={canEdit}
                isMain={client.mainContact?.type === 'sector' && client.mainContact?.key === setor.id}
                onSetMain={() => setMainContact({ type: 'sector', key: setor.id })}
              />
            ))}
          </>
        )}

        {/* ─── TAB: SÓCIOS ────────────────────────────────── */}
        {tab === 'socios' && (
          <>
            {socios.length === 0 && !addingSocio && (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text2)', fontSize: 12 }}>
                <i className="ti ti-users" style={{ fontSize: 24, display: 'block', margin: '0 auto 8px', opacity: .3 }} />
                Nenhum sócio cadastrado
              </div>
            )}

            {socios.map(s => (
              <div key={s.id}>
                {editingSocioId === s.id ? (
                  <SocioForm
                    initial={s}
                    onSave={(form) => saveEditSocio({ ...form, id: s.id })}
                    onCancel={() => setEditingSocioId(null)}
                  />
                ) : (
                  <div style={{ background: isSocioMain(s.id) ? 'var(--green-light)' : 'var(--bg2)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 10, border: isSocioMain(s.id) ? '1px solid var(--green-mid)' : '1px solid transparent', transition: 'all .15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple-light)', color: 'var(--purple-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 }}>
                          {avInitials(s.nome)}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {s.nome}
                            {isSocioMain(s.id) && (
                              <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--green)', color: '#fff', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <i className="ti ti-star-filled" style={{ fontSize: 9 }} /> Principal
                              </span>
                            )}
                          </div>
                          {s.nascimento && (
                            <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <i className="ti ti-cake" style={{ fontSize: 11, color: 'var(--amber)' }} />
                              Nasc. {fmtNasc(s.nascimento)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isSocioMain(s.id) && canEdit && (
                          <button onClick={() => setMainContact({ type: 'socio', id: s.id })} style={{ ...sBtn, color: 'var(--amber)' }} title="Definir como contato principal">
                            <i className="ti ti-star" style={{ fontSize: 12 }} />
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button onClick={() => setEditingSocioId(s.id)} style={sBtn}>
                              <i className="ti ti-pencil" style={{ fontSize: 12 }} />
                            </button>
                            <button onClick={() => removeSocio(s.id)} style={sBtnDanger}>
                              <i className="ti ti-trash" style={{ fontSize: 12 }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                      {[['CPF', s.cpf], ['RG', s.rg], ['E-mail', s.email], ['Celular', s.celular]].filter(([, v]) => v).map(([l, v]) => (
                        <div key={l} style={{ padding: '4px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
                          <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div>
                          <div style={{ color: 'var(--text)', fontWeight: 500, marginTop: 1 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingSocio && (
              <SocioForm onSave={saveNewSocio} onCancel={() => setAddingSocio(false)} />
            )}

            {canEdit && !addingSocio && editingSocioId === null && (
              <button
                onClick={() => setAddingSocio(true)}
                style={{ width: '100%', padding: '9px 0', border: '1px dashed var(--border2)', borderRadius: 'var(--r)', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <i className="ti ti-plus" style={{ fontSize: 14 }} /> Adicionar sócio
              </button>
            )}
          </>
        )}
      </Modal>

      {/* Report panel */}
      <ReportPanel
        open={showReport}
        onClose={() => setShowReport(false)}
        client={client}
        certs={certs}
        tasks={tasks}
      />
    </>
  )
}

// ── Shared styles ────────────────────────────────────────────────────────────

const lbStyle    = { fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }
const sBtn       = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 'var(--r)', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text)' }
const sBtnPrimary= { ...sBtn, background: 'var(--btn-primary)', color: '#fff', borderColor: 'var(--btn-primary)' }
const sBtnDanger = { ...sBtn, background: 'var(--red-light)', color: 'var(--red-dark)', borderColor: '#F09595' }
