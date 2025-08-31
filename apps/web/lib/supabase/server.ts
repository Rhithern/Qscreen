import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// NOTE: cookies() must be awaited on Next.js 15
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // In Next.js 15, cookies can only be set in Server Actions or Route Handlers
          // For read-only operations, we'll silently ignore cookie setting
          console.warn('Cookie setting ignored in read-only context:', name)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch (error) {
          // In Next.js 15, cookies can only be set in Server Actions or Route Handlers
          // For read-only operations, we'll silently ignore cookie removal
          console.warn('Cookie removal ignored in read-only context:', name)
        }
      },
    },
  })
}
