import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'

export async function Header() {
  const supabase = await createClient()  // 👈 await now
  const { data: { session } } = await supabase.auth.getSession()

  let profile: { role?: 'employer' | 'candidate' | 'hr'; full_name?: string } | null = null
  if (session) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single()
    profile = data
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              InterviewPro
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              {session && (
                <>
                  {(profile?.role === 'employer' || profile?.role === 'hr') && (
                    <Link href="/employer" className="text-gray-600 hover:text-gray-900">Employer</Link>
                  )}
                  {profile?.role === 'hr' && (
                    <Link href="/hr" className="text-gray-600 hover:text-gray-900">HR</Link>
                  )}
                  {profile?.role === 'candidate' && (
                    <Link href="/candidate" className="text-gray-600 hover:text-gray-900">Candidate</Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {profile?.full_name || session.user.email}
                </span>
                <form action={signOut}>
                  <Button variant="outline" size="sm" type="submit">Logout</Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login"><Button variant="outline" size="sm">Login</Button></Link>
                <Link href="/auth/register/employer"><Button size="sm">Get Started</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
