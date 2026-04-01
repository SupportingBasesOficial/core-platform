import { createSupabaseServerClient } from '../db/supabaseServer'

export async function checkPermission(role: string, action: string) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('id')
    .eq('role', role)
    .eq('permission', action)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return !!data
}