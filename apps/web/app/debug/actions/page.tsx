'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ActionLog {
  timestamp: string
  action: string
  userId?: string
  tenantId?: string
  ok: boolean
  err?: string
  meta?: any
}

export default function DebugActionsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from a logging service
    // For now, we'll simulate with localStorage or console logs
    const mockLogs: ActionLog[] = [
      {
        timestamp: new Date().toISOString(),
        action: 'createCompanyAndTenant',
        userId: 'user-123',
        tenantId: 'tenant-456',
        ok: true,
        meta: { companyName: 'Demo Company' }
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        action: 'signIn',
        userId: 'user-123',
        ok: true
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        action: 'signUpEmployer',
        ok: false,
        err: 'Email already exists'
      }
    ]
    
    setLogs(mockLogs)
    setLoading(false)
  }, [])

  const refreshLogs = () => {
    setLoading(true)
    // Simulate refresh
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>This page is only available in development mode</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Debug Actions</h1>
          <p className="text-gray-600">Recent server action logs</p>
        </div>
        <Button onClick={refreshLogs} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{log.action}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={log.ok ? 'default' : 'destructive'}>
                    {log.ok ? 'Success' : 'Error'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {log.userId && (
                  <div>
                    <span className="font-medium">User ID:</span> {log.userId}
                  </div>
                )}
                {log.tenantId && (
                  <div>
                    <span className="font-medium">Tenant ID:</span> {log.tenantId}
                  </div>
                )}
                {log.err && (
                  <div className="col-span-2">
                    <span className="font-medium text-red-600">Error:</span> {log.err}
                  </div>
                )}
                {log.meta && (
                  <div className="col-span-2">
                    <span className="font-medium">Metadata:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {logs.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No action logs found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
