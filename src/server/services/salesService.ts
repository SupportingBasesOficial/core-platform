import { getUser } from '../auth/getUser'
import { getCurrentOrg } from '../auth/getCurrentOrg'
import { checkPermission } from '../permissions/checkPermission'
import { createSupabaseServerClient } from '../db/supabaseServer'
import { auditLog } from '../audit/auditLog'
import { AppError } from '../errors/AppError'

export async function createSale(input: {
  total: number
  organization_id: string
  idempotency_key: string
}) {
  const user = await getUser()

  if (!user) {
    throw new AppError('UNAUTHORIZED', 401)
  }

  const membership = await getCurrentOrg(user.id)

  if (!membership) {
    throw new AppError('NO_ORG', 403)
  }

  if (membership.organization_id !== input.organization_id) {
    throw new AppError('FORBIDDEN', 403)
  }

  const allowed = await checkPermission(membership.role, 'vendas:create')

  if (!allowed) {
    throw new AppError('FORBIDDEN', 403)
  }

  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.rpc('create_sale_with_event', {
    p_total: input.total,
    p_organization_id: input.organization_id,
    p_idempotency_key: input.idempotency_key,
  })

  if (error) {
    throw new AppError(error.message || 'SALE_TRANSACTION_FAILED', 500)
  }

  const sale = data as {
    id: string
    organization_id: string
    total: number
    idempotency_key: string
    created_at: string
  }

  try {
    await auditLog({
      user_id: user.id,
      action: 'vendas:create',
      metadata: {
        sale_id: sale.id,
        total: sale.total,
        organization_id: sale.organization_id,
        idempotency_key: input.idempotency_key,
      },
    })
  } catch (err) {
    console.error('AUDIT_LOG_FAIL', err)
  }

  return sale
}