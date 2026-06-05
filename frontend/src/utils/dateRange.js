export function normalizeDateRange(range) {
  const from = range?.from || ''
  const to = range?.to || ''

  if (from && to && to < from) {
    return { from, to: from }
  }

  return { from, to }
}

export function isInDateRange(isoDate, range) {
  const normalized = normalizeDateRange(range)

  if (!normalized.from && !normalized.to) {
    return true
  }

  if (!isoDate) {
    return false
  }

  const value = new Date(isoDate)
  if (Number.isNaN(value.getTime())) {
    return false
  }

  if (normalized.from) {
    const fromDate = new Date(`${normalized.from}T00:00:00`)
    if (value < fromDate) {
      return false
    }
  }

  if (normalized.to) {
    const toDate = new Date(`${normalized.to}T23:59:59`)
    if (value > toDate) {
      return false
    }
  }

  return true
}

export function hasDateRange(range) {
  return Boolean(range?.from || range?.to)
}
