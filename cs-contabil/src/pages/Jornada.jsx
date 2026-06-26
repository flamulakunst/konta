import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COL_NAMES, COL_DOTS } from '../data/mockData'
import Modal from '../components/ui/Modal'
import { FormGrid, FormRow, Input, Select } from '../components/ui/FormField'

const STATUS_TAG = {
  Saudável:'green', Agendado:'blue', Aprovando:'green', 'No prazo':'green',
  'Em risco':'red', Atrasado:'amber', Revisão:'amber', Quente:'green', Novo:'blue'
}
const TAG_STYLES = {
  green:  { background: 'var(--green-light)', color: 'var(--green-dark)' },
  blue:   { background: 'var(--blue-light)',  color: 'var(--blue-dark)'  },
  red:    { background: 'var(--red-light)',   color: 'var(--red-dark)'   },
  amber:  { background: 'var(--amber-light)', color: 'var(--amber-dark)' },
  gray:   { background: 'var(--bg2)',         color: 'var(--text2)'      },
}

function KanbanCard({ card, onDragStart, onDragEnd, onClick }) {
  const ts = TAG_STYLES[STATUS_TAG[card.status]] || TAG_STYLES.gray
  const isResc = card.col === 4
  const leftBorder = card.alert ? '3px solid var(--red)' : card.warn ? '3px solid var(--amber)' : 'none'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: isResc ? '#FFF5F5' : 'var(--bg)',
        border: isResc ? '0.5px solid #F5C0C0' : '0.5px solid var(--border)',
        borderRadius: 'var(--r)',
        borderLeft: isResc ? '3px solid var(--red)' : leftBorder,
        padding: '10px 11px', marginBottom: 7,
        cursor: 'grab', userSelect: 'none', transition: 'border-color .15s',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{card.nome}</div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{card.seg}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ ...ts, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{card.status}</span>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{card.cs.split(' ')[0]}</span>
      </div>
      {isResc && (
        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--red-light)', color: 'var(--red-dark)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} />
          Em rescisão
        </div>
      )}
    </div>
  )
}

