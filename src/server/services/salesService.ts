import { getUser } from '../auth/getUser'
import { getCurrentOrg } from '../auth/getCurrentOrg'
import { checkPermission } from '../permissions/checkPermission'
import { insertSale } from '../repositories/salesRepository'
import { emitEvent } from '../events/eventBus'
import { auditLog } from '../audit/auditLog'
import { AppError } from '../errors/AppError'

export async function createSale(input: {
  total: number
  organization_id: string
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

  const sale = await insertSale(input)

  await emitEvent({
    type: 'sale_created',
    payload: sale,
    organization_id: input.organization_id,
  })

  await auditLog({
    user_id: user.id,
    action: 'vendas:create',
    metadata: {
      sale_id: sale.id,
      total: sale.total,
      organization_id: sale.organization_id,
    },
  })

  return sale
}