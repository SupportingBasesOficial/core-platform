import { z } from 'zod'

export const createSaleSchema = z.object({
  total: z.number().positive(),
  organization_id: z.string().uuid(),
})