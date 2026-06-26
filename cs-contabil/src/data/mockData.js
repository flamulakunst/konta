export const TODAY = new Date(2026, 5, 24)

export const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const DOWS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

export const COL_NAMES = [
  'Onboarding — Contrato de Prestação de Serviço',
  'Onboarding — Reunião',
  'Onboarding — Transferência de Contabilidade',
  'BPO — Implementação de Sistema',
  'Rescisão de Contrato',
]
export const COL_DOTS = ['#2E7DD1','#378ADD','#1D9E75','#EF9F27','#E24B4A']

export const AV_BG = ['#E1F5EE','#E6F1FB','#EEEDFE','#FAEEDA','#FAECE7']
export const AV_CO = ['#085041','#0C447C','#3C3489','#633806','#712B13']

export const PERMS = {
  admin:       { canEdit: true,  canDelete: true,  canManageUsers: true,  canExport: true,  canConfig: true  },
  cs:          { canEdit: true,  canDelete: false, canManageUsers: false, canExport: true,  canConfig: false },
  visualizador:{ canEdit: false, canDelete: false, canManageUsers: false, canExport: false, canConfig: false },
}

export const ROLE_LABELS = {
  admin: { label: 'Admin', color: 'purple' },
  cs: { label: 'CS', color: 'green' },
  visualizador: { label: 'Visualizador', color: 'blue' },
}

export const MOCK_USERS = [
  { id: 1, nome: 'Admin',          email: 'admin@konta.com.br', senha: 'admin123',  perfil: 'admin',        ativo: true,  ultimo: '24/06/2026 09:14', av: 'AD', avBg: '#EEEDFE', avCo: '#3C3489' },
  { id: 2, nome: 'Ana Lima',       email: 'ana@konta.com.br',   senha: 'cs123',     perfil: 'cs',           ativo: true,  ultimo: '24/06/2026 08:50', av: 'AL', avBg: '#E1F5EE', avCo: '#085041' },
  { id: 3, nome: 'Carlos Neto',    email: 'carlos@konta.com.br',senha: 'cs456',     perfil: 'cs',           ativo: true,  ultimo: '23/06/2026 17:30', av: 'CN', avBg: '#E1F5EE', avCo: '#085041' },
  { id: 4, nome: 'Beatriz Souza',  email: 'beatriz@konta.com.br',senha: 'cs789',   perfil: 'cs',           ativo: false, ultimo: '20/06/2026 14:00', av: 'BS', avBg: '#E1F5EE', avCo: '#085041' },
  { id: 5, nome: 'Visualizador',   email: 'vis@konta.com.br',   senha: 'view123',   perfil: 'visualizador', ativo: true,  ultimo: '22/06/2026 11:00', av: 'VZ', avBg: '#E6F1FB', avCo: '#0C447C' },
]

