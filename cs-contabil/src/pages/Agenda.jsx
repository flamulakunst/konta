import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { MONTHS, DOWS, TODAY } from '../data/mockData'
import { diasPara, fmtD } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import { FormGrid, FormRow, Input, Select } from '../components/ui/FormField'

function buildCalendar(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const days  = []
  for (let d = first.getDay(); d > 0; d--) {
    const dd = new Date(year, month, 1 - d)
    days.push({ date: dd, other: true })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), other: false })
  }
  while (days.length % 7 !== 0) {
    days.push({ date: new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1), other: true })
  }
  return days
}

const EMPTY_TASK = { desc:'', cli:'', resp:'Ana Lima', data:'', prio:'media', tipo:'Follow-up' }

function HeaderKPI({ icon, value, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 11 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 12, opacity: .8 }} />
      <span style={{ fontWeight: 600 }}>{value}</span>
      <span style={{ opacity: .75 }}>{label}</span>
    </div>
  )
}

export default function Agenda({ setTopbarActions, setHeaderKPIs }) {
  const { tasks, addTask, toggleTask, delTask, birthdays } = useData()
  const { user } = useAuth()
  const p = user?.perms || {}

  const [calYear, setCalYear]   = useState(2026)
  const [calMonth, setCalMonth] = useState(5)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [tFilter, setTFilter]   = useState('todas')
  const [form, setForm]         = useState(EMPTY_TASK)

  useEffect(() => {
    setTopbarActions(
      p.canEdit ? <button onClick={() => setShowAdd(true)} style={btnPrimary}><i className="ti ti-plus" /> Nova tarefa</button> : null
    )
    const pendentes = tasks.filter(t => !t.done).length
    const vencidas  = tasks.filter(t => !t.done && diasPara(t.data) < 0).length
    const bdaysWeek = birthdays.filter(b => {
      let d = new Date(TODAY.getFullYear(), b.mes, b.dia)
      if (d < TODAY) d.setFullYear(d.getFullYear() + 1)
      return (d - TODAY) / 86400000 <= 7
    }).length
    if (setHeaderKPIs) setHeaderKPIs([
      <HeaderKPI key="p" icon="ti-checklist"    value={pendentes} label="Tarefas pendentes"  />,
      <HeaderKPI key="v" icon="ti-clock"         value={vencidas}  label="Vencidas"           />,
      <HeaderKPI key="b" icon="ti-cake"          value={bdaysWeek} label="Aniversários 7d"    />,
    ])
  }, [tasks, birthdays, p.canEdit])

  const days = buildCalendar(calYear, calMonth)

  const tasksOnDay = (d) => tasks.filter(t => {
    const td = new Date(t.data); return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && td.getDate() === d.getDate()
  })
  const bdaysOnDay = (d) => birthdays.filter(b => b.mes === d.getMonth() && b.dia === d.getDate())

  const todayKey   = `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`
  const isToday    = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey
  const isSelected = (d) => selected && `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`

  const filteredTasks = tasks.filter(t => {
    if (tFilter === 'pendentes')  return !t.done
    if (tFilter === 'concluidas') return t.done
    if (tFilter === 'vencidas')   return !t.done && diasPara(t.data) < 0
    return true
  }).sort((a, b) => a.data - b.data)

  function handleAddTask() {
    if (!form.desc || !form.data) return
    addTask({ ...form, data: new Date(form.data + 'T00:00:00') })
    setForm(EMPTY_TASK)
    setShowAdd(false)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const prioColors = { alta: { bg:'var(--red-light)', co:'var(--red-dark)' }, media: { bg:'var(--amber-light)', co:'var(--amber-dark)' }, baixa: { bg:'var(--bg2)', co:'var(--text2)' } }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

      {/* Left: calendar + tasks */}
      <div>
        {/* Calendar */}
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--rl)', padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y-- } setCalMonth(m); setCalYear(y) }} style={navBtn}><i className="ti ti-chevron-left" /></button>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={() => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++ } setCalMonth(m); setCalYear(y) }} style={navBtn}><i className="ti ti-chevron-right" /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {DOWS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, color: 'var(--text2)', padding: '4px 0' }}>{d}</div>)}
            {days.map((day, i) => {
              const hasTasks  = !day.other && tasksOnDay(day.date).length > 0
              const hasBdays  = !day.other && bdaysOnDay(day.date).length > 0
              const today     = !day.other && isToday(day.date)
              const sel       = !day.other && isSelected(day.date)
              const dotColor  = hasTasks && hasBdays ? 'var(--red)' : hasTasks ? 'var(--green)' : hasBdays ? 'var(--amber)' : null
              return (
                <div
                  key={i}
                  onClick={() => !day.other && setSelected(day.date)}
                  style={{
                    aspectRatio: 1, borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: day.other ? 'default' : 'pointer',
                    position: 'relative', color: sel ? '#fff' : today ? 'var(--green-dark)' : day.other ? 'var(--text3)' : 'var(--text2)',
                    background: sel ? 'var(--green)' : today ? 'var(--green-light)' : 'transparent',
                    fontWeight: (today || sel) ? 500 : 400,
                    opacity: day.other ? .3 : 1,
                  }}
                >
                  {day.date.getDate()}
                  {dotColor && (
                    <span style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: sel ? '#fff' : dotColor }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Task filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['todas','Todas'],['pendentes','Pendentes'],['concluidas','Concluídas'],['vencidas','Vencidas']].map(([id,label]) => (
            <button key={id} onClick={() => setTFilter(id)} style={{ ...filterBtn, background: tFilter===id ? 'var(--green-light)' : 'transparent', color: tFilter===id ? 'var(--green-dark)' : 'var(--text2)', borderColor: tFilter===id ? 'var(--green-mid)' : 'var(--border2)' }}>{label}</button>
          ))}
        </div>

        {/* Tasks list */}
        {filteredTasks.map(t => {
          const diff  = diasPara(t.data)
          const prio  = prioColors[t.prio] || prioColors.baixa
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 'var(--r)', border: '0.5px solid var(--border)', background: 'var(--bg)', marginBottom: 7, opacity: t.done ? .5 : 1 }}>
              <div
                onClick={() => p.canEdit && toggleTask(t.id)}
                style={{ width: 17, height: 17, minWidth: 17, borderRadius: 4, border: `1.5px solid ${t.done ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, cursor: p.canEdit ? 'pointer' : 'default', background: t.done ? 'var(--green)' : 'transparent', color: '#fff', transition: 'all .15s' }}
              >
                {t.done && <i className="ti ti-check" style={{ fontSize: 11 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, textDecoration: t.done ? 'line-through' : 'none' }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>{t.cli}</span>
                  <span style={{ ...prio, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{t.prio === 'alta' ? 'Alta' : t.prio === 'media' ? 'Média' : 'Baixa'}</span>
                  <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>{t.tipo}</span>
                  {!t.done && (
                    diff < 0
                      ? <span style={{ background:'var(--red-light)',color:'var(--red-dark)',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:500 }}>Vencida há {Math.abs(diff)}d</span>
                      : diff === 0
                      ? <span style={{ background:'var(--amber-light)',color:'var(--amber-dark)',fontSize:10,padding:'2px 8px',borderRadius:20,fontWeight:500 }}>Vence hoje</span>
                      : <span style={{ background:'var(--bg2)',color:'var(--text2)',fontSize:10,padding:'2px 8px',borderRadius:20 }}>{fmtD(t.data)}</span>
                  )}
                </div>
              </div>
              {p.canEdit && (
                <button onClick={() => delTask(t.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:2,fontSize:14 }}>
                  <i className="ti ti-x" />
                </button>
              )}
            </div>
          )
        })}

        {filteredTasks.length === 0 && (
          <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--text2)', fontSize:12 }}>
            <i className="ti ti-calendar-off" style={{ fontSize:22, display:'block', margin:'0 auto 8px', opacity:.4 }} />
            Nenhuma tarefa neste filtro
          </div>
        )}
      </div>

      {/* Right: birthdays */}
      <div>
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--rl)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            Aniversários <i className="ti ti-cake" style={{ fontSize: 13, color: 'var(--amber)' }} /> <i className="ti ti-building-bank" style={{ fontSize: 13, color: 'var(--blue)' }} />
          </div>
          {[...birthdays].sort((a, bk) => {
            const da = new Date(TODAY.getFullYear(), a.mes, a.dia); if (da < TODAY) da.setFullYear(da.getFullYear() + 1)
            const db = new Date(TODAY.getFullYear(), bk.mes, bk.dia); if (db < TODAY) db.setFullYear(db.getFullYear() + 1)
            return da - db
          }).map((b, i) => {
            const d         = new Date(TODAY.getFullYear(), b.mes, b.dia)
            if (d < TODAY) d.setFullYear(d.getFullYear() + 1)
            const diff      = Math.round((d - TODAY) / 86400000)
            const isTodayB  = diff === 0
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
                <div style={{ minWidth: 38, textAlign: 'center', background: isTodayB ? hiLight : 'var(--bg2)', borderRadius: 6, padding: '4px 0' }}>
                  <span style={{ fontSize: 16, fontWeight: 500, display: 'block', lineHeight: 1, color: isTodayB ? hiDark : 'var(--text)' }}>{b.dia}</span>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)' }}>{MONTHS[b.mes].slice(0,3)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`ti ${icon}`} style={{ fontSize: 12, color: hiColor }} />
                    {b.nome}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{empText}</div>
                </div>
                {isTodayB
                  ? <span style={{ background: hiLight, color: hiDark, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>Hoje</span>
                  : <span style={{ background: 'var(--bg2)', color: 'var(--text2)', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{diff}d</span>
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal nova tarefa */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(EMPTY_TASK) }}
        title={<span><i className="ti ti-circle-plus" style={{ fontSize:15,verticalAlign:-2,marginRight:6,color:'var(--btn-primary)' }} />Nova tarefa</span>}
        footer={<>
          <button onClick={() => { setShowAdd(false); setForm(EMPTY_TASK) }} style={btnStyle}>Cancelar</button>
          <button onClick={handleAddTask} style={btnPrimary}><i className="ti ti-plus" /> Criar</button>
        </>}
      >
        <FormGrid>
          <FormRow label="Descrição" full><Input value={form.desc} onChange={e => set('desc',e.target.value)} placeholder="Descreva a tarefa" /></FormRow>
          <FormRow label="Cliente"><Input value={form.cli} onChange={e => set('cli',e.target.value)} placeholder="Empresa" /></FormRow>
          <FormRow label="Responsável"><Select value={form.resp} onChange={e => set('resp',e.target.value)}>
            {['Ana Lima','Carlos Neto','Beatriz Souza'].map(s=><option key={s}>{s}</option>)}
          </Select></FormRow>
          <FormRow label="Vencimento"><Input type="date" value={form.data} onChange={e => set('data',e.target.value)} /></FormRow>
          <FormRow label="Prioridade"><Select value={form.prio} onChange={e => set('prio',e.target.value)}>
            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </Select></FormRow>
          <FormRow label="Tipo" full><Select value={form.tipo} onChange={e => set('tipo',e.target.value)}>
            {['Follow-up','Reunião','Envio de documento','Renovação','Certificado digital','Outro'].map(s=><option key={s}>{s}</option>)}
          </Select></FormRow>
        </FormGrid>
      </Modal>
    </div>
  )
}

const navBtn    = { background:'none',border:'0.5px solid var(--border2)',borderRadius:'var(--r)',padding:'4px 8px',cursor:'pointer',color:'var(--text2)',display:'flex',alignItems:'center' }
const filterBtn = { display:'inline-flex',alignItems:'center',padding:'4px 10px',borderRadius:'var(--r)',fontSize:11,fontWeight:500,cursor:'pointer',border:'0.5px solid var(--border2)' }
const btnStyle  = { display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:'var(--r)',fontSize:11,fontWeight:500,cursor:'pointer',border:'0.5px solid var(--border2)',background:'transparent',color:'var(--text)' }
const btnPrimary= { ...btnStyle, background:'var(--btn-primary)',color:'#fff',border:'1px solid var(--btn-primary)' }
