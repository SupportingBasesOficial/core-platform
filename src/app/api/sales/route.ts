import { createSaleSchema } from '@/modules/vendas/schema'
import { createSale } from '@/server/services/salesService'
import { handleError } from '../_utils/handleError'

export async function POST(req: Request) {
  try {
    const json = await req.json()

    const body = createSaleSchema.parse({
      ...json,
      total: Number(json.total),
    })

    const sale = await createSale(body)

    return Response.json(sale, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}