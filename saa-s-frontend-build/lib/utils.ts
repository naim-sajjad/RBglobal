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
