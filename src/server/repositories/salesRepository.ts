import { createSupabaseServerClient } from '../db/supabaseServer'

export async function insertSale(input: {
  total: number
  organization_id: string
}) {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('sales')
    .insert(input)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}