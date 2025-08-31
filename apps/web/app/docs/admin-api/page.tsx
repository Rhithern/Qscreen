import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin API Documentation - Qscreen',
  description: 'Complete API documentation for Qscreen Admin REST endpoints'
};

export default function AdminApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 prose prose-slate dark:prose-invert">
      <h1>Qscreen Admin API Documentation</h1>
      
      <p className="lead">
        The Qscreen Admin API provides secure REST endpoints for external builders to manage Jobs, Question Bank, 
        Invites, Responses/Reviews, and Team members. All endpoints support both Tenant Admin API Keys and 
        Supabase JWT authentication.
      </p>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-8">
        <h3 className="text-blue-800 dark:text-blue-200 mt-0">🔐 Security First</h3>
        <p className="mb-0 text-blue-700 dark:text-blue-300">
          All endpoints enforce tenant-scoped RLS policies and require proper authentication. 
          Rate limiting is applied (60 requests/minute for regular operations, 10/minute for bulk operations).
        </p>
      </div>

      <h2>Authentication</h2>
      
      <p>The API supports two authentication methods:</p>

      <h3>1. Tenant Admin API Key (Recommended for External Builders)</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <p><strong>Header:</strong> <code>Authorization: Bearer qsk_your_tenant_admin_api_key</code></p>
        <p><strong>Use case:</strong> Server-side integrations, no-code builders (WeWeb, Builder.io)</p>
        <p><strong>Scopes:</strong> Default includes jobs, questions, invites, responses, team</p>
      </div>

      <h3>2. Supabase User JWT</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <p><strong>Header:</strong> <code>Authorization: Bearer supabase_jwt_token</code></p>
        <p><strong>Use case:</strong> Direct integration with Qscreen web app</p>
        <p><strong>Scopes:</strong> Based on user role (owner, admin, recruiter, reviewer)</p>
      </div>

      <h2>Creating API Keys</h2>
      
      <p>To create a Tenant Admin API Key:</p>
      <ol>
        <li>Log into Qscreen as an Owner or Admin</li>
        <li>Go to Settings → API Keys</li>
        <li>Click "Create New API Key"</li>
        <li>Copy the key immediately (it's only shown once!)</li>
      </ol>

      <p>Or use the API endpoint:</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`curl -X POST https://your-app.com/api/admin/api-keys \\
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"WeWeb Integration","scopes":["jobs","questions","invites"]}'`}
      </pre>

      <h2>Base URL & Rate Limits</h2>
      
      <ul>
        <li><strong>Base URL:</strong> <code>https://your-app.com/api/admin</code></li>
        <li><strong>Rate Limit:</strong> 60 requests/minute (regular), 10 requests/minute (bulk operations)</li>
        <li><strong>Response Format:</strong> All responses follow <code>{`{ok: boolean, data?, error?}`}</code></li>
      </ul>

      <h2>Jobs API</h2>

      <h3>List Jobs</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/jobs?search=&status=&limit=20&cursor=

# Example
curl -H "Authorization: Bearer qsk_..." \\
  "https://your-app.com/api/admin/jobs?status=live&limit=10"`}
      </pre>

      <h3>Create Job</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/jobs
Content-Type: application/json

{
  "title": "Frontend Engineer",
  "location": "Remote",
  "jd": "We are looking for...",
  "competencies": ["JavaScript", "React"],
  "due_date": "2025-12-31T23:59:59Z",
  "status": "draft",
  "brand": {
    "logoUrl": "https://...",
    "colors": {"primary": "#007bff"}
  }
}

# Example
curl -X POST https://your-app.com/api/admin/jobs \\
  -H "Authorization: Bearer qsk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Data Scientist","location":"San Francisco","status":"draft"}'`}
      </pre>

      <h3>Update Job</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`PATCH /api/admin/jobs/:id
Content-Type: application/json

{
  "title": "Senior Frontend Engineer",
  "status": "live"
}`}
      </pre>

      <h3>Publish/Close Job</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/jobs/:id/publish  # Sets status to 'live'
POST /api/admin/jobs/:id/close     # Sets status to 'closed'`}
      </pre>

      <h2>Question Bank API</h2>

      <h3>List Reusable Questions</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/question-bank?tags=javascript,react&limit=20&cursor=`}
      </pre>

      <h3>Create Reusable Question</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/question-bank
Content-Type: application/json

{
  "text": "Explain the difference between let and const",
  "tags": ["javascript", "fundamentals"],
  "time_limit_sec": 120,
  "ideal_answer": "const creates immutable bindings..."
}`}
      </pre>

      <h3>Job Questions</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/jobs/:id/questions           # List job questions
POST /api/admin/jobs/:id/questions          # Add question to job
PATCH /api/admin/jobs/:id/questions/:qid    # Update job question
DELETE /api/admin/jobs/:id/questions/:qid   # Remove job question
POST /api/admin/jobs/:id/questions/reorder  # Reorder questions`}
      </pre>

      <h2>Invites API</h2>

      <h3>List Job Invites</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/jobs/:id/invites?status=unused&limit=20`}
      </pre>

      <h3>Create Single Invite</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/jobs/:id/invites
Content-Type: application/json

{
  "email": "candidate@example.com",
  "name": "John Doe",
  "notes": "Referred by Alice",
  "expires_at": "2025-12-31T23:59:59Z",
  "reminders": {"t72": true, "t24": true}
}`}
      </pre>

      <h3>Bulk CSV Invites</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/jobs/:id/invites
