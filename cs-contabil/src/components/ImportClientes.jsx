import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../contexts/DataContext'

// ── Mapeamento de colunas ────────────────────────────────────────────────────
// Cada campo aceita uma lista de variações de cabeçalho (sem acentos, minúsculas)
const FIELD_ALIASES = {
  nome:     ['razao social', 'empresa', 'nome', 'razao', 'company', 'cliente'],
  cnpj:     ['cnpj', 'cpf cnpj', 'inscricao'],
  seg:      ['segmento', 'segment', 'ramo', 'atividade', 'setor'],
  regime:   ['regime tributario', 'regime', 'tributacao', 'enquadramento'],
  cs:       ['responsavel cs', 'cs responsavel', 'cs', 'responsavel', 'atendente', 'gerente'],
  hon:      ['honorario mensal', 'honorario', 'valor mensal', 'mensalidade', 'valor', 'fee'],
  cidade:   ['cidade uf', 'cidade', 'municipio', 'city', 'localidade', 'estado'],
  telefone: ['telefone', 'fone', 'tel', 'phone', 'whatsapp', 'celular', 'contato'],
  email:    ['email principal', 'email', 'e mail', 'e-mail', 'contato email', 'mail'],
  abertura: ['data de abertura', 'data abertura', 'abertura', 'data fundacao', 'data de fundacao', 'inicio atividade'],
}

const DISPLAY_COLS = [
  { field: 'nome',     label: 'Razão Social',    minWidth: 190 },
  { field: 'cnpj',     label: 'CNPJ',            minWidth: 140 },
  { field: 'seg',      label: 'Segmento',        minWidth: 110 },
  { field: 'regime',   label: 'Regime',          minWidth: 120 },
  { field: 'cs',       label: 'CS',              minWidth: 100 },
  { field: 'hon',      label: 'Honorário',       minWidth: 90  },
  { field: 'cidade',   label: 'Cidade/UF',       minWidth: 110 },
  { field: 'telefone', label: 'Telefone',        minWidth: 120 },
  { field: 'email',    label: 'E-mail',          minWidth: 160 },
  { field: 'abertura', label: 'Data de abertura', minWidth: 130 },
]

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStr(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function detectField(header) {
  const h = normalizeStr(header)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some(a => h === a || h.includes(a))) return field
  }
  return null
}

function normalizeCNPJ(raw) {
  return String(raw ?? '').replace(/\D/g, '')
}

function safeStr(v) {
  // proteção básica contra prototype pollution: garantir que é string
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return ''
  return String(v).trim().slice(0, 500)
}

