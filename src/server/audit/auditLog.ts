import { createSupabaseServerClient } from '../db/supabaseServer'

export async function auditLog(input: {
  user_id: string
  action: string
  metadata?: unknown
}) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.from('audit_logs').insert({
    user_id: input.user_id,
    action: input.action,
    metadata: input.metadata ?? null,
  })

  if (error) {
    throw error
  }
}