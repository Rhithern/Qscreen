# Railway Deployment Guide

This guide covers deploying the AI Interviewer platform to Railway.

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Manual Deployment

### 1. Prerequisites

- Railway account
- GitHub repository (already set up at https://github.com/Rhithern/Qscreen)
- Supabase project with database

### 2. Environment Variables

Set these environment variables in Railway:

```env
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_64_char_jwt_secret
EMBED_JWT_SECRET=your_64_char_embed_jwt_secret

# CORS (add your domains)
ALLOWED_ORIGINS=https://your-domain.com,https://client-domain.com
ADMIN_API_ALLOWED_ORIGINS=https://admin.your-domain.com

# Optional APIs
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Railway-specific
PORT=3001
NODE_ENV=production
```

### 3. Deploy Steps

1. **Connect Repository**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Rhithern/Qscreen`

2. **Configure Build**
   - Railway will auto-detect the build configuration
   - Build command: `pnpm run build:railway`
   - Start command: `pnpm run start:railway`

3. **Set Environment Variables**
   - Go to project settings
   - Add all environment variables listed above
   - Generate secure JWT secrets:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```

4. **Deploy**
   - Push changes to GitHub
   - Railway will automatically deploy
   - Monitor logs for any issues

### 4. Post-Deployment

1. **Verify Health Check**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

2. **Test Embed CDN**
   ```bash
   curl https://your-app.railway.app/cdn/embed/embed.min.js
   ```

3. **Update CORS Origins**
   - Add your Railway domain to `ALLOWED_ORIGINS`
   - Format: `https://your-app.railway.app`

## Troubleshooting

### Build Failures

**Error: `turbo: not found`**
- Fixed in latest version with `turbo` added to dependencies
- Uses `build:railway` script that doesn't require turbo

**Error: `pnpm: command not found`**
- Railway should auto-detect pnpm from `packageManager` field
- If issues persist, add to `nixpacks.toml`:
  ```toml
  [phases.setup]
  nixPkgs = ['nodejs', 'pnpm']
  ```

### Runtime Issues

**Health check failing:**
- Check environment variables are set
- Verify Supabase connection
- Check logs: `railway logs`

**CORS errors:**
- Ensure your domain is in `ALLOWED_ORIGINS`
- Check embed widget origin matches allowlist

### Performance Optimization

1. **Enable compression** (already configured)
2. **Set up CDN caching** for embed SDK
3. **Monitor resource usage** in Railway dashboard
4. **Scale if needed** using Railway's scaling options

## Custom Domain

1. **Add Domain in Railway**
   - Go to project settings
   - Add custom domain
   - Update DNS records

2. **Update Environment Variables**
   ```env
   ALLOWED_ORIGINS=https://your-custom-domain.com
   ```

3. **SSL Certificate**
   - Railway automatically provisions SSL
   - Verify HTTPS is working

## Monitoring

- **Logs**: `railway logs --tail`
- **Metrics**: Available in Railway dashboard
- **Health**: Monitor `/api/health` endpoint
- **Uptime**: Set up external monitoring (UptimeRobot, etc.)

## Scaling

Railway supports automatic scaling:
- **Horizontal**: Multiple instances
- **Vertical**: Increase CPU/memory
- **Database**: Use Supabase's scaling options

## Cost Optimization

- **Hobby Plan**: $5/month for small usage
- **Pro Plan**: Pay-per-use for production
- **Monitor usage** in Railway dashboard
- **Optimize bundle sizes** for faster deploys
