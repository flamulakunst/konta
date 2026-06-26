import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer, maxWidth = 480 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
        zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg)', borderRadius: 'var(--rl)', padding: 22,
        width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '0.5px solid var(--border2)', borderRadius: 'var(--r)', padding: '4px 8px', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center' }}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} />
          </button>
        </div>
        {children}
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
