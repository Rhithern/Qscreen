@echo off
echo Setting up development environment...

echo # Supabase Configuration > apps\web\.env.local
echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co >> apps\web\.env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here >> apps\web\.env.local
echo. >> apps\web\.env.local
echo # Application URLs >> apps\web\.env.local
echo NEXT_PUBLIC_WS_URL=ws://localhost:8787 >> apps\web\.env.local
echo NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback >> apps\web\.env.local
echo NEXT_PUBLIC_BASE_URL=http://localhost:3000 >> apps\web\.env.local
echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> apps\web\.env.local
echo. >> apps\web\.env.local
echo # Optional Features >> apps\web\.env.local
echo NEXT_PUBLIC_SKIP_TENANT_CHECK=false >> apps\web\.env.local
echo NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si >> apps\web\.env.local
echo. >> apps\web\.env.local
echo # Email Service (Optional) >> apps\web\.env.local
echo RESEND_API_KEY=your_resend_api_key >> apps\web\.env.local
echo. >> apps\web\.env.local
echo # Database Service Role (for admin operations) >> apps\web\.env.local
echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key >> apps\web\.env.local

echo.
echo Environment file created at apps\web\.env.local
echo.
echo IMPORTANT: You need to:
echo 1. Go to https://supabase.com and create a new project
echo 2. Get your project URL and anon key from Settings ^> API
echo 3. Replace the placeholder values in apps\web\.env.local
echo 4. Run the database migrations in your Supabase project
echo.
echo After setting up Supabase, run: pnpm dev
echo.
pause
