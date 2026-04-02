import crypto from 'crypto'
import { createSaleSchema } from '@/modules/vendas/schema'
import { createSale } from '@/server/services/salesService'
import { handleError } from '../_utils/handleError'
import { applyRequestMetric } from '../_utils/applyRequestMetric'
import { log } from '@/server/utils/logger'

export async function POST(req: Request) {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  try {
    const json = await req.json()

    log('info', 'CREATE_SALE_REQUEST_START', {
      requestId,
      route: '/api/sales',
      method: 'POST',
      body: json,
    })

    const body = createSaleSchema.parse({
      ...json,
      total: Number(json.total),
    })

    const sale = await createSale(body, { requestId })

    applyRequestMetric({
      route: '/api/sales',
      method: 'POST',
      duration: Date.now() - start,
      success: true,
      statusCode: 201,
      requestId,
    })

    return Response.json(sale, { status: 201 })
  } catch (err: any) {
    log('error', 'CREATE_SALE_REQUEST_FAIL', {
      requestId,
      route: '/api/sales',
      method: 'POST',
      error: err?.message ?? 'UNKNOWN_ERROR',
    })

    applyRequestMetric({
      route: '/api/sales',
      method: 'POST',
      duration: Date.now() - start,
      success: false,
      statusCode: err?.status || 500,
      requestId,
    })

    return handleError(err)
  }
}