export function toDayId(date: string): string {
  return date.replace(/-/g, '')
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]!
}

export function lastNDates(count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const value = new Date()
    value.setDate(value.getDate() - index)
    return value.toISOString().split('T')[0]!
  })
}
