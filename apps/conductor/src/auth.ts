import jwt from 'jsonwebtoken';
import { config } from './config';
import { logger } from './logger';

export interface EmbedTokenPayload {
  tenant_id: string;
  session_id: string;
  job_id?: string;
  interview_id?: string;
  candidate_id?: string;
  invite_id: string;
  exp: number;
}

export function verifyEmbedToken(token: string): EmbedTokenPayload | null {
  try {
    const jwtSecret = config.EMBED_JWT_SECRET || config.NEXTAUTH_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as EmbedTokenPayload;
    
    // Check if token has expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      logger.warn('JWT token has expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    logger.warn('Invalid JWT token:', error);
    return null;
  }
}

export function extractTokenFromRequest(request: any): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
