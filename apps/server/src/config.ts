// Simple configuration without validation to avoid startup issues
export const config = {
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
  EMBED_JWT_SECRET: process.env.EMBED_JWT_SECRET || 'your-embed-jwt-secret',
  
  // External APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  
  // CORS and WebSocket
  WS_URL: process.env.WS_URL || `ws://localhost:${process.env.PORT || '3001'}/ws`,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  
  // Admin API
  ADMIN_API_ALLOWED_ORIGINS: process.env.ADMIN_API_ALLOWED_ORIGINS || 'http://localhost:3000',
};

// Helper function to parse allowed origins as array
export const getAllowedOrigins = () => {
  return config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
};
