import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

export const createClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key: string) {
          return request.cookies.get(key)?.value
        },
        set(key: string, value: string, options: any) {
          response.cookies.set({
            name: key,
            value,
            ...options,
          })
        },
        remove(key: string, options: any) {
          response.cookies.set({
            name: key,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}