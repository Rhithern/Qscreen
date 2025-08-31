# Admin API Reference

Complete documentation for all admin REST endpoints in the AI Interviewer platform.

## Authentication

All admin endpoints require authentication via JWT token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

## Base URL

```
https://your-domain.com/api
```

## Admin Endpoints

### API Keys Management

#### List API Keys
```http
GET /admin/api-keys
```

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "key_123",
      "name": "Production Key",
      "lastUsed": "2025-09-01T03:00:00Z",
      "createdAt": "2025-08-01T00:00:00Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X GET "https://your-domain.com/api/admin/api-keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create API Key
```http
POST /admin/api-keys
```

**Request Body:**
```json
{
  "name": "New API Key",
  "permissions": ["read", "write"]
}
```

**Response:**
```json
{
  "id": "key_456",
  "name": "New API Key",
  "key": "sk_live_...",
  "createdAt": "2025-09-01T03:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "https://your-domain.com/api/admin/api-keys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New API Key", "permissions": ["read", "write"]}'
```

#### Delete API Key
```http
DELETE /admin/api-keys/[id]
```

**cURL Example:**
```bash
curl -X DELETE "https://your-domain.com/api/admin/api-keys/key_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Rotate API Key
```http
POST /admin/api-keys/[id]/rotate
```

**Response:**
```json
{
  "id": "key_123",
  "newKey": "sk_live_new_key...",
  "rotatedAt": "2025-09-01T03:00:00Z"
}
```

### Jobs Management

#### List Jobs
```http
GET /admin/jobs
```

**Query Parameters:**
- `status` - Filter by status (active, draft, closed)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "title": "Senior Developer",
      "status": "active",
      "createdAt": "2025-08-01T00:00:00Z",
      "responsesCount": 15
    }
  ],
  "total": 25,
  "hasMore": true
}
```

