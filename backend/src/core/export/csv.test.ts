import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('writing a CSV', () => {
  it('puts the header first and one line per row', () => {
    expect(toCsv(['Name', 'Hours'], [['Amara', '4'], ['Keza', '2.5']])).toBe('Name,Hours\nAmara,4\nKeza,2.5')
  })

  it('quotes a cell with a comma, a quote or a line break in it', () => {
    const csv = toCsv(['Title'], [['Clean up, then plant'], ['The "big" day'], ['Two\nlines']])

    expect(csv.split('\n').slice(1, 3)).toEqual(['"Clean up, then plant"', '"The ""big"" day"'])
    expect(csv.endsWith('"Two\nlines"')).toBe(true)
  })

  it('stops a cell running as a formula when the file is opened', () => {
    const csv = toCsv(['Title'], [
      ['=HYPERLINK("https://example.invalid","Open")'],
      ['+250 788 000 000'],
      ['-cmd'],
      ['@SUM(A1:A2)'],
    ])

    expect(csv.split('\n').slice(1)).toEqual([
      '"\'=HYPERLINK(""https://example.invalid"",""Open"")"',
      "'+250 788 000 000",
      "'-cmd",
      "'@SUM(A1:A2)",
    ])
  })

  it('leaves plain numbers alone, negative ones included', () => {
    expect(toCsv(['Change'], [['-3'], ['+2'], ['4.75']])).toBe('Change\n-3\n+2\n4.75')
  })

  it('leaves ordinary text alone', () => {
    expect(toCsv(['Where'], [['Kimironko'], ['2026-11-14']])).toBe('Where\nKimironko\n2026-11-14')
  })
})
