
export default function Imigongo({ height = 14 }: { height?: number }) {
  const rows = [0, 3, 6, 9]
  return (
    <svg width="100%" height={height} aria-hidden="true" focusable="false"
         style={{ display: 'block' }}>
      <defs>
        <pattern id="imigongo" width="14" height={height} patternUnits="userSpaceOnUse">
          <rect width="14" height={height} fill="var(--imigongo-white)" />
          {rows.map(offset => (
            <polyline key={offset}
                      points={`0,${height - offset} 7,${height - offset - 7} 14,${height - offset}`}
                      fill="none" stroke="var(--imigongo-black)" strokeWidth="1.1" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#imigongo)" />
    </svg>
  )
}
