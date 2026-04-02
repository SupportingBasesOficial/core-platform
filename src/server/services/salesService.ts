import { getUser } from '../auth/getUser'
import { getCurrentOrg } from '../auth/getCurrentOrg'
import { checkPermission } from '../permissions/checkPermission'
import { createSupabaseServerClient } from '../db/supabaseServer'
import { auditLog } from '../audit/auditLog'
import { AppError } from '../errors/AppError'
import { log } from '../utils/logger'
import type { RequestContext } from '@/shared/types/context'

export async function createSale(
  input: {
    total: number
    organization_id: string
    idempotency_key: string
  },
  context: RequestContext
) {
  log('info', 'CREATE_SALE_START', {
    context,
    organization_id: input.organization_id,
    total: input.total,
    idempotency_key: input.idempotency_key,
  })

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
    log('error', 'CREATE_SALE_RPC_FAIL', {
      context,
      error: error.message,
    })

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
        request_id: context.requestId,
      },
    })
  } catch (err) {
    log('error', 'AUDIT_LOG_FAIL', {
      context,
      sale_id: sale.id,
    })
  }

  log('info', 'CREATE_SALE_SUCCESS', {
    context,
    sale_id: sale.id,
    organization_id: sale.organization_id,
  })

  return sale
}