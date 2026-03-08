export function groupByYear(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = []
    acc[item.year].push(item)
    return acc
  }, {})
}
