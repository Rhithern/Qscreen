# AI Interviewer Platform

A comprehensive AI-powered interview platform with embeddable widgets for seamless integration.

🔗 **GitHub Repository**: https://github.com/Rhithern/Qscreen

## Quick Links
- [Complete Setup Guide](./HOW-TO-USE.md)
- [Embed Documentation](./docs/embed/)
- [Admin API Reference](./docs/admin-api-reference.md)
- [WebSocket Protocol](./docs/embed-websocket-protocol.md)

## 🚀 Quick Start

Get the interview platform running in under 5 minutes:

### 1. Prerequisites
- **Node.js 20+** and **pnpm 8+** installed
- **Supabase project** with database URL and anon key

### 2. One-Command Setup
```bash
# Clone and setup environment files
pnpm setup

# Install dependencies and start both services
pnpm up
```

### 3. Configure Your Keys
Edit the generated `.env` files with your Supabase credentials:
- `apps/web/.env.local` - Add your Supabase URL and anon key
- `apps/conductor/.env` - Configure allowed origins

### 4. Seed Demo Data (Optional)
```bash
# Create demo tenant, users, and interview
pnpm seed:dev
```

### 5. Verify Everything Works
```bash
# Run health checks and smoke tests
pnpm doctor
pnpm verify
```

**🎉 Done!** Visit http://localhost:3000 to access the platform.

### Quick Commands Reference
```bash
pnpm setup     # Setup environment files
pnpm up        # Install deps + start services
pnpm dev:all   # Start both web and conductor
pnpm seed:dev  # Create demo data
pnpm doctor    # Check system health
pnpm verify    # Run smoke tests
pnpm test:e2e  # Run end-to-end tests
```

## 📋 Features

- **Multi-tenant Architecture**: Complete subdomain and custom domain support
- **Role-based Access Control**: Employer, HR, and Candidate user roles
- **Real-time Interviews**: WebSocket-powered live interview sessions
- **Email Notifications**: Professional email templates for invitations and updates
- **Responsive Design**: Mobile-first UI with accessibility features
- **Production Ready**: PM2 process management and Docker support

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js WebSocket server with Express
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Email**: Resend or SMTP
- **Process Management**: PM2, Docker Compose

### Project Structure
```
apps/
├── web/                    # Next.js frontend application
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utilities and configurations
│   └── hooks/            # Custom React hooks
│
├── conductor/             # WebSocket server
│   └── src/              # Server source code
│
packages/
└── shared/               # Shared types and utilities

scripts/                  # Build and development scripts
supabase/                # Database migrations and schema
```

## 🔧 Environment Setup

### Required Environment Variables

**Web App (`apps/web/.env.local`):**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONDUCTOR_URL=ws://localhost:8080

# Email Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name

# Development flags
NEXT_PUBLIC_SKIP_TENANT_CHECK=false
```

**Conductor Service (`apps/conductor/.env`):**
```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# External API Keys (Optional)
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
```

## Run & Background

### Development (Single Window)

Run both web and conductor apps in development mode:

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This runs both services with live reload:
- Web: http://localhost:3000
- Conductor: ws://localhost:8787

### Production-like Background Mode (PM2)

Run services as background daemons:

```bash
# Build all apps
pnpm build

# Start background services
pnpm bg:start

# View logs
pnpm bg:logs

# Stop services
pnpm bg:stop
```

PM2 features:
- Auto-restart on crash
- Log management
- Process monitoring
- Environment variable support

### Docker Compose (Background)

Run services in containers:

```bash
# Start containers
pnpm compose:up

# View logs
pnpm compose:logs

# Stop containers
pnpm compose:down
```

Docker features:
- Isolated environments
- Easy scaling
- Consistent builds
- Environment variable support via .env

## Project Structure

```
apps/
├── web/              # Next.js frontend
│   ├── src/         # Source code
│   └── public/      # Static files
│
└── conductor/       # WebSocket server
    └── src/        # Source code

packages/
└── shared/         # Shared utilities and types
```

## Development

### Prerequisites

1. Install Node.js 20 or later:
   - Download from [nodejs.org](https://nodejs.org/)

2. Install pnpm:
   ```bash
   npm install -g pnpm
   ```

3. On Windows, enable PowerShell script execution:
   ```powershell
   # Run PowerShell as Administartor
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Start development servers:
   ```bash
   pnpm dev
   ```

This will start:
- Web app: http://localhost:3000
- Conductor: ws://localhost:8787

## Production Deployment

1. Build all apps:
```bash
pnpm build
```

2. Choose deployment method:

   a. PM2 (Background Daemons):
   ```bash
   pnpm bg:start
   ```

   b. Docker Compose:
   ```bash
   pnpm compose:up
   ```

## Environment Variables

The platform uses environment variables for configuration. No `.env` files are loaded in the code; all configuration comes from the environment.

### Web App Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_JITSI_DOMAIN`: Jitsi domain (optional)
- `WEB_PORT`: Web server port (default: 3000)

### Conductor Variables
- `CONDUCTOR_PORT`: WebSocket server port (default: 8787)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## License

MIT