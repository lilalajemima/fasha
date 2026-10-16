export default function ImigongoBand({ height = 18 }: { height?: number }) {
  return (
    <svg className="imigongo" height={height} width="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="imigongo-chevron" width={height * 2} height={height}
                 patternUnits="userSpaceOnUse">
          <rect width={height * 2} height={height} fill="var(--imigongo-white)" />
          <path d={`M0 ${height} L${height / 2} 0 L${height} ${height} L${height * 1.5} 0 L${height * 2} ${height} Z`}
                fill="var(--imigongo-black)" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="url(#imigongo-chevron)" />
    </svg>
  )
}
