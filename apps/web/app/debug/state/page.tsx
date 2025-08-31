import { getAccessState } from '@/lib/auth/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

export default async function DebugStatePage() {
  const state = await getAccessState()
  const currentPath = '/debug/state'

  // Fetch route check and database meta data
  let routeCheck = null
  let dbMeta = null
  
  try {
    const [routeResponse, dbResponse] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/routecheck?path=${encodeURIComponent(currentPath)}`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/db/meta`, {
        cache: 'no-store'
      })
    ])
    
    if (routeResponse.ok) {
      routeCheck = await routeResponse.json()
    }
    if (dbResponse.ok) {
      dbMeta = await dbResponse.json()
    }
  } catch (error) {
    console.error('Failed to fetch debug data:', error)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Debug State</h1>
          <p className="text-muted-foreground">Current authentication and routing state</p>
        </div>
        <Link href="/debug/state">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </Link>
      </div>

      {/* Current State */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication State</CardTitle>
          <CardDescription>Current user session and role information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Has Session</label>
              <div>
                <Badge variant={state.hasSession ? 'default' : 'destructive'}>
                  {state.hasSession ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <div>
                <Badge variant={state.role ? 'default' : 'secondary'}>
                  {state.role || 'None'}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tenant ID</label>
              <div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {state.tenantId || 'None'}
                </code>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Onboarding Completed</label>
              <div>
                <Badge variant={state.onboardingCompleted ? 'default' : 'destructive'}>
                  {state.onboardingCompleted ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Schema */}
      {dbMeta && (
        <Card>
          <CardHeader>
            <CardTitle>Database Schema</CardTitle>
            <CardDescription>Current database schema status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Onboarding Column Exists</label>
              <div>
                <Badge variant={dbMeta.hasOnboardingCompleted ? 'default' : 'destructive'}>
                  {dbMeta.hasOnboardingCompleted ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            {!dbMeta.hasOnboardingCompleted && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  <strong>Fix:</strong> Run the migration in Supabase SQL (see scripts/schema.sql)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Route Check */}
      {routeCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Route Decision</CardTitle>
            <CardDescription>How the routing logic would handle this path</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Path</label>
              <div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {routeCheck.path}
                </code>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Decision</label>
              <div>
                <Badge variant={routeCheck.decision.startsWith('allow') ? 'default' : 'secondary'}>
                  {routeCheck.decision}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Timestamp</label>
              <div className="text-xs text-muted-foreground">
                {new Date(routeCheck.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Test different routes and scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">Test /dashboard</Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="outline" className="w-full">Test /onboarding</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">Test /auth/login</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="w-full">Test /jobs</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>Complete state object for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({ state, routeCheck, dbMeta }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
