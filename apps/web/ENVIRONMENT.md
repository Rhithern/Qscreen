# Environment Setup

This document explains how to set up the required environment variables for the application.

## Required Variables

### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These values can be found in your Supabase project settings:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Project Settings → API
4. Copy the values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Project API Keys → anon/public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Application Configuration

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

This should be:
- `http://localhost:3000` for local development
- Your production URL for deployment

## Development Options

```bash
# Skip tenant/auth checks in development
NEXT_PUBLIC_SKIP_TENANT_CHECK=true
```

This allows you to bypass tenant validation in development mode.

## Setting Up Environment Variables

1. Local Development:
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Edit the file with your values
   nano .env.local
   ```

2. Production:
   - Add these variables to your hosting platform's environment settings
   - For Vercel: Project Settings → Environment Variables

## Troubleshooting

If you see the error:
```
Error: Your project's URL and Key are required to create a Supabase client!
```

Check:
1. `.env.local` exists and has the correct values
2. You've restarted the development server after adding variables
3. Variables are properly set in your production environment

## Security Notes

1. Never commit `.env.local` or any file containing real credentials
2. Always use `NEXT_PUBLIC_` prefix for variables needed in the browser
3. Keep your anon key private despite the `public` name - it should only be used server-side
4. Rotate keys if they're ever exposed

## Type Safety

The application validates environment variables at startup:
- Required variables are checked
- Helpful error messages guide you to fix missing values
- Development mode has safety fallbacks