Content-Type: application/json

{
  "csv": "base64_encoded_csv_content"
}

# CSV format: email,name,notes
# john@example.com,John Doe,Referred by Alice
# jane@example.com,Jane Smith,LinkedIn application`}
      </pre>

      <h3>Send & Manage Invites</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/invites/:inviteId/send        # Send email + get magic link
POST /api/admin/invites/:inviteId/regenerate   # Generate new token`}
      </pre>

      <h2>Responses & Reviews API</h2>

      <h3>List Job Responses</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/jobs/:id/responses?status=submitted&minScore=7&limit=20

# Returns candidate summaries:
{
  "ok": true,
  "data": {
    "items": [
      {
        "session_id": "uuid",
        "candidate_email": "john@example.com",
        "status": "submitted",
        "answers_count": 3,
        "avg_score": 8.5,
        "submitted_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}`}
      </pre>

      <h3>Get Response Details</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/responses/:sessionId/detail

# Returns per-question responses with audio, transcript, scores`}
      </pre>

      <h3>Score Response</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/responses/:sessionId/score
Content-Type: application/json

{
  "question_id": "uuid",
  "score": 8.5,
  "notes": "Great explanation of async/await"
}`}
      </pre>

      <h3>Export Responses CSV</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/jobs/:id/export.csv

# Downloads CSV with columns:
# candidate_email, candidate_name, question, duration, transcript, score, submitted_at`}
      </pre>

      <h2>Team Management API</h2>

      <h3>List Team Members</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/team

# Returns:
{
  "ok": true,
  "data": [
    {
      "user_id": "uuid",
      "email": "admin@company.com",
      "full_name": "Admin User",
      "role": "admin",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}`}
      </pre>

      <h3>Add Team Member</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`POST /api/admin/team
Content-Type: application/json

{
  "email": "recruiter@company.com",
  "role": "recruiter"
}

# Roles: owner, admin, recruiter, reviewer`}
      </pre>

      <h3>Update/Remove Team Member</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`PATCH /api/admin/team/:userId    # Update role
DELETE /api/admin/team/:userId   # Remove from team`}
      </pre>

      <h2>API Keys Management</h2>

      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`GET /api/admin/api-keys                    # List keys (no raw keys shown)
POST /api/admin/api-keys                   # Create new key
POST /api/admin/api-keys/:id/rotate        # Rotate key (get new raw key)
DELETE /api/admin/api-keys/:id             # Delete key`}
      </pre>

      <h2>Error Handling</h2>

      <p>All endpoints return consistent error responses:</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "field": "email"  // Optional field reference
  }
}

# Common error codes:
# UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, 
# RATE_LIMIT_EXCEEDED, DATABASE_ERROR, INTERNAL_ERROR`}
      </pre>

      <h2>Integration Examples</h2>

      <h3>WeWeb Server Action</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`export default async function createJobAction() {
  const response = await fetch('https://your-app.com/api/admin/jobs', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.QSCREEN_TENANT_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Frontend Developer',
      location: 'Remote',
      status: 'draft'
    })
  });
  
  const result = await response.json();
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}`}
      </pre>

      <h3>Builder.io Integration</h3>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`// In Builder.io custom component
async function loadJobResponses(jobId) {
  const response = await fetch(\`https://your-app.com/api/admin/jobs/\${jobId}/responses\`, {
    headers: {
      'Authorization': 'Bearer ' + builderApiKey
    }
  });
  
  const data = await response.json();
  return data.ok ? data.data.items : [];
}`}
      </pre>

      <h2>Security Best Practices</h2>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="text-yellow-800 dark:text-yellow-200 mt-0">⚠️ Important Security Notes</h3>
        <ul className="text-yellow-700 dark:text-yellow-300 mb-0">
          <li><strong>Never expose API keys in browser/client-side code</strong></li>
          <li>Use Tenant Admin API Keys only in server-side environments</li>
          <li>For client-side integrations, use Supabase JWT authentication</li>
          <li>Rotate API keys regularly and immediately if compromised</li>
          <li>Use minimal scopes - only grant permissions you need</li>
          <li>Monitor API usage and set up alerts for unusual activity</li>
        </ul>
      </div>

      <h2>Pagination</h2>

      <p>List endpoints support cursor-based pagination:</p>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "ok": true,
  "data": {
    "items": [...],
    "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNS0wMS0xNVQxMDozMDowMFoiLCJpZCI6InV1aWQifQ",
    "hasMore": true
  }
}

# Use nextCursor for next page:
GET /api/admin/jobs?cursor=eyJjcmVhdGVkX2F0...&limit=20`}
      </pre>

      <h2>Support</h2>

      <p>For API support:</p>
      <ul>
        <li>Check error messages and status codes</li>
        <li>Verify authentication and scopes</li>
        <li>Review rate limiting headers</li>
        <li>Contact support with request/response details</li>
      </ul>
    </div>
  );
}
