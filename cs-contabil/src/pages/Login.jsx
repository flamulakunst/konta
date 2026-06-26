import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!email || !senha) return
    setLoading(true); setError('')
    const result = await login(email.trim().toLowerCase(), senha)
    if (!result.ok) setError(result.msg)
    setLoading(false)
  }

  function fill(e, s) { setEmail(e); setSenha(s); setError('') }

  const labelStyle = { fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }
  const inputStyle = { width: '100%', padding: '9px 36px', border: '0.5px solid var(--border2)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FA', padding: 20 }}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--rl)', padding: '36px 32px', width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1B4F8A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B5D4F4', fontSize: 20 }}>
            <i className="ti ti-building-bank" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Konta</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>Customer Success</div>
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', textAlign: 'center', marginBottom: 4 }}>Entrar na plataforma</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 24 }}>Acesso restrito a usuários autorizados</div>

        {/* Error */}
        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red-dark)', border: '0.5px solid #F09595', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 15 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-mail" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text3)', pointerEvents: 'none' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} />
            </div>
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: 'relative' }}>
              <i className="ti ti-lock" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text3)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
                <i className={`ti ${showPw ? 'ti-eye-off' : 'ti-eye'}`} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: 'auto' }} /> Lembrar acesso
            </label>
            <span style={{ fontSize: 12, color: '#2E7DD1', cursor: 'pointer' }}>Esqueci a senha</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 10, background: loading ? '#7BA7CC' : '#1B4F8A', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            <i className="ti ti-login" />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Demo hints */}
        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: '12px 14px', marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Acessos de demonstração — clique para preencher
          </div>
          {[
            { email: 'admin@konta.com.br', senha: 'admin123', label: 'Admin',        variant: '#3C3489',           bg: '#EEEDFE',           icon: 'ti-shield' },
            { email: 'ana@konta.com.br',   senha: 'cs123',    label: 'CS',           variant: 'var(--green-dark)', bg: 'var(--green-light)', icon: 'ti-users' },
            { email: 'vis@konta.com.br',   senha: 'view123',  label: 'Visualizador', variant: 'var(--blue-dark)',  bg: 'var(--blue-light)',  icon: 'ti-eye' },
          ].map(h => (
            <div
              key={h.email}
              onClick={() => fill(h.email, h.senha)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1 }}>
                <i className={`ti ${h.icon}`} style={{ fontSize: 12, marginRight: 3 }} />{h.email}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, background: h.bg, color: h.variant }}>
                {h.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