export default function Jornada({ setTopbarActions }) {
  const { kanban, moveCard, addKanbanCard } = useData()
  const { user } = useAuth()
  const p = user?.perms || {}

  const [filter, setFilter]           = useState('todos')
  const [dragId, setDragId]           = useState(null)
  const [overCol, setOverCol]         = useState(null)
  const [addCol, setAddCol]           = useState(null)
  const [pendingMove, setPendingMove] = useState(null)
  const [addForm, setAddForm]         = useState({ nome:'', seg:'Contábil', cs:'Ana Lima', status:'No prazo', hon:'', obs:'' })

  useEffect(() => { setTopbarActions(null) }, [])

  const visible = kanban.filter(c => {
    if (filter === 'todos') return true
    if (filter === 'risk') return c.alert || c.warn
    return c.cs.includes(filter)
  })

  const filterBtns = [
    { id:'todos', label:'Todos' },
    { id:'Ana', label:'Ana Lima' },
    { id:'Carlos', label:'Carlos Neto' },
    { id:'Beatriz', label:'Beatriz' },
    { id:'risk', label:'Em risco', icon:'ti-alert-triangle' },
  ]

  function handleDrop(e, col) {
    e.preventDefault()
    setOverCol(null)
    if (dragId === null) return
    const id = dragId
    setDragId(null)
    if (col === 3 || col === 4) {
      setPendingMove({ cardId: id, targetCol: col })
    } else {
      moveCard(id, col)
    }
  }

  function confirmMove() {
    if (!pendingMove) return
    moveCard(pendingMove.cardId, pendingMove.targetCol)
    setPendingMove(null)
  }

  function handleAddCard() {
    addKanbanCard({ ...addForm, col: addCol, warn: false, alert: false })
    setAddCol(null)
    setAddForm({ nome:'', seg:'Contábil', cs:'Ana Lima', status:'No prazo', hon:'', obs:'' })
  }

  const confirmMsg = pendingMove?.targetCol === 4
    ? 'Tem certeza que deseja mover este cliente para Rescisão de Contrato?'
    : 'Confirmar início da implementação de sistema para este cliente?'

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {filterBtns.map(fb => {
          const active = filter === fb.id
          return (
            <button
              key={fb.id}
              onClick={() => setFilter(fb.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 'var(--r)', fontSize: 11, fontWeight: 500,
                cursor: 'pointer', border: '0.5px solid var(--border2)',
                background: active ? 'var(--green-light)' : 'transparent',
                color: active ? 'var(--green-dark)' : 'var(--text)',
                borderColor: active ? 'var(--green-mid)' : 'var(--border2)',
              }}
            >
              {fb.icon && <i className={`ti ${fb.icon}`} style={{ fontSize: 11 }} />}
              {fb.label}
            </button>
          )
        })}
      </div>

      {/* Board */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
        {COL_NAMES.map((name, ci) => {
          const colCards = visible.filter(c => c.col === ci)
          const allCol   = kanban.filter(c => c.col === ci)
          const hon = allCol.reduce((s, c) => {
            const v = parseFloat((c.hon || '').replace(/[^0-9]/g, ''))
            return s + (isNaN(v) ? 0 : v)
          }, 0)
          const isOver    = overCol === ci
          const isRescCol = ci === 4

          return (
            <div key={ci} style={{ minWidth: 170, flex: 1 }}>
              {/* Column header */}
              <div style={{
                padding: '10px 10px 8px',
                background: isRescCol ? '#FFF8F8' : 'var(--bg)',
                border: '0.5px solid var(--border)',
                borderTop: isRescCol ? '3px solid var(--red)' : '0.5px solid var(--border)',
                borderBottom: 'none',
                borderRadius: '12px 12px 0 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COL_DOTS[ci], display: 'inline-block' }} />
                    {name}
                  </div>
                  <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{allCol.length}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>R$ {hon.toLocaleString('pt-BR')}/mês</div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setOverCol(ci) }}
                onDragLeave={() => setOverCol(null)}
                onDrop={e => handleDrop(e, ci)}
                style={{
                  background: isOver
                    ? (isRescCol ? '#FFEDED' : 'var(--green-light)')
                    : (isRescCol ? '#FFF5F5' : 'var(--bg2)'),
                  border: `0.5px solid ${isOver
                    ? (isRescCol ? '#F5C0C0' : 'var(--green-mid)')
                    : 'var(--border)'}`,
                  borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 8, minHeight: 280,
                  transition: 'background .15s',
                }}
              >
                {colCards.map(c => (
                  <KanbanCard
                    key={c.id}
                    card={c}
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null) }}
                    onClick={() => {}}
                  />
                ))}
                {colCards.length === 0 && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', padding: '20px 8px', lineHeight: 1.5 }}>
                    Nenhum cliente neste estágio. Adicione um cliente ou arraste um cartão para cá.
                  </div>
                )}
                {p.canEdit && (
                  <div
                    onClick={() => setAddCol(ci)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 7, fontSize: 11, color: 'var(--text2)', cursor: 'pointer', border: '0.5px dashed var(--border2)', borderRadius: 'var(--r)', marginTop: 4 }}
                  >
                    <i className="ti ti-plus" style={{ fontSize: 13 }} /> Adicionar
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add card modal */}
      <Modal
        open={addCol !== null}
        onClose={() => setAddCol(null)}
        title={<span><i className="ti ti-plus" style={{ marginRight: 6, color: 'var(--green)' }} />Adicionar card — {addCol !== null ? COL_NAMES[addCol] : ''}</span>}
        footer={<>
          <button onClick={() => setAddCol(null)} style={btnStyle}>Cancelar</button>
          <button onClick={handleAddCard} style={btnPrimary}><i className="ti ti-plus" /> Adicionar</button>
        </>}
      >
        <FormGrid>
          <FormRow label="Empresa" full><Input value={addForm.nome} onChange={e => setAddForm(f=>({...f,nome:e.target.value}))} placeholder="Nome da empresa" /></FormRow>
          <FormRow label="Segmento"><Select value={addForm.seg} onChange={e => setAddForm(f=>({...f,seg:e.target.value}))}>
            {['Contábil','Fiscal','Full','Varejo','Logística'].map(s=><option key={s}>{s}</option>)}
          </Select></FormRow>
          <FormRow label="Responsável CS"><Select value={addForm.cs} onChange={e => setAddForm(f=>({...f,cs:e.target.value}))}>
            {['Ana Lima','Carlos Neto','Beatriz Souza'].map(s=><option key={s}>{s}</option>)}
          </Select></FormRow>
          <FormRow label="Status"><Select value={addForm.status} onChange={e => setAddForm(f=>({...f,status:e.target.value}))}>
            {['No prazo','Agendado','Atrasado','Revisão','Saudável','Em risco','Aprovando'].map(s=><option key={s}>{s}</option>)}
          </Select></FormRow>
          <FormRow label="Honorário"><Input value={addForm.hon} onChange={e => setAddForm(f=>({...f,hon:e.target.value}))} placeholder="R$ 0,00" /></FormRow>
        </FormGrid>
      </Modal>

      {/* Confirm move modal */}
      <Modal
        open={pendingMove !== null}
        onClose={() => setPendingMove(null)}
        title={
          pendingMove?.targetCol === 4
            ? <span><i className="ti ti-alert-triangle" style={{ marginRight: 6, color: 'var(--red)' }} />Confirmar Rescisão</span>
            : <span><i className="ti ti-settings" style={{ marginRight: 6, color: 'var(--btn-primary)' }} />Confirmar Implementação</span>
        }
        footer={<>
          <button onClick={() => setPendingMove(null)} style={btnStyle}>Cancelar</button>
          <button onClick={confirmMove} style={pendingMove?.targetCol === 4 ? btnDanger : btnPrimary}>
            {pendingMove?.targetCol === 4
              ? <><i className="ti ti-check" /> Confirmar rescisão</>
              : <><i className="ti ti-check" /> Confirmar</>
            }
          </button>
        </>}
      >
        <p style={{ fontSize: 13, color: 'var(--text)', margin: 0 }}>{confirmMsg}</p>
      </Modal>
    </div>
  )
}

const btnStyle   = { display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:'var(--r)',fontSize:11,fontWeight:500,cursor:'pointer',border:'0.5px solid var(--border2)',background:'transparent',color:'var(--text)' }
const btnPrimary = { ...btnStyle, background:'var(--btn-primary)',color:'#fff',border:'1px solid var(--btn-primary)' }
const btnDanger  = { ...btnStyle, background:'var(--red-light)',color:'var(--red-dark)',borderColor:'#F09595' }
