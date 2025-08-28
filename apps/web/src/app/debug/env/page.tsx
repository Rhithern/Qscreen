'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EnvironmentDebugPage() {
  const envVars = {
    'Supabase Configuration': {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '***' // masked for security
    },
    'Development Settings': {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SKIP_TENANT_CHECK: process.env.NEXT_PUBLIC_SKIP_TENANT_CHECK,
      WEB_PORT: process.env.WEB_PORT,
      CONDUCTOR_PORT: process.env.CONDUCTOR_PORT
    },
    'WebSocket Configuration': {
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    },
    'Authentication': {
      NEXT_PUBLIC_AUTH_REDIRECT_URL: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
    },
    'External Services': {
      NEXT_PUBLIC_JITSI_DOMAIN: process.env.NEXT_PUBLIC_JITSI_DOMAIN
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Environment Configuration Debug</h1>
      
      {Object.entries(envVars).map(([section, vars]) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle>{section}</CardTitle>
            <CardDescription>Configuration values for {section.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(vars).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between p-2 bg-muted rounded">
                  <span className="font-mono text-sm">{key}</span>
                  <span className={`font-mono text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                    {value ? (key.includes('KEY') ? '✓ Set' : value) : '✗ Not Set'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
