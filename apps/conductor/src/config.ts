import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CONDUCTOR_PORT: z.coerce.number().int().positive().default(8787),
  ALLOWED_ORIGINS: z.string()
    .transform(str => str.split(',').map(s => s.trim()))
    .pipe(z.array(z.string().min(1)).min(1))
    .default('http://localhost:3000')
    .describe('Comma-separated list of allowed WebSocket origins'),
  
  // JWT Secret for embed tokens
  EMBED_JWT_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  
  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // External APIs (optional for development)
  DEEPGRAM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

// Type for the validated config
type EnvConfig = z.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid environment configuration:', {
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    } else {
      logger.error('Error validating environment:', error);
    }
    process.exit(1);
  }
}

// Export validated config
export const config = validateEnv();