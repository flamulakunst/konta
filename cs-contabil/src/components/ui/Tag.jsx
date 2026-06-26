const VARIANTS = {
  green:  { background: 'var(--green-light)', color: 'var(--green-dark)' },
  amber:  { background: 'var(--amber-light)', color: 'var(--amber-dark)' },
  red:    { background: 'var(--red-light)',   color: 'var(--red-dark)'   },
  blue:   { background: 'var(--blue-light)',  color: 'var(--blue-dark)'  },
  gray:   { background: 'var(--bg2)',         color: 'var(--text2)'      },
  purple: { background: 'var(--purple-light)',color: 'var(--purple-dark)'},
}

export default function Tag({ variant = 'gray', children, style }) {
  const s = VARIANTS[variant] || VARIANTS.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10,
      padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap',
      ...s, ...style,
    }}>
      {children}
    </span>
  )
}
