# AI Interviewer Platform - Complete Setup Guide

This guide covers everything you need to deploy and use the AI Interviewer platform as a fully portable embeddable widget system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm package manager
- Supabase account
- OpenAI API key (optional)
- Deepgram API key (optional)

### 1. Environment Setup

Create environment files from examples:

```bash
# Root environment
cp .env.example .env

# Web app environment
cp apps/web/.env.example apps/web/.env.local

# Server environment  
cp apps/server/.env.example apps/server/.env

# Conductor environment
cp apps/conductor/.env.example apps/conductor/.env
```

### 2. Configure Environment Variables

**Root `.env`:**
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_jwt_secret_here
EMBED_JWT_SECRET=your_embed_jwt_secret_here

# External APIs (optional)
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# CORS and Origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
ADMIN_API_ALLOWED_ORIGINS=http://localhost:3000,https://admin.yourdomain.com
```

**Apps/web `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONDUCTOR_URL=ws://localhost:3002
```

**Apps/server `.env`:**
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WS_URL=ws://localhost:3001/ws
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Database Setup

Run Supabase migrations:

```bash
cd supabase
npx supabase db reset
```

### 5. Seed Demo Data

```bash
pnpm seed
```

This creates demo users, jobs, and invite tokens. **Save the output** - it contains important URLs and tokens.

### 6. Start All Services

```bash
# Start all services
pnpm dev

# Or start individually:
# pnpm dev:web      # Frontend (port 3000)
# pnpm dev:server   # Backend API (port 3001) 
# pnpm dev:conductor # WebSocket server (port 3002)
```

## 📋 Platform Components

### Core Services

1. **Web App** (`apps/web`) - Next.js frontend
   - Admin dashboard for employers/HR
   - Candidate interview interface
   - Authentication and user management

2. **Server** (`apps/server`) - Express.js API
   - REST endpoints for CRUD operations
   - JWT authentication middleware
   - Embed token generation with rate limiting
   - CDN serving for embed SDK

3. **Conductor** (`apps/conductor`) - WebSocket server
   - Real-time interview sessions
   - Audio processing and transcription
   - AI-powered conversation flow

4. **Embed SDK** (`packages/embed-sdk`) - Embeddable widget
   - UMD and ESM bundles
   - React wrapper component
   - Vanilla JavaScript API

## 🎯 Using the Embed Widget

### Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>Interview</title>
</head>
<body>
    <div id="interview-widget"></div>
    
    <script src="https://your-domain.com/cdn/embed/embed.min.js"></script>
    <script>
        QscreenInterview.mount({
            el: '#interview-widget',
            inviteToken: 'your-invite-token-here',
            onStart: () => console.log('Interview started'),
            onComplete: (result) => console.log('Interview completed', result),
            onError: (error) => console.error('Interview error', error)
        });
    </script>
</body>
</html>
```

### React Integration

```jsx
import { QscreenInterviewWidget } from '@ai-interviewer/embed-sdk';

function InterviewPage() {
  return (
    <QscreenInterviewWidget
      inviteToken="your-invite-token-here"
      onStart={() => console.log('Interview started')}
      onComplete={(result) => console.log('Interview completed', result)}
      onError={(error) => console.error('Interview error', error)}
    />
  );
}
```

### No-Code Platform Integration

See detailed guides in `/docs/embed/`:
- [WeWeb Integration](./docs/embed/weweb.md)
- [Webflow Integration](./docs/embed/webflow.md)
- [WordPress Integration](./docs/embed/wordpress.md)
- [Framer Integration](./docs/embed/framer.md)

## 🔐 Security Configuration

### CORS Setup

Add your domains to environment variables:

```env
# Allow these origins for embed widget
ALLOWED_ORIGINS=https://yoursite.com,https://client.com,*.yourdomain.com

# Allow these origins for admin API
ADMIN_API_ALLOWED_ORIGINS=https://admin.yoursite.com
```

### JWT Configuration

Generate secure secrets:

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Rate Limiting

Default limits (configurable in code):
- Embed token API: 10 requests/minute per IP
- Admin API: 1000 requests/hour per user
- WebSocket connections: Origin validation required

## 📊 Admin Dashboard Usage

### 1. Login
Visit `http://localhost:3000/auth/login` with demo credentials:
- Employer: `employer@demo.com` / `demo123456`
- HR: `hr@demo.com` / `demo123456`

