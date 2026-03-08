import { groupByYear } from './groupByYear'

export function groupByCategory(items) {
  return items.reduce((acc, item) => {
    const cat = item.category.split(/[/\s]/)[0].trim() || item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
}

export function sortByDate(items, order = 'desc') {
  return [...items].sort((a, b) => {
    const [monthA, yearA] = a.date.split('.').map(Number)
    const [monthB, yearB] = b.date.split('.').map(Number)
    const dateA = yearA * 12 + monthA
    const dateB = yearB * 12 + monthB
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

export function sortByTitle(items, order = 'asc') {
  return [...items].sort((a, b) => {
    const titleA = (a.title ?? '').toLowerCase()
    const titleB = (b.title ?? '').toLowerCase()
    const cmp = titleA.localeCompare(titleB)
    return order === 'asc' ? cmp : -cmp
  })
}

export const SORT_OPTIONS = {
  date: { label: 'Date', group: false },
  title: { label: 'Title', group: false },
  year: { label: 'Year', group: true, groupFn: groupByYear },
  category: { label: 'Category', group: true, groupFn: groupByCategory },
}

export function getSortedArchive(archive, sortBy) {
  const opt = SORT_OPTIONS[sortBy]
  if (!opt) return { grouped: { all: archive }, keys: ['all'] }

  if (opt.group) {
    const sorted = sortBy === 'year'
      ? sortByDate(archive, 'desc')
      : sortByTitle(archive, 'asc')
    const grouped = opt.groupFn(sorted)
    const keys = Object.keys(grouped).sort((a, b) => {
      if (sortBy === 'year') return Number(b) - Number(a)
      return a.localeCompare(b)
    })
    return { grouped, keys }
  }

  const sorted = sortBy === 'date' ? sortByDate(archive, 'desc') : sortByTitle(archive, 'asc')
  return { grouped: { all: sorted }, keys: ['all'] }
}
