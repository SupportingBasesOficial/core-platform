import { createSupabaseServerClient } from '@/server/db/supabaseServer'
import { getUser } from '@/server/auth/getUser'
import { getCurrentOrg } from '@/server/auth/getCurrentOrg'
import { handleError } from '../../_utils/handleError'

export async function POST() {
  try {
    const user = await getUser()

    if (!user) {
      throw new Error('UNAUTHORIZED')
    }

    const membership = await getCurrentOrg(user.id)

    if (!membership) {
      throw new Error('NO_ORG')
    }

    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('events')
      .insert({
        type: 'sale_created',
        organization_id: membership.organization_id,
        payload: {
          force_fail: true,
          source: 'manual_test',
        },
        status: 'pending',
        attempts: 0,
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return Response.json({
      ok: true,
      event: data,
    })
  } catch (err) {
    return handleError(err)
  }
}