export const MOCK_CLIENTS = [
  {
    id:1, nome:'Alves & Filhos Ltda', cnpj:'12.345.678/0001-90', seg:'Comércio',
    regime:'Simples Nacional', cs:'Ana Lima', hon:'R$ 1.200', cidade:'São Paulo / SP',
    col:3, status:'Saudável', desde:'Jan/2023', obs:'',
    contacts: {
      dp:         { nome:'Carla Santos',   email:'dp@alvesfilhos.com.br',          telefone:'(11) 98765-4321', cargo:'Assistente DP'       },
      fiscal:     { nome:'Roberto Alves',  email:'fiscal@alvesfilhos.com.br',      telefone:'(11) 98765-1234', cargo:'Contador Interno'    },
      financeiro: { nome:'Marcia Lima',    email:'financeiro@alvesfilhos.com.br',  telefone:'(11) 97654-3210', cargo:'Gerente Financeiro'  },
    },
    socios: [
      { id:1, nome:'Ricardo Alves',  cpf:'123.456.789-01', rg:'12.345.678-9', nascimento:'1975-07-10', email:'ricardo@alvesfilhos.com.br',  celular:'(11) 99999-0001' },
      { id:2, nome:'Fernanda Alves', cpf:'321.654.987-00', rg:'32.165.498-7', nascimento:'1978-09-20', email:'fernanda@alvesfilhos.com.br', celular:'(11) 99999-0002' },
    ],
    abertura: '2018-01-15',
    mainContact: { type: 'socio', id: 1 },
  },
  {
    id:2, nome:'TechFlex Soluções', cnpj:'98.765.432/0001-11', seg:'Tecnologia',
    regime:'Lucro Presumido', cs:'Carlos Neto', hon:'R$ 2.800', cidade:'Campinas / SP',
    col:2, status:'Agendado', desde:'Mai/2026', obs:'Reunião diagnóstico em 26/06.',
    contacts: {
      dp:         { nome:'Lucas Gomes',    email:'dp@techflex.com.br',         telefone:'(19) 99876-5432', cargo:'Analista RH'         },
      fiscal:     { nome:'Fernanda Costa', email:'fiscal@techflex.com.br',     telefone:'(19) 99876-1234', cargo:'Coordenadora Fiscal'  },
      financeiro: { nome:'',              email:'',                            telefone:'',               cargo:''                   },
    },
    socios: [
      { id:1, nome:'Fernanda Costa',  cpf:'456.789.012-34', rg:'45.678.901-2', nascimento:'1982-11-05', email:'fernanda.ceo@techflex.com.br', celular:'(19) 98888-0001' },
      { id:2, nome:'Thiago Martins',  cpf:'567.890.123-45', rg:'56.789.012-3', nascimento:'1980-08-14', email:'thiago@techflex.com.br',       celular:'(19) 98888-0002' },
    ],
    abertura: '2023-04-10',
    mainContact: { type: 'sector', key: 'fiscal' },
  },
  { id:3, nome:'Mendes Comércio',       cnpj:'11.222.333/0001-44', seg:'Varejo',           regime:'Simples Nacional',  cs:'Ana Lima',      hon:'R$ 1.100', cidade:'São Paulo / SP',       col:4, status:'Em risco',  desde:'Mar/2021', obs:'Certificado e-CNPJ vencido.',   contacts:null, socios:[], abertura: '2014-06-24', mainContact: null },
  { id:4, nome:'Rodrigues Construtora', cnpj:'55.666.777/0001-88', seg:'Construção civil', regime:'Lucro Presumido',   cs:'Beatriz Souza', hon:'R$ 1.800', cidade:'Rio de Janeiro / RJ',  col:1, status:'Atrasado', desde:'Jun/2026', obs:'Docs pendentes há 10 dias.',     contacts:null, socios:[], abertura: '2020-06-25', mainContact: null },
  { id:5, nome:'Prime Serviços',        cnpj:'22.333.444/0001-55', seg:'Serviços',         regime:'Lucro Presumido',   cs:'Carlos Neto',   hon:'R$ 2.200', cidade:'São Paulo / SP',       col:3, status:'Saudável', desde:'Ago/2022', obs:'',                              contacts:null, socios:[], abertura: '2017-06-26', mainContact: null },
  { id:6, nome:'Sol Alimentos',         cnpj:'33.444.555/0001-66', seg:'Alimentação',      regime:'Simples Nacional',  cs:'Ana Lima',      hon:'R$ 1.050', cidade:'Belo Horizonte / MG',  col:2, status:'Revisão',  desde:'Abr/2025', obs:'',                              contacts:null, socios:[], abertura: '2019-07-05', mainContact: null },
  { id:7, nome:'Rede Farma Plus',       cnpj:'44.555.666/0001-77', seg:'Farmácia',         regime:'Lucro Presumido',   cs:'Carlos Neto',   hon:'R$ 3.200', cidade:'Curitiba / PR',        col:3, status:'Aprovando',desde:'Nov/2024', obs:'',                              contacts:null, socios:[], abertura: '2015-11-20', mainContact: null },
  { id:8, nome:'Logística Bravo',       cnpj:'66.777.888/0001-99', seg:'Logística',        regime:'Lucro Real',        cs:'Ana Lima',      hon:'R$ 1.400', cidade:'Porto Alegre / RS',    col:2, status:'Revisão',  desde:'Jul/2025', obs:'',                              contacts:null, socios:[], abertura: '2021-03-08', mainContact: null },
]

