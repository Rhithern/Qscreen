'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SupabaseDebugPage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const supabase = createClientComponentClient()

  const testConnection = async () => {
    setStatus('testing')
    setError(null)
    setResults(null)

    try {
      // Test authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw authError

      // Test database query
      const { data: tenants, error: dbError } = await supabase
        .from('tenants')
        .select('id, name')
        .limit(1)

      if (dbError) throw dbError

      setResults({
        auth: {
          status: 'Connected',
          session: session ? 'Active' : 'No active session'
        },
        database: {
          status: 'Connected',
          tenants: tenants?.length || 0
        }
      })

      setStatus('success')
    } catch (error: any) {
      setError(error.message)
      setStatus('error')
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>Test Supabase authentication and database connection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={testConnection}
                disabled={status === 'testing'}
              >
                {status === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>
              {status !== 'idle' && (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'testing' ? 'bg-yellow-500 animate-pulse' :
                    status === 'success' ? 'bg-green-500' :
                    'bg-red-500'
                  }`} />
                  <span>{
                    status === 'testing' ? 'Testing connection...' :
                    status === 'success' ? 'Connection successful' :
                    'Connection failed'
                  }</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded">
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <div className="space-y-1 text-sm">
                    <p>Status: {results.auth.status}</p>
                    <p>Session: {results.auth.session}</p>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded">
                  <h3 className="font-semibold mb-2">Database</h3>
                  <div className="space-y-1 text-sm">
                    <p>Status: {results.database.status}</p>
                    <p>Tenants found: {results.database.tenants}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