### 2. Create Jobs
1. Navigate to Jobs → Create New Job
2. Add job title, description, and questions
3. Set time limits and difficulty
4. Publish when ready

### 3. Invite Candidates
1. Go to job details
2. Click "Invite Candidate"
3. Enter candidate email
4. System generates unique invite token
5. Send invitation link to candidate

### 4. Review Responses
1. View job responses in dashboard
2. Listen to audio recordings
3. Read AI-generated transcripts
4. Score and add feedback
5. Export results as CSV

## 🔌 API Integration

### Generate Embed Tokens

```bash
curl -X POST "https://your-domain.com/api/embed/token" \
  -H "Content-Type: application/json" \
  -d '{
    "inviteToken": "inv_abc123...",
    "origin": "https://client-domain.com"
  }'
```

### Admin API Examples

```javascript
// Get jobs list
const jobs = await fetch('/api/admin/jobs', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Create new job
const newJob = await fetch('/api/admin/jobs', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Software Engineer',
    description: 'Full-stack developer position',
    questions: ['Tell me about yourself', 'Describe your experience']
  })
});
```

See complete API documentation: [Admin API Reference](./docs/admin-api-reference.md)

## 🧪 Testing

### Embed Widget Testing

1. Visit test page: `http://localhost:3000/embed/test`
2. Use invite token from seed script output
3. Monitor live event logs
4. Test microphone permissions
5. Verify WebSocket connection

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Job creation and management
- [ ] Candidate invitation flow
- [ ] Embed widget loading
- [ ] Microphone permissions
- [ ] Audio recording and transcription
- [ ] Interview completion flow
- [ ] Response review and scoring
- [ ] CSV export functionality

### Automated Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run embed widget tests
pnpm test:embed
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Use production URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_CONDUCTOR_URL=wss://your-domain.com

# Secure origins
ALLOWED_ORIGINS=https://your-domain.com,https://client1.com,https://client2.com

# Strong JWT secrets (64+ characters)
JWT_SECRET=your_very_long_secure_secret_here
EMBED_JWT_SECRET=another_very_long_secure_secret_here

# Production database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### Build and Deploy

```bash
# Build all packages
pnpm build

# Deploy web app (Vercel example)
cd apps/web && vercel deploy

# Deploy server (Railway example)
cd apps/server && railway deploy

# Deploy conductor (Railway example)
cd apps/conductor && railway deploy
```

### CDN Setup

Serve embed SDK from CDN:

```bash
# Upload dist files to CDN
aws s3 cp packages/embed-sdk/dist/ s3://your-cdn-bucket/embed/ --recursive

# Update CDN URLs in documentation
# https://cdn.your-domain.com/embed/embed.min.js
```

### SSL/HTTPS Requirements

- **Required** for microphone access
- **Required** for WebSocket connections
- Use Let's Encrypt or cloud provider certificates

## 🔧 Troubleshooting

### Common Issues

**Widget not loading:**
- Check CDN URL is accessible
- Verify CORS settings allow your domain
- Ensure invite token is valid and not expired

**Microphone not working:**
- Ensure HTTPS is enabled
- Check browser permissions
- Test on different browsers

**WebSocket connection failed:**
- Verify WebSocket URL in configuration
- Check firewall/proxy settings
- Ensure origin is in allowlist

**Database connection issues:**
- Verify Supabase credentials
- Check network connectivity
- Ensure service role key has proper permissions

### Debug Mode

Enable debug logging:

```javascript
QscreenInterview.mount({
  el: '#interview',
  inviteToken: 'token',
  debug: true // Enables console logging
});
```

### Health Checks

Monitor service health:

```bash
# Check API health
curl https://your-domain.com/api/health

# Check database connectivity
curl https://your-domain.com/api/dbcheck
```

## 📖 Additional Resources

- [Embed WebSocket Protocol](./docs/embed-websocket-protocol.md)
- [Admin API Reference](./docs/admin-api-reference.md)
- [No-Code Platform Guides](./docs/embed/)
- [Security Best Practices](./docs/security.md)

## 🆘 Support

For technical support:
- GitHub Repository: [Rhithern/Qscreen](https://github.com/Rhithern/Qscreen)
- GitHub Issues: [Create an issue](https://github.com/Rhithern/Qscreen/issues)
- Documentation: Available in `/docs/` directory

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

**🎉 You're all set!** The AI Interviewer platform is now ready for production use as a fully portable embeddable widget system.