export const MOCK_KANBAN = [
  { id:1,  col:0, nome:'Nova Gestão ME',       seg:'Contábil', cs:'Ana Lima',      status:'No prazo', data:'20/06', hon:'R$ 900',   obs:'', warn:false, alert:false },
  { id:2,  col:0, nome:'Impacto Trade',         seg:'Full',     cs:'Carlos Neto',   status:'Agendado', data:'22/06', hon:'R$ 2.500', obs:'', warn:false, alert:false },
  { id:3,  col:1, nome:'Rodrigues Const.',      seg:'Full',     cs:'Beatriz Souza', status:'Atrasado', data:'01/06', hon:'R$ 1.800', obs:'Docs pendentes.', warn:true, alert:false },
  { id:4,  col:1, nome:'Vitória Eventos',       seg:'Contábil', cs:'Ana Lima',      status:'No prazo', data:'10/06', hon:'R$ 950',   obs:'', warn:false, alert:false },
  { id:5,  col:2, nome:'TechFlex Soluções',     seg:'Full',     cs:'Carlos Neto',   status:'Agendado', data:'26/06', hon:'R$ 2.800', obs:'', warn:false, alert:false },
  { id:6,  col:2, nome:'Sol Alimentos',         seg:'Fiscal',   cs:'Ana Lima',      status:'Revisão',  data:'15/06', hon:'R$ 1.050', obs:'', warn:false, alert:false },
  { id:7,  col:3, nome:'Rede Farma Plus',       seg:'Full',     cs:'Carlos Neto',   status:'Aprovando',data:'10/06', hon:'R$ 3.200', obs:'', warn:false, alert:false },
  { id:8,  col:3, nome:'Delta Comércio',        seg:'Contábil', cs:'Ana Lima',      status:'Revisão',  data:'08/06', hon:'R$ 1.300', obs:'', warn:false, alert:false },
  { id:9,  col:3, nome:'Alves & Filhos',        seg:'Contábil', cs:'Ana Lima',      status:'Saudável', data:'15/06', hon:'R$ 1.200', obs:'', warn:false, alert:false },
  { id:10, col:3, nome:'Prime Serviços',        seg:'Full',     cs:'Carlos Neto',   status:'Saudável', data:'10/06', hon:'R$ 2.200', obs:'', warn:false, alert:false },
  { id:11, col:3, nome:'Mendes Comércio',       seg:'Varejo',   cs:'Ana Lima',      status:'Saudável', data:'08/06', hon:'R$ 1.100', obs:'Cert. vencendo.', warn:true, alert:false },
  { id:12, col:4, nome:'Constru Center',        seg:'Contábil', cs:'Beatriz Souza', status:'Quente',   data:'01/06', hon:'R$ 1.200', obs:'', warn:false, alert:false },
  { id:13, col:4, nome:'Mendes Indústria',      seg:'Full',     cs:'Carlos Neto',   status:'Em risco', data:'20/05', hon:'R$ 2.800', obs:'Insatisfeito com prazo.', warn:false, alert:true },
]

