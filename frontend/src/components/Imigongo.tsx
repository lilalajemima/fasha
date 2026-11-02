export default function Imigongo({ height = 14, tone = 'ink' }: {
  height?: number
  tone?: 'ink' | 'light'
}) {
  const rows = [0, 3, 6, 9]
  const id = `imigongo-${tone}-${height}`
  const stroke = tone === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'var(--imigongo-black)'

  return (
    <svg width="100%" height={height} aria-hidden="true" focusable="false"
         style={{ display: 'block' }}>
      <defs>
        <pattern id={id} width="14" height={height} patternUnits="userSpaceOnUse">
          {tone === 'ink' && <rect width="14" height={height} fill="var(--imigongo-white)" />}
          {rows.map(offset => (
            <polyline key={offset}
                      points={`0,${height - offset} 7,${height - offset - 7} 14,${height - offset}`}
                      fill="none" stroke={stroke} strokeWidth="1.1" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  )
}