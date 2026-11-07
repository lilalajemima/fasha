import { describe, expect, it } from 'vitest'
import { PER_PAGE, pageCount, pageNumbers, pageSlice } from './paging'

describe('counting pages', () => {
  // A table with nothing in it still shows page 1 of 1 rather than page 1 of 0.
  it('always has at least one page', () => {
    expect(pageCount(0)).toBe(1)
  })

  it('fills a page before it starts another', () => {
    expect(pageCount(PER_PAGE)).toBe(1)
    expect(pageCount(PER_PAGE + 1)).toBe(2)
  })
})

describe('taking one page of rows', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('gives the first page from the start', () => {
    expect(pageSlice(items, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('gives whatever is left on the last page', () => {
    expect(pageSlice(items, 2)).toEqual([9, 10])
  })

  it('gives nothing past the end rather than throwing', () => {
    expect(pageSlice(items, 9)).toEqual([])
  })
})

describe('the row of page buttons', () => {
  it('shows every page while the list is short', () => {
    expect(pageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  // The point of this one is that the row never grows past seven buttons,
  // however many pages there are.
  it('keeps the first, the last and the current page with its neighbours', () => {
    expect(pageNumbers(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
  })

  it('collapses only on the side that needs it at the start', () => {
    expect(pageNumbers(1, 10)).toEqual([1, 2, 'gap', 10])
  })

  it('collapses only on the side that needs it at the end', () => {
    expect(pageNumbers(10, 10)).toEqual([1, 'gap', 9, 10])
  })

  it('never draws more than seven steps', () => {
    for (let current = 1; current <= 40; current += 1) {
      expect(pageNumbers(current, 40).length).toBeLessThanOrEqual(7)
    }
  })
})