function parseSpreadsheet(file, existingClients) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'))
    reader.onload = (e) => {
      try {
        const ab = e.target.result
        const wb = XLSX.read(ab, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (!raw || raw.length < 2) {
          return reject(new Error('Arquivo vazio ou sem dados suficientes.'))
        }

        // Detectar linha de cabeçalho (primeira linha com ≥3 células não vazias)
        let headerIdx = 0
        for (let i = 0; i < Math.min(raw.length, 5); i++) {
          const nonEmpty = raw[i].filter(c => String(c).trim()).length
          if (nonEmpty >= 3) { headerIdx = i; break }
        }

        const headers = raw[headerIdx]
        const fieldMap = {} // colIdx -> fieldKey
        headers.forEach((h, i) => {
          const field = detectField(h)
          if (field && !(Object.values(fieldMap).includes(field))) fieldMap[i] = field
        })

        if (!Object.values(fieldMap).includes('nome')) {
          return reject(new Error('Coluna "Razão Social" não encontrada. Verifique os cabeçalhos da planilha.'))
        }

        const existingCNPJs = new Set(existingClients.map(c => normalizeCNPJ(c.cnpj)))

        // Primeira passagem: parsear dados
        const rows = raw.slice(headerIdx + 1)
          .filter(row => row.some(cell => String(cell).trim()))
          .map((row, idx) => {
            const obj = { _idx: idx }
            Object.entries(fieldMap).forEach(([colIdx, field]) => {
              obj[field] = safeStr(row[colIdx])
            })

            const cnpjNorm = normalizeCNPJ(obj.cnpj)
            let status = 'ok', statusMsg = ''

            if (!obj.nome) {
              status = 'error'; statusMsg = 'Razão Social é obrigatória'
            } else if (cnpjNorm && existingCNPJs.has(cnpjNorm)) {
              status = 'dup_db'; statusMsg = 'CNPJ já existe na base'
            }

            return { ...obj, status, statusMsg, cnpjNorm }
          })

        // Segunda passagem: detectar duplicatas dentro do arquivo
        const cnpjCount = {}
        rows.forEach(r => { if (r.cnpjNorm) cnpjCount[r.cnpjNorm] = (cnpjCount[r.cnpjNorm] || 0) + 1 })
        rows.forEach(r => {
          if (r.status === 'ok' && r.cnpjNorm && cnpjCount[r.cnpjNorm] > 1) {
            r.status = 'dup_file'
            r.statusMsg = `CNPJ duplicado no arquivo (${cnpjCount[r.cnpjNorm]}×)`
          }
        })

        resolve({ rows, fieldMap })
      } catch (err) {
        reject(new Error('Formato de arquivo não reconhecido. Use .xlsx, .xls ou .csv.'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

function downloadTemplate() {
  // ── Aba 1: Dados ─────────────────────────────────────────────────────────
  const headers = [
    'Razão Social', 'CNPJ', 'Segmento', 'Regime Tributário',
    'Responsável CS', 'Honorário Mensal', 'Cidade/UF', 'Telefone', 'E-mail principal', 'Data de Abertura',
  ]
  const examples = [
    ['Alves & Filhos Ltda',  '12.345.678/0001-90', 'Comércio',    'Simples Nacional', 'Ana Lima',    'R$ 1.200', 'São Paulo / SP',      '(11) 98765-4321', 'contato@alvesfilhos.com.br',     '2018-01-15'],
    ['Oliveira Tecnologia',  '45.678.901/0001-23', 'Tecnologia',  'Lucro Presumido',  'Carlos Neto', 'R$ 3.500', 'Curitiba / PR',       '(41) 99321-4567', 'financeiro@oliveiratech.com.br', '2015-07-22'],
    ['Café da Maria ME',     '78.901.234/0001-56', 'Alimentação', 'MEI',              'Ana Lima',    'R$ 350',   'Florianópolis / SC',  '(48) 98765-0001', 'maria@cafedamaria.com',          ''          ],
  ]

  const wsDados = XLSX.utils.aoa_to_sheet([headers, ...examples])
  wsDados['!cols']       = [{ wch:26 },{ wch:20 },{ wch:14 },{ wch:20 },{ wch:16 },{ wch:16 },{ wch:20 },{ wch:17 },{ wch:32 },{ wch:16 }]
  wsDados['!autofilter'] = { ref: 'A1:J1' }
  wsDados['!freeze']     = { xSplit: 0, ySplit: 1 }

  // ── Aba 2: Instruções ─────────────────────────────────────────────────────
  const guide = [
    ['Konta — Modelo de importação de clientes'],
    ['Preencha a aba "Dados" seguindo as instruções abaixo. A primeira linha deve ser o cabeçalho. O sistema reconhece variações nos nomes das colunas.'],
    [],
    ['Campo', 'Obrigatório', 'Descrição', 'Formato / Valores aceitos', 'Exemplo'],
    ['Razão Social',      'Sim ★', 'Nome legal da empresa',                      'Texto livre',                                                   'Alves & Filhos Ltda'           ],
    ['CNPJ',              'Não',   'CNPJ da empresa — usado para detectar duplicatas', '00.000.000/0001-00  ou  apenas os dígitos',              '12.345.678/0001-90'            ],
    ['Segmento',          'Não',   'Ramo ou área de atuação',                    'Texto livre',                                                   'Comércio'                      ],
    ['Regime Tributário', 'Não',   'Enquadramento fiscal da empresa',             'Simples Nacional | Lucro Presumido | Lucro Real | MEI',        'Simples Nacional'              ],
    ['Responsável CS',    'Não',   'Analista de CS responsável pelo cliente',     'Texto livre',                                                   'Ana Lima'                      ],
    ['Honorário Mensal',  'Não',   'Mensalidade cobrada pelo escritório',         'Texto livre (ex: R$ 1.200)',                                     'R$ 1.200'                     ],
    ['Cidade/UF',         'Não',   'Município e estado do cliente',               'Texto livre',                                                   'São Paulo / SP'                ],
    ['Telefone',          'Não',   'Telefone ou WhatsApp principal',              '(XX) XXXXX-XXXX',                                              '(11) 98765-4321'               ],
    ['E-mail principal',  'Não',   'E-mail do contato principal',                 'endereco@dominio.com.br',                                      'contato@empresa.com.br'        ],
    ['Data de Abertura',  'Não',   'Data de abertura da empresa (Receita Federal)','AAAA-MM-DD  (ex: 2018-01-15)',                                 '2018-01-15'                    ],
    [],
    ['★  Razão Social é o único campo obrigatório. Linhas sem esse valor serão ignoradas na importação.'],
    ['   CNPJs duplicados (já existentes na base ou repetidos no arquivo) são sinalizados em amarelo na prévia.'],
  ]

  const wsInst = XLSX.utils.aoa_to_sheet(guide)
  wsInst['!cols']   = [{ wch:20 },{ wch:13 },{ wch:44 },{ wch:52 },{ wch:30 }]
  wsInst['!merges'] = [
    { s: { r:0,  c:0 }, e: { r:0,  c:4 } },
    { s: { r:1,  c:0 }, e: { r:1,  c:4 } },
    { s: { r:15, c:0 }, e: { r:15, c:4 } },
    { s: { r:16, c:0 }, e: { r:16, c:4 } },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsDados, 'Dados')
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções')
  XLSX.writeFile(wb, 'modelo_importacao_clientes.xlsx')
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ImportClientes({ open, onClose }) {
  const { clients, addClients } = useData()

  const [step,        setStep]       = useState('upload') // 'upload'|'parsing'|'preview'|'done'
  const [rows,        setRows]       = useState([])
  const [skipDupes,   setSkipDupes]  = useState(true)
  const [isDragOver,  setIsDragOver] = useState(false)
  const [parseError,  setParseError] = useState(null)
  const [fileName,    setFileName]   = useState('')
  const [importedCount, setImportedCount] = useState(0)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setStep('upload'); setRows([]); setParseError(null)
      setFileName(''); setIsDragOver(false); setSkipDupes(true)
    }
  }, [open])

  async function processFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx','xls','csv'].includes(ext)) {
      setParseError('Formato inválido. Use .xlsx, .xls ou .csv.')
      return
    }
    setFileName(file.name)
    setParseError(null)
    setStep('parsing')
    try {
      const { rows } = await parseSpreadsheet(file, clients)
      setRows(rows)
      setStep('preview')
    } catch (err) {
      setParseError(err.message)
      setStep('upload')
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleImport() {
    const toImport = rows.filter(r => {
      if (r.status === 'error') return false
      if (skipDupes && (r.status === 'dup_db' || r.status === 'dup_file')) return false
      return true
    })

    const now = new Date()
    const desde = `${MONTHS_SHORT[now.getMonth()]}/${now.getFullYear()}`

    const newClients = toImport.map(r => ({
      nome:     r.nome,
      cnpj:     r.cnpj    || '',
      seg:      r.seg     || '',
      regime:   r.regime  || 'Simples Nacional',
      cs:       r.cs      || 'Ana Lima',
      hon:      r.hon     || '',
      cidade:   r.cidade  || '',
      telefone: r.telefone|| '',
      email:    r.email   || '',
      col:    0,
      status: 'Saudável',
      desde,
      obs: '',
      abertura: r.abertura || null,
      contacts: null,
      socios: [],
    }))

    addClients(newClients)
    setImportedCount(newClients.length)
    setStep('done')
  }

  // Estatísticas
  const countOk    = rows.filter(r => r.status === 'ok').length
  const countDup   = rows.filter(r => r.status === 'dup_db' || r.status === 'dup_file').length
  const countErr   = rows.filter(r => r.status === 'error').length
  const toImportN  = rows.filter(r => r.status === 'ok' || (!skipDupes && (r.status === 'dup_db' || r.status === 'dup_file'))).length

  // Colunas que têm pelo menos um valor no dataset
  const activeCols = DISPLAY_COLS.filter(col => rows.some(r => r[col.field]))

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--rl)', width: '100%',
        maxWidth: step === 'preview' ? 980 : 520,
        margin: 'auto', transition: 'max-width .2s',
      }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <i className="ti ti-file-spreadsheet" style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Importar planilha de clientes</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>
                {step === 'upload'  && 'Selecione um arquivo .xlsx, .xls ou .csv'}
                {step === 'parsing' && 'Lendo arquivo…'}
                {step === 'preview' && `${rows.length} registro${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''} em ${fileName}`}
                {step === 'done'    && `${importedCount} cliente${importedCount !== 1 ? 's' : ''} importado${importedCount !== 1 ? 's' : ''} com sucesso`}
              </div>
            </div>
          </div>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginRight: 12 }}>
            {[['1', 'Upload'], ['2', 'Prévia'], ['3', 'Concluído']].map(([n, l], i) => {
              const stepIds = ['upload', 'preview', 'done']
              const currentIdx = stepIds.indexOf(step === 'parsing' ? 'upload' : step)
              const isActive   = i === currentIdx
              const isDone     = i < currentIdx
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600,
                      background: isDone ? 'var(--green)' : isActive ? 'var(--green-light)' : 'var(--bg2)',
                      color: isDone ? '#fff' : isActive ? 'var(--green)' : 'var(--text3)',
                      border: isActive ? '1.5px solid var(--green)' : '1px solid transparent',
                    }}>
                      {isDone ? <i className="ti ti-check" style={{ fontSize: 10 }} /> : n}
                    </div>
                    <span style={{ fontSize: 11, color: isActive ? 'var(--green)' : isDone ? 'var(--text2)' : 'var(--text3)', fontWeight: isActive ? 500 : 400 }}>{l}</span>
                  </div>
                  {i < 2 && <div style={{ width: 20, height: 1, background: 'var(--border)', margin: '0 4px' }} />}
                </div>
              )
            })}
          </div>

          <button onClick={onClose} style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 'var(--r)', padding: '4px 8px', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22 }}>

          {/* ── STEP: UPLOAD ── */}
          {(step === 'upload' || step === 'parsing') && (
            <>
              {parseError && (
                <div style={{ background: 'var(--red-light)', color: 'var(--red-dark)', border: '0.5px solid #F09595', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} /> {parseError}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => step !== 'parsing' && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--green)' : 'var(--border2)'}`,
                  borderRadius: 'var(--rl)', padding: '44px 20px', textAlign: 'center',
                  cursor: step === 'parsing' ? 'default' : 'pointer',
                  background: isDragOver ? 'var(--green-light)' : 'var(--bg2)',
                  transition: 'all .15s', marginBottom: 16,
                }}
              >
                {step === 'parsing' ? (
                  <div style={{ color: 'var(--text2)' }}>
                    <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', margin: '0 auto 12px', color: 'var(--green)', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Lendo arquivo…</div>
                  </div>
                ) : (
                  <>
                    <i className="ti ti-cloud-upload" style={{ fontSize: 36, display: 'block', margin: '0 auto 12px', color: isDragOver ? 'var(--green)' : 'var(--text3)' }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: isDragOver ? 'var(--green)' : 'var(--text)', marginBottom: 5 }}>
                      Arraste o arquivo aqui ou <span style={{ color: 'var(--green)', textDecoration: 'underline' }}>clique para selecionar</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      Suporta .xlsx, .xls e .csv — até 10 MB
                    </div>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              {/* Columns hint */}
              <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: '12px 14px', fontSize: 11, color: 'var(--text2)', marginBottom: 14 }}>
                <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-columns" style={{ fontSize: 13, color: 'var(--green)' }} /> Colunas reconhecidas (a primeira linha deve ser o cabeçalho):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
                  {['Razão Social *','CNPJ','Segmento','Regime Tributário','Responsável CS','Honorário Mensal','Cidade/UF','Telefone','E-mail principal','Data de abertura'].map(c => (
                    <span key={c} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 10.5, color: c.includes('*') ? 'var(--green-dark)' : 'var(--text2)', fontWeight: c.includes('*') ? 500 : 400 }}>{c}</span>
                  ))}
                </div>
              </div>

              {/* Template download */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text2)' }}>Não tem uma planilha?</span>
                <button
                  onClick={downloadTemplate}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 12, fontWeight: 500, textDecoration: 'underline', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <i className="ti ti-download" style={{ fontSize: 13 }} /> Baixar modelo
                </button>
              </div>
            </>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <>
              {/* Summary bar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <SummaryPill icon="ti-circle-check" bg="var(--green-light)" co="var(--green-dark)" count={countOk}  label="Novos" />
                <SummaryPill icon="ti-alert-triangle" bg="var(--amber-light)" co="var(--amber-dark)" count={countDup} label="Duplicados" />
                <SummaryPill icon="ti-alert-circle"   bg="var(--red-light)"   co="var(--red-dark)"   count={countErr} label="Com erro"  />
                <div style={{ flex: 1 }} />
                {countDup > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', userSelect: 'none' }}>
                    <div
                      onClick={() => setSkipDupes(!skipDupes)}
                      style={{ width: 32, height: 18, borderRadius: 9, background: skipDupes ? 'var(--green)' : 'var(--border2)', position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: skipDupes ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
                    </div>
                    Pular duplicados
                  </label>
                )}
              </div>

              {/* Preview table */}
              <div style={{ overflowX: 'auto', borderRadius: 'var(--rl)', border: '0.5px solid var(--border)', maxHeight: 420 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: activeCols.length * 110 }}>
                  <colgroup>
                    <col style={{ width: 36 }} />
                    {activeCols.map(c => <col key={c.field} style={{ minWidth: c.minWidth }} />)}
                  </colgroup>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr style={{ background: 'var(--bg2)' }}>
                      <th style={thStyle}></th>
                      {activeCols.map(c => <th key={c.field} style={thStyle}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const rowBg =
                        r.status === 'error'    ? '#FEF2F2' :
                        r.status === 'dup_db'   ? '#FFFBEB' :
                        r.status === 'dup_file' ? '#FFFBEB' : 'var(--bg)'

                      const shouldImport = r.status === 'ok' || (!skipDupes && (r.status === 'dup_db' || r.status === 'dup_file'))
                      const opaque = (r.status === 'error') || (skipDupes && (r.status === 'dup_db' || r.status === 'dup_file'))

                      return (
                        <tr key={i} style={{ background: rowBg, opacity: opaque ? 0.55 : 1 }}>
                          <td style={{ ...tdStyle, padding: '7px 8px', textAlign: 'center' }}>
                            <StatusIcon status={r.status} msg={r.statusMsg} />
                          </td>
                          {activeCols.map(c => (
                            <td key={c.field} style={{
                              ...tdStyle,
                              fontWeight: c.field === 'nome' ? 500 : 400,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              maxWidth: c.minWidth,
                            }}>
                              {r[c.field] || <span style={{ color: 'var(--text3)' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Duplicate warning box */}
              {countDup > 0 && (
                <div style={{ background: 'var(--amber-light)', border: '0.5px solid var(--amber)', borderRadius: 'var(--r)', padding: '9px 13px', fontSize: 12, color: 'var(--amber-dark)', marginTop: 12, display: 'flex', gap: 8 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} />
                  <span>
                    <strong>{countDup} registro{countDup !== 1 ? 's' : ''}</strong> com CNPJ duplicado (marcado{countDup !== 1 ? 's' : ''} em amarelo).{' '}
                    {skipDupes
                      ? 'Serão ignorados na importação. Desative "Pular duplicados" para incluí-los.'
                      : 'Serão importados mesmo assim — podem criar duplicatas na base.'}
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--green)' }}>
                <i className="ti ti-circle-check" style={{ fontSize: 28 }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>
                Importação concluída!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                <strong style={{ color: 'var(--green)' }}>{importedCount} cliente{importedCount !== 1 ? 's' : ''}</strong> adicionado{importedCount !== 1 ? 's' : ''} à base com sucesso.
              </div>
              {rows.filter(r => r.status === 'error').length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {rows.filter(r => r.status === 'error').length} registro{rows.filter(r => r.status === 'error').length !== 1 ? 's' : ''} ignorado{rows.filter(r => r.status === 'error').length !== 1 ? 's' : ''} por erro.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {step === 'preview' && `${toImportN} de ${rows.length} registros serão importados`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'preview' && (
              <button onClick={() => setStep('upload')} style={btnStyle}>
                <i className="ti ti-arrow-left" style={{ fontSize: 12 }} /> Voltar
              </button>
            )}
            {step === 'upload' && (
              <button onClick={onClose} style={btnStyle}>Cancelar</button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleImport}
                disabled={toImportN === 0}
                style={{ ...btnPrimary, opacity: toImportN === 0 ? 0.5 : 1, cursor: toImportN === 0 ? 'not-allowed' : 'pointer' }}
              >
                <i className="ti ti-database-import" style={{ fontSize: 13 }} />
                Importar {toImportN} cliente{toImportN !== 1 ? 's' : ''}
              </button>
            )}
            {step === 'done' && (
              <button onClick={onClose} style={btnPrimary}>
                <i className="ti ti-check" style={{ fontSize: 12 }} /> Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function SummaryPill({ icon, bg, co, count, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: bg, borderRadius: 'var(--r)', padding: '5px 10px' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 13, color: co }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: co }}>{count}</span>
      <span style={{ fontSize: 11, color: co, opacity: .8 }}>{label}</span>
    </div>
  )
}

function StatusIcon({ status, msg }) {
  const configs = {
    ok:       { icon: 'ti-circle-check', color: 'var(--green)', title: 'Novo registro' },
    dup_db:   { icon: 'ti-alert-triangle', color: 'var(--amber)', title: msg },
    dup_file: { icon: 'ti-copy-x',       color: 'var(--amber)', title: msg },
    error:    { icon: 'ti-circle-x',     color: 'var(--red)',   title: msg },
  }
  const cfg = configs[status] || configs.ok
  return (
    <span title={cfg.title} style={{ cursor: 'help' }}>
      <i className={`ti ${cfg.icon}`} style={{ fontSize: 14, color: cfg.color }} />
    </span>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const thStyle  = { textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text2)', padding: '8px 10px', borderBottom: '0.5px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }
const tdStyle  = { padding: '8px 10px', fontSize: 12, color: 'var(--text)', borderBottom: '0.5px solid var(--border)' }
const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 'var(--r)', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--border2)', background: 'transparent', color: 'var(--text)' }
const btnPrimary = { ...btnStyle, background: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }
