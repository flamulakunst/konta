import { avInitials, avColors } from '../../utils/helpers'

export default function Avatar({ nome, size = 28, style }) {
  const { bg, co } = avColors(nome)
  return (
    <span style={{
      width: size, height: size, minWidth: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 500, background: bg, color: co,
      verticalAlign: 'middle',
      ...style,
    }}>
      {avInitials(nome)}
    </span>
  )
}
