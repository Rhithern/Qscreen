import { createClient } from '@/lib/supabase/server'

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  meta: Record<string, any> = {}
) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('audit_log')
    .insert({
      actor_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      meta
    })
}
