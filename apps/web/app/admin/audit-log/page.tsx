import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Download } from 'lucide-react'

async function getAuditLogs(searchParams: { search?: string; action?: string }) {
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

  let query = supabase
    .from('audit_log')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      meta,
      created_at,
      profiles!audit_log_actor_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.search) {
    query = query.or(`action.ilike.%${searchParams.search}%,entity_type.ilike.%${searchParams.search}%`)
  }

  if (searchParams.action) {
    query = query.eq('action', searchParams.action)
  }

  const { data: logs } = await query

  return logs || []
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const logs = await getAuditLogs(resolvedSearchParams)

  const actionTypes = [...new Set(logs.map(log => log.action))].sort()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search actions or entities..."
                  className="pl-10"
                  defaultValue={searchParams.search}
                  name="search"
                />
              </div>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md"
              defaultValue={searchParams.action || ''}
              name="action"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent system activities (last 100 entries)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-sm font-medium">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.entity_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      Actor: {log.profiles?.full_name || log.profiles?.email || 'System'}
                    </div>
                    
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          View metadata
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
