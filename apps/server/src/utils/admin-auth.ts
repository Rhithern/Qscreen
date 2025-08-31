import { Request, Response, NextFunction } from 'express';
import { createClient } from './supabase';

export interface AdminAuthContext {
  userId: string;
  tenantId: string;
  role: string;
  scopes: string[];
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AdminAuthContext;
    }
  }
}

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authContext = await authenticateAdminRequest(req);
  if (!authContext) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing authentication'
    });
  }
  req.authContext = authContext;
  next();
};

export async function authenticateAdminRequest(req: Request): Promise<AdminAuthContext | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();

    // Verify the session token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Get user's tenant and role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, role, scopes')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      userId: user.id,
      tenantId: profile.tenant_id,
      role: profile.role,
      scopes: profile.scopes || []
    };
  } catch (error) {
    console.error('Error authenticating admin request:', error);
    return null;
  }
}

export function hasScope(authContext: AdminAuthContext, requiredScope: string): boolean {
  return authContext.role === 'owner' || 
         authContext.role === 'admin' || 
         authContext.scopes.includes(requiredScope);
}

export function createErrorResponse(code: string, message: string) {
  return {
    error: {
      code,
      message
    }
  };
}

export function createSuccessResponse(data: any) {
  return {
    success: true,
    data
  };
}
