/**
 * Reads what core/export/csv.ts on the server writes: a value is quoted only
 * when it holds a quote, a comma or a line break, and a quote inside is
 * doubled. Line breaks inside quotes belong to the value.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

// The server puts an apostrophe in front of anything a spreadsheet would run
// as a formula. That is for Excel; here the value is read as text, and a title
// has to come back exactly as it was typed to be matched against its row.
function unguarded(cell: string): string {
  return /^'[=+\-@\t\r]/.test(cell) ? cell.slice(1) : cell
}

/** One object per row, keyed by the header, so columns can move without breaking this. */
export function recordsOf(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text.replace(/^\uFEFF/, ''))

  if (!header) return []

  return rows
    .filter(cells => cells.some(cell => cell !== ''))
    .map(cells => Object.fromEntries(header.map((name, index) => [name, unguarded(cells[index] ?? '')])))
}
