import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COL_NAMES, COL_DOTS } from '../data/mockData'
import { avInitials, avColors, getMainContact } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import { FormGrid, FormRow, Input, Select } from '../components/ui/FormField'
import ClientDetail from '../components/ClientDetail'
import ImportClientes from '../components/ImportClientes'

const STATUS_VARIANT = { Saudável:'green', Agendado:'blue', Revisão:'amber', Atrasado:'amber', 'Em risco':'red', Aprovando:'green' }

const EMPTY_FORM = { nome:'', cnpj:'', seg:'', regime:'Simples Nacional', cs:'Ana Lima', col:0, hon:'', cidade:'', obs:'', abertura: '' }

// ── Relatório ────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function fmtDatePT(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function exportPDF(clients) {
  const date = fmtDatePT(new Date())
  const total = clients.length
  const rows = clients.map((c, i) => {
    const mc    = getMainContact(c)
    const tel   = mc?.telefone || c.telefone || ''
    const email = mc?.email    || c.email    || '—'
    return `
    <tr>
      <td class="idx">${i + 1}</td>
      <td class="nome">${esc(c.nome)}</td>
      <td>${esc(c.cnpj)}</td>
      <td>${esc(c.regime)}</td>
      <td>${esc(c.cs)}</td>
      <td>${mc ? `${esc(mc.nome)}<div style="font-size:9.5px;color:#6b6a65;margin-top:1px">${esc(tel)}</div>` : `<span style="color:#9d9c97">—</span>`}</td>
      <td class="email">${esc(email)}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Clientes — Konta</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Arial,sans-serif;font-size:11px;color:#1a1a18;padding:28px 32px;background:#fff}
  .header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:2.5px solid #0F6E56;margin-bottom:16px}
  .brand{font-size:21px;font-weight:800;color:#0F6E56;letter-spacing:-.5px;line-height:1}
  .brand small{display:block;font-size:10px;font-weight:400;color:#6b6a65;letter-spacing:0;margin-top:3px}
  .meta{text-align:right}
  .meta h2{font-size:14px;font-weight:600;color:#1a1a18}
  .meta p{font-size:10px;color:#6b6a65;margin-top:4px}
  .kpis{display:flex;gap:10px;margin-bottom:16px}
  .kpi{background:#E1F5EE;border-radius:8px;padding:9px 14px;min-width:100px}
  .kpi-n{font-size:22px;font-weight:700;color:#0F6E56;line-height:1}
  .kpi-l{font-size:9.5px;color:#085041;margin-top:3px;text-transform:uppercase;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse}
  thead th{background:#0F6E56;color:#fff;padding:7px 9px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.07em}
  tbody tr:nth-child(even){background:#f7f7f6}
  tbody td{padding:6px 9px;border-bottom:.5px solid rgba(0,0,0,.07);font-size:10.5px;vertical-align:middle}
  tbody tr:last-child td{border-bottom:none}
  td.idx{color:#9d9c97;font-size:10px;width:28px;text-align:center}
  td.nome{font-weight:500}
  td.email{color:#2563EB}
  .footer{margin-top:14px;display:flex;justify-content:space-between;font-size:9px;color:#9d9c97;border-top:.5px solid #e5e5e5;padding-top:10px}
  @media print{
    body{padding:10mm 12mm}
    .kpis{display:none}
    @page{size:A4 landscape;margin:12mm 14mm}
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Konta<small>Sistema de Customer Success</small></div>
    <div class="meta">
      <h2>Relatório de Clientes</h2>
      <p>Gerado em ${date} &nbsp;·&nbsp; ${total} empresa${total !== 1 ? 's' : ''} cadastrada${total !== 1 ? 's' : ''}</p>
    </div>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-n">${total}</div><div class="kpi-l">Total de clientes</div></div>
    <div class="kpi"><div class="kpi-n">${clients.filter(c=>c.regime==='Simples Nacional').length}</div><div class="kpi-l">Simples Nacional</div></div>
    <div class="kpi"><div class="kpi-n">${clients.filter(c=>c.regime==='Lucro Presumido').length}</div><div class="kpi-l">Lucro Presumido</div></div>
    <div class="kpi"><div class="kpi-n">${clients.filter(c=>c.regime==='Lucro Real').length}</div><div class="kpi-l">Lucro Real</div></div>
    <div class="kpi"><div class="kpi-n">${clients.filter(c=>c.regime==='MEI').length}</div><div class="kpi-l">MEI</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th style="width:24%">Razão Social</th>
        <th style="width:14%">CNPJ</th>
        <th style="width:14%">Regime Tributário</th>
        <th style="width:11%">Resp. CS</th>
        <th style="width:15%">Contato Principal</th>
        <th>E-mail</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>Konta — Customer Success</span>
    <span>Relatório gerado em ${date}</span>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),350)</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) { alert('Permita pop-ups para gerar o PDF.'); return }
  win.document.write(html)
  win.document.close()
}

function exportXLSX(clients) {
  const now = new Date()
  const date = fmtDatePT(now)
  const pad = n => String(n).padStart(2, '0')
  const filename = `relatorio_clientes_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}.xlsx`

  const aoa = [
    ['Konta — Relatório de Clientes'],
    [`Gerado em: ${date}     Total: ${clients.length} empresa${clients.length !== 1 ? 's' : ''} cadastrada${clients.length !== 1 ? 's' : ''}`],
    [],
    ['#', 'Razão Social', 'CNPJ', 'Regime Tributário', 'Responsável CS', 'Contato Principal', 'Telefone', 'E-mail'],
    ...clients.map((c, i) => {
      const mc = getMainContact(c)
      return [i + 1, c.nome, c.cnpj, c.regime, c.cs, mc?.nome || '', mc?.telefone || c.telefone || '', mc?.email || c.email || '']
    }),
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 32 }]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, filename)
}

function ClientModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  useEffect(() => { setForm(initial || EMPTY_FORM) }, [initial, open])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<span><i className="ti ti-building" style={{ fontSize: 15, verticalAlign: -2, marginRight: 6, color: 'var(--green)' }} />{initial ? 'Editar cliente' : 'Novo cliente'}</span>}
      footer={<>
        <button onClick={onClose} style={btnStyle}>Cancelar</button>
        <button onClick={() => { onSave(form); onClose() }} style={btnPrimary}><i className="ti ti-plus" /> {initial ? 'Salvar' : 'Adicionar'}</button>
      </>}
    >
      <FormGrid>
        <FormRow label="Razão social" full><Input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome da empresa" /></FormRow>
        <FormRow label="CNPJ"><Input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></FormRow>
        <FormRow label="Segmento"><Input value={form.seg} onChange={e => set('seg', e.target.value)} placeholder="Ex: Comércio" /></FormRow>
        <FormRow label="Regime tributário">
          <Select value={form.regime} onChange={e => set('regime', e.target.value)}>
            {['Simples Nacional','Lucro Presumido','Lucro Real','MEI'].map(r => <option key={r}>{r}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Responsável CS">
          <Select value={form.cs} onChange={e => set('cs', e.target.value)}>
            {['Ana Lima','Carlos Neto','Beatriz Souza'].map(r => <option key={r}>{r}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Estágio">
          <Select value={form.col} onChange={e => set('col', Number(e.target.value))}>
            {COL_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </Select>
        </FormRow>
        <FormRow label="Honorário mensal"><Input value={form.hon} onChange={e => set('hon', e.target.value)} placeholder="R$ 0,00" /></FormRow>
        <FormRow label="Cidade / UF"><Input value={form.cidade} onChange={e => set('cidade', e.target.value)} placeholder="São Paulo / SP" /></FormRow>
        <FormRow label="Data de abertura"><Input type="date" value={form.abertura || ''} onChange={e => set('abertura', e.target.value || null)} /></FormRow>
      </FormGrid>
    </Modal>
  )
}


export default function Clientes({ setTopbarActions }) {
  const { clients, addClient, editClient, delClient } = useData()
  const { user } = useAuth()
  const p = user?.perms || {}

  const [search, setSearch]           = useState('')
  const [colFilter, setColFilter]     = useState('')
  const [showAdd, setShowAdd]         = useState(false)
  const [showImport, setShowImport]   = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [detailId, setDetailId]       = useState(null)
  const [editData, setEditData]       = useState(null)

  useEffect(() => {
    setTopbarActions(
      p.canEdit ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowImport(true)} style={btnStyle}>
            <i className="ti ti-table-import" style={{ fontSize: 13 }} /> Importar planilha
          </button>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}>
            <i className="ti ti-plus" /> Novo cliente
          </button>
        </div>
      ) : null
    )
  }, [p.canEdit])

  const filtered = clients.filter(c =>
    (c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search) ||
    c.seg.toLowerCase().includes(search.toLowerCase())) &&
    (colFilter === '' || c.col === Number(colFilter))
  )

  function handleSave(form) {
    if (editData) editClient({ ...editData, ...form })
    else addClient({ ...form, status: 'Saudável', desde: 'Jun/2026', obs: form.obs || '' })
    setEditData(null)
  }

  return (
    <div>
      {!p.canEdit && (
        <div style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)', borderRadius: 'var(--r)', padding: '9px 13px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <i className="ti ti-eye" style={{ fontSize: 15 }} /> Modo leitura — seu perfil não permite criar ou editar registros.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', border: '0.5px solid var(--border2)', borderRadius: 'var(--r)', background: 'var(--bg)' }}>
          <i className="ti ti-search" style={{ fontSize: 15, color: 'var(--text3)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, CNPJ ou segmento..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text)', width: '100%' }} />
        </div>

        <select
          value={colFilter}
          onChange={e => setColFilter(e.target.value)}
          style={{ padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 'var(--r)', background: 'var(--bg)', fontSize: 12, color: colFilter === '' ? 'var(--text2)' : 'var(--text)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Todos os estágios</option>
          {COL_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
        </select>

        {p.canExport && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowReportMenu(v => !v)} style={{ ...btnStyle, padding: '7px 11px' }}>
              <i className="ti ti-file-analytics" style={{ fontSize: 13 }} />
              Relatório geral
              <i className="ti ti-chevron-down" style={{ fontSize: 11, marginLeft: 1, opacity: .6 }} />
            </button>
            {showReportMenu && (
              <>
                <div onClick={() => setShowReportMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 50,
                  background: 'var(--bg)', border: '0.5px solid var(--border)',
                  borderRadius: 'var(--rl)', padding: 4, minWidth: 196,
                  boxShadow: '0 6px 24px rgba(0,0,0,.12)',
                }}>
                  <button onClick={() => { exportPDF(clients); setShowReportMenu(false) }} style={menuItemStyle}>
                    <i className="ti ti-file-type-pdf" style={{ fontSize: 15, color: 'var(--red)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Exportar PDF</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Abre prévia para impressão</div>
                    </div>
                  </button>
                  <button onClick={() => { exportXLSX(clients); setShowReportMenu(false) }} style={menuItemStyle}>
                    <i className="ti ti-table-export" style={{ fontSize: 15, color: 'var(--green)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 500 }}>Exportar Excel</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Baixa arquivo .xlsx</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--rl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Empresa','Segmento','Regime','CS','Estágio','Hon./mês','Desde',''].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text2)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const { bg, co } = avColors(c.nome)
              const mc = getMainContact(c)
              return (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(c.id)}
                  onMouseEnter={e => { Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'var(--bg2)') }}
                  onMouseLeave={e => { Array.from(e.currentTarget.cells).forEach(td => td.style.background = '') }}
                >
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text)', borderBottom: '0.5px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, background: bg, color: co, flexShrink: 0, marginTop: 1 }}>{avInitials(c.nome)}</span>
                      <div>
                        <div>{c.nome}</div>
                        {mc && (
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <i className="ti ti-star-filled" style={{ fontSize: 9, color: 'var(--green)' }} />
                            <span>{mc.nome}</span>
                            {mc.telefone && <span style={{ color: 'var(--border2)', marginLeft: 2 }}>· {mc.telefone}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{c.seg}</td>
                  <td style={tdStyle}>{c.regime}</td>
                  <td style={tdStyle}>{c.cs}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: COL_DOTS[c.col], display: 'inline-block' }} />
                      {COL_NAMES[c.col]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{c.hon}</td>
                  <td style={{ ...tdStyle, color: 'var(--text2)' }}>{c.desde}</td>
                  <td style={tdStyle}>
                    <button onClick={e => { e.stopPropagation(); setDetailId(c.id) }} style={btnStyle}><i className="ti ti-eye" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ClientModal
        open={showAdd || !!editData}
        onClose={() => { setShowAdd(false); setEditData(null) }}
        onSave={handleSave}
        initial={editData}
      />
      <ClientDetail
        clientId={detailId}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        canEdit={p.canEdit}
        canDelete={p.canDelete}
      />
      <ImportClientes
        open={showImport}
        onClose={() => setShowImport(false)}
      />
    </div>
  )
}

const tdStyle = { padding: '10px 12px', fontSize: 12, color: 'var(--text)', borderBottom: '0.5px solid var(--border)' }
const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--r)', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text)' }
const btnPrimary = { ...btnStyle, background: 'var(--btn-primary)', color: '#fff', border: '1px solid var(--btn-primary)' }
const btnDanger  = { ...btnStyle, background: 'var(--red-light)', color: 'var(--red-dark)', borderColor: '#F09595' }
const menuItemStyle = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 'var(--r)', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: 'var(--text)', fontWeight: 400 }
