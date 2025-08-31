import { Router, Request, Response } from 'express';
import { createClient } from '../../utils/supabase';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse
} from '../../utils/admin-auth';
import { adminApiLimiter, withRateLimit } from '../../utils/rate-limit';
import crypto from 'crypto';

export const apiKeysRoutes = Router();

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Generate API key
function generateApiKey(): string {
  return 'qsk_' + crypto.randomBytes(32).toString('base64url');
}

// Hash API key
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// OPTIONS handler
apiKeysRoutes.options('*', (req: Request, res: Response) => {
  res.set(corsHeaders).status(200).end();
});

// GET /api/admin/api-keys - List API keys
apiKeysRoutes.get('/', async (req: Request, res: Response) => {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(req);
  if (!rateLimitResult.allowed) {
    return res.status(429).set({ ...corsHeaders, ...rateLimitResult.headers }).json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests')
    );
  }

  // Authentication
  const authContext = await authenticateAdminRequest(req);
  if (!authContext) {
    return res.status(401).set(corsHeaders).json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication')
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return res.status(403).set(corsHeaders).json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access')
    );
  }

  try {
    const supabase = await createClient();

    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, scopes, created_at, last_used_at')
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).set(corsHeaders).json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch API keys')
      );
    }

    res.set(corsHeaders).json(createSuccessResponse(apiKeys || []));
  } catch (error) {
    console.error('Error in GET /api/admin/api-keys:', error);
    res.status(500).set(corsHeaders).json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error')
    );
  }
});

// POST /api/admin/api-keys - Create API key
apiKeysRoutes.post('/', async (req: Request, res: Response) => {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(req);
  if (!rateLimitResult.allowed) {
    return res.status(429).set({ ...corsHeaders, ...rateLimitResult.headers }).json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests')
    );
  }

  // Authentication
  const authContext = await authenticateAdminRequest(req);
  if (!authContext) {
    return res.status(401).set(corsHeaders).json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication')
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return res.status(403).set(corsHeaders).json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access')
    );
  }

  try {
    const { name, scopes } = req.body;

    if (!name || !scopes) {
      return res.status(400).set(corsHeaders).json(
        createErrorResponse('VALIDATION_ERROR', 'Name and scopes are required')
      );
    }

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);

    const supabase = await createClient();

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: keyHash,
        scopes,
        tenant_id: authContext.tenantId
      })
      .select('id, name, scopes, created_at')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return res.status(500).set(corsHeaders).json(
        createErrorResponse('DATABASE_ERROR', 'Failed to create API key')
      );
    }

    res.set(corsHeaders).json(createSuccessResponse({
      ...apiKey,
      rawKeyOnce: rawKey // Only returned once!
    }));
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    res.status(500).set(corsHeaders).json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error')
    );
  }
});

// DELETE /api/admin/api-keys/:id - Delete API key
apiKeysRoutes.delete('/:id', async (req: Request, res: Response) => {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(req);
  if (!rateLimitResult.allowed) {
    return res.status(429).set({ ...corsHeaders, ...rateLimitResult.headers }).json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests')
    );
  }

  // Authentication
  const authContext = await authenticateAdminRequest(req);
  if (!authContext) {
    return res.status(401).set(corsHeaders).json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication')
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return res.status(403).set(corsHeaders).json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access')
    );
  }

  try {
    const { id } = req.params;
    const supabase = await createClient();

    // Verify API key exists and belongs to tenant
    const { data: existingKey, error: keyError } = await supabase
      .from('api_keys')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (keyError || !existingKey) {
      return res.status(404).set(corsHeaders).json(
        createErrorResponse('NOT_FOUND', 'API key not found')
      );
    }

    // Delete API key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (deleteError) {
      console.error('Error deleting API key:', deleteError);
      return res.status(500).set(corsHeaders).json(
        createErrorResponse('DATABASE_ERROR', 'Failed to delete API key')
      );
    }

    res.set(corsHeaders).json(createSuccessResponse({ id, deleted: true }));
  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys/:id:', error);
    res.status(500).set(corsHeaders).json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error')
    );
  }
});

// POST /api/admin/api-keys/:id/rotate - Rotate API key
apiKeysRoutes.post('/:id/rotate', async (req: Request, res: Response) => {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(req);
  if (!rateLimitResult.allowed) {
    return res.status(429).set({ ...corsHeaders, ...rateLimitResult.headers }).json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests')
    );
  }

  // Authentication
  const authContext = await authenticateAdminRequest(req);
  if (!authContext) {
    return res.status(401).set(corsHeaders).json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication')
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return res.status(403).set(corsHeaders).json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access')
    );
  }

  try {
    const { id } = req.params;
    const supabase = await createClient();

    // Verify API key exists and belongs to tenant
    const { data: existingKey, error: keyError } = await supabase
      .from('api_keys')
      .select('id, name, scopes')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (keyError || !existingKey) {
      return res.status(404).set(corsHeaders).json(
        createErrorResponse('NOT_FOUND', 'API key not found')
      );
    }

    // Generate new API key
    const newRawKey = generateApiKey();
    const newKeyHash = hashApiKey(newRawKey);

    // Update API key with new hash
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ 
        key_hash: newKeyHash,
        last_used_at: null // Reset last used time
      })
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (updateError) {
      console.error('Error rotating API key:', updateError);
      return res.status(500).set(corsHeaders).json(
        createErrorResponse('DATABASE_ERROR', 'Failed to rotate API key')
      );
    }

    res.set(corsHeaders).json(createSuccessResponse({
      id,
      name: existingKey.name,
      newRawKeyOnce: newRawKey, // Only returned once!
      scopes: existingKey.scopes
    }));
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys/:id/rotate:', error);
    res.status(500).set(corsHeaders).json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error')
    );
  }
});
