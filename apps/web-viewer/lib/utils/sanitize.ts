/**
 * Sanitize HTML content (basic server-side implementation)
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML tag removal for server-side
  return html.replace(/<[^>]*>?/gm, '')
}

/**
 * Sanitize file name to prevent directory traversal and invalid characters
 */
export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, '_') // Replace invalid chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing dots, underscores, hyphens
    .substring(0, 255) // Limit length
}

/**
 * Sanitize user input for database queries
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'%;&\(\)<>]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000) // Limit length
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>\"'%;&\(\)<>]/g, '') // Remove dangerous characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .substring(0, 100) // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a secure filename with timestamp
 */
export function generateSecureFilename(originalName: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${timestamp}_${random}.${extension}`
}

/**
 * Escape special regex characters
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Remove null bytes and control characters
 */
export function removeControlCharacters(str: string): string {
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
}

/**
 * Validate and sanitize JSON input
 */
export function sanitizeJsonInput(input: string): any {
  try {
    const parsed = JSON.parse(input)
    // Basic validation - no functions or prototype pollution
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.parse(JSON.stringify(parsed))
    }
    return parsed
  } catch {
    throw new Error('Invalid JSON input')
  }
}