// lib/supabase/client.ts
// Browser-side Supabase client for Next.js App Router

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Custom hook for using Supabase client in components
import { useMemo } from 'react'

export function useSupabase() {
  return useMemo(() => createClient(), [])
}

// Example usage:
// const supabase = useSupabase()
// const { data: user } = await supabase.auth.getUser()