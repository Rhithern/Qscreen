import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

function maskValue(key: string, value: string): string {
  // Don't mask NEXT_PUBLIC values
  if (key.startsWith('NEXT_PUBLIC_')) {
    return value
  }
  // Show first and last 4 chars of secrets
  if (value.length > 8) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`
  }
  // For shorter values just show ***
  return '***'
}

export default function DebugEnvPage() {
  // Only allow access in non-production
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  // Get all environment variables
  const envVars = { ...process.env }
  const sortedKeys = Object.keys(envVars).sort()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Dashboard</h1>
      
      <div className="grid gap-6 mb-8">
        <div className="flex space-x-4">
          <a 
            href="/api/selfcheck" 
            target="_blank"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Self Check
          </a>
          <a 
            href="/api/dbcheck" 
            target="_blank"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            DB Check
          </a>
          <a 
            href="http://localhost:8787/health" 
            target="_blank"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Conductor Health
          </a>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
      <div className="bg-gray-100 p-6 rounded-lg">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left pb-4">Key</th>
              <th className="text-left pb-4">Value</th>
            </tr>
          </thead>
          <tbody>
            {sortedKeys.map((key) => (
              <tr key={key} className="border-t border-gray-200">
                <td className="py-2 pr-4 font-mono text-sm">{key}</td>
                <td className="py-2 font-mono text-sm">
                  {maskValue(key, envVars[key] || '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
