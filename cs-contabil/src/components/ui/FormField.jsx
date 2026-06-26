export function FormGrid({ children, style }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, ...style }}>
      {children}
    </div>
  )
}

export function FormRow({ label, full, children }) {
  return (
    <div style={{ gridColumn: full ? '1/-1' : undefined, marginBottom: 0 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 }}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '0.5px solid var(--border2)',
  borderRadius: 'var(--r)', fontSize: 12, color: 'var(--text)', background: 'var(--bg)', outline: 'none',
}

export function Input({ style, ...props }) {
  return <input style={{ ...inputStyle, ...style }} {...props} />
}

export function Select({ children, style, ...props }) {
  return <select style={{ ...inputStyle, ...style }} {...props}>{children}</select>
}

export function Textarea({ style, ...props }) {
  return <textarea style={{ ...inputStyle, resize: 'none', height: 72, ...style }} {...props} />
}
