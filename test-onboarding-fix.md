# Onboarding Redirect Loop Fix - Test Plan

## Files Changed/Created

### Database Migration
- `supabase/migrations/008_add_onboarding_completed.sql` - Adds onboarding_completed field

### Auth Helpers
- `apps/web/lib/auth/server.ts` - Enhanced with getRoleAndTenant, getAccessState functions

### Diagnostic Tools
- `apps/web/lib/dev/why-redirect.ts` - Logic to explain redirect decisions
- `apps/web/app/api/routecheck/route.ts` - API endpoint for route checking
- `apps/web/app/debug/state/page.tsx` - Debug page showing auth state

### Middleware
- `apps/web/src/middleware.ts` - Fixed to handle auth redirects properly

### Pages Fixed
- `apps/web/app/dashboard/page.tsx` - Uses new auth helpers
- `apps/web/app/jobs/page.tsx` - Uses new auth helpers  
- `apps/web/app/question-bank/page.tsx` - Uses new auth helpers
- `apps/web/app/invites/page.tsx` - Uses new auth helpers
- `apps/web/app/onboarding/layout.tsx` - Server-side redirect check
- `apps/web/app/onboarding/actions.ts` - Sets onboarding_completed=true

## HOW TO RETEST

### 1. Apply Database Migration
```bash
# Run the migration in Supabase SQL Editor
-- Copy contents of supabase/migrations/008_add_onboarding_completed.sql
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Test Employer Flow

#### New Employer Registration
1. Navigate to `/auth/register/employer`
2. Complete registration → should redirect to `/onboarding`
3. Fill out company form and submit → should redirect to `/dashboard`
4. Refresh `/dashboard` → should stay on dashboard (no redirect loop)
5. Try visiting `/onboarding` directly → should redirect to `/dashboard`

#### Returning Employer Login
1. Navigate to `/auth/login`
2. Login with existing employer credentials → should redirect to `/dashboard`
3. Navigate to other employer pages:
   - `/jobs` - should load without redirect
   - `/question-bank` - should load without redirect
   - `/invites` - should load without redirect
   - `/responses` - should load without redirect
   - `/analytics` - should load without redirect
   - `/settings` - should load without redirect

### 4. Test Diagnostic Tools

#### Route Check API
```bash
# Test different paths
curl "http://localhost:3000/api/routecheck?path=/dashboard"
curl "http://localhost:3000/api/routecheck?path=/onboarding"
curl "http://localhost:3000/api/routecheck?path=/jobs"
```

#### Debug State Page
1. Navigate to `/debug/state`
2. Should show current auth state and routing decisions
3. Test quick action buttons to verify routing

### 5. Verify Console Logs
Check server console for:
- `[middleware]` logs showing routing decisions
- `[onboarding] completed` logs when onboarding finishes
- `[routecheck]` logs from diagnostic API

## Expected Results

✅ **New employer flow**: `/auth/register/employer` → `/onboarding` → `/dashboard` (stays)  
✅ **Returning employer**: `/auth/login` → `/dashboard` (no loop)  
✅ **Onboarding redirect**: Direct `/onboarding` visit → `/dashboard` (if completed)  
✅ **Employer pages**: All load without redirects for authenticated employers  
✅ **Diagnostics**: `/api/routecheck` and `/debug/state` show clear state  
✅ **Candidate flow**: Unaffected by changes

## Root Cause Identified

The redirect loop was caused by:
1. **Missing `onboarding_completed` field** in profiles table
2. **Dashboard redirected to `/onboarding`** when no tenant member found
3. **Onboarding action didn't mark completion** 
4. **Middleware only did tenant resolution** - no auth routing logic

## Fix Summary

- Added `onboarding_completed` boolean field to track completion state
- Enhanced auth helpers to provide consistent state checking
- Fixed middleware to handle auth redirects before tenant resolution
- Updated all employer pages to use new auth helpers
- Added comprehensive diagnostic tools for debugging
- Ensured onboarding completion is properly marked and checked
