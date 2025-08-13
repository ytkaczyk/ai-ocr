import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI OCR Dashboard',
  description: 'Modern dashboard with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}