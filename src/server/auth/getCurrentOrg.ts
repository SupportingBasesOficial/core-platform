import { createSupabaseServerClient } from '../db/supabaseServer'

export async function getCurrentOrg(userId: string) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}