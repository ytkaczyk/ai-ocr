import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, apostrophes, and hyphens'),
  email: z.string().email('Invalid email format'),
})

export const fileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters')
    .regex(/^[^<>:"/\\|?*]+\.(pdf|md)$/i, 'Invalid file name or extension'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.enum(['pdf', 'markdown'], { required_error: 'Invalid file type' }),
})

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Search query contains invalid characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters'),
})

export const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
  type: z.enum(['info', 'success', 'warning', 'error']),
})