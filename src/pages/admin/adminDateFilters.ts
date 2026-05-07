const DEFAULT_LAST_HOURS = Number.parseInt(import.meta.env.VITE_ADMIN_DEFAULT_LAST_HOURS ?? '24', 10)

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

export function toDatetimeLocalValue(date: Date): string {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getDefaultLastHoursRangeLocal(): { fromLocal: string; toLocal: string } {
  const now = new Date()
  const hours = Number.isFinite(DEFAULT_LAST_HOURS) && DEFAULT_LAST_HOURS > 0 ? DEFAULT_LAST_HOURS : 24
  const from = new Date(now.getTime() - hours * 60 * 60 * 1000)
  return {
    fromLocal: toDatetimeLocalValue(from),
    toLocal: toDatetimeLocalValue(now),
  }
}

export function localDatetimeToUtcIso(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

