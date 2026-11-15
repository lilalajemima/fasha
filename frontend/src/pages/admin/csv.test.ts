import { describe, expect, it } from 'vitest'
import { parseCsv, recordsOf } from './csv'

describe('reading the CSV the server sends', () => {
  it('splits rows and cells', () => {
    expect(parseCsv('Name,Hours\nAmara,4\nKeza,2.5')).toEqual([['Name', 'Hours'], ['Amara', '4'], ['Keza', '2.5']])
  })

  it('reads quoted cells with commas, doubled quotes and line breaks in them', () => {
    expect(parseCsv('Title\n"Clean up, then plant"\n"The ""big"" day"\n"Two\nlines"')).toEqual([
      ['Title'],
      ['Clean up, then plant'],
      ['The "big" day'],
      ['Two\nlines'],
    ])
  })

  it('accepts Windows line endings', () => {
    expect(parseCsv('A,B\r\n1,2\r\n')).toEqual([['A', 'B'], ['1', '2']])
  })

  it('keeps an empty last cell', () => {
    expect(parseCsv('A,B\n1,')).toEqual([['A', 'B'], ['1', '']])
  })
})

describe('turning it into records', () => {
  it('keys each row by its header, so a column can move without breaking anything', () => {
    expect(recordsOf('Volunteer,Hours\nAmara,4')).toEqual([{ Volunteer: 'Amara', Hours: '4' }])
    expect(recordsOf('Hours,Volunteer\n4,Amara')).toEqual([{ Volunteer: 'Amara', Hours: '4' }])
  })

  it('skips blank lines and a byte order mark', () => {
    expect(recordsOf('﻿Volunteer\nAmara\n\n')).toEqual([{ Volunteer: 'Amara' }])
  })

  it('fills a short row with empty cells', () => {
    expect(recordsOf('Volunteer,Checked out\nAmara')).toEqual([{ Volunteer: 'Amara', 'Checked out': '' }])
  })

  it('gives back an empty list for an empty file', () => {
    expect(recordsOf('')).toEqual([])
  })

  it('takes off the apostrophe the server adds for spreadsheets, so titles still match', () => {
    const text = 'Opportunity,Volunteer\n"\'=Clean, then plant",\'-Amara\nPlain,\'Quoted'

    expect(recordsOf(text)).toEqual([
      { Opportunity: '=Clean, then plant', Volunteer: '-Amara' },
      { Opportunity: 'Plain', Volunteer: "'Quoted" },
    ])
  })
})
