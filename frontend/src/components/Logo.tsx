export default function Logo({ size = 28, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="11" fill="none" stroke="var(--imigongo-black)" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.2" fill="var(--primary)" />
        {[0, 90, 180, 270].map(angle => (
          <g key={angle} transform={`rotate(${angle} 16 16)`}>
            <path d="M16 5.5 L18.4 2.2 L13.6 2.2 Z" fill="var(--imigongo-black)" />
            <rect x="15" y="7.4" width="2" height="5" rx="1" fill="var(--imigongo-black)" />
          </g>
        ))}
      </svg>
      {showWord && (
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: size * 0.82,
                       letterSpacing: '-0.01em' }}>
          fasha
          <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                         background: 'var(--primary)', marginLeft: 4, verticalAlign: 'middle' }} />
        </span>
      )}
    </span>
  )
}