export const MOCK_TASKS = [
  { id:1, desc:'Enviar proposta de renovação',    cli:'Alves & Filhos',       resp:'Ana Lima',      data:new Date(2026,5,24), prio:'alta',  tipo:'Renovação',           done:false },
  { id:2, desc:'Agendar diagnóstico inicial',     cli:'TechFlex Soluções',    resp:'Carlos Neto',   data:new Date(2026,5,26), prio:'media', tipo:'Reunião',             done:false },
  { id:3, desc:'Verificar certificado e-CNPJ',   cli:'Mendes Comércio',      resp:'Ana Lima',      data:new Date(2026,5,30), prio:'alta',  tipo:'Certificado digital', done:false },
  { id:4, desc:'Follow-up onboarding pendente',  cli:'Rodrigues Construtora',resp:'Beatriz Souza', data:new Date(2026,5,27), prio:'media', tipo:'Follow-up',           done:false },
  { id:5, desc:'Reunião de plano de ação',        cli:'Sol Alimentos',        resp:'Ana Lima',      data:new Date(2026,5,28), prio:'baixa', tipo:'Reunião',             done:false },
  { id:6, desc:'Enviar relatório contábil maio',  cli:'Prime Serviços',       resp:'Carlos Neto',   data:new Date(2026,5,20), prio:'alta',  tipo:'Envio de documento',  done:true  },
  { id:7, desc:'Cobrar documentos faltantes',    cli:'Vitória Eventos',      resp:'Beatriz Souza', data:new Date(2026,5,22), prio:'alta',  tipo:'Follow-up',           done:false },
]

export const MOCK_BIRTHDAYS = [
  { nome:'Ricardo Alves',   emp:'Alves & Filhos · Sócio',      dia:24, mes:5 },
  { nome:'Fernanda Costa',  emp:'TechFlex · Sócia',            dia:26, mes:5 },
  { nome:'Paulo Mendes',    emp:'Mendes Comércio · Dono',      dia:28, mes:5 },
  { nome:'Lucia Rodrigues', emp:'Rodrigues Const. · Dona',     dia:3,  mes:6 },
  { nome:'Carlos Bravo',    emp:'Logística Bravo · Sócio',     dia:10, mes:6 },
  { nome:'Amanda Silva',    emp:'Prime Serviços · Sócia',      dia:18, mes:6 },
  { nome:'Jorge Neves',     emp:'Nuvem Digital · Dono',        dia:22, mes:6 },
]

export const MOCK_CERTS = [
  { id:1, emp:'Mendes Comércio',      tipo:'e-CNPJ A3', tit:'Paulo Mendes',     emissao:new Date(2023,5,18), venc:new Date(2026,5,18), obs:'Token no cofre.' },
  { id:2, emp:'Sol Alimentos',         tipo:'e-CPF A1',  tit:'Marcos Teles',     emissao:new Date(2024,2,22), venc:new Date(2026,5,22), obs:'' },
  { id:3, emp:'TechFlex Soluções',     tipo:'e-CNPJ A1', tit:'Fernanda Costa',   emissao:new Date(2024,6,10), venc:new Date(2026,6,10), obs:'' },
  { id:4, emp:'Alves & Filhos',        tipo:'e-CNPJ A3', tit:'Ricardo Alves',    emissao:new Date(2024,6,14), venc:new Date(2026,6,14), obs:'Token com cliente.' },
  { id:5, emp:'Rodrigues Construtora', tipo:'e-CNPJ A3', tit:'Lucia Rodrigues',  emissao:new Date(2024,7,12), venc:new Date(2026,7,12), obs:'' },
  { id:6, emp:'Prime Serviços',        tipo:'e-CPF A1',  tit:'Amanda Silva',     emissao:new Date(2024,8,20), venc:new Date(2026,8,20), obs:'' },
  { id:7, emp:'Logística Bravo',       tipo:'e-CNPJ A1', tit:'Carlos Bravo',     emissao:new Date(2024,10,15),venc:new Date(2026,10,15),obs:'' },
  { id:8, emp:'Oliveira & Cia',        tipo:'e-CNPJ A1', tit:'Fernando Oliveira',emissao:new Date(2025,0,10), venc:new Date(2027,0,10), obs:'' },
]
