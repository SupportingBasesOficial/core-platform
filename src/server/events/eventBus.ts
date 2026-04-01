import { createSupabaseServerClient } from '../db/supabaseServer'

export async function emitEvent(input: {
  type: string
  payload: unknown
  organization_id: string
}) {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.from('events').insert({
    type: input.type,
    payload: input.payload,
    organization_id: input.organization_id,
    status: 'pending',
    attempts: 0,
  })

  if (error) {
    throw error
  }
}