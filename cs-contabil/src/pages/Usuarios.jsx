import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, PERMS } from '../data/mockData'
import Modal from '../components/ui/Modal'
import { FormGrid, FormRow, Input, Select } from '../components/ui/FormField'
import Tag from '../components/ui/Tag'

const EMPTY_FORM = { nome:'', email:'', perfil:'cs', senha:'' }

export default function Usuarios({ setTopbarActions }) {
  const { appUsers, addUser, toggleUser } = useData()
  const { user } = useAuth()
  const p = user?.perms || {}

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    setTopbarActions(
      p.canManageUsers ? (
        <button onClick={() => setShowAdd(true)} style={btnPrimary}><i className="ti ti-user-plus" /> Convidar usuário</button>
      ) : null
    )
  }, [p.canManageUsers])

  function handleAdd() {
    if (!form.nome || !form.email) return
    addUser({ ...form, av: form.nome.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(), avBg:'#E1F5EE', avCo:'#085041' })
    setForm(EMPTY_FORM); setShowAdd(false)
  }

  const permRows = [
    { key:'canEdit',         label:'Criar e editar registros' },
    { key:'canDelete',       label:'Excluir registros' },
    { key:'canManageUsers',  label:'Gerenciar usuários' },
    { key:'canExport',       label:'Exportar dados' },
    { key:'canConfig',       label:'Configurações do sistema' },
  ]

  return (
    <div>
      {/* Permissions reference */}
      <div style={{ background:'var(--bg)',border:'0.5px solid var(--border)',borderRadius:'var(--rl)',padding:16,marginBottom:16 }}>
        <div style={{ fontSize:11,fontWeight:500,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12 }}>Permissões por perfil</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, fontSize:12 }}>
          <div style={{ fontWeight:500,color:'var(--text2)',fontSize:11 }}>Permissão</div>
          {['admin','cs','visualizador'].map(role => {
            const info = ROLE_LABELS[role]
            return <div key={role} style={{ textAlign:'center' }}><Tag variant={info.color}>{info.label}</Tag></div>
          })}
          {permRows.map(row => (
            <>
              <div key={row.key+'l'} style={{ color:'var(--text2)',fontSize:12,padding:'3px 0' }}>{row.label}</div>
              {['admin','cs','visualizador'].map(role => (
                <div key={role+row.key} style={{ textAlign:'center',padding:'3px 0' }}>
                  {PERMS[role][row.key]
                    ? <i className="ti ti-circle-check" style={{ color:'var(--green)',fontSize:15 }} />
                    : <i className="ti ti-circle-x"     style={{ color:'var(--red)',  fontSize:15,opacity:.4 }} />
                  }
                </div>
              ))}
            </>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div style={{ background:'var(--bg)',border:'0.5px solid var(--border)',borderRadius:'var(--rl)',overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Usuário','E-mail','Perfil','Último acesso','Status',''].map(h => (
                <th key={h} style={{ textAlign:'left',fontSize:11,fontWeight:500,color:'var(--text2)',padding:'8px 12px',borderBottom:'0.5px solid var(--border)',textTransform:'uppercase',letterSpacing:'.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appUsers.map(u => {
              const roleInfo = ROLE_LABELS[u.perfil] || { label: u.perfil, color: 'gray' }
              return (
                <tr key={u.id}>
                  <td style={tdStyle}>
                    <span style={{ width:28,height:28,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:500,background:u.avBg,color:u.avCo,verticalAlign:'middle',marginRight:8 }}>
                      {u.av}
                    </span>
                    {u.nome}
                  </td>
                  <td style={{ ...tdStyle, color:'var(--text2)' }}>{u.email}</td>
                  <td style={tdStyle}><Tag variant={roleInfo.color}>{roleInfo.label}</Tag></td>
                  <td style={{ ...tdStyle, color:'var(--text2)' }}>{u.ultimo}</td>
                  <td style={tdStyle}>
                    {u.ativo
                      ? <Tag variant="green">Ativo</Tag>
                      : <Tag variant="gray">Inativo</Tag>
                    }
                  </td>
                  <td style={tdStyle}>
                    {p.canManageUsers && u.id !== user.id && (
                      <button
                        onClick={() => toggleUser(u.id)}
                        style={u.ativo ? btnDanger : btnStyle}
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {u.ativo ? <><i className="ti ti-user-off" /> Desativar</> : <><i className="ti ti-user-check" /> Ativar</>}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(EMPTY_FORM) }}
        title={<span><i className="ti ti-user-plus" style={{ fontSize:15,verticalAlign:-2,marginRight:6,color:'var(--green)' }} />Convidar usuário</span>}
        footer={<>
          <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }} style={btnStyle}>Cancelar</button>
          <button onClick={handleAdd} style={btnPrimary}><i className="ti ti-send" /> Convidar</button>
        </>}
      >
        <FormGrid>
          <FormRow label="Nome completo" full><Input value={form.nome} onChange={e => set('nome',e.target.value)} placeholder="Nome do usuário" /></FormRow>
          <FormRow label="E-mail" full><Input type="email" value={form.email} onChange={e => set('email',e.target.value)} placeholder="email@empresa.com.br" /></FormRow>
          <FormRow label="Perfil"><Select value={form.perfil} onChange={e => set('perfil',e.target.value)}>
            <option value="admin">Admin</option>
            <option value="cs">CS</option>
            <option value="visualizador">Visualizador</option>
          </Select></FormRow>
          <FormRow label="Senha temporária"><Input type="text" value={form.senha} onChange={e => set('senha',e.target.value)} placeholder="Senha de primeiro acesso" /></FormRow>
        </FormGrid>
        <div style={{ background:'var(--blue-light)',color:'var(--blue-dark)',borderRadius:'var(--r)',padding:'9px 12px',fontSize:12,display:'flex',alignItems:'center',gap:7,marginTop:12 }}>
          <i className="ti ti-info-circle" style={{ fontSize:15 }} /> No sistema em produção, um e-mail de convite seria enviado automaticamente.
        </div>
      </Modal>
    </div>
  )
}

const tdStyle    = { padding:'10px 12px',fontSize:12,color:'var(--text)',borderBottom:'0.5px solid var(--border)' }
const btnStyle   = { display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:'var(--r)',fontSize:11,fontWeight:500,cursor:'pointer',border:'0.5px solid var(--border2)',background:'transparent',color:'var(--text)' }
const btnPrimary = { ...btnStyle, background:'var(--btn-primary)',color:'#fff',border:'1px solid var(--btn-primary)' }
const btnDanger  = { ...btnStyle, background:'var(--red-light)',color:'var(--red-dark)',borderColor:'#F09595' }
