# Interview Platform

A modern interview platform built with Next.js and WebSocket.

## Environment Setup

Required environment variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Web
WEB_PORT=3000                    # Optional, defaults to 3000

# Conductor
CONDUCTOR_PORT=8787              # Optional, defaults to 8787
ALLOWED_ORIGINS=http://localhost:3000  # Optional, defaults to web URL
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
   # Run PowerShell as Administrator
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