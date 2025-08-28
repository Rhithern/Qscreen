'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const errorMessages = {
  login_required: 'Please log in to access your interview.',
  invalid_token: 'The interview link appears to be invalid.',
  token_used: 'This interview link has already been used.',
  session_creation_failed: 'There was a problem setting up your interview.',
  server_error: 'Something went wrong. Please try again later.'
}

export default function WelcomePage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') as keyof typeof errorMessages

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Interview</CardTitle>
            <CardDescription>
              {error ? (
                <div className="text-red-600 dark:text-red-400 mt-2">
                  {errorMessages[error] || 'An error occurred.'}
                </div>
              ) : (
                'Get ready for your interview experience.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert">
              <h3>What to Expect</h3>
              <ul>
                <li>Professional interview environment</li>
                <li>Clear, focused questions</li>
                <li>Time to think and respond</li>
                <li>Opportunity to showcase your skills</li>
              </ul>

              <h3>Tips for Success</h3>
              <ul>
                <li>Find a quiet space</li>
                <li>Test your microphone</li>
                <li>Take your time with responses</li>
                <li>Be yourself</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
