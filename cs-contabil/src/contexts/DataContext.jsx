import { createContext, useContext, useState } from 'react'
import {
  MOCK_CLIENTS, MOCK_KANBAN, MOCK_TASKS, MOCK_BIRTHDAYS, MOCK_CERTS, MOCK_USERS, TODAY
} from '../data/mockData'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [clients, setClients]     = useState(MOCK_CLIENTS)
  const [kanban, setKanban]       = useState(MOCK_KANBAN)
  const [tasks, setTasks]         = useState(MOCK_TASKS)
  const [certs, setCerts]         = useState(MOCK_CERTS)
  const [appUsers, setAppUsers]   = useState(MOCK_USERS)

  // birthdays = contatos fixos + sócios com nascimento + aniversários de fundação das empresas
  const birthdays = [
    ...MOCK_BIRTHDAYS,
    ...clients.flatMap(c =>
      (c.socios || [])
        .filter(s => s.nascimento)
        .map(s => {
          const parts = s.nascimento.split('-')
          return { nome: s.nome, emp: `${c.nome} · Sócio`, dia: parseInt(parts[2]), mes: parseInt(parts[1]) - 1 }
        })
    ),
    ...clients.filter(c => c.abertura).map(c => {
      const [anoAb, mesAb, diaAb] = c.abertura.split('-').map(Number)
      return { nome: c.nome, emp: 'Aniversário de fundação', dia: diaAb, mes: mesAb - 1, tipo: 'empresa', anoAbertura: anoAb }
    }),
  ]

  const nextId = (list) => Math.max(...list.map(x => x.id), 0) + 1

  function addClient(data)  { setClients(p => [...p, { ...data, id: nextId(p) }]) }
  function editClient(data) { setClients(p => p.map(c => c.id === data.id ? data : c)) }
  function delClient(id)    { setClients(p => p.filter(c => c.id !== id)) }

  function addClients(list) {
    setClients(prev => {
      let maxId = Math.max(...prev.map(c => c.id), 0)
      const newOnes = list.map(c => ({ ...c, id: ++maxId }))
      return [...prev, ...newOnes]
    })
  }

  function moveCard(id, col) {
    setKanban(p => p.map(c => c.id === id ? { ...c, col } : c))
  }
  function addKanbanCard(data) { setKanban(p => [...p, { ...data, id: nextId(p) }]) }

  function addTask(data)    { setTasks(p => [...p, { ...data, id: nextId(p), done: false }]) }
  function toggleTask(id)   { setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function delTask(id)      { setTasks(p => p.filter(t => t.id !== id)) }

  function addCert(data)    { setCerts(p => [...p, { ...data, id: nextId(p) }]) }
  function delCert(id)      { setCerts(p => p.filter(c => c.id !== id)) }

  function addUser(data)    { setAppUsers(p => [...p, { ...data, id: nextId(p), ativo: true, ultimo: '-' }]) }
  function toggleUser(id)   { setAppUsers(p => p.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u)) }

  return (
    <DataContext.Provider value={{
      clients, addClient, editClient, delClient, addClients,
      kanban, moveCard, addKanbanCard,
      tasks, addTask, toggleTask, delTask,
      birthdays,
      certs, addCert, delCert,
      appUsers, addUser, toggleUser,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