**cURL Example:**
```bash
curl -X GET "https://your-domain.com/api/admin/jobs?status=active&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Create Job
```http
POST /admin/jobs
```

**Request Body:**
```json
{
  "title": "Frontend Developer",
  "description": "React developer position",
  "questions": [
    "Tell me about your React experience",
    "How do you handle state management?"
  ],
  "timeLimit": 300,
  "status": "draft"
}
```

**Response:**
```json
{
  "id": "job_456",
  "title": "Frontend Developer",
  "status": "draft",
  "createdAt": "2025-09-01T03:00:00Z"
}
```

#### Get Job Details
```http
GET /admin/jobs/[id]
```

**Response:**
```json
{
  "id": "job_123",
  "title": "Senior Developer",
  "description": "Full-stack developer role",
  "status": "active",
  "questions": [
    {
      "id": "q_1",
      "text": "Tell me about yourself",
      "order": 1,
      "timeLimit": 60
    }
  ],
  "createdAt": "2025-08-01T00:00:00Z"
}
```

#### Update Job
```http
PUT /admin/jobs/[id]
```

**Request Body:**
```json
{
  "title": "Updated Job Title",
  "description": "Updated description",
  "status": "active"
}
```

#### Delete Job
```http
DELETE /admin/jobs/[id]
```

#### Publish Job
```http
POST /admin/jobs/[id]/publish
```

**Response:**
```json
{
  "id": "job_123",
  "status": "active",
  "publishedAt": "2025-09-01T03:00:00Z"
}
```

#### Close Job
```http
POST /admin/jobs/[id]/close
```

**Response:**
```json
{
  "id": "job_123",
  "status": "closed",
  "closedAt": "2025-09-01T03:00:00Z"
}
```

#### Export Job Responses (CSV)
```http
GET /admin/jobs/[id]/export.csv
```

**Response:** CSV file download

**cURL Example:**
```bash
curl -X GET "https://your-domain.com/api/admin/jobs/job_123/export.csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "job_responses.csv"
```

### Job Questions Management

#### List Job Questions
```http
GET /admin/jobs/[id]/questions
```

**Response:**
```json
{
  "questions": [
    {
      "id": "q_1",
      "text": "Tell me about yourself",
      "order": 1,
      "timeLimit": 60,
      "required": true
    }
  ]
}
```

#### Add Question to Job
```http
POST /admin/jobs/[id]/questions
```

**Request Body:**
```json
{
  "text": "What's your experience with Node.js?",
  "timeLimit": 90,
  "order": 2,
  "required": true
}
```

#### Update Question
```http
PUT /admin/jobs/[id]/questions/[qid]
```

**Request Body:**
```json
{
  "text": "Updated question text",
  "timeLimit": 120
}
```

#### Delete Question
```http
DELETE /admin/jobs/[id]/questions/[qid]
```

#### Reorder Questions
```http
POST /admin/jobs/[id]/questions/reorder
```

**Request Body:**
```json
{
  "questionIds": ["q_2", "q_1", "q_3"]
}
```

### Invitations Management

#### Create Job Invitation
```http
POST /admin/jobs/[id]/invites
```

**Request Body:**
```json
{
  "candidateEmail": "candidate@example.com",
  "candidateName": "John Doe",
  "expiresIn": 86400,
  "customMessage": "Please complete this interview"
}
```

**Response:**
```json
{
  "id": "invite_123",
  "token": "inv_abc123...",
  "candidateEmail": "candidate@example.com",
  "expiresAt": "2025-09-02T03:00:00Z",
  "status": "pending"
}
```

#### List Job Invitations
```http
GET /admin/jobs/[id]/invites
```

**Response:**
```json
{
  "invites": [
    {
      "id": "invite_123",
      "candidateEmail": "candidate@example.com",
      "status": "pending",
      "sentAt": "2025-09-01T03:00:00Z",
      "expiresAt": "2025-09-02T03:00:00Z"
    }
  ]
}
```

#### Regenerate Invitation
```http
POST /admin/invites/[inviteId]/regenerate
```

**Response:**
```json
{
  "id": "invite_123",
  "newToken": "inv_xyz789...",
  "expiresAt": "2025-09-02T03:00:00Z"
}
```

#### Send Invitation Email
```http
POST /admin/invites/[inviteId]/send
```

**Request Body:**
```json
{
  "customMessage": "Please complete your interview by tomorrow"
}
```

### Responses Management

#### List Job Responses
```http
GET /admin/jobs/[id]/responses
```

**Query Parameters:**
- `status` - Filter by status (pending, completed, expired)
- `limit` - Number of results
- `offset` - Pagination offset

**Response:**
```json
{
  "responses": [
    {
      "id": "session_123",
      "candidateEmail": "candidate@example.com",
      "status": "completed",
      "score": 8.5,
      "completedAt": "2025-09-01T02:30:00Z",
      "duration": 1200
    }
  ],
  "total": 10
}
```

#### Get Response Details
```http
GET /admin/responses/[sessionId]/detail
```

**Response:**
```json
{
  "id": "session_123",
  "candidateEmail": "candidate@example.com",
  "status": "completed",
  "overallScore": 8.5,
  "responses": [
    {
      "questionId": "q_1",
      "questionText": "Tell me about yourself",
      "transcript": "I am a software developer...",
      "score": 8.0,
      "duration": 120,
      "audioUrl": "https://storage.com/audio/123.mp3"
    }
  ],
  "completedAt": "2025-09-01T02:30:00Z"
}
```

#### Update Response Score
```http
PUT /admin/responses/[sessionId]/score
```

**Request Body:**
```json
{
  "overallScore": 9.0,
  "questionScores": {
    "q_1": 8.5,
    "q_2": 9.5
  },
  "feedback": "Excellent technical knowledge"
}
```

### Question Bank Management

#### List Question Bank
```http
GET /admin/question-bank
```

**Query Parameters:**
- `category` - Filter by category
- `difficulty` - Filter by difficulty (easy, medium, hard)
- `search` - Search question text

**Response:**
```json
{
  "questions": [
    {
      "id": "qb_1",
      "text": "Describe your problem-solving approach",
      "category": "behavioral",
      "difficulty": "medium",
      "tags": ["problem-solving", "general"]
    }
  ]
}
```

#### Add Question to Bank
```http
POST /admin/question-bank
```

**Request Body:**
```json
{
  "text": "How do you handle code reviews?",
  "category": "technical",
  "difficulty": "medium",
  "tags": ["code-review", "collaboration"],
  "suggestedTimeLimit": 90
}
```

#### Update Question in Bank
```http
PUT /admin/question-bank/[id]
```

#### Delete Question from Bank
```http
DELETE /admin/question-bank/[id]
```

### Team Management

#### List Team Members
```http
GET /admin/team
```

**Response:**
```json
{
  "members": [
    {
      "id": "user_123",
      "email": "admin@company.com",
      "role": "admin",
      "lastActive": "2025-09-01T02:00:00Z",
      "createdAt": "2025-08-01T00:00:00Z"
    }
  ]
}
```

#### Add Team Member
```http
POST /admin/team
```

**Request Body:**
```json
{
  "email": "newuser@company.com",
  "role": "interviewer",
  "sendInvite": true
}
```

#### Update Team Member
```http
PUT /admin/team/[userId]
```

**Request Body:**
```json
{
  "role": "admin",
  "active": true
}
```

#### Remove Team Member
```http
DELETE /admin/team/[userId]
```

## Embed API Endpoints

### Get Embed Configuration
```http
GET /embed/config
```

**Response:**
```json
{
  "wsUrl": "wss://your-domain.com/ws",
  "version": "1.0.0",
  "features": {
    "audioRecording": true,
    "realTimeTranscription": true
  }
}
```

### Generate Embed Token
```http
POST /embed/token
```

**Request Body:**
```json
{
  "inviteToken": "inv_abc123...",
  "origin": "https://client-domain.com"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "sessionId": "session_456",
  "expiresIn": 600,
  "job": {
    "id": "job_123",
    "title": "Senior Developer"
  }
}
```

## Utility Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-01T03:00:00Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

### Database Check
```http
GET /dbcheck
```

**Response:**
```json
{
  "database": "connected",
  "migrations": "up-to-date",
  "timestamp": "2025-09-01T03:00:00Z"
}
```

### Export Interview Data
```http
GET /export/interview/[id]
```

**Response:** JSON file with complete interview data

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- Admin endpoints: 1000 requests per hour per user
- Embed endpoints: 100 requests per hour per IP
- Export endpoints: 10 requests per hour per user

## JavaScript Examples

### Using Fetch API

```javascript
// Get jobs list
const response = await fetch('/api/admin/jobs', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create new job
const newJob = await fetch('/api/admin/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Position',
    description: 'Job description',
    questions: ['Question 1', 'Question 2']
  })
});
```

### Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get job responses
const responses = await api.get(`/admin/jobs/${jobId}/responses`);

// Update response score
await api.put(`/admin/responses/${sessionId}/score`, {
  overallScore: 8.5,
  feedback: 'Great interview'
});
```
