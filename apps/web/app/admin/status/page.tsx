import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Server, Globe } from 'lucide-react'

async function getSystemStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Test database connectivity
  let dbStatus = { ok: false, error: null, responseTime: 0 }
  try {
    const start = Date.now()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    const responseTime = Date.now() - start
    dbStatus = { ok: !error, error: error?.message || null, responseTime }
  } catch (error) {
    dbStatus = { ok: false, error: 'Connection failed', responseTime: 0 }
  }

  // Test conductor health
  let conductorStatus = { ok: false, error: null, responseTime: 0, details: null }
  try {
    const start = Date.now()
    const response = await fetch('http://localhost:8787/health', { 
      signal: AbortSignal.timeout(5000) 
    })
    const responseTime = Date.now() - start
    if (response.ok) {
      const details = await response.json()
      conductorStatus = { ok: true, error: null, responseTime, details }
    } else {
      conductorStatus = { ok: false, error: `HTTP ${response.status}`, responseTime, details: null }
    }
  } catch (error) {
    conductorStatus = { ok: false, error: 'Service unreachable', responseTime: 0, details: null }
  }

  // Environment checks
  const envStatus = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV || 'unknown'
  }

  return {
    database: dbStatus,
    conductor: conductorStatus,
    environment: envStatus,
    timestamp: new Date().toISOString()
  }
}

export default async function SystemStatusPage() {
  const status = await getSystemStatus()

  const overallHealth = status.database.ok && status.conductor.ok

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="text-muted-foreground">
            Monitor system health and service availability
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={overallHealth ? 'default' : 'destructive'} className="text-sm">
            {overallHealth ? 'All Systems Operational' : 'Service Degraded'}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {overallHealth ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            System Overview
          </CardTitle>
          <CardDescription>
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-muted-foreground">
                  {status.database.ok ? 'Connected' : 'Error'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-medium">Conductor</div>
                <div className="text-sm text-muted-foreground">
                  {status.conductor.ok ? 'Running' : 'Offline'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-medium">Web Service</div>
                <div className="text-sm text-muted-foreground">
                  Operational
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Connection Status</span>
              <Badge variant={status.database.ok ? 'default' : 'destructive'}>
                {status.database.ok ? 'Connected' : 'Failed'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Response Time</span>
              <span className="text-sm text-muted-foreground">
                {status.database.responseTime}ms
              </span>
            </div>
            
            {status.database.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{status.database.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conductor Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Conductor Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Service Status</span>
              <Badge variant={status.conductor.ok ? 'default' : 'destructive'}>
                {status.conductor.ok ? 'Running' : 'Offline'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Response Time</span>
              <span className="text-sm text-muted-foreground">
                {status.conductor.responseTime}ms
              </span>
            </div>
            
            {status.conductor.details && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Port</span>
                  <span className="text-sm text-muted-foreground">
                    {status.conductor.details.port || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uptime</span>
                  <span className="text-sm text-muted-foreground">
                    {status.conductor.details.uptimeSeconds 
                      ? `${Math.floor(status.conductor.details.uptimeSeconds / 60)}m`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            )}
            
            {status.conductor.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{status.conductor.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            System environment and configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span>Supabase URL</span>
              <Badge variant={status.environment.supabaseUrl ? 'default' : 'destructive'}>
                {status.environment.supabaseUrl ? 'Set' : 'Missing'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Supabase Key</span>
              <Badge variant={status.environment.supabaseAnonKey ? 'default' : 'destructive'}>
                {status.environment.supabaseAnonKey ? 'Set' : 'Missing'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Environment</span>
              <Badge variant="outline">
                {status.environment.nodeEnv}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
