import { NextRequest, NextResponse } from 'next/server';
import { embedConfigLimiter, withRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = withRateLimit(embedConfigLimiter)(request);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: rateLimitResult.headers
      }
    );
  }

  const conductorUrl = process.env.NEXT_PUBLIC_CONDUCTOR_URL || 'ws://localhost:8787';
  const webOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return NextResponse.json({
    conductorUrl,
    webOrigin,
    features: {
      captions: true,
      progress: true
    }
  }, {
    headers: rateLimitResult.headers
  });
}
