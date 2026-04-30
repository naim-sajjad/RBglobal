import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract a user-friendly message from an API error (e.g. Axios + Laravel validation). */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object' || !('response' in err)) return fallback
  const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
  if (!res?.data) return fallback
  const { message, errors } = res.data
  if (message && message !== 'The given data was invalid.') return message
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0]
    const firstMessages = firstKey ? errors[firstKey] : null
    if (Array.isArray(firstMessages) && firstMessages[0]) return firstMessages[0]
  }
  return message || fallback
}

/**
 * Formats Laravel/API date or datetime strings for display.
 * Uses the calendar YYYY-MM-DD from the string when present so midnight UTC does not shift the day locally.
 */
export function formatApiDate(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  const ymd = value.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const y = Number(ymd.slice(0, 4))
    const mo = Number(ymd.slice(5, 7))
    const d = Number(ymd.slice(8, 10))
    return new Date(y, mo - 1, d).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return String(value)
  return dt.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatApiDateRange(start: string, end: string): string {
  return `${formatApiDate(start)} → ${formatApiDate(end)}`
}
