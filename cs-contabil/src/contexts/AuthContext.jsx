import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_USERS, PERMS } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Tenta restaurar sessão do localStorage (modo mock) ou do Supabase
  useEffect(() => {
    const saved = localStorage.getItem('cs_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [])

  async function login(email, senha) {
    // Tenta autenticação real pelo Supabase primeiro
    const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({ email, password: senha }).catch(() => ({ data: null, error: true }))

    if (sbData?.user && !sbError) {
      const profile = {
        id: sbData.user.id,
        nome: sbData.user.user_metadata?.nome || email.split('@')[0],
        email,
        perfil: sbData.user.user_metadata?.perfil || 'visualizador',
        ativo: true,
        av: (sbData.user.user_metadata?.nome || email).split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase(),
        avBg: '#E1F5EE',
        avCo: '#085041',
      }
      const withPerms = { ...profile, perms: PERMS[profile.perfil] }
      setUser(withPerms)
      localStorage.setItem('cs_user', JSON.stringify(withPerms))
      return { ok: true }
    }

    // Fallback: autenticação mock para demonstração
    const mockUser = MOCK_USERS.find(u => u.email === email.toLowerCase() && u.senha === senha)
    if (!mockUser) return { ok: false, msg: 'E-mail ou senha incorretos.' }
    if (!mockUser.ativo) return { ok: false, msg: 'Usuário inativo. Contate o administrador.' }

    const withPerms = { ...mockUser, perms: PERMS[mockUser.perfil] }
    setUser(withPerms)
    localStorage.setItem('cs_user', JSON.stringify(withPerms))
    return { ok: true }
  }

  function logout() {
    supabase.auth.signOut().catch(() => {})
    setUser(null)
    localStorage.removeItem('cs_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
