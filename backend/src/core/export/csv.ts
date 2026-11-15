// Excel and Sheets run a cell that starts with one of these as a formula, so a
// title like =HYPERLINK(...) typed by anybody would run on the admin's
// computer. A leading apostrophe makes it plain text. Plain numbers, negative
// ones included, are left as they are.
const FORMULA_START = /^[=+\-@\t\r]/
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/

function escapeCell(raw: string): string {
  const value = FORMULA_START.test(raw) && !PLAIN_NUMBER.test(raw) ? `'${raw}` : raw

  if (!/[",\n]/.test(value)) return value

  return `"${value.replace(/"/g, '""')}"`
}

export function toCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map(cells => cells.map(escapeCell).join(','))

  return lines.join('\n')
}