function escapeCell(value: string): string {
  if (!/[",\n]/.test(value)) return value

  return `"${value.replace(/"/g, '""')}"`
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map(cells => cells.map(escapeCell).join(','))

  return lines.join('\n')
}