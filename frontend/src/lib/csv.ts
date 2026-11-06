/**
 * A small RFC 4180 reader, for showing a downloaded report before it is saved.
 *
 * Splitting on commas is not enough: a place called "Kimironko, Kigali" is one
 * field written "Kimironko, Kigali", and a quote inside a field is doubled. The
 * parser walks the text once and tracks whether it is inside quotes.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  // A file written on Windows ends its lines with \r\n; drop the \r so it does
  // not end up at the end of every last field.
  const body = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let at = 0; at < body.length; at += 1) {
    const char = body[at]

    if (quoted) {
      if (char === '"') {
        if (body[at + 1] === '"') {
          field += '"'
          at += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }

      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  // Whatever is left after the last newline, unless the file ended on one.
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
