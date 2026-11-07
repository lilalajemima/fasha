export default function Logo({ size = 28, showWord = true }: {
  size?: number
  showWord?: boolean
}) {
  if (!showWord) return null

  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: size * 0.82,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      fasha
      <span
        style={{
          display: 'inline-block',
          width: Math.max(Math.round(size * 0.17), 4),
          height: Math.max(Math.round(size * 0.17), 4),
          borderRadius: '50%',
          background: 'var(--primary)',
          marginLeft: 5,
        }}
      />
    </span>
  )
}
