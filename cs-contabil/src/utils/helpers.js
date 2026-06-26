import { TODAY, AV_BG, AV_CO } from '../data/mockData'

export function fmtD(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function diasPara(d) {
  const t = new Date(TODAY); t.setHours(0,0,0,0)
  const o = new Date(d); o.setHours(0,0,0,0)
  return Math.round((o - t) / 86400000)
}

export function vidaUtil(emissao, venc) {
  const tot = venc - emissao
  const used = TODAY - emissao
  return Math.min(100, Math.max(0, Math.round(used / tot * 100)))
}

export function certStatus(dias) {
  if (dias < 0)   return { label: `Vencido há ${Math.abs(dias)}d`, color: '#E24B4A', tco: '#791F1F', bg: '#FCEBEB', cls: 'vencido',  barC: '#E24B4A' }
  if (dias <= 15)  return { label: `${dias}d restantes`,            color: '#EF9F27', tco: '#633806', bg: '#FAEEDA', cls: 'critico',  barC: '#EF9F27' }
  if (dias <= 60)  return { label: `${dias}d restantes`,            color: '#378ADD', tco: '#0C447C', bg: '#E6F1FB', cls: '',         barC: '#378ADD' }
  return              { label: `${dias}d restantes`,            color: '#1D9E75', tco: '#085041', bg: '#E1F5EE', cls: '',         barC: '#1D9E75' }
}

export function avInitials(nome) {
  return nome.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

export function avColors(nome) {
  const i = Math.abs(nome.charCodeAt(0)) % 5
  return { bg: AV_BG[i], co: AV_CO[i] }
}

export function prioColor(p) {
  if (p === 'alta')  return { bg: '#FCEBEB', co: '#791F1F' }
  if (p === 'media') return { bg: '#FAEEDA', co: '#633806' }
  return { bg: '#f5f5f4', co: '#6b6a65' }
}

export function prioLabel(p) {
  if (p === 'alta')  return 'Alta'
  if (p === 'media') return 'Média'
  return 'Baixa'
}

// ── Contato principal ────────────────────────────────────────────────────────

const SECTOR_LABELS = { dp: 'Depto. Pessoal', fiscal: 'Fiscal', financeiro: 'Financeiro' }

/**
 * Retorna { nome, cargo, setor, telefone, email } do contato marcado como principal,
 * ou null se nenhum estiver definido ou o registro não existir mais.
 */
export function getMainContact(client) {
  if (!client?.mainContact) return null
  const mc = client.mainContact
  if (mc.type === 'sector') {
    const ct = client.contacts?.[mc.key]
    if (!ct?.nome) return null
    return {
      nome:     ct.nome,
      cargo:    ct.cargo || '',
      setor:    SECTOR_LABELS[mc.key] || mc.key,
      telefone: ct.telefone || '',
      email:    ct.email    || '',
    }
  }
  if (mc.type === 'socio') {
    const s = (client.socios || []).find(s => s.id === mc.id)
    if (!s?.nome) return null
    return {
      nome:     s.nome,
      cargo:    'Sócio/Dono',
      setor:    'Sócio/Dono',
      telefone: s.celular || '',
      email:    s.email   || '',
    }
  }
  return null
}
