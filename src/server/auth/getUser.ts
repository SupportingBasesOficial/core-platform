import { createSupabaseServerClient } from '../db/supabaseServer'

export async function getUser() {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}