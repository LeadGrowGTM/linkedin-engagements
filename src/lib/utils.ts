import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return formatDate(d)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function parseLinkedInUsername(url: string): string {
  try {
    // Remove trailing slash if present
    const cleanUrl = url.trim().replace(/\/$/, '')
    
    // Match LinkedIn profile URL patterns
    // Handles: https://www.linkedin.com/in/username
    //          https://linkedin.com/in/username
    //          www.linkedin.com/in/username
    //          linkedin.com/in/username
    const match = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?]+)/i)
    
    if (match && match[1]) {
      return match[1]
    }
    
    // If no match, try to extract the last meaningful part of the URL
    const parts = cleanUrl.split('/')
    const lastPart = parts[parts.length - 1]
    
    if (lastPart && lastPart !== 'in') {
      return lastPart
    }
    
    // Fallback to "LinkedIn Profile"
    return 'LinkedIn Profile'
  } catch (error) {
    return 'LinkedIn Profile'
  }
}